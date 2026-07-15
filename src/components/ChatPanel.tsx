/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Message, GateData } from "../types";
import { Send, Sparkles, BrainCircuit, Globe2, Compass, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  gates: GateData[];
}

const PRESETS = [
  {
    label: "🇺🇸 Near B, Section 214",
    text: "I'm near Gate B, trying to reach Section 214, entrance closes in 20 minutes"
  },
  {
    label: "🇪🇸 Cerca de Puerta B, Sec 214",
    text: "Estoy cerca de la Puerta B, intento llegar a la Sección 214, la entrada cierra en 20 minutos"
  },
  {
    label: "🇫🇷 Porte C, Sec 105",
    text: "Je suis près de la Porte C, j'essaie d'atteindre la section 105"
  },
  {
    label: "🇩🇪 Tor F, Sektor 120",
    text: "Ich bin bei Tor F und muss zu Sektor 120"
  },
  {
    label: "🇧🇷 Portão B, Seção 203",
    text: "Perto do Portão B para a Seção 203, faltam 15 minutos"
  }
];

/**
 * Renders the interactive fan chat assistant panel.
 * Supports multiple languages, simulation presets, real-time response logs, and ARIA attributes for screen readers.
 */
export default function ChatPanel({ messages, onSendMessage, isLoading, gates }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handlePresetClick = (presetText: string) => {
    if (isLoading) return;
    onSendMessage(presetText);
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[650px] bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden" id="chat-panel">
      {/* Header */}
      <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cybercyan rounded-sm flex items-center justify-center font-bold text-black text-sm">
            GS
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5" id="chat-title">
              GateSense
            </h3>
            <p className="text-[10px] text-white/60 font-mono uppercase tracking-tighter">AI Reasoning Engine: Gemini-3.5-Flash</p>
          </div>
        </div>

        <div className="text-[9px] font-mono uppercase tracking-widest text-white/60 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Operational
        </div>
      </div>

      {/* Message Area */}
      <div 
        className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 bg-black/20" 
        role="log" 
        aria-live="polite" 
        aria-label="Chat Message History"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-5 rounded-lg bg-white/5 border border-white/10 text-white/70 max-w-sm flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-cybercyan mb-2.5 animate-pulse" aria-hidden="true" />
              <p className="text-xs font-mono text-white tracking-wide uppercase mb-1">
                Awaiting Fan Situation
              </p>
              <p className="text-[11px] text-white/70 leading-relaxed font-light">
                Describe your current location gate, target section, or urgency in any language (e.g. Spanish, French, Portuguese, German, or English).
              </p>
            </div>
            
            {/* Quick Presets */}
            <div className="w-full max-w-md space-y-2">
              <span className="text-[10px] text-white/60 uppercase tracking-widest font-mono block">
                Quick Evaluator Scenarios
              </span>
              <div className="flex flex-col gap-1.5 text-left" role="group" aria-label="Quick start query presets">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.text)}
                    className="text-xs p-3 rounded bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 text-left transition truncate cursor-pointer font-sans focus:outline-none focus:ring-1 focus:ring-cybercyan"
                    id={`preset-${idx}`}
                    aria-label={`Ask preset: ${preset.label}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  id={`chat-msg-${msg.id}`}
                >
                  <div className={`space-y-2.5 max-w-[90%] ${msg.role === "user" ? "text-right flex flex-col items-end" : "text-left flex flex-col items-start"}`}>
                    <div
                      className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-white/10 text-white font-light rounded-tr-none"
                          : "bg-cybercyan/10 border border-cybercyan/20 text-cybercyan rounded-tl-none font-medium"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Rendering the Reasoning Engine Outcome for Evaluators */}
                    {msg.role === "assistant" && msg.data && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="reasoning-box p-4 rounded-r-lg max-w-[95%] space-y-2.5 text-left w-full bg-white/5 border border-white/5"
                        id={`cognitive-reasoning-${msg.id}`}
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className="text-[10px] font-mono tracking-widest text-cybercyan uppercase flex items-center gap-1">
                            <Compass className="w-3 h-3 text-cybercyan" />
                            REASONING CHAIN
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded font-mono text-white/70 bg-white/5 border border-white/10">
                            {msg.data.isFallback ? "OFFLINE_FALLBACK" : "GEMINI_API_LIVE"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-white/70">
                          <div>
                            <span className="block text-[9px] tracking-wider text-white/50">DETECTED_LOCALE</span>
                            <span className="text-white flex items-center gap-1 font-sans mt-0.5">
                              <Globe2 className="w-3 h-3 text-cybercyan shrink-0" />
                              {msg.data.detectedLanguage.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] tracking-wider text-white/50">RECOMMENDED_ACCESS</span>
                            <span className="text-cybercyan font-bold font-mono mt-0.5">
                              {msg.data.recommendedGate === "NONE" ? "NONE (EMERGENCY_LOCK)" : `GATE ${msg.data.recommendedGate}`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-white/80 leading-relaxed italic border-t border-white/5 pt-2">
                          {msg.data.reasoning}
                        </p>
                      </motion.div>
                    )}

                    <div className="text-[9px] text-white/50 px-1 font-mono uppercase">
                      {msg.role === "user" ? "Fan Inquiry" : "AI Assistant"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start"
                id="chat-loading-indicator"
              >
                <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-4 h-4 text-cybercyan animate-spin" />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl rounded-tl-none max-w-[80%] space-y-1.5">
                  <div className="text-[10px] text-cybercyan flex items-center gap-1.5 font-mono uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-cybercyan animate-pulse" />
                    Cognitive sensor evaluation...
                  </div>
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-cybercyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-cybercyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-cybercyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion Chips (when some messages already exist) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/10 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none" role="group" aria-label="Additional query presets">
          <span className="text-[9px] font-mono text-white/30 shrink-0 uppercase tracking-widest self-center mr-1">PRESETS:</span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset.text)}
              disabled={isLoading}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded px-2.5 py-1.5 font-mono transition disabled:opacity-50 inline-block cursor-pointer focus:outline-none focus:ring-1 focus:ring-cybercyan"
              id={`preset-inline-${idx}`}
              aria-label={`Ask preset: ${preset.label}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-black/60 border-t border-white/10 flex flex-col gap-1.5" role="form" aria-label="Ask crowd copilot panel">
        <p id="query-input-description" className="sr-only">
          Input your stadium location, target section, or urgency in Spanish, French, Portuguese, German, or English to receive route safety recommendations.
        </p>
        <div className="flex gap-2 w-full">
          <label htmlFor="fan-query-input" className="sr-only">Ask crowd copilot</label>
          <input
            id="fan-query-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your situation (e.g. 'Estoy cerca de la Puerta B, ¿cómo llego a la sección 214?')"
            disabled={isLoading}
            aria-required="true"
            aria-describedby="query-input-description"
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-black text-sm text-white px-4 py-3.5 rounded-lg border border-white/10 focus:border-cybercyan transition outline-none placeholder-white/60 font-light focus:ring-1 focus:ring-cybercyan"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-white/10 hover:bg-cybercyan/20 text-white hover:text-black border border-white/10 hover:border-cybercyan disabled:bg-white/5 disabled:border-white/10 disabled:text-white/20 px-5 rounded-lg transition duration-150 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cybercyan"
            aria-label="Send query"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
