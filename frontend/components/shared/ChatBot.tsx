"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, TrendingUp, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const STARTERS = [
  "What is the risk score for RELIANCE?",
  "Analyse TATAMOTORS — should I be worried?",
  "How does NIFTY 50 look today?",
  "Compare TCS vs INFY risk profiles",
  "Explain RashtriyaRiskIndex™",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm ArthaDrishti AI. I can help you analyse Indian equities, risk scores, market trends, and portfolio insights. What would you like to know?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setApiError(null);

    const userMsg: Message = { role: "user", content: q, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Failed to get response");
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "⚠️ " + (data.error || "I'm having trouble connecting. Please try again."),
          ts: Date.now(),
        }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, ts: Date.now() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Network error. Please check your connection.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const unreadBadge = !open && messages.length > 1;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #4338CA, #6366F1)",
          border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(67,56,202,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}
        aria-label="Open AI Chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {unreadBadge && (
          <span style={{
            position: "absolute", top: 4, right: 4, width: 10, height: 10,
            borderRadius: "50%", background: "#EF4444", border: "2px solid #fff",
          }} />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "fixed", bottom: 92, right: 24, zIndex: 999,
              width: 380, maxHeight: "75vh",
              background: "#fff", borderRadius: 20,
              boxShadow: "0 20px 60px rgba(15,23,42,0.2), 0 0 0 1px rgba(67,56,202,0.12)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #0F172A, #1E293B)",
              padding: "16px 18px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #4338CA, #6366F1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <TrendingUp size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 14 }}>ArthaDrishti AI</div>
                <div style={{ color: "#475569", fontSize: 11 }}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> Analysing…
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
                      Indian Equity Expert · Powered by Groq
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex", gap: 8,
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: msg.role === "user" ? "#4338CA" : "#F1F5F9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 2,
                  }}>
                    {msg.role === "user"
                      ? <User size={13} color="#fff" />
                      : <Bot size={13} color="#4338CA" />}
                  </div>
                  <div style={{
                    background: msg.role === "user" ? "#EEF2FF" : "#F8FAFC",
                    border: `1px solid ${msg.role === "user" ? "#C7D2FE" : "#E2E8F0"}`,
                    borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                    padding: "9px 13px",
                    maxWidth: "82%",
                  }}>
                    <p style={{
                      margin: 0, fontSize: 13, lineHeight: 1.6,
                      color: "#0F172A", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </p>
                    <div style={{ color: "#CBD5E1", fontSize: 10, marginTop: 4, textAlign: "right" }}>
                      {new Date(msg.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={13} color="#4338CA" />
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px 14px 14px 14px", padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1",
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick starters (only at start) */}
            {messages.length === 1 && (
              <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      background: "#EEF2FF", border: "1px solid #C7D2FE",
                      borderRadius: 20, padding: "5px 11px",
                      fontSize: 11, color: "#4338CA", cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#C7D2FE"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {apiError && !loading && (
              <div style={{ fontSize: 11, color: "#DC2626", background: "#FFF1F2", margin: "0 14px 8px", borderRadius: 8, padding: "8px 10px" }}>
                Add GROQ_API_KEY to Vercel env vars to enable AI chat.
              </div>
            )}

            {/* Input */}
            <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask about any NSE/BSE company…"
                  disabled={loading}
                  style={{
                    flex: 1, border: "1px solid #E2E8F0", borderRadius: 12,
                    padding: "10px 14px", fontSize: 13, outline: "none",
                    background: "#F8FAFC", color: "#0F172A", fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#818CF8"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
                />
                <motion.button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: input.trim() && !loading ? "linear-gradient(135deg, #4338CA, #6366F1)" : "#E2E8F0",
                    border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: input.trim() && !loading ? "#fff" : "#94A3B8",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
              <div style={{ color: "#CBD5E1", fontSize: 10, marginTop: 6, textAlign: "center" }}>
                Not SEBI-registered. Research purposes only.
              </div>
            </div>

            <style>{`
              @keyframes bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-6px); }
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
