"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { FileText, Download, Plus, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: history, refetch } = useQuery({
    queryKey: ["research-history"],
    queryFn: async () => {
      const { data } = await api.get("/research/history?limit=50");
      return data;
    },
  });

  const handleSearch = async (q: string) => {
    setSearchSymbol(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await api.get(`/companies/search?q=${q}&limit=5`);
    setSearchResults(data);
  };

  const generateReport = async (symbol: string) => {
    setGenerating(symbol);
    setSearchResults([]);
    setSearchSymbol("");
    try {
      const resp = await api.post(`/research/report/${symbol}`, {}, { responseType: "blob" });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ArthaDrishti_${symbol}_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      refetch();
    } catch (e) {
      alert("Report generation failed. Ensure the company has filings ingested.");
    } finally {
      setGenerating(null);
    }
  };

  const completedQueries = history?.filter((h: any) => h.status === "complete") || [];
  const uniqueSymbols = [...new Set(completedQueries.map((h: any) => h.symbol))] as string[];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
          Research Reports
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Generate one-click PDF equity research reports with citations and risk analysis.
        </p>
      </div>

      {/* Generate New Report */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Generate New Report
        </h3>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                value={searchSymbol}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search company (e.g. RELIANCE, TCS)..."
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px 10px 36px",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>
          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginTop: 4,
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {searchResults.map((r: any) => (
                <button
                  key={r.symbol}
                  onClick={() => generateReport(r.symbol)}
                  disabled={!!generating}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{r.symbol}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{r.name} · {r.sector}</div>
                  </div>
                  <Download size={14} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {generating && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, color: "var(--accent-primary)", fontSize: 13 }}>
            <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTop: "2px solid var(--accent-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Generating PDF report for {generating}… (this may take 30-60 seconds)
          </div>
        )}

        {/* Quick Generate from watchlisted symbols */}
        {uniqueSymbols.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Recent companies</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {uniqueSymbols.slice(0, 8).map((sym: string) => (
                <button
                  key={sym}
                  onClick={() => generateReport(sym)}
                  disabled={!!generating}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--accent-primary)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Download size={11} /> {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Research History */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Research History</span>
          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>{completedQueries.length} analyses</span>
        </div>
        {completedQueries.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No research history yet. Use the Research terminal on any company page to start.
          </div>
        ) : (
          completedQueries.slice(0, 20).map((q: any) => (
            <div
              key={q.id}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <FileText size={15} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    background: "var(--bg-elevated)",
                    color: "var(--accent-primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {q.symbol}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{timeAgo(q.created_at)}</span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{q.query}</div>
                {q.citations?.length > 0 && (
                  <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                    {q.citations.length} citations
                  </div>
                )}
              </div>
              <button
                onClick={() => generateReport(q.symbol)}
                disabled={!!generating}
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "var(--accent-primary)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <Download size={11} /> PDF
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "var(--text-muted)", fontSize: 11 }}>
        Reports are generated from publicly available documents and market data. Not financial advice. ArthaDrishti AI is not a SEBI-registered investment advisor.
      </div>
    </div>
  );
}
