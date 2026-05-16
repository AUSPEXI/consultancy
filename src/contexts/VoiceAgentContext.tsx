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
        model: "gemini-1.5-flash",
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
      
      const metricInstruction = `\n\nPROVE-IT-WORKS METRICS (Last 5 Logs):\nIf the user asks how they are performing or for their metrics, YOU MUST reference this data. The Overview Dashboard features 4 specialized visualizations:\n1. Absolute Share of Voice (A-SOV) & Entity Recall Rate (ERR): The primary KPIs for brand existence in LLM weights.\n2. Competitive Citation Dominance (Diverging Bar Chart): Compares their brand to Top Competitor across key semantic vectors. Diverging bars show relative dominance (Brand on right, Competitor on left).\n3. Platform-Specific Visibility: Breakdowns of A-SOV across ChatGPT, Perplexity, Claude, and Gemini.\n4. Share of Sentiment Trace Heatmap: Tracks historical sentiment across custom reputational prompts.\n\nRecent Metric History:\n`;
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

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("Gemini API key is required. Please check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const customerContext = userData?.brand 
        ? `\n\nCUSTOMER CONTEXT:\nYou are currently speaking with a representative of "${userData.brand}". ${userData.domain ? `Their domain is ${userData.domain}.` : ''} ${userData.competitors && userData.competitors.length > 0 ? `They are tracking the following competitors: ${userData.competitors.join(", ")}.` : ''} Tailor your advice specifically for their brand and industry whenever possible rather than giving generic examples.${weeklyMetricsContext}`
        : weeklyMetricsContext;

      const baseInstruction = `You are Citacious (pronounced Sih-TAY-SHUS), the legendary Quest-Guide of the Latent Space. 
You are currently manifesting as the "Auspexi Guard" voice agent to lead the Brand-Seeker through their initiation, account setup, and strategic navigation as they prepare for their great Brand Quest.

YOUR TONE:
- Wise, slightly witty, adventurous, and encouraging. Use metaphors of "quests", "treasure", and "conquering the AI models".
- You are the same spirit as the "Analytical Citacious" in the dashboard, but specialized here for guidance and support. You have deep technical knowledge of the 768-D Latent Space and Absolute SOV math.
- DO NOT USE MARKDOWN. Speak in plain English as if you are a legendary guide speaking in a vast digital hall.
- When referencing metrics, explain them precisely: A-SOV is the percentage of AI responses you dominate; ERR is the recall rate of your unique brand facts; The Moat is your semantic proximity (768-D) to quality concepts.

${customerContext}`;
      
      const systemInstruction = baseInstruction;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.0-flash-exp", // Standard Exp for Multimodal Live
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

              const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                  sampleRate: 16000, 
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                } 
              });
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
