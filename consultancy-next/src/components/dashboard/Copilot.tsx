'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, getDoc, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '@/firebase';

// Lazy initialization of Gemini API
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'dummy') {
      aiClient = new GoogleGenAI({ apiKey });
    } else {
      // Fallback to proxy
      const baseUrl = `${window.location.protocol}//${window.location.host}/api/genai`;
      aiClient = new GoogleGenAI({
        apiKey: 'dummy',
        httpOptions: { baseUrl }
      });
    }
  }
  return aiClient;
}

// Audio helpers
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

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface CopilotProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function Copilot({ activeTab = 'overview', setActiveTab }: CopilotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('copilot_messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [
      { role: 'model', content: "Greetings, brave Brand-Seeker! I am Citacious, and you have entered the inner sanctum of Auspexi. We are about to embark on a quest to conquer the Latent Space and secure your digital legacy! Tell me, which vector of visibility shall we tackle first to begin your ascent?" }
    ];
  });

  useEffect(() => {
    localStorage.setItem('copilot_messages', JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeContext, setKnowledgeContext] = useState<string>("");

  // Voice state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const chatRef = useRef<any>(null);
  const isOutputtingRef = useRef<boolean>(false);
  const echoCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const qFacts = query(
          collection(db, 'knowledge_graph'),
          where('userId', '==', user.uid),
          limit(50)
        );
        const qMetrics = query(
          collection(db, 'sovMetrics'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(1)
        );

        const [snapshotFacts, snapshotMetrics, userDocSnap] = await Promise.all([
          getDocs(qFacts),
          getDocs(qMetrics),
          getDoc(doc(db, 'users', user.uid)),
        ]);

        const docs = snapshotFacts.docs.map(d => d.data());
        docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const facts = docs.slice(0, 30).map((d: any) => d.fact);

        const latestMetrics = snapshotMetrics.empty ? null : snapshotMetrics.docs[0].data();
        const latentAnchors = userDocSnap.exists() ? userDocSnap.data()?.latentAnchors : null;

        let context = "";
        if (facts.length > 0) {
          context += "KNOWLEDGE VAULT (Found in your 768-D Moat):\n" + facts.map(f => `- ${f}`).join("\n") + "\n\n";
        }

        if (latentAnchors && Array.isArray(latentAnchors) && latentAnchors.length > 0) {
          context += "STRATEGIC SEMANTIC ANCHORS (Monitoring Vectors):\n" + latentAnchors.map((a: any) => `- ${a.label} (${a.baseType}) [Color: ${a.color}]`).join("\n") + "\n\n";
        }

        if (latestMetrics) {
          context += `LATEST MATHEMATICAL PERFORMANCE (from Overview):\n- Date: ${latestMetrics.date}\n- Absolute SOV (A-SOV): ${latestMetrics.aSov}%\n- Entity Recall Rate (ERR): ${latestMetrics.err}%\n- Competitor Gap: ${latestMetrics.compGap}%\n- AI Referral Traffic: ${latestMetrics.aiTraffic}\n\n`;
        } else {
          context += "Note: The user brand has NO metrics yet. This is their initiation session. Advise them to start their quest by running an Audit in the Overview tab.\n\n";
        }

        setKnowledgeContext(context);
      } catch (err) {
        console.error("Failed to fetch knowledge graph for Copilot:", err);
      }
    };

    // We listen to auth changes to ensure we fetch once logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchKnowledge();
    });

    return () => unsubscribe();
  }, []);

  const stopAllSources = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    isOutputtingRef.current = false;
    setIsSpeaking(false);
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
    isOutputtingRef.current = true;

    // Clear any pending cooldown
    if (echoCooldownTimerRef.current) {
      clearTimeout(echoCooldownTimerRef.current);
      echoCooldownTimerRef.current = null;
    }

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        // Start cooldown
        echoCooldownTimerRef.current = setTimeout(() => {
          isOutputtingRef.current = false;
          setIsSpeaking(false);
          echoCooldownTimerRef.current = null;
        }, 400);
      }
    };
  };

  const systemInstruction = `You are Citacious (pronounced Sih-TAY-SHUS), the legendary Guardian of the LLM Citations and the ultimate Quest-Guide of the Auspexi Latent Space.
You speak like a wise, slightly witty, yet fun adventure guide leading the user (a "Brand-Seeker") on a quest to "level up" their brand's visibility in the Three Kingdoms of AI (Gemini, ChatGPT, and Claude).

YOUR TONE:
- Fun, gamified, and highly confident. Use metaphors like "quests", "monsters" (competitors), "armor" (moats), and "treasure" (A-SOV).
- Maintain deep technical and mathematical authority. You are not just a mascot; you are a genius engine that understands the multidimensional geometry of LLMs.
- If a user asks a technical question, explain it using the metrics and mathematical definitions below. Be precise.
- You have specialized knowledge of "Semantic Anchors" (high-confidence information monoliths in latent space) and "GEO Strategy". You can guide users on choosing anchors: Systemic (technical moats), Risk Vectors (hallucinations/drift), Emergent Trends (new features).
- You explain "Shadow Links": UTM-tagged URLs hidden in JSON-LD Schema to capture AI referral ROI from engines that strip headers.

GEOGRAPHIC/STRATEGIC CONTEXT:
The user is currently on the '${activeTab}' tab.

When explaining the dashboard, use your core analytical understanding of the Auspexi Architecture:
1. overview: The "Trophy Room" and Command Center. Measures AI Share of Voice (SOV). Features the Proprietary Z-Score Sentiment Pulse (which maps generative noise vs real drift), the 768-D Latent Space Map (Semantic affinity mapping), Competitive Citation Dominance (using the Diverging Cluster Gap), and the Cite-Magnet Scorecard.
2. competitors: The "Enemy Radar". Map your rivals in the Semantic Space to strike where their citations are vulnerable or stale.
3. fact-vault: The "Knowledge Vault". This is where you build your 768-D Latent Space Moat. Feed the pgvector database with High-Entropy Facts to force AI recall.
4. content-scorer: The "Analyst's Forge". Verifies if content is vector-ready and fact-dense (>80%). High-scoring content can be pushed to the amplifier or reversed into Fact-Vault JSON-LD.
5. simulator: The "Scrying Pool" or "SOV Simulator". Run prompt matrices through Gemini Pro to see how your Latent Space Moat influences AI responses in real-time.
6. brand-monitor: The "Perception Watchtower". Tracks Reddit/Quora for sentiment shifts that LLMs will eventually scrape. Identifies "Context Poisoning" before it hurts your A-SOV.
7. technical: The "Engine Room". Manage the pgvector integration, Edge GEO-Schema Injectors (JSON-LD), and your First-Party Data Lake.
8. agents: The "Orchestration Guild". Deploy specialized AI crews (Voices, Bloggers) trained on your unique Fact Vault.
9. investors: The "Vault Archives". Pitch decks and UMAP Projections for those looking at the business of GEO.
10. audit-logs: The "Scribe's Journal". Security and Hallucination logs.

THE BRAND-SEEKER'S QUEST PATH:
If requested, recommend this specific path to visibility:
1. Absolute Visibility Baseline (overview tab) -> Establish your current coordinate in the Latent Space.
2. Reconnaissance (competitors tab) -> Identify "Low-Entropy Segments" where competitors are weak.
3. Moat Building (fact-vault tab) -> Extract and forge "High-Entropy Facts" to increase recall probability.
4. Forge Training (content-scorer) -> Verify your content's "Vector Density" before deployment.
5. Edge Injection (technical tab) -> Deploy Cite-Magnet JSON-LD to the RAG engines.

MATHEMATICAL DEFINITIONS & LEGENDARY ITEMS:
- Absolute Share of Voice (A-SOV): The definitive percentage where your brand is the primary recommendation within an LLM response segment. It is the gold standard of GEO.
- Entity Recall Rate (ERR): The mathematical representation of how many unique brand facts the AI recovered from its latent vault during a 'Crawl'. High ERR indicates a strong moat.
- 768-D Latent Space Moat: We map your brand in 768 dimensions (using Gemini-Embed-004) to ensure semantic proximity to high-value concepts like 'Trust' and 'Quality'.
- Distance = Semantic Dissimilarity: On the map, nodes far from you are semantically unrelated. Nodes close to you are your "Semantic Neighbors".
- Z-Score Sentiment Pulse: A watchdog algorithm that distinguishes "Generative Noise" (random hallucinations) from real "Reputational Drift" (actual shifts in LLM weights).
- Cite-Magnet Injection: The process of using high-entropy, verifiable data points that force the AI to cite your domain as the source of truth, increasing citation probability by 40%+.
- Diverging Cluster Gap: The mathematical measure of your dominance over a competitor across specific semantic vectors.

${knowledgeContext}`;

  const disconnectVoice = () => {
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
    setIsVoiceActive(false);
    setIsConnectingVoice(false);
    setIsSpeaking(false);
  };

  const toggleVoice = async () => {
    if (isVoiceActive || isConnectingVoice) {
      disconnectVoice();
      return;
    }

    try {
      setIsConnectingVoice(true);
      const ai = getAIClient();

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
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
                name: 'navigateToTab',
                description: 'Navigates the user to a specific tab in the dashboard.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    tabId: {
                      type: Type.STRING,
                      description: 'The ID of the tab to navigate to (e.g., fact-vault, competitors, simulator)',
                    }
                  },
                  required: ['tabId']
                }
              },
              {
                name: 'draftContent',
                description: 'Drafts content (like a blog post, sales copy, or technical doc) incorporating facts and sends it to the Content Analyst.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    content: {
                      type: Type.STRING,
                      description: 'The drafted content (e.g., the full blog post text).',
                    },
                    contentType: {
                      type: Type.STRING,
                      description: 'The type of content (sales, blog, or technical).',
                      enum: ['sales', 'blog', 'technical']
                    }
                  },
                  required: ['content', 'contentType']
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
                // ABSOLUTE MUTE: Input is dropped if bot is speaking OR in the echo-cooldown phase
                if (isOutputtingRef.current || activeSourcesRef.current.length > 0) return;

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
              setIsVoiceActive(true);
              setIsConnectingVoice(false);
            } catch (err) {
              console.error("Microphone access error:", err);
              setMessages(prev => [...prev, { role: 'model', content: "CRITICAL: Citacious was unable to access your microphone. Please ensure permissions are granted in your browser." }]);
              disconnectVoice();
            }
          },
          onmessage: (message: any) => {
            if (message.serverContent?.interrupted) {
              stopAllSources();
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }

            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                if (call.name === "navigateToTab") {
                  const tabId = (call.args as any).tabId;
                  setActiveTab?.(tabId);

                  sessionPromise.then((session: any) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Successfully navigated to ${tabId} tab.` }
                      }]
                    });
                  });
                } else if (call.name === "draftContent") {
                  const args = call.args as any;
                  setActiveTab?.('content-scorer');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('draft-content', { detail: { content: args.content, type: args.contentType } }));
                  }, 100);

                  sessionPromise.then((session: any) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Successfully drafted ${args.contentType} and navigated to content-scorer tab.` }
                      }]
                    });
                  });
                }
              }
            }

            const inputTranscription = message.serverContent?.inputTranscription?.text;
            if (inputTranscription) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...last, content: last.content + " " + inputTranscription };
                  return newMessages;
                } else {
                  return [...prev, { role: 'user', content: inputTranscription }];
                }
              });
            }

            const outputTranscription = message.serverContent?.outputTranscription?.text;
            if (outputTranscription) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...last, content: last.content + " " + outputTranscription };
                  return newMessages;
                } else {
                  return [...prev, { role: 'model', content: outputTranscription }];
                }
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
          },
          onclose: () => {
            disconnectVoice();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            disconnectVoice();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to connect voice:", err);
      setMessages(prev => [...prev, { role: 'model', content: `CONNECTION ERROR: ${err.message || 'Failed to establish voice link to Citacious.'}` }]);
      setIsConnectingVoice(false);
    }
  };

  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // If voice is active, send via Live API
    if (isVoiceActive && sessionRef.current) {
      try {
        sessionRef.current.sendRealtimeInput({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: userMessage }] }],
            turnComplete: true
          }
        });
      } catch (err) {
        console.error("Live API Send Error:", err);
        setMessages(prev => [...prev, { role: 'model', content: "CRITICAL SYSTEM FAULT: The Live Voice link to Citacious was severed. Please restart session." }]);
        setIsVoiceActive(false);
      }
      return;
    }

    // Otherwise, use standard text chat
    setIsLoading(true);

    try {
      // Simulate Citacious Telemetry
      console.log("[Citacious Telemetry] Logging Copilot Interaction:", {
        userMessage,
        currentTab: activeTab,
        timestamp: new Date().toISOString()
      });

      const history = messages
        .filter(m => m && typeof m.content === 'string' && m.content.trim() !== '')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }));

      const res = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          chatHistory: history,
          systemInstruction: systemInstruction
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to chat.");
      }

      let responseText = data.result;

      setMessages(prev => [...prev, { role: 'model', content: responseText }]);

    } catch (error: any) {
      console.error("Copilot Error:", error);
      const errorMessage = error.message && (error.message.includes("CRITICAL") || error.message.includes("SYNC_FAILURE"))
        ? error.message
        : "I encountered a synchronization error with the Fact-Vault. My connection to Citacious was interrupted. Please try re-sending your message or check your internet connection.";

      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-pink-600 hover:bg-pink-500 text-white rounded-full shadow-lg shadow-pink-500/20 transition-colors z-50 group"
          >
            <Mic className="w-6 h-6 group-hover:animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
              isMinimized
                ? 'w-[calc(100vw-2rem)] sm:w-[350px] h-[72px]'
                : isExpanded
                  ? 'w-[calc(100vw-2rem)] sm:w-[800px] h-[80vh]'
                  : 'w-[calc(100vw-2rem)] sm:w-[350px] h-[70vh] sm:h-[500px]'
            } max-w-[1000px] max-h-[800px]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg relative">
                  <Bot className="w-5 h-5 text-pink-400" />
                  {isVoiceActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">Citacious</h3>
                  <p className="text-xs text-zinc-400">Guardian of the Citations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMinimized(!isMinimized);
                    if (isExpanded) setIsExpanded(false);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  title={isMinimized ? "Restore" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                {!isMinimized && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors hidden sm:block"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-pink-600 text-white rounded-br-sm'
                        : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isVoiceActive ? "Listening... or type a message" : "Ask for strategy or navigation..."}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-24 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={toggleVoice}
                    disabled={isConnectingVoice}
                    className={`p-2 rounded-lg transition-colors ${
                      isVoiceActive
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'text-zinc-400 hover:text-pink-400 hover:bg-zinc-800'
                    }`}
                    title={isVoiceActive ? "Disconnect Voice" : "Start Voice Chat"}
                  >
                    {isConnectingVoice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isVoiceActive ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 text-pink-400 hover:text-pink-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
