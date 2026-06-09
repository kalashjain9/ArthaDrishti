"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { RiskScoreBadge, RiskRadarChart } from "@/components/charts/RiskRadar";
import { ResearchTerminal } from "@/components/agents/ResearchTerminal";
import { riskColor, formatCurrency, timeAgo, sentimentColor } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, Plus, CheckCircle,
  TrendingUp, TrendingDown, FileText, AlertTriangle,
  BarChart3, Users, Activity, Shield, Newspaper,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";
import { useWatchlistStore } from "@/lib/store";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "financials", label: "Financials", icon: TrendingUp },
  { id: "filings", label: "Filings", icon: FileText },
  { id: "research", label: "Research", icon: Activity },
  { id: "risks", label: "Risks", icon: Shield },
  { id: "news", label: "News", icon: Newspaper },
  { id: "competitors", label: "Competitors", icon: Users },
];

const DISCLAIMER =
  "This analysis is generated from publicly available documents and market data for informational purposes only. It does not constitute financial advice, investment recommendation, or trading signal. ArthaDrishti AI is not a SEBI-registered investment advisor. Past performance and AI-generated risk scores are not indicative of future results. Please consult a qualified financial advisor before making investment decisions.";

export default function CompanyPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();
  const [activeTab, setActiveTab] = useState("overview");
  const { addToWatchlist, items: watchlistItems } = useWatchlistStore();

  const isWatchlisted = watchlistItems.some((i) => i.symbol === symbol);

  // Fetch company profile
  const { data: company } = useQuery({
    queryKey: ["company", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}`);
      return data;
    },
  });

  // Fetch live quote
  const { data: quote } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/quote`);
      return data;
    },
    refetchInterval: 60 * 1000,
  });

  const isPositive = (quote?.change_pct || 0) >= 0;

  return (
    <div>
      {/* Company Header */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: 0 }}>
                {company?.name || symbol}
              </h1>
              <span
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--accent-primary)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                NSE: {symbol}
              </span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
              {company?.sector || ""}{company?.industry ? ` · ${company.industry}` : ""}
            </div>

            {/* Price + Scores */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {quote && (
                <div>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ₹{quote.price?.toLocaleString("en-IN") || "—"}
                  </span>
                  <span
                    style={{
                      color: isPositive ? "var(--accent-safe)" : "var(--accent-hot)",
                      fontSize: 14,
                      marginLeft: 8,
                      fontWeight: 600,
                    }}
                  >
                    {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}{quote.change?.toFixed(2)} (
                    {isPositive ? "+" : ""}{quote.change_pct?.toFixed(2)}%)
                  </span>
                </div>
              )}

              {company && (
                <>
                  <RiskScoreBadge score={company.risk_score || 50} size="md" />
                  <span
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.25)",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Fraud: {(company.fraud_score || 0).toFixed(0)}/100
                  </span>
                  <span
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#818CF8",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ESG: {(company.esg_score || 0).toFixed(0)}/100
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {!isWatchlisted && (
              <button
                onClick={() => addToWatchlist(symbol)}
                style={{
                  background: "rgba(245,158,11,0.12)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={15} /> Add to Watchlist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 2,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 6,
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? "var(--accent-primary)" : "transparent",
                color: isActive ? "#000" : "var(--text-secondary)",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab symbol={symbol} />}
      {activeTab === "financials" && <FinancialsTab symbol={symbol} />}
      {activeTab === "filings" && <FilingsTab symbol={symbol} />}
      {activeTab === "research" && <ResearchTerminal symbol={symbol} />}
      {activeTab === "risks" && <RisksTab symbol={symbol} />}
      {activeTab === "news" && <NewsTab symbol={symbol} />}
      {activeTab === "competitors" && <CompetitorsTab symbol={symbol} />}

      {/* Disclaimer */}
      <div
        style={{
          marginTop: 24,
          padding: "12px 16px",
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.15)",
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
  );
}

function OverviewTab({ symbol }: { symbol: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      {/* AI Summary placeholder */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          AI Company Summary
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Use the Research tab to generate a grounded AI summary with citations from company filings.
          Upload the latest Annual Report to unlock full analysis.
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <PriceChart symbol={symbol} />
        </div>
      </div>

      {/* Risk Radar */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Risk Pentagon
        </h3>
        <RiskRadarChart symbol={symbol} size={280} />
      </div>
    </div>
  );
}

function PriceChart({ symbol }: { symbol: string }) {
  const { data: history } = useQuery({
    queryKey: ["price-history", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/history?period=3mo`);
      return data;
    },
  });

  if (!history?.length) return null;

  const isPositive = history[history.length - 1].close >= history[0].close;

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
            tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={60}
            tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--text-secondary)" }}
            itemStyle={{ color: "var(--text-primary)" }}
          />
          <Area type="monotone" dataKey="close" stroke={isPositive ? "#10B981" : "#EF4444"}
            fill="url(#priceGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinancialsTab({ symbol }: { symbol: string }) {
  const { data: fin } = useQuery({
    queryKey: ["financials", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/financials`);
      return data;
    },
  });

  const ratios = [
    { label: "P/E Ratio", value: fin?.pe_ratio?.toFixed(1) || "N/A" },
    { label: "P/B Ratio", value: fin?.pb_ratio?.toFixed(2) || "N/A" },
    { label: "Debt/Equity", value: fin?.debt_equity?.toFixed(2) || "N/A" },
    { label: "ROE", value: fin?.roe ? `${(fin.roe * 100).toFixed(1)}%` : "N/A" },
    { label: "Beta", value: fin?.beta?.toFixed(2) || "N/A" },
    { label: "Market Cap", value: fin?.market_cap ? formatCurrency(fin.market_cap) : "N/A" },
    { label: "Revenue", value: fin?.revenue ? formatCurrency(fin.revenue) : "N/A" },
    { label: "Net Profit", value: fin?.net_income ? formatCurrency(fin.net_income) : "N/A" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Key Financial Ratios
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {ratios.map((r) => (
            <div
              key={r.label}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{r.label}</div>
              <div style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilingsTab({ symbol }: { symbol: string }) {
  const { data: filings } = useQuery({
    queryKey: ["filings", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/filings`);
      return data;
    },
  });

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Company Filings</span>
        <UploadButton symbol={symbol} />
      </div>
      {!filings?.length ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No filings ingested yet. Upload a PDF to start AI analysis.
        </div>
      ) : (
        filings.map((f: any) => (
          <div key={f.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center" }}>
            <FileText size={16} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{f.filename}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                {f.filing_type} · {f.fiscal_year} · {f.chunk_count} chunks · {timeAgo(f.created_at)}
              </div>
            </div>
            <span style={{
              background: f.status === "complete" ? "rgba(16,185,129,0.12)" : f.status === "error" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
              color: f.status === "complete" ? "#10B981" : f.status === "error" ? "#EF4444" : "#F59E0B",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}>
              {f.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function UploadButton({ symbol }: { symbol: string }) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("symbol", symbol);
    formData.append("filing_type", "annual_report");
    await api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    alert("Upload started! Ingestion in progress...");
  };

  return (
    <label style={{
      background: "rgba(245,158,11,0.12)",
      color: "var(--accent-primary)",
      border: "1px solid rgba(245,158,11,0.3)",
      borderRadius: 8,
      padding: "7px 14px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}>
      <Plus size={14} /> Upload Filing
      <input type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} style={{ display: "none" }} />
    </label>
  );
}

function RisksTab({ symbol }: { symbol: string }) {
  const { data: riskData } = useQuery({
    queryKey: ["risk-detail", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/risk`);
      return data;
    },
  });

  const { data: fraudData } = useQuery({
    queryKey: ["fraud", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/fraud`);
      return data;
    },
  });

  const ri = riskData?.risk_index;
  const dims = ["financial", "operational", "geopolitical", "legal", "market", "esg", "fraud", "macro"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Risk Breakdown */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          RashtriyaRiskIndex™ Breakdown
        </h3>
        {ri ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dims.map((dim) => {
              const d = ri[dim] || {};
              const score = d.score || 50;
              const color = riskColor(score);
              return (
                <div key={dim} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 100, color: "var(--text-secondary)", fontSize: 12, textTransform: "capitalize", flexShrink: 0 }}>
                    {dim}
                  </div>
                  <div style={{ flex: 1, height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ width: 50, color, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {score}/100
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11, flex: 1 }}>
                    {d.key_finding || ""}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading risk analysis...</div>
        )}
      </div>

      {/* Fraud Early Warning */}
      {fraudData && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Fraud Early Warning
          </h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>Fraud Probability</div>
              <div style={{
                color: fraudData.fraud_probability === "Low" ? "#10B981" : fraudData.fraud_probability === "Medium" ? "#F59E0B" : "#EF4444",
                fontSize: 20, fontWeight: 700
              }}>
                {fraudData.fraud_probability}
              </div>
            </div>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>Beneish M-Score</div>
              <div style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {fraudData.m_score_estimate?.toFixed(2) || "N/A"}
              </div>
            </div>
          </div>
          {fraudData.red_flags?.length > 0 && (
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Red Flags</div>
              {fraudData.red_flags.map((flag: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 12px", background: "rgba(239,68,68,0.05)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)" }}>
                  <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: 13 }}>{flag.flag}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>{flag.evidence}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "#EF4444", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    {flag.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewsTab({ symbol }: { symbol: string }) {
  const { data: newsData } = useQuery({
    queryKey: ["news", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/news`);
      return data;
    },
  });

  const { data: sentimentData } = useQuery({
    queryKey: ["sentiment", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/sentiment`);
      return data;
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Narrative Divergence */}
      {sentimentData && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Narrative Divergence Meter
          </h3>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Divergence Score</span>
                <span style={{
                  color: sentimentData.divergence_score > 70 ? "#EF4444" : sentimentData.divergence_score > 40 ? "#F59E0B" : "#10B981",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {sentimentData.divergence_score}%
                </span>
              </div>
              <div style={{ height: 10, background: "var(--bg-elevated)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{
                  width: `${sentimentData.divergence_score}%`,
                  height: "100%",
                  background: sentimentData.divergence_score > 70 ? "#EF4444" : sentimentData.divergence_score > 40 ? "#F59E0B" : "#10B981",
                  borderRadius: 5,
                  transition: "width 0.5s",
                }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Management Tone</div>
                  <div style={{ color: "#6366F1", fontWeight: 600, fontSize: 13 }}>{sentimentData.management_tone || "neutral"}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>News Tone</div>
                  <div style={{ color: sentimentColor(sentimentData.news_aggregate_sentiment || 0), fontWeight: 600, fontSize: 13 }}>
                    {sentimentData.news_tone || "neutral"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {sentimentData.contradictions?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Detected Contradictions</div>
              {sentimentData.contradictions.map((c: any, i: number) => (
                <div key={i} style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 6, border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--accent-primary)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.topic}</div>
                  <div style={{ color: "#10B981", fontSize: 12 }}>Management: "{c.management_claim}"</div>
                  <div style={{ color: "#EF4444", fontSize: 12 }}>News: "{c.news_report}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* News Feed */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>News Feed</span>
          {newsData && (
            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
              {newsData.article_count} articles · Sentiment: {newsData.aggregate_sentiment?.toFixed(2)} ({newsData.trend})
            </span>
          )}
        </div>
        {newsData?.articles?.slice(0, 20).map((art: any, i: number) => {
          const sentColor = art.sentiment_score > 0.2 ? "#10B981" : art.sentiment_score < -0.2 ? "#EF4444" : "#94A3B8";
          return (
            <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <a href={art.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                    {art.title}
                  </a>
                  {art.ai_summary && (
                    <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                      {art.ai_summary}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{art.source}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{art.published_at?.substring(0, 10)}</span>
                  </div>
                </div>
                <span style={{
                  background: `${sentColor}18`,
                  color: sentColor,
                  border: `1px solid ${sentColor}30`,
                  borderRadius: 12,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {art.sentiment_label || "neutral"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorsTab({ symbol }: { symbol: string }) {
  const { data: competitorData } = useQuery({
    queryKey: ["competitors", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/competitors`);
      return data;
    },
  });

  const peers = competitorData?.peer_comparison || [];
  const metrics = ["pe_ratio", "debt_equity", "roe", "market_cap"];
  const metricLabels: Record<string, string> = {
    pe_ratio: "P/E", debt_equity: "D/E", roe: "ROE", market_cap: "Mkt Cap",
  };

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Peer Comparison</span>
        {competitorData?.relative_position && (
          <span style={{
            background: "rgba(245,158,11,0.12)", color: "var(--accent-primary)",
            borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600, marginLeft: 10
          }}>
            {symbol}: {competitorData.relative_position.replace("_", " ")}
          </span>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)" }}>
              <th style={{ padding: "10px 20px", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textAlign: "left" }}>Symbol</th>
              {metrics.map(m => (
                <th key={m} style={{ padding: "10px 16px", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textAlign: "right" }}>
                  {metricLabels[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {peers.map((p: any, i: number) => (
              <tr key={p.symbol} style={{ borderBottom: "1px solid var(--border)", background: p.symbol === symbol ? "rgba(245,158,11,0.04)" : "transparent" }}>
                <td style={{ padding: "10px 20px" }}>
                  <div style={{ color: p.symbol === symbol ? "var(--accent-primary)" : "var(--text-primary)", fontWeight: p.symbol === symbol ? 700 : 500, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                    {p.symbol}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{p.name?.substring(0, 30) || ""}</div>
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  {p.pe_ratio?.toFixed(1) || "—"}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  {p.debt_equity?.toFixed(2) || "—"}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", color: p.roe > 0.15 ? "#10B981" : p.roe > 0.05 ? "var(--text-primary)" : "#EF4444", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  {p.roe ? `${(p.roe * 100).toFixed(1)}%` : "—"}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  {p.market_cap ? formatCurrency(p.market_cap) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {competitorData?.analysis && (
        <div style={{ padding: "14px 20px", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>AI Competitive Analysis</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
            {competitorData.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
