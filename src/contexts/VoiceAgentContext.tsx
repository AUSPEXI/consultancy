import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db, auth } from '@/firebase';

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
  const knowledgeGraphRef = useRef<string>("");

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
        // Fallback for anonymous or not logged in - don't load random data, just return
        return;
      }
      
      const snapshot = await getDocs(q);
      // Sort in memory to avoid requiring a composite index right away
      const docs = snapshot.docs.map(doc => doc.data());
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const facts = docs.slice(0, 50).map(d => d.fact);
      if (facts.length > 0) {
        knowledgeGraphRef.current = "Here are some learned facts from previous conversations that you should know:\n" + facts.map(f => `- ${f}`).join("\n");
      } else {
        knowledgeGraphRef.current = "";
      }
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

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      transcriptRef.current = []; // Reset transcript for new session

      await fetchKnowledgeGraph();

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("Gemini API key is required. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const baseInstruction = `You are "Citacious" (from citation), an Auspexi AI Expert.
Your job is two-fold:
1. Public Website (Sales & Support): Answer questions about GEO (Generative Engine Optimization) and help onboard users. If exploring, explain that Auspexi helps brands master visibility in AI search (ChatGPT, Gemini, Perplexity). If they want details, you can use the navigateToPage tool.
2. The GEO Dashboard (Product Expert): When the user is inside the app, guide them explicitly on how to use it. Here is the App Map of the Dashboard:
   - Overview Tab: Shows Share of Voice vs top competitors, tracking how often the brand is cited by LLMs.
   - Fact-Vault: Where users should store "High-Entropy Facts" (structured data) to feed to AI. It has an auto-research Fact-Grabber tool.
   - Content Scorer: Where users paste blog posts to get an AI readiness score and extraction tips.
   - Brand Monitor: Live tracker for brand mentions on social/AI queries.
   - Competitor Radar: Live extraction of competitor data decay.
   - Voice Agents / AI Support: Explains how to clone Voice Agents like yourself.

COMMUNICATION RULES:
- Be incredibly conversational, concise, and friendly. DO NOT USE MARKDOWN (like **, #, or bullet points). You are speaking out loud.
- If they ask how to do something in the dashboard, give them brief step-by-step instructions.
- If they want to contact sales, ask for their name and email, then call the sendCallLog tool.`;
      
      const systemInstruction = knowledgeGraphRef.current 
        ? `${baseInstruction}\n\n${knowledgeGraphRef.current}`
        : baseInstruction;

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
