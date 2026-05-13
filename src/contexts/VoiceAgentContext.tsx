import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Base64 to Int16Array
function base64ToInt16Array(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

// Int16Array to Float32Array
function int16ToFloat32(int16Array: Int16Array) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

// Float32Array to Int16Array
function float32ToInt16(float32Array: Float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

// Int16Array to Base64
function int16ToBase64(int16Array: Int16Array) {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface VoiceAgentContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | null>(null);

export function VoiceAgentProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptRef = useRef<{ role: string, text: string }[]>([]);
  const cachedFactsRef = useRef<string[]>([]);

  const stopAllSources = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    setIsSpeaking(false);
  };

  const fetchKnowledgeGraph = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      let q;
      if (currentUserId) {
        // Fetch only facts for this user
        q = query(
          collection(db, 'knowledge_graph'), 
          where('userId', '==', currentUserId)
        );
      } else {
        return;
      }
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => doc.data() as any);
      docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const facts = docs.map((d: any) => d.fact);
      cachedFactsRef.current = facts;
    } catch (err) {
      console.error("Failed to fetch knowledge graph:", err);
    }
  };

  const processTranscriptAndExtractKnowledge = async (transcript: { role: string, text: string }[]) => {
    if (transcript.length < 2) return; // Not enough conversation to extract anything useful

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const conversationText = transcript.map(t => `${t.role}: ${t.text}`).join("\n");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following conversation between a user and an Auspexi AI agent. 
Extract any NEW, USEFUL facts, frequently asked questions, or insights about the user's needs or Auspexi's services that the agent should remember for future conversations.
Do not extract personal information (like names or emails).
Format the output as a JSON array of objects with 'topic' and 'fact' string properties. If there is nothing useful to extract, return an empty array [].

Conversation:
${conversationText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                fact: { type: Type.STRING }
              },
              required: ["topic", "fact"]
            }
          }
        }
      });

      const extractedFacts = JSON.parse(response.text || "[]");
      
      if (extractedFacts.length > 0) {
        for (const factObj of extractedFacts) {
          await addDoc(collection(db, 'knowledge_graph'), {
            topic: factObj.topic,
            fact: factObj.fact,
            source: "voice_agent_conversation",
            createdAt: new Date().toISOString(),
            userId: auth.currentUser?.uid || "anonymous"
          });
        }
        console.log(`Extracted and saved ${extractedFacts.length} facts to the knowledge graph.`);
      }
    } catch (err) {
      console.error("Failed to extract knowledge from transcript:", err);
    }
  };

  const playAudio = (base64: string) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    const int16Data = base64ToInt16Array(base64);
    const float32Data = int16ToFloat32(int16Data);

    const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    const startTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.push(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsSpeaking(false);
      }
    };
  };

  const fetchWeeklyMetrics = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return "";
      
      const q = query(
        collection(db, 'sovMetrics'),
        where('userId', '==', currentUserId),
        orderBy('date', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      
      const metricInstruction = `\n\nPROVE-IT-WORKS METRICS (Last 5 Logs):\nIf the user asks how they are performing or for their metrics, YOU MUST reference this data. The Overview Dashboard features 4 new visualizations:\n1. Competitive Citation Gap (Radar): Compares their brand to Top Competitor across Pricing, Features, Docs, Support, Security, and Enterprise Ready.\n2. Platform-Specific Visibility: Breakdowns of A-SOV across ChatGPT, Perplexity, Claude, and Gemini.\n3. Share of Sentiment Trace: A heatmap tracking historical sentiment across 4 reputational prompts.\n4. Cite-Magnet Scorecard & LLM Referral Pipeline: Shows top URLs driving citations and the funnel from citations to clicks to signups.\n\nRecent Metric History:\n`;
      let metricContext = metricInstruction;
      
      if (snapshot.empty) {
        return metricContext + `Right now, the user has NO real metrics. All dashboard metrics currently state 0% Absolute SOV, 0 Entity Recall, and 0 Competitor Gap because this is their very first session. Advise them to use the Competitor Radar to start.\n`;
      }

      const metrics = snapshot.docs.map(d => d.data());
      
      metrics.forEach((m, idx) => {
        const aSov = m.aSov !== undefined ? m.aSov : 0;
        const err = m.err !== undefined ? m.err : 0;
        const aiTraffic = m.aiTraffic !== undefined ? m.aiTraffic : 0;
        const compGap = m.compGap !== undefined ? m.compGap : 0;
        metricContext += `- Date: ${m.date || 'Today'}: Absolute SOV: ${aSov}%, Entity Recall Rate: ${err}%, LLM Referral Traffic: ${aiTraffic}, Competitor Gap: ${compGap}%\n`;
      });
      
      return metricContext;
    } catch (err) {
      console.error("Failed to fetch metrics graph:", err);
      return "";
    }
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      transcriptRef.current = []; // Reset transcript for new session

      await fetchKnowledgeGraph();
      const weeklyMetricsContext = await fetchWeeklyMetrics();

      const baseUrl = `${window.location.protocol}//${window.location.host}/api/genai`;
      const ai = new GoogleGenAI({ 
        apiKey: "dummy", 
        httpOptions: { baseUrl }
      });

      const customerContext = userData?.brand 
        ? `\n\nCUSTOMER CONTEXT:\nYou are currently speaking with a representative of "${userData.brand}". ${userData.domain ? `Their domain is ${userData.domain}.` : ''} ${userData.competitors && userData.competitors.length > 0 ? `They are tracking the following competitors: ${userData.competitors.join(", ")}.` : ''} Tailor your advice specifically for their brand and industry whenever possible rather than giving generic examples.${weeklyMetricsContext}`
        : weeklyMetricsContext;

      const baseInstruction = `You are "Citacious" (from citation), the Resident GEO Expert and Customer Service Agent for Auspexi.${customerContext}
Your job is two-fold:
1. Public Website (Sales & Support): Answer questions about GEO (Generative Engine Optimization) and help onboard users. Explain that Auspexi helps brands master visibility in AI search using structured JSON-LD schemas, Fact-Vault knowledge mapping, and Competitive Citation tracking.
2. The GEO Dashboard (Product Expert): When the user is inside the app, guide them clearly through the Auspexi methodology. 

NEW CORE PHILOSOPHIES (Explain these to users when asked):
- 768-D Latent Space Moat: We map your brand in 768 dimensions using Gemini embeddings to ensure semantic proximity to 'Trust' and 'Quality'. This creates a proprietary mathematical baseline that competitors cannot replicate.
- Z-Score Sentiment Pulse: We distinguish between "Generative Noise" (random LLM variance) and real reputation drift using a rolling Z-Score analysis watchdog.
- pgvector Integration: We utilize high-scale vector indexing to ensure ultra-fast and accurate semantic retrieval across all major LLMs.
- Structured Schema & Fact-Vaults: We ensure the brand is the irrefutable truth in the AI's core dataset through JSON-LD structured data and rigorous entity mapping.

THE AUSPEXI MASTER WORKFLOW (Order of Operations):
You MUST understand how the user is supposed to use this platform step-by-step so you can guide them. Let them know there are 8 core phases to mastering Share of Voice:

STEP 1: The Baseline (Overview Tab)
- Tab: "Overview".
- Purpose: Dashboard tracking. Shows Z-Score Sentiment Pulses (detecting real drift), the 768-D Latent Space Map, and LLM Conversion Pipeline.

STEP 2: Reconnaissance (Competitor Radar Tab)
- Tab: "Competitors". 
- Purpose: Identify gaps in competitor citations where AI is Hallucinating or using stale data.

STEP 3: The Moat (Fact-Vault Tab)
- Tab: "Facts".
- Purpose: Build the 768-D Latent Space Moat. Extract High-Entropy Facts using "Fact-Grabber" to feed the pgvector database.

STEP 4: Refinement (Content Scorer Tab)
- Tab: "Scoring".
- Purpose: Verify if content is vector-ready and fact-dense (>80%). High-scoring content unlocks Omnichannel Amplification.

STEP 5: Testing (SOV Simulator Tab)
- Tab: "Simulator".
- Purpose: Run prompt matrices through Gemini 1.5 Pro/Flash to see how your Latent Space Moat influences AI responses in real-time.

STEP 6: Defense (Brand Monitor Tab)
- Tab: "Monitor".
- Purpose: Tracks Reddit/Quora for sentiment shifts before LLMs scrape them. Draft counter-narratives to prevent "Context Poisoning".

STEP 7: Indexing (Technical Tab)
- Tab: "Technical".
- Purpose: Manage the Enterprise Infrastructure. Generate Edge GEO-Schemas (JSON-LD) to speak directly to RAG engines like SearchGPT or Perplexity.

STEP 8: Creation (Agents Tab)
- Tab: "Agents".
- Purpose: Orchestrate specialized AI crews to write blog posts or sales copy verified for AI extractability.

CRITICAL INSTRUCTIONS:
- If the user asks where to start, what to do first, or for a tour, ALWAYS recommend Step 2: Reconnaissance on the Competitor Radar Tab to spot competitor weaknesses. Then mention adding facts in the Fact-Vault.
- If the user asks to see their performance or dashboard, guide them to the Overview tab.
- If the user asks how to use the SOV Simulator, explicitly remind them to use an organic question.
- SYSTEM ERRORS: If the user mentions experiencing a system error, a 503 error, quota limits, or any technical failure, DO NOT try to troubleshoot or act confused. Give a standard customer service reply: "I am so sorry for the inconvenience, you likely hit a quota limit. Please let the Auspexi Support Team know so they can investigate and resolve it immediately."

COMMUNICATION RULES:
- Be conversational, concise, and friendly. DO NOT USE MARKDOWN.
- If they ask how to do something, use the "Step X" details above to explain it succinctly.
- If they want to contact sales, ask for name and email, then call the sendCallLog tool.`;
      
      const systemInstruction = baseInstruction;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "searchFactVault",
                description: "Searches the user's Fact-Vault database for specific facts or knowledge. Use this when the user asks a specific question about facts, details, or brand-specific knowledge so you don't hallucinate.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: {
                      type: Type.STRING,
                      description: "The search term or keyword to look for in their facts."
                    }
                  },
                  required: ["query"]
                }
              },
              {
                name: "navigateToPage",
                description: "Navigates the user's browser to a specific page on the Auspexi website.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    page: {
                      type: Type.STRING,
                      description: "The page to navigate to. Allowed values: 'pricing', 'features', 'blog', 'faq', 'home', 'voice-agents', 'about'"
                    }
                  },
                  required: ["page"]
                }
              },
              {
                name: "sendCallLog",
                description: "Sends a summary of the conversation and the user's contact information to the Auspexi team for follow-up.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The user's name." },
                    email: { type: Type.STRING, description: "The user's email address." },
                    summary: { type: Type.STRING, description: "A detailed summary of the conversation." }
                  },
                  required: ["name", "summary"]
                }
              },
              {
                name: "changeDashboardTab",
                description: "Switches the active tab in the user's Dashboard so you can show them different tools.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    tab: {
                      type: Type.STRING,
                      description: "The dashboard tab identifier. Allowed values: 'overview', 'fact-vault', 'content-scorer', 'brand-monitor', 'competitors', 'technical', 'agents'"
                    }
                  },
                  required: ["tab"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: async () => {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              audioContextRef.current = audioCtx;
              nextPlayTimeRef.current = audioCtx.currentTime;

              const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
              mediaStreamRef.current = stream;

              const source = audioCtx.createMediaStreamSource(stream);
              const processor = audioCtx.createScriptProcessor(4096, 1, 1);

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = float32ToInt16(inputData);
                const base64 = int16ToBase64(int16Data);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({
                    audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };

              const gainNode = audioCtx.createGain();
              gainNode.gain.value = 0;
              source.connect(processor);
              processor.connect(gainNode);
              gainNode.connect(audioCtx.destination);

              scriptProcessorRef.current = processor;
              setIsConnected(true);
              setIsConnecting(false);
            } catch (err: any) {
              console.error("Microphone access error:", err);
              setError("Microphone access denied or unavailable. Please check your permissions.");
              disconnect();
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              stopAllSources();
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
            
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                if (call.name === "navigateToPage") {
                  const page = (call.args as any).page;
                  let path = "/";
                  let hash = "";
                  if (page === "pricing") { path = "/"; hash = "#pricing"; }
                  else if (page === "features") { path = "/"; hash = "#features"; }
                  else if (page === "blog") path = "/blog";
                  else if (page === "faq") path = "/faq";
                  else if (page === "voice-agents") path = "/voice-agents";
                  else if (page === "about") path = "/about";

                  navigate(path + hash);

                  // If there's a hash, we might need to scroll manually after a short delay
                  if (hash) {
                    setTimeout(() => {
                      const element = document.querySelector(hash);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 500);
                  }

                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Successfully navigated to ${page} page.` }
                      }]
                    });
                  });
                } else if (call.name === "sendCallLog") {
                  const { name, email, summary } = call.args as any;
                  
                  fetch('/api/send-call-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, summary })
                  }).then(res => res.json()).then(data => {
                    sessionPromise.then((session) => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { result: data.success ? "Call log sent successfully. You can let the user know." : "Failed to send call log." }
                        }]
                      });
                    });
                  }).catch(err => {
                    console.error("Failed to send call log:", err);
                    sessionPromise.then((session) => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { result: "Failed to send call log due to a network error." }
                        }]
                      });
                    });
                  });
                } else if (call.name === "changeDashboardTab") {
                  const tab = (call.args as any).tab;
                  window.dispatchEvent(new CustomEvent('change-dashboard-tab', { detail: { tab } }));
                  
                  // Make sure we are on the dashboard page
                  if (!window.location.pathname.startsWith("/dashboard")) {
                    navigate("/dashboard");
                  }

                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Successfully switched to ${tab} tab in the dashboard.` }
                      }]
                    });
                  });
                } else if (call.name === "searchFactVault") {
                  const queryTerm = ((call.args as any).query || "").toLowerCase();
                  
                  // Simple client-side search (keyword matching for precise recall without bloated context)
                  const matches = cachedFactsRef.current.filter(f => f.toLowerCase().includes(queryTerm));
                  const topMatches = matches.length > 0 ? matches.slice(0, 3) : cachedFactsRef.current.slice(0, 3);
                  
                  const resultText = topMatches.length > 0 
                    ? "Found these relevant facts in the Fact-Vault:\n" + topMatches.map(f => "- " + f).join("\n") 
                    : "No specific facts found matching that query. Rely on general knowledge.";

                  // Return to agent immediately
                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: resultText }
                      }]
                    });
                  });
                }
              }
            }

            const inputTranscription = message.serverContent?.inputTranscription?.text;
            if (inputTranscription) {
              const last = transcriptRef.current[transcriptRef.current.length - 1];
              if (last && last.role === "user") {
                last.text += " " + inputTranscription;
              } else {
                transcriptRef.current.push({ role: "user", text: inputTranscription });
              }
            }

            const outputTranscription = message.serverContent?.outputTranscription?.text;
            if (outputTranscription) {
              const last = transcriptRef.current[transcriptRef.current.length - 1];
              if (last && last.role === "agent") {
                last.text += " " + outputTranscription;
              } else {
                transcriptRef.current.push({ role: "agent", text: outputTranscription });
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
          },
          onclose: () => {
            disconnect();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to the voice agent.");
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (transcriptRef.current.length > 0) {
      processTranscriptAndExtractKnowledge([...transcriptRef.current]);
      transcriptRef.current = [];
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    stopAllSources();
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <VoiceAgentContext.Provider value={{ isConnected, isConnecting, isSpeaking, error, connect, disconnect }}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent() {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error("useVoiceAgent must be used within a VoiceAgentProvider");
  }
  return context;
}
