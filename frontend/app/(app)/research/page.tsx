"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { ResearchTerminal } from "@/components/agents/ResearchTerminal";
import { timeAgo } from "@/lib/utils";
import { FileText, Download, Plus, Search } from "lucide-react";
import Link from "next/link";

const NSE_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR",
  "SBIN", "BAJFINANCE", "BHARTIARTL", "TATAMOTORS", "WIPRO", "AXISBANK",
  "LT", "SUNPHARMA", "KOTAKBANK", "MARUTI", "TITAN", "ITC",
];

export default function ResearchPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reports } = useQuery({
    queryKey: ["research-reports"],
    queryFn: async () => {
      const { data } = await api.get("/research/history");
      return data;
    },
  });

  const filteredSymbols = NSE_SYMBOLS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleGenerateReport = async () => {
    const a = document.createElement("a");
    a.href = `${process.env.NEXT_PUBLIC_API_URL}/research/report/${selectedSymbol}`;
    a.download = `ArthaDrishti_${selectedSymbol}_Research.pdf`;
    a.click();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Research Terminal
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          AI-powered analysis grounded in company filings and public data
        </p>
      </div>

      {/* Company Selector + PDF Export */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "9px 14px",
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Search size={14} />
            {selectedSymbol}
          </button>
          {searchOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 100,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 12,
              minWidth: 240,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol..."
                style={{
                  width: "100%",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {filteredSymbols.map((s) => (
                  <div
                    key={s}
                    onClick={() => { setSelectedSymbol(s); setSearchOpen(false); setSearchQuery(""); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: s === selectedSymbol ? "var(--accent-primary)" : "var(--text-primary)",
                      background: s === selectedSymbol ? "rgba(245,158,11,0.08)" : "transparent",
                      fontSize: 13,
                      fontWeight: s === selectedSymbol ? 700 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href={`/company/${selectedSymbol}`} style={{
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "9px 14px",
          fontSize: 13,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          View Full Profile →
        </Link>

        <button
          onClick={handleGenerateReport}
          style={{
            marginLeft: "auto",
            background: "rgba(245,158,11,0.12)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Download size={14} /> Export PDF Report
        </button>
      </div>

      {/* Research Terminal */}
      <ResearchTerminal symbol={selectedSymbol} />

      {/* Research History */}
      {reports?.length > 0 && (
        <div style={{ marginTop: 24, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Research History</span>
          </div>
          {reports.map((r: any) => (
            <div key={r.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center" }}>
              <FileText size={15} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>
                  {r.query}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                  {r.symbol} · {timeAgo(r.created_at)} · {r.citations?.length || 0} citations
                </div>
              </div>
              <button
                onClick={() => setSelectedSymbol(r.symbol)}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Re-run
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
