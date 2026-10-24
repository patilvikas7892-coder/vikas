import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Volume2, VolumeX, Copy, Check, AlertCircle, Info, ShieldAlert, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ChatMessage, DistrictGroundwaterInfo } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatbotProps {
  selectedDistrict: DistrictGroundwaterInfo | null;
  onClearDistrictContext: () => void;
  onSelectDistrict: (district: DistrictGroundwaterInfo) => void;
  selectedLanguage: string;
}

const STARTER_PROMPTS = [
  {
    category: 'Water Quality',
    label: 'My borewell TDS is 1,200 ppm and hardness is 420. Is it safe for drinking?',
    icon: '🧪',
  },
  {
    category: 'Groundwater Level',
    label: 'How deep is the groundwater table in Bengaluru & why are borewells failing?',
    icon: '📉',
  },
  {
    category: 'Fluoride & Health',
    label: 'What are the symptoms of high fluoride in drinking water and how to filter it?',
    icon: '⚠️',
  },
  {
    category: 'Borewell Recharge',
    label: 'Step-by-step design for recharging an existing borewell with rooftop rainwater.',
    icon: '🌧️',
  },
  {
    category: 'RO Water Truth',
    label: 'When is an RO purifier necessary vs when does it waste water unnecessarily?',
    icon: '💧',
  },
  {
    category: 'Arsenic Alert',
    label: 'Which areas in India have toxic arsenic in groundwater and what is the limit?',
    icon: '🛑',
  },
];

