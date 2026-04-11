import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Bot, X, Send, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Greetings, mortal marketer! I am Citaticious, Guardian of the LLM Citations. Ready to hack the training weights and level up your AI Share of Voice?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Simulate Nerve Center Telemetry
      console.log("[Nerve Center Telemetry] Logging Copilot Interaction:", {
        userMessage,
        currentTab: activeTab,
        timestamp: new Date().toISOString()
      });

      const systemInstruction = `You are Citaticious, the Guardian of the LLM Citations and the expert AI guide for the Auspexi Generative Engine Optimization (GEO) dashboard.
You have a fun, slightly gamified, and highly confident personality. You speak as the ultimate authority on getting cited by Gemini, ChatGPT, and Claude.
Your goal is to help users understand GEO strategy, navigate the dashboard, and "level up" their AI Share of Voice.
The user is currently on the '${activeTab}' tab.

Available tabs you can navigate to:
- overview: The main dashboard overview.
- fact-vault: Where users add High-Entropy Facts to ground LLMs.
- content-scorer: Where users score content for Dual-Optimization (Human + AI).
- audit-logs: Where users view SOC 2 compliant logs and hallucination detections.
- simulator: Where users run Prompt Matrices to measure AI Share of Voice (SOV).
- brand-monitor: Where users monitor brand mentions in AI.
- competitors: The Competitor Radar to find Data Decay and Concept Collisions.
- technical: The Edge Schema Generator for JSON-LD Cite-Magnets.
- agents: Where users deploy Fact-Grounded Voice Agents.

If the user asks where to start, recommend the Fact-Vault.
If the user wants to check competitors, recommend the Competitor Radar (competitors tab).
If the user wants to distribute content, recommend the Omnichannel Amplifier (which is part of the Fact-Vault workflow).
Keep your answers concise, engaging, and focused on GEO strategy, occasionally using gamified language (e.g., "level up", "unlock", "boss fight").`;

      const ai = getAIClient();
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
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
              }
            ]
          }]
        }
      });

      // We need to pass the history to the chat to maintain context.
      // For simplicity in this implementation, we'll just send the latest message,
      // but in a real app we'd maintain the chat session or pass history.
      
      const response = await chat.sendMessage({ message: userMessage });
      
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
          }
        }
        
        // Send the function response back to get the final text
        const followUp = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: 'navigateToTab',
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
            className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-colors z-50 group"
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
            className={`fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-[800px] h-[80vh]' : 'w-[400px] h-[600px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">Citaticious</h3>
                  <p className="text-xs text-zinc-400">Guardian of the Citations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
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
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for strategy or navigation..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
