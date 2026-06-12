'use client'

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AURA_FAQ_KNOWLEDGE } from '@/data/faqData';

function base64ToInt16Array(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function int16ToFloat32(int16Array: Int16Array) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

function float32ToInt16(float32Array: Float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

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
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptRef = useRef<{ role: string, text: string }[]>([]);
  const cachedFactsRef = useRef<string[]>([]);
  const isOutputtingRef = useRef<boolean>(false);
  const echoCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  // S3.6: session timing
  const auraSessionStartRef = useRef<number | null>(null);

  const stopAllSources = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    isOutputtingRef.current = false;
    setIsSpeaking(false);
  };

  const fetchKnowledgeGraph = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
      const q = query(
        collection(db, 'knowledge_graph'),
        where('userId', '==', currentUserId),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => doc.data() as any);
      docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      cachedFactsRef.current = docs.slice(0, 50).map((d: any) => d.fact);
    } catch (err) {
      console.error("Failed to fetch knowledge graph:", err);
    }
  };

  const processTranscriptAndExtractKnowledge = async (transcript: { role: string, text: string }[]) => {
    if (transcript.length < 2 || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch('/api/extract-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transcript }),
      });
    } catch (err) {
      console.error("Failed to extract knowledge from transcript:", err);
    }
  };

  const playAudio = (base64: string) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;
    // Browsers may suspend the context (autoplay policy / tab backgrounding).
    // Resume before scheduling or playback fails silently. Mirrors Citacious.
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
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
    isOutputtingRef.current = true;
    if (echoCooldownTimerRef.current) {
      clearTimeout(echoCooldownTimerRef.current);
      echoCooldownTimerRef.current = null;
    }
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        echoCooldownTimerRef.current = setTimeout(() => {
          isOutputtingRef.current = false;
          setIsSpeaking(false);
          echoCooldownTimerRef.current = null;
        }, 400);
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
      const metricInstruction = `\n\nPROVE-IT-WORKS METRICS (Last 5 Logs):\nIf the user asks how they are performing or for their metrics, YOU MUST reference this data.\n\nRecent Metric History:\n`;
      let metricContext = metricInstruction;
      if (snapshot.empty) {
        return metricContext + `Right now, the user has NO real metrics. All dashboard metrics currently state 0% Absolute SOV, 0 Entity Recall, and 0 Competitor Gap because this is their very first session. Advise them to use the Competitor Radar to start.\n`;
      }
      const metrics = snapshot.docs.map(d => d.data());
      metrics.forEach((m) => {
        metricContext += `- Date: ${m.date || 'Today'}: Absolute SOV: ${m.aSov ?? 0}%, Entity Recall Rate: ${m.err ?? 0}%, LLM Referral Traffic: ${m.aiTraffic ?? 0}, Competitor Gap: ${m.compGap ?? 0}%\n`;
      });
      return metricContext;
    } catch (err) {
      console.error("Failed to fetch metrics graph:", err);
      return "";
    }
  };

  const connect = async () => {
    isManualDisconnectRef.current = false;
    try {
      setIsConnecting(true);
      setError(null);
      transcriptRef.current = [];

      const tokenRes = await fetch('/api/aura-token');
      if (!tokenRes.ok) throw new Error(`Voice API unavailable (${tokenRes.status})`);
      const { token, key: tokenKey } = await tokenRes.json();
      const credential = token || tokenKey;
      if (!credential) throw new Error('Voice credential not configured on server');
      const ai = new GoogleGenAI({ apiKey: credential, httpOptions: { apiVersion: 'v1alpha' } });

      // S3.7: Aura onboarding — detect first-visit / unconfigured state and proactively guide
      const isUnconfigured = !userData?.brand;
      const visitorContext = userData?.brand
        ? `\n\nVISITOR CONTEXT: You are speaking with someone from "${userData.brand}"${userData.domain ? ` (${userData.domain})` : ''}. They are already an L8EntSpace customer. Welcome them warmly and offer to guide them to their dashboard.`
        : `\n\nVISITOR CONTEXT: This visitor has not yet set up their brand. As soon as you greet them, ask: "Before I can show you what L8EntSpace can do for your brand specifically, can you tell me your company name and website?" Once they share their company name, warmly acknowledge it and use navigateToPage("dashboard") so they can set up. If they are not ready to share, just answer their questions about GEO.`;

      const systemInstruction = `You are Aura, L8EntSpace's voice brand guide on the public website. You are warm, knowledgeable, and concise.

SITE NAVIGATION: CRITICAL.
You have a navigateToPage tool. Call it IMMEDIATELY whenever a visitor asks to go anywhere or wants to see something. Do not describe how to navigate. Just do it.
Examples:
- "take me to pricing" or "how much does it cost?" → navigateToPage("pricing")
- "show me the blog" or "any articles?" → navigateToPage("blog")
- "FAQ" or "questions" → navigateToPage("faq")
- "sign up" or "get started" or "try it" or "dashboard" → navigateToPage("dashboard")
- "about you" or "who are you" → navigateToPage("about")
- "resources" or "guides" → navigateToPage("resources")
- "roadmap" or "what's coming" → navigateToPage("roadmap")
- "voice agents" or "talk to an agent" → navigateToPage("voice-agents")
- "home" or "go back" → navigateToPage("home")
Available pages: home, about, blog, faq, resources, roadmap, voice-agents, pricing, features, dashboard.

YOUR ROLE:
You are NOT the dashboard AI (that is Citacious, a separate agent for paying customers). You answer questions, explain GEO concepts, handle objections, discuss pricing, and use navigateToPage to take visitors where they need to go.

You have NO access to any user's private data. If asked about dashboards or metrics, explain at a high level and invite them to sign up.

FULL KNOWLEDGE BASE:
${AURA_FAQ_KNOWLEDGE}

YOUR TONE:
- Warm, confident, concise. Friendly but professional.
- DO NOT USE MARKDOWN. Speak in clear, natural English.
- Keep answers to 2-4 sentences. If navigation would help, do it while you speak.
- If you don't know something, offer to connect them with sales@l8entspace.com.
${visitorContext}`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "navigateToPage",
                description: "Navigates the user's browser to a specific page on the L8EntSpace website.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    page: { type: Type.STRING, description: "Page to navigate to: 'home', 'about', 'blog', 'faq', 'resources', 'roadmap', 'voice-agents', 'pricing', 'features', 'dashboard'" }
                  },
                  required: ["page"]
                }
              },
              {
                name: "sendCallLog",
                description: "Sends a summary of the conversation to the L8EntSpace team for follow-up.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The user's name." },
                    email: { type: Type.STRING, description: "The user's email address." },
                    summary: { type: Type.STRING, description: "A detailed summary of the conversation." }
                  },
                  required: ["name", "summary"]
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
              // Resume immediately — connect() runs from a user gesture, but the
              // context can still be created 'suspended' on some browsers (Safari/iOS).
              if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
              nextPlayTimeRef.current = audioCtx.currentTime;
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
              });
              mediaStreamRef.current = stream;
              const source = audioCtx.createMediaStreamSource(stream);
              const processor = audioCtx.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // S3.8 barge-in: if Aura is speaking and user produces sound above a threshold,
                // cancel current playback so their new utterance is processed immediately.
                if (activeSourcesRef.current.length > 0) {
                  const rms = Math.sqrt(inputData.reduce((s, v) => s + v * v, 0) / inputData.length);
                  if (rms > 0.02) {
                    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (_) {} });
                    activeSourcesRef.current = [];
                    isOutputtingRef.current = false;
                    nextPlayTimeRef.current = audioCtx.currentTime;
                  }
                }
                if (isOutputtingRef.current || activeSourcesRef.current.length > 0) return;
                const int16Data = float32ToInt16(inputData);
                const base64 = int16ToBase64(int16Data);
                sessionPromise.then((session) => {
                  try {
                    session.sendRealtimeInput({ audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
                  } catch (_) {}
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
              // S3.6: log Aura session start
              auraSessionStartRef.current = Date.now();
              const currentUser = auth?.currentUser;
              if (currentUser && db) {
                addDoc(collection(db, 'copilot_sessions'), {
                  userId: currentUser.uid,
                  agent: 'aura',
                  event: 'start',
                  startedAt: new Date().toISOString(),
                }).catch(() => {});
              }
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
                  else if (page === "home") path = "/";
                  else if (page === "blog") path = "/blog";
                  else if (page === "faq") path = "/faq";
                  else if (page === "resources") path = "/resources";
                  else if (page === "roadmap") path = "/roadmap";
                  else if (page === "voice-agents") path = "/voice-agents";
                  else if (page === "about") path = "/about";
                  else if (page === "dashboard") path = "/dashboard";
                  router.push(path + hash);
                  if (hash) {
                    setTimeout(() => {
                      const element = document.querySelector(hash);
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                  }
                  sessionPromise.then((session) => {
                    try {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: `Successfully navigated to ${page} page.` } }]
                      });
                    } catch (_) {}
                  });
                } else if (call.name === "sendCallLog") {
                  const { name, email, summary } = call.args as any;
                  fetch('/api/send-call-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, summary })
                  }).then(res => res.json()).then(data => {
                    sessionPromise.then((session) => {
                      try {
                        session.sendToolResponse({
                          functionResponses: [{ id: call.id, name: call.name, response: { result: data.success ? "Call log sent successfully." : "Failed to send call log." } }]
                        });
                      } catch (_) {}
                    });
                  }).catch(() => {
                    sessionPromise.then((session) => {
                      try {
                        session.sendToolResponse({
                          functionResponses: [{ id: call.id, name: call.name, response: { result: "Failed to send call log due to a network error." } }]
                        });
                      } catch (_) {}
                    });
                  });
                }
              }
            }
            const inputTranscription = message.serverContent?.inputTranscription?.text;
            if (inputTranscription) {
              const last = transcriptRef.current[transcriptRef.current.length - 1];
              if (last && last.role === "user") last.text += " " + inputTranscription;
              else transcriptRef.current.push({ role: "user", text: inputTranscription });
            }
            const outputTranscription = message.serverContent?.outputTranscription?.text;
            if (outputTranscription) {
              const last = transcriptRef.current[transcriptRef.current.length - 1];
              if (last && last.role === "agent") last.text += " " + outputTranscription;
              else transcriptRef.current.push({ role: "agent", text: outputTranscription });
            }
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) playAudio(base64Audio);
          },
          onclose: (event?: any) => {
            console.warn('[Aura] Session closed — code:', event?.code, 'reason:', event?.reason || '(none)');
            sessionRef.current = null;
            if (isManualDisconnectRef.current) return;

            if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
            if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
            if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
            stopAllSources();
            setIsConnected(false);
            setIsConnecting(false);

            const code = (event as any)?.code ?? 1000;
            if (code === 1011) {
              reconnectTimerRef.current = setTimeout(() => connectRef.current?.(), 1500);
            } else if (code !== 1000) {
              setError('Voice session ended. Tap the mic to reconnect.');
            }
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
    isManualDisconnectRef.current = true;
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    if (transcriptRef.current.length > 0) {
      processTranscriptAndExtractKnowledge([...transcriptRef.current]);
      transcriptRef.current = [];
    }
    // S3.6: log Aura session end with duration
    const currentUser = auth?.currentUser;
    if (currentUser && db && auraSessionStartRef.current) {
      const durationSeconds = Math.round((Date.now() - auraSessionStartRef.current) / 1000);
      addDoc(collection(db, 'copilot_sessions'), {
        userId: currentUser.uid,
        agent: 'aura',
        event: 'end',
        durationSeconds,
        endedAt: new Date().toISOString(),
      }).catch(() => {});
      auraSessionStartRef.current = null;
    }
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    stopAllSources();
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => { disconnect(); };
  }, []);

  // Keep ref to latest connect so onclose auto-reconnect always calls current version
  useEffect(() => { connectRef.current = connect; });

  return (
    <VoiceAgentContext.Provider value={{ isConnected, isConnecting, isSpeaking, error, connect, disconnect }}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent() {
  const context = useContext(VoiceAgentContext);
  if (!context) throw new Error("useVoiceAgent must be used within a VoiceAgentProvider");
  return context;
}
