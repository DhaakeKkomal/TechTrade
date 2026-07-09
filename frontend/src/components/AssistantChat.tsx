import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { 
  MessageSquare, X, Send, Paperclip, Bot, User, 
  Loader2, Sparkles, Terminal, FileImage, ShieldAlert, Mic, MicOff 
} from "lucide-react";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleVoiceAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("HTML5 Web Speech API is not supported by your current browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [modelType, setModelType] = useState("DeepSeek");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.chat.getHistory();
      setMessages(data);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    let finalContent = input;
    if (attachedFile) {
      finalContent += `\n[Attached screenshot: ${attachedFile.name}]`;
    }

    const userMessage: Message = { role: "user", content: finalContent };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);
    setSending(true);

    // Add placeholder assistant message for streaming
    const streamingAssistantMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, streamingAssistantMsg]);

    try {
      let accumulatedText = "";
      await api.chat.sendMessageStream(finalContent, modelType, (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = accumulatedText;
          }
          return updated;
        });
      });
    } catch (err) {
      console.error("Streaming failed:", err);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content = "Failed to stream copilot response. Make sure local LLM services are online.";
        }
        return updated;
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 z-50 cursor-pointer"
        title="Open AI Copilot Chat"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
          Copilot
        </span>
      </button>

      {/* Sidebar Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Window */}
          <div className="relative w-full max-w-md h-full bg-bg-dark border-l border-border-dark flex flex-col shadow-2xl z-10 transition-transform duration-300 animate-slide-in">
            
            {/* Header */}
            <div className="p-4 border-b border-border-dark flex items-center justify-between bg-card-dark">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider m-0">AI Trading Copilot</h3>
                  <span className="text-[9px] text-gray-500 block mt-0.5">RAG Knowledge Base & memory activated</span>
                </div>
              </div>

              {/* Model selection */}
              <div className="flex items-center gap-2">
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="bg-bg-dark border border-border-dark rounded-lg px-2 py-1 text-[10px] text-gray-300 outline-none cursor-pointer"
                >
                  <option value="OpenAI">GPT-4o</option>
                  <option value="Llama">Llama 3</option>
                  <option value="Gemma">Gemma 2</option>
                  <option value="Mistral">Mistral</option>
                  <option value="DeepSeek">DeepSeek</option>
                </select>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-bg-dark transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-dark/40">
              {loadingHistory ? (
                <div className="h-full flex flex-col justify-center items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Retrieving message records...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-xs text-gray-500 space-y-4">
                  <Bot className="w-12 h-12 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-400">Ask your Copilot questions</p>
                    <p className="text-[10px] text-gray-600 max-w-xs mt-1">
                      Query about technical indicators, pattern formations, portfolio insights, or ask to analyze uploaded chart screenshots.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3 items-start ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg flex-shrink-0">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                        isUser 
                          ? "bg-emerald-500 text-white rounded-tr-none" 
                          : "bg-card-dark border border-border-dark text-gray-200 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>

                      {isUser && (
                        <div className="bg-card-dark border border-border-dark p-1.5 rounded-lg flex-shrink-0">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input & Upload Bar */}
            <form onSubmit={handleSend} className="p-4 border-t border-border-dark bg-card-dark space-y-2">
              {attachedFile && (
                <div className="bg-bg-dark border border-border-dark px-3 py-1.5 rounded-xl flex items-center justify-between text-[10px] text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                    {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setAttachedFile(null)} 
                    className="text-gray-500 hover:text-red-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="bg-bg-dark hover:bg-border-dark border border-border-dark text-gray-400 hover:text-white p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
                
                <button
                  type="button"
                  onClick={toggleVoiceAssistant}
                  className={`border p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                    isListening 
                      ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" 
                      : "bg-bg-dark hover:bg-border-dark border-border-dark text-gray-400 hover:text-white"
                  }`}
                  title={isListening ? "Listening..." : "Voice Assistant input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  placeholder="Type stock questions or commands..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50"
                />

                <button
                  type="submit"
                  disabled={sending || (!input.trim() && !attachedFile)}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
