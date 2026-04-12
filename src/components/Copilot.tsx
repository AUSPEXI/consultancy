import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

// Lazy initialization of Gemini API
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
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
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Copilot({ activeTab, setActiveTab }: CopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('copilot_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      { role: 'model', content: "Greetings, mortal marketer! I am Citaticious, Guardian of the LLM Citations. Ready to hack the training weights and level up your AI Share of Voice?" }
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const q = query(collection(db, 'knowledge_graph'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const facts = snapshot.docs.map(doc => doc.data().fact);
        if (facts.length > 0) {
          setKnowledgeContext("Here are some learned facts and context about the company from previous conversations that you should know:\n" + facts.map(f => `- ${f}`).join("\n"));
        }
      } catch (err) {
        console.error("Failed to fetch knowledge graph for Copilot:", err);
      }
    };
    fetchKnowledge();
  }, []);

  const stopAllSources = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
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

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
    };
  };

  const systemInstruction = `You are Citaticious, the Guardian of the LLM Citations and the expert AI guide for the Auspexi Generative Engine Optimization (GEO) dashboard.
You have a fun, slightly gamified, and highly confident personality. You speak as the ultimate authority on getting cited by Gemini, ChatGPT, and Claude.
Your goal is to help users understand GEO strategy, navigate the dashboard, and "level up" their AI Share of Voice.
The user is currently on the '${activeTab}' tab.

Available tabs and their specific features:
- overview: The main dashboard overview showing GEO score and metrics.
- fact-vault: Where users add High-Entropy Facts to ground LLMs. IT HAS AN 'Auto-Research' BUTTON that opens the "Fact-Grabber" modal. This modal can automatically generate facts by scraping URLs or searching the web. Users do NOT have to manually enter everything.
- content-scorer: Where users score content for Dual-Optimization (Human + AI). This tool is also known as the "Content Analyst".
- audit-logs: Where users view SOC 2 compliant logs and hallucination detections.
- simulator: Where users run Prompt Matrices to measure AI Share of Voice (SOV).
- brand-monitor: Where users monitor brand mentions in AI.
- competitors: The Competitor Radar to find Data Decay and Concept Collisions.
- technical: The Edge Schema Generator for JSON-LD Cite-Magnets.
- agents: Where users deploy Fact-Grounded Voice Agents.

If the user asks where to start, recommend the Fact-Vault and mention the Fact-Grabber (Auto-Research) tool.
If the user wants to check competitors, recommend the Competitor Radar (competitors tab).
If the user wants to distribute content, recommend the Omnichannel Amplifier (which is part of the Fact-Vault workflow).
If the user wants to write a blog post, sales copy, or technical doc incorporating their facts, DO NOT ask them for a topic if they have already provided context or facts. Proactively use the 'draftContent' tool to generate the content and send it to the Content Analyst.
When drafting content (especially blog posts) using the 'draftContent' tool:
- Ensure blog posts are comprehensive and a minimum of 500 words. Do NOT generate single-paragraph blog posts.
- Maintain a professional, educational, and engaging tone that fits the user's brand.
- Understand the user's service offerings and stay strictly on topic when increasing entity density.
- Seamlessly weave the provided facts into the narrative.
Keep your answers concise, engaging, and focused on GEO strategy, occasionally using gamified language (e.g., "level up", "unlock", "boss fight").

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
              setIsVoiceActive(true);
              setIsConnectingVoice(false);
            } catch (err) {
              console.error("Microphone access error:", err);
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
                  setActiveTab(tabId);
                  
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
                  setActiveTab('content-scorer');
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
    } catch (err) {
      console.error("Failed to connect voice:", err);
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
      sessionRef.current.sendRealtimeInput({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: userMessage }] }],
          turnComplete: true
        }
      });
      return;
    }

    // Otherwise, use standard text chat
    setIsLoading(true);

    try {
      // Simulate Nerve Center Telemetry
      console.log("[Nerve Center Telemetry] Logging Copilot Interaction:", {
        userMessage,
        currentTab: activeTab,
        timestamp: new Date().toISOString()
      });

      const ai = getAIClient();
      if (!chatRef.current) {
        // Build history from existing messages, skipping the initial greeting if it's the only one, 
        // or just pass them all. The Gemini API expects alternating user/model turns, starting with user.
        // Actually, it's safer to just let the model see the history.
        const history = messages
          .filter(m => m && typeof m.content === 'string' && m.content.trim() !== '') // Ensure no empty messages
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));

        // Gemini history must start with 'user' and strictly alternate between 'user' and 'model'.
        const normalizedHistory: any[] = [];
        let expectedRole = 'user';
        
        for (const msg of history) {
          if (msg.role === expectedRole) {
            normalizedHistory.push(msg);
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
          } else {
            normalizedHistory.push({
              role: expectedRole,
              parts: [{ text: expectedRole === 'user' ? '...' : 'Understood.' }]
            });
            normalizedHistory.push(msg);
            // After pushing the expected role, the actual role was pushed.
            // The actual role is the opposite of expectedRole.
            // So the NEXT expected role should be the original expectedRole.
          }
        }

        // The history must end with a 'model' message because we are about to send a 'user' message via sendMessage.
        if (normalizedHistory.length > 0 && normalizedHistory[normalizedHistory.length - 1].role === 'user') {
          normalizedHistory.push({
            role: 'model',
            parts: [{ text: 'Understood.' }]
          });
        }

        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          history: normalizedHistory,
          config: {
            systemInstruction,
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
          }
        });
      }
      
      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      let responseText = '';
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'navigateToTab') {
            const args = call.args as { tabId: string };
            setActiveTab(args.tabId);
            responseText += `I have navigated you to the ${args.tabId} tab. `;
            
            // Simulate Nerve Center Telemetry for action
            console.log("[Nerve Center Telemetry] Executed Action:", {
              action: 'navigateToTab',
              target: args.tabId,
              timestamp: new Date().toISOString()
            });
          } else if (call.name === 'draftContent') {
            const args = call.args as any;
            setActiveTab('content-scorer');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('draft-content', { detail: { content: args.content, type: args.contentType } }));
            }, 100);
            responseText += `I have drafted the ${args.contentType} and navigated you to the Content Analyst tab. `;
            
            console.log("[Nerve Center Telemetry] Executed Action:", {
              action: 'draftContent',
              target: 'content-scorer',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Send the function response back to get the final text
        const followUp = await chatRef.current.sendMessage({
          message: [{
            functionResponse: {
              name: response.functionCalls[0].name,
              response: { success: true }
            }
          }]
        });
        
        if (followUp.text) {
          responseText += followUp.text;
        }
      } else if (response.text) {
        responseText = response.text;
      }

      setMessages(prev => [...prev, { role: 'model', content: responseText }]);

    } catch (error) {
      console.error("Copilot Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered an error connecting to the Nerve Center. Please try again." }]);
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
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-pink-600 hover:bg-pink-500 text-white rounded-full shadow-lg shadow-pink-500/20 transition-colors z-50 group"
          >
            <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
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
                  <h3 className="font-medium text-zinc-100">Citaticious</h3>
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
