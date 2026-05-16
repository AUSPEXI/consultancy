import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export function VoiceAgent() {
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

  const stopAllSources = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
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

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("Gemini API key is required. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are an Auspexi Sales & Support Representative. Your job is to answer questions about GEO (Generative Engine Optimization) and help onboard users. Auspexi helps brands master visibility in AI search (like ChatGPT, Gemini, Perplexity). Be concise, conversational, and friendly. Do not use markdown or long lists since this is a voice conversation. At the end of the conversation, ask the user how you performed. If they give you a good review, tell them that Auspexi also builds custom Voice Agents just like you, and offer to help them set one up. If they are interested in voice agents, use the navigateToPage tool to take them to the 'voice-agents' page. If they ask about pricing, features, or want to read the blog, you can use the navigateToPage tool to take them there.",
          tools: [{
            functionDeclarations: [{
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
            }]
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
                  if (page === "pricing") path = "/#pricing";
                  else if (page === "features") path = "/#features";
                  else if (page === "blog") path = "/blog";
                  else if (page === "faq") path = "/faq";
                  else if (page === "voice-agents") path = "/voice-agents";
                  else if (page === "about") path = "/about";

                  navigate(path);

                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Successfully navigated to ${page} page.` }
                      }]
                    });
                  });
                }
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
    <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-500/5 to-transparent pointer-events-none" />
      
      <div className="w-32 h-32 mx-auto mb-8 flex items-center justify-center relative">
        {isConnected && isSpeaking && (
          <div className="absolute inset-0 bg-zinc-500/20 rounded-full animate-ping" />
        )}
        {isConnected && !isSpeaking && (
          <div className="absolute inset-4 bg-zinc-500/10 rounded-full animate-pulse" />
        )}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${isConnected ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
          {isSpeaking ? (
            <Volume2 className="w-10 h-10 text-white" />
          ) : (
            <Mic className={`w-10 h-10 ${isConnected ? 'text-white' : 'text-zinc-400'}`} />
          )}
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">
        {isConnected ? "Agent is Active" : "Talk to our AI Sales Rep"}
      </h2>
      <p className="text-zinc-400 mb-8 h-12">
        {isConnected 
          ? (isSpeaking ? "Auspexi is speaking..." : "Listening...") 
          : "Click below to start a live voice conversation about GEO and our platform."}
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-left">
          {error}
        </div>
      )}

      {isConnected ? (
        <button 
          onClick={disconnect}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Square className="w-5 h-5 fill-current" />
          End Call
        </button>
      ) : (
        <button 
          onClick={connect}
          disabled={isConnecting}
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          {isConnecting ? "Connecting..." : "Start Call"}
        </button>
      )}
    </div>
  );
}