export const Chatbot: React.FC<ChatbotProps> = ({
  selectedDistrict,
  onClearDistrictContext,
  selectedLanguage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Namaste & Welcome! 🙏 I am **Jal-Doot** (जल-दूत), your dedicated hydrogeology and water conservation assistant.

I can help you:
* **Check local groundwater levels** and over-exploitation status across Indian districts.
* **Diagnose water test results** (TDS, pH, Fluoride, Arsenic, Nitrate, Hardness) against **BIS IS 10500:2012** safe limits.
* **Design artificial recharge structures** (rooftop rainwater harvesting, recharge shafts, percolation pits).
* **Select the right purification technology** without wasting valuable water.

How can I assist you with your water today? Ask a question below or click any topic!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If district context changed, add system notification or suggestion
  useEffect(() => {
    if (selectedDistrict) {
      const summaryContext = `District: ${selectedDistrict.district}, ${selectedDistrict.state} | Extraction Stage: ${selectedDistrict.stageOfExtraction}% (${selectedDistrict.cgwbCategory}) | Water Table: ${selectedDistrict.waterLevelPreMonsoon}m BGL | TDS: ${selectedDistrict.waterQuality.tds} ppm | Fluoride: ${selectedDistrict.waterQuality.fluoride} mg/L | Nitrate: ${selectedDistrict.waterQuality.nitrate} mg/L | Contaminants: ${selectedDistrict.keyContaminants.join(', ')}`;

      // Append assistant acknowledgment
      setMessages((prev) => [
        ...prev,
        {
          id: `district-context-${Date.now()}`,
          role: 'assistant',
          content: `📍 **Grounding Activated for ${selectedDistrict.district}, ${selectedDistrict.state}**
- **Aquifer Category:** \`${selectedDistrict.cgwbCategory}\` (Extraction Stage: ${selectedDistrict.stageOfExtraction}%)
- **Depth to Water Table:** ${selectedDistrict.waterLevelPreMonsoon} m BGL
- **Primary Contaminants:** ${selectedDistrict.keyContaminants.join(', ')}
- **Suitability:** ${selectedDistrict.potabilityStatus}

Ask me anything about water quality, borewell depths, or recharge structures tailored specifically for **${selectedDistrict.district}**!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          districtContext: summaryContext,
        },
      ]);
    }
  }, [selectedDistrict]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages([...newMessages, assistantPlaceholder]);

    // Build context string if district is selected
    const districtContextString = selectedDistrict
      ? `District: ${selectedDistrict.district}, ${selectedDistrict.state}\nZone: ${selectedDistrict.zone}\nExtraction: ${selectedDistrict.stageOfExtraction}% (${selectedDistrict.cgwbCategory})\nWater Table: ${selectedDistrict.waterLevelPreMonsoon}m BGL pre-monsoon, ${selectedDistrict.waterLevelPostMonsoon}m post-monsoon\nAquifer Type: ${selectedDistrict.primaryAquiferType}\nTDS: ${selectedDistrict.waterQuality.tds} mg/L, pH: ${selectedDistrict.waterQuality.ph}, Fluoride: ${selectedDistrict.waterQuality.fluoride} mg/L, Nitrate: ${selectedDistrict.waterQuality.nitrate} mg/L, Arsenic: ${selectedDistrict.waterQuality.arsenic} mg/L, Hardness: ${selectedDistrict.waterQuality.hardness} mg/L, Iron: ${selectedDistrict.waterQuality.iron} mg/L\nAdvisory: ${selectedDistrict.advisoryNote}\nRecommended Recharge: ${selectedDistrict.recommendedRecharge}`
      : undefined;

    try {
      // Use SSE streaming endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          districtContext: districtContextString,
          userLanguage: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataPayload = line.substring(6).trim();
              if (dataPayload === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataPayload);
                if (parsed.text) {
                  accumulatedContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedContent, isStreaming: true }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  accumulatedContent += `\n\n*(Notice: ${parsed.error})*`;
                }
              } catch {
                // Ignore partial JSON chunks
              }
            }
          }
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: accumulatedContent || 'No response received.', isStreaming: false }
            : msg
        )
      );
    } catch (err: unknown) {
      console.error('Chat error:', err);
      // Fallback to static chat endpoint if streaming fails
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            districtContext: districtContextString,
            userLanguage: selectedLanguage,
          }),
        });
        const fallbackData = await fallbackRes.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: fallbackData.reply || 'Water information system is ready.', isStreaming: false }
              : msg
          )
        );
      } catch (fallbackErr) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    'I am currently operating with cached hydrogeology guidelines. Please verify your query or check our Regional Levels database directly!',
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to speech playback
  const toggleSpeech = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\|/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: `Conversation refreshed. How can I help with your groundwater or water test inquiries?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-2 sm:px-4 py-3">
      {/* Top Banner / District Context Bar */}
      {selectedDistrict ? (
        <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border border-sky-300 dark:border-sky-800 flex items-center justify-between text-xs transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-sky-950 dark:text-sky-200 truncate">
              Active Regional Grounding: {selectedDistrict.district}, {selectedDistrict.state}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                selectedDistrict.cgwbCategory === 'Safe'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : selectedDistrict.cgwbCategory === 'Semi-Critical'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {selectedDistrict.cgwbCategory} ({selectedDistrict.stageOfExtraction}%)
            </span>
          </div>
          <button
            onClick={onClearDistrictContext}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline text-[11px] font-medium ml-2 whitespace-nowrap"
          >
            Clear context
          </button>
        </div>
      ) : (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>
              Tip: Select any district in the <strong>Regional Levels</strong> tab to ground responses in local CGWB hydro data.
            </span>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
            title="Reset conversation"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 py-2 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for bot */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-700 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {/* Header row for bot */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 pb-1 mb-1 border-b border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Jal-Doot
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleSpeech(msg.content, msg.id)}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          speakingMessageId === msg.id ? 'text-sky-600 font-bold' : ''
                        }`}
                        title={speakingMessageId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div>
                    {msg.content ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 py-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-xs italic ml-1">Consulting hydrogeological models...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[10px] mt-1 text-right ${
                    isUser ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Avatar for user */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 3 && !isLoading && (
        <div className="mt-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Common Inquiries & Field Scenarios:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.label)}
                className="text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sm transition-all group flex items-start gap-2"
              >
                <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                  {prompt.icon}
                </span>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                    {prompt.category}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight">
                    {prompt.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="mt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border-2 border-sky-100 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 rounded-2xl p-2 shadow-md transition-all"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLanguage !== 'English'
                ? `Ask Jal-Doot in ${selectedLanguage} (e.g. जल गुणवत्ता, बोरवेल स्तर)...`
                : 'Ask about groundwater depth, borewell safety, TDS, Fluoride, Rainwater harvesting...'
            }
            rows={2}
            className="flex-1 bg-transparent resize-none border-none focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 p-1 max-h-32 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 pb-0.5">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl font-medium flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-md shadow-sky-500/20 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            Powered by <strong>Gemini 3.8 Flash</strong> • BIS IS 10500:2012 benchmarks
          </span>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
