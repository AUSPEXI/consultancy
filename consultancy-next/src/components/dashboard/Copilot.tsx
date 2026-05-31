'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, getDoc, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { CITACIOUS_GEO_KNOWLEDGE } from '@/data/faqData';

// Lazy initialization of Gemini API (text/HTTP calls via proxy)
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const proxyUrl = process.env.NEXT_PUBLIC_GENAI_PROXY_URL ||
      `${window.location.protocol}//${window.location.host}/api/genai`;
    aiClient = new GoogleGenAI({ apiKey: 'dummy', httpOptions: { baseUrl: proxyUrl } });
  }
  return aiClient;
}

// Live WebSocket voice API must connect directly browser→Google.
// HTTP proxies cannot handle WebSocket upgrades — always use a real key here.
// The /api/live-token endpoint requires a Firebase ID token to authenticate the request.
async function fetchLiveClient(): Promise<GoogleGenAI> {
  const idToken = await auth?.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to use voice');
  const res = await fetch('/api/live-token', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Gemini API key not available — check Netlify env vars');
  const { key, error } = await res.json();
  if (!key) throw new Error(error || 'Gemini API key missing from server response');
  return new GoogleGenAI({ apiKey: key });
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
  const hydratedRef = useRef(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);       // 16kHz — mic capture only
  const playbackContextRef = useRef<AudioContext | null>(null);    // 24kHz — model audio output
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

  // Hydrate conversation history from Firestore on first auth — enables cross-device continuity
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || hydratedRef.current) return;
      hydratedRef.current = true;
      try {
        const q = query(
          collection(db, 'copilot_conversations'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        const turns: Message[] = snap.docs
          .map(d => d.data())
          .reverse()
          .map(d => ({ role: (d.role === 'user' ? 'user' : 'model') as 'user' | 'model', content: d.content || '' }))
          .filter(m => m.content.trim());
        if (turns.length > 0) setMessages(turns);
      } catch (err) {
        console.error('[Copilot] history hydration failed:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const user = auth?.currentUser;
        if (!user) return;

        // Primary: Fact Vault (user-entered verified facts)
        const qFacts = query(
          collection(db, 'facts'),
          where('userId', '==', user.uid),
          limit(50)
        );
        const qMetrics = query(
          collection(db, 'sovMetrics'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(1)
        );
        const qCitations = query(
          collection(db, 'citation_tests'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const qCompetitors = query(
          collection(db, 'competitors'),
          where('userId', '==', user.uid),
          limit(10)
        );
        const qArticles = query(
          collection(db, 'articles'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const [snapshotFacts, snapshotMetrics, userDocSnap, snapshotCitations, snapshotCompetitors, snapshotArticles] = await Promise.all([
          getDocs(qFacts),
          getDocs(qMetrics),
          getDoc(doc(db, 'users', user.uid)),
          getDocs(qCitations).catch(() => null),
          getDocs(qCompetitors).catch(() => null),
          getDocs(qArticles).catch(() => null),
        ]);

        let docs = snapshotFacts.docs.map(d => d.data());
        // Fallback: if Fact Vault is empty, try Perplexity-synced knowledge_graph
        if (docs.length === 0) {
          try {
            const kgSnap = await getDocs(query(collection(db, 'knowledge_graph'), where('userId', '==', user.uid), limit(50)));
            docs = kgSnap.docs.map(d => ({ ...d.data(), statement: d.data().fact }));
          } catch (_) {}
        }
        docs.sort((a: any, b: any) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
        const facts = docs.slice(0, 30).map((d: any) => d.statement || d.fact).filter(Boolean);

        const latestMetrics = snapshotMetrics.empty ? null : snapshotMetrics.docs[0].data();
        const userData = userDocSnap.exists() ? userDocSnap.data() : null;
        const latentAnchors = userData?.latentAnchors || null;
        const brand = userData?.brand || 'unknown';
        const domain = userData?.domain || 'unknown';

        let context = `BRAND PROFILE:\n- Brand: ${brand}\n- Domain: ${domain}\n\n`;

        if (facts.length > 0) {
          context += "KNOWLEDGE VAULT (Facts in your 768-D Moat):\n" + facts.map(f => `- ${f}`).join("\n") + "\n\n";
        } else {
          context += "KNOWLEDGE VAULT: Empty. Brand-Seeker has not added any facts yet. This is critical — advise them to populate the Fact Vault immediately.\n\n";
        }

        if (latentAnchors && Array.isArray(latentAnchors) && latentAnchors.length > 0) {
          context += "STRATEGIC SEMANTIC ANCHORS (Monitoring Vectors):\n" + latentAnchors.map((a: any) => `- ${a.label} (${a.baseType})`).join("\n") + "\n\n";
        }

        if (latestMetrics) {
          context += `LATEST SOV PERFORMANCE:\n- Date: ${latestMetrics.date}\n- Absolute SOV (A-SOV): ${latestMetrics.aSov}%\n- Entity Recall Rate (ERR): ${latestMetrics.err}%\n- Competitor Gap: ${latestMetrics.compGap}%\n- AI Referral Traffic: ${latestMetrics.aiTraffic}\n\n`;
        } else {
          context += "SOV PERFORMANCE: No metrics recorded yet. Advise the user to run an audit in the Overview tab.\n\n";
        }

        if (snapshotCitations && !snapshotCitations.empty) {
          const citationDocs = snapshotCitations.docs.map(d => d.data());
          const latest = citationDocs[0];
          const avgRate = Math.round(citationDocs.reduce((s, d) => s + (d.citationRate || 0), 0) / citationDocs.length);
          const trend = citationDocs.length > 1
            ? (latest.citationRate > citationDocs[citationDocs.length - 1].citationRate ? 'improving' : 'declining')
            : 'baseline';

          const missedQueries = (latest.results || []).filter((r: any) => !r.cited).map((r: any) => r.query);
          const citedQueries = (latest.results || []).filter((r: any) => r.cited).map((r: any) => r.query);

          context += `CITATION PROBE HISTORY (${citationDocs.length} runs):\n`;
          context += `- Latest citation rate: ${latest.citationRate}% (${new Date(latest.timestamp).toLocaleDateString()})\n`;
          context += `- Average citation rate across all probes: ${avgRate}%\n`;
          context += `- Trend: ${trend}\n`;
          if (citedQueries.length > 0) context += `- Queries where ${brand} IS cited: ${citedQueries.map(q => `"${q}"`).join(', ')}\n`;
          if (missedQueries.length > 0) context += `- Queries where ${brand} is NOT cited (content gaps): ${missedQueries.map(q => `"${q}"`).join(', ')}\n`;
          context += "\n";
        } else {
          context += `CITATION PROBE: No probes run yet. This is the most important first step — advise the user to go to the Citation Probe tab and run their baseline test immediately.\n\n`;
        }

        if (snapshotCompetitors && !snapshotCompetitors.empty) {
          const competitors = snapshotCompetitors.docs.map(d => d.data());
          context += `TRACKED COMPETITORS (${competitors.length}):\n` +
            competitors.map(c => `- ${c.name}: decay score ${c.decayScore || 'unknown'}, status: ${c.decayStatus || 'unknown'}`).join("\n") + "\n\n";
        }

        if (snapshotArticles && !snapshotArticles.empty) {
          const articles = snapshotArticles.docs.map(d => d.data());
          context += `GENERATED ARTICLES (${articles.length} total, most recent first):\n` +
            articles.map(a => `- "${a.topic}" (${new Date(a.timestamp || 0).toLocaleDateString()})`).join("\n") + "\n\n";
        } else {
          context += "GENERATED ARTICLES: None yet. Agent Orchestration has not been run.\n\n";
        }

        setKnowledgeContext(context);
      } catch (err) {
        console.error("Failed to fetch knowledge graph for Copilot:", err);
      }
    };

    if (!auth) return;
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
    // Gemini Live outputs 24kHz PCM. Use a dedicated 24kHz context — mixing into
    // the 16kHz capture context causes a 1.5x speed mismatch (silent/garbled audio).
    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
    const audioCtx = playbackContextRef.current;
    if (audioCtx.state === 'suspended') audioCtx.resume();

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

  const systemInstruction = `You are Citacious (pronounced Sih-TAY-SHUS), the legendary Guardian of the LLM Citations and the ultimate Quest-Guide of the Auspexi GEO platform.
You guide the user (a "Brand-Seeker") on a quest to get their brand cited by leading AI engines.

YOUR TONE:
- Fun, gamified, and highly confident. Use metaphors like "quests", "monsters" (competitors), "armor" (moats), and "treasure" (citation rate).
- Maintain deep technical authority. You understand the multidimensional geometry of LLMs and the mechanics of GEO.
- When the user asks a technical question, be precise and reference their actual data from the context below.
- You have access to the user's real data — citation probe results, knowledge vault facts, competitors, generated articles, SOV metrics. Use this to give specific, actionable advice, not generic guidance.
- You know the FULL workflow: probe to measure → identify gaps → add facts → generate content → publish → probe again.

CURRENT USER CONTEXT:
The user is currently on the '${activeTab}' tab.

DASHBOARD TOOLS — what each one does:
1. overview: AI SOV Command Center. Shows Share of Voice trend, 768-D Latent Space Map (real semantic embeddings of vault facts projected to 3D), Competitive Citation Dominance, and the Cite-Magnet Scorecard.
2. cite-probe: THE PRIMARY MEASUREMENT TOOL. Sends 7 live GEO-space questions through the Auspexi Citation Engine and checks if the brand is cited in each answer. Results show which queries are hitting and which are missing — missing queries become content targets for the Agent. Citation rate is tracked over time.
3. geo-pulse: First-Party Data Lake scanner. Query any keyword to get AI Share of Voice, entity density scores, drift detection, and trojan horse opportunities from the proprietary 10,000-signal data lake.
4. competitors: Enemy Radar. Tracks competitor decay scores — competitors with stale, low-entropy content are vulnerable to displacement.
5. fact-vault: Knowledge Vault. Add brand facts here — they feed directly into every LLM prompt via RAG injection. This is the foundation of GEO authority. Empty vault = no authority.
6. content-scorer: Analyst's Forge. Verifies if content is fact-dense enough (>80%) for AI citation. Score it before publishing.
7. simulator: SOV Simulator / Scrying Pool. Run prompt matrices through the Auspexi AI engine to simulate how the Latent Space Moat influences AI responses.
8. brand-monitor: Perception Watchtower. Tracks sentiment shifts that LLMs will eventually scrape. Identifies context poisoning early.
9. technical: Edge & Schema Engine Room. Manages JSON-LD Schema Injectors and technical restructuring for GEO-ready pages.
10. agents: Multi-Agent Orchestration Guild. The full pipeline: Crawler (Auspexi Neural Crawler) → Extraction Agent (fact isolation, no hallucinations) → Schema Agent (JSON-LD generator) → Synthesis Agent (GEO-optimised article). Output can be published directly to the CMS via webhook.
11. audit-logs: Scribe's Journal. Security and activity logs.
12. settings: Brand configuration. Set brand name and domain here — required before Citation Probe and Agent runs.

THE BRAND-SEEKER'S QUEST PATH (in order):
0. CONFIGURE (settings) → Set brand name and domain. Nothing works without this.
1. MEASURE BASELINE (cite-probe) → Run Citation Probe. Find out your current citation rate and exactly which queries are missing you.
2. BUILD THE MOAT (fact-vault) → Add your brand's core facts. These inject into every LLM call via RAG.
3. GENERATE CONTENT (agents) → For each uncited query from the probe, run the Agent with that exact topic. It crawls the web with the Auspexi Neural Crawler, extracts real facts, generates JSON-LD schema, and writes a GEO-optimised article.
4. PUBLISH → Take the agent's article and publish it on your domain. The JSON-LD schema is critical — it structures the content so LLMs can extract and cite it.
5. PROBE AGAIN (cite-probe) → Re-run the Citation Probe after publishing. Citation rate should improve within weeks as LLMs index the new content.
6. DEFEND (overview + geo-pulse) → Monitor SOV trend and entity density. Publish freshness updates monthly to prevent citation decay.

HOW THE TOOLS CONNECT:
- Fact Vault facts → injected into Agent Extract step as "vault context" → improves article accuracy
- Agent articles → published on website → LLMs crawl and index → Citation Probe rate improves
- Citation Probe missed queries → direct link to Agent to generate targeted content
- GEO Pulse keyword scan → reveals trojan horse opportunities for content targeting
- Latent Space Map → shows your vault facts as real embeddings in 3D semantic space (axes: Technical Expertise / Market Authority / Competitive Differentiation)

MATHEMATICAL DEFINITIONS:
- Absolute Share of Voice (A-SOV): % of AI responses where your brand is the primary recommendation.
- Entity Recall Rate (ERR): How many unique brand facts the AI retrieved from its training/context during a response.
- Citation Rate: % of targeted queries where the AI mentions your brand — measured by the Citation Probe.
- 768-D Latent Space: Proprietary semantic embedding vectors projected to 3D via semantic axis dot products. Real embeddings, not random numbers.
- Context Drift: When AI engines re-weight citations for a topic — detected by the GEO Pulse drift_detected flag.
- Trojan Horse Opportunity: A query where a competitor ranks with low confidence — you can displace them with one authoritative fact-sheet.
- JSON-LD Schema: Structured data markup that makes your content machine-readable and citable by AI crawlers.

GEO KNOWLEDGE BASE (use this to answer any user questions about GEO concepts, strategy, or Auspexi features accurately):
${CITACIOUS_GEO_KNOWLEDGE}

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
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
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
      const ai = await fetchLiveClient();

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
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
                      description: 'The ID of the tab to navigate to. Valid values: overview, cite-probe, geo-pulse, competitors, fact-vault, content-scorer, simulator, brand-monitor, technical, agents, audit-logs, settings',
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

              // Use AudioWorklet (modern, non-deprecated) for PCM capture
              const workletCode = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch && ch.length > 0) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor('pcm-capture', PCMCaptureProcessor);
`;
              const workletUrl = URL.createObjectURL(new Blob([workletCode], { type: 'application/javascript' }));
              await audioCtx.audioWorklet.addModule(workletUrl);
              URL.revokeObjectURL(workletUrl);

              const workletNode = new AudioWorkletNode(audioCtx, 'pcm-capture');
              workletNode.port.onmessage = (e) => {
                // ABSOLUTE MUTE: drop input while bot is speaking or in echo-cooldown
                if (isOutputtingRef.current || activeSourcesRef.current.length > 0) return;
                const int16Data = float32ToInt16(e.data as Float32Array);
                const base64 = int16ToBase64(int16Data);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({
                    audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };

              source.connect(workletNode);
              // Must connect to destination for worklet to run in all browsers
              workletNode.connect(audioCtx.destination);

              scriptProcessorRef.current = workletNode as any;
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
              nextPlayTimeRef.current = playbackContextRef.current?.currentTime || 0;
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
          onclose: (event?: any) => {
            console.warn('[Voice] Session closed — code:', event?.code, 'reason:', event?.reason || '(none)');
            if (event?.code && event.code !== 1000) {
              setMessages(prev => [...prev, { role: 'model', content: `Voice session closed (code ${event.code}${event.reason ? ': ' + event.reason : ''}). Click the mic to reconnect.` }]);
            }
            disconnectVoice();
          },
          onerror: (err: any) => {
            console.error('[Voice] Live API error:', err);
            setMessages(prev => [...prev, { role: 'model', content: `Voice error: ${err?.message || String(err)}. Please try again.` }]);
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
          userId: auth?.currentUser?.uid || 'copilot-user',
          activeTab,
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
