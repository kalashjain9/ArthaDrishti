"use client";
import { useEffect, useState } from "react";
import { streamResearch, type ResearchChunk, type Citation } from "@/lib/sse";
import { cn, timeAgo } from "@/lib/utils";
import { Search, FileText, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface ResearchTerminalProps {
  symbol: string;
  initialQuery?: string;
}

const DISCLAIMER =
  "This analysis is generated from publicly available documents and market data for informational purposes only. It does not constitute financial advice, investment recommendation, or trading signal. ArthaDrishti AI is not a SEBI-registered investment advisor.";

export function ResearchTerminal({ symbol, initialQuery = "" }: ResearchTerminalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [chunks, setChunks] = useState<ResearchChunk[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [answer, setAnswer] = useState("");
  const [activeAgents, setActiveAgents] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    setChunks([]);
    setCitations([]);
    setAnswer("");
    setActiveAgents([]);
    setIsStreaming(true);

    try {
      for await (const chunk of streamResearch(query, symbol)) {
        setChunks((prev) => [...prev, chunk]);

        if (chunk.type === "answer") {
          setAnswer((prev) => prev + chunk.content);
        }
        if (chunk.type === "agent_start" && chunk.agent) {
          setActiveAgents((prev) => [...prev, chunk.agent!]);
        }
        if (chunk.type === "agent_end" && chunk.agent) {
          setActiveAgents((prev) => prev.filter((a) => a !== chunk.agent));
        }
        if (chunk.type === "citation" && chunk.citations) {
          setCitations(chunk.citations);
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      setIsStreaming(false);
      setActiveAgents([]);
    }
  };

  const suggestedQueries = [
    "What are the main risks in the latest annual report?",
    "Summarize key financial metrics and growth drivers",
    "Are there any audit qualifications or related party concerns?",
    "What does management say about demand outlook?",
    "Identify any litigation or regulatory risks",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Terminal Header */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            arthadrishti:~$ research terminal — {symbol}
          </span>
          {isStreaming && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={13} style={{ color: "var(--accent-primary)", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "var(--accent-primary)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                {activeAgents.length > 0 ? `running: ${activeAgents.join(", ")}` : "processing..."}
              </span>
            </div>
          )}
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <span style={{ color: "var(--accent-primary)", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
            ›
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about filings, risks, management commentary..."
            disabled={isStreaming}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !query.trim()}
            style={{
              background: isStreaming ? "var(--border)" : "var(--accent-primary)",
              color: isStreaming ? "var(--text-muted)" : "#000",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: isStreaming ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Search size={14} />
            Analyze
          </button>
        </form>
      </div>

      {/* Suggested Queries */}
      {!answer && !isStreaming && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: 20,
                padding: "5px 12px",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {q.length > 50 ? q.substring(0, 50) + "..." : q}
            </button>
          ))}
        </div>
      )}

      {/* Thinking / Agent Status */}
      {chunks.filter((c) => c.type === "thinking").length > 0 && (
        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          {chunks
            .filter((c) => c.type === "thinking")
            .map((c, i) => (
              <div
                key={i}
                style={{
                  color: "#818CF8",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 3,
                }}
              >
                ⟳ {c.content}
              </div>
            ))}
        </div>
      )}

      {/* Answer */}
      {(answer || isStreaming) && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle size={15} style={{ color: "var(--accent-safe)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>
              ArthaDrishti AI Analysis
            </span>
          </div>

          <div
            style={{
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
            className={cn(isStreaming && !answer && "streaming-cursor")}
          >
            {answer}
            {isStreaming && <span className="streaming-cursor" />}
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Sources & Citations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {citations.map((cite, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      borderLeft: "3px solid var(--accent-primary)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={12} style={{ color: "var(--accent-primary)" }} />
                      <span
                        style={{
                          color: "var(--accent-primary)",
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {cite.source_file}, Page {cite.page_number}
                        {cite.section && ` — ${cite.section}`}
                      </span>
                    </div>
                    {cite.excerpt && (
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          marginTop: 4,
                          fontStyle: "italic",
                          lineHeight: 1.5,
                        }}
                      >
                        "{cite.excerpt.substring(0, 200)}{cite.excerpt.length > 200 ? "..." : ""}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={11} style={{ display: "inline", marginRight: 6, color: "#F59E0B" }} />
            {DISCLAIMER}
          </div>
        </div>
      )}
    </div>
  );
}
