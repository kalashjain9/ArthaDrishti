"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CompanyAvatar } from "@/components/shared/MarketOverview";
import { riskColor, riskLabel } from "@/lib/utils";
import { FileText, Download, Search, Shield, TrendingUp, BarChart3, Clock, CheckCircle, Star } from "lucide-react";

/* ── Static report library ──────────────────────────────────── */
const REPORTS = [
  { id: 1,  symbol: "RELIANCE",   title: "Reliance Industries — Full Company Analysis Q4 FY26",         date: "Jun 08, 2026", pages: 24, citations: 18, type: "deep-dive",   risk: 32, verdict: "ACCUMULATE", score: 9.2 },
  { id: 2,  symbol: "TCS",        title: "TCS — GenAI Deal Momentum & FY27 Outlook",                    date: "Jun 07, 2026", pages: 18, citations: 12, type: "quarterly",  risk: 21, verdict: "BUY",       score: 9.5 },
  { id: 3,  symbol: "TATAMOTORS", title: "Tata Motors — JLR EV Transition Risk Assessment",             date: "Jun 06, 2026", pages: 21, citations: 14, type: "risk",       risk: 62, verdict: "HOLD",      score: 7.1 },
  { id: 4,  symbol: "HDFCBANK",   title: "HDFC Bank — Post-Merger Integration: LDR & Deposit Analysis", date: "Jun 05, 2026", pages: 19, citations: 11, type: "deep-dive",  risk: 38, verdict: "BUY",       score: 8.8 },
  { id: 5,  symbol: "BAJFINANCE", title: "Bajaj Finance — RBI NBFC Circular Impact Study",              date: "Jun 04, 2026", pages: 15, citations: 9,  type: "regulatory", risk: 45, verdict: "HOLD",      score: 7.8 },
  { id: 6,  symbol: "ICICIBANK",  title: "ICICI Bank — Digital Banking Leadership & Competitive Moat",  date: "Jun 03, 2026", pages: 16, citations: 10, type: "strategy",   risk: 35, verdict: "BUY",       score: 9.0 },
  { id: 7,  symbol: "INFY",       title: "Infosys — Large Deal Wins & Client Concentration Analysis",   date: "Jun 02, 2026", pages: 14, citations: 8,  type: "quarterly",  risk: 25, verdict: "BUY",       score: 8.5 },
  { id: 8,  symbol: "SBIN",       title: "SBI — NPA Recovery Trajectory & Credit Quality Outlook",      date: "May 31, 2026", pages: 17, citations: 12, type: "deep-dive",  risk: 42, verdict: "ACCUMULATE",score: 8.2 },
  { id: 9,  symbol: "WIPRO",      title: "Wipro — Restructuring Impact & New Management Strategy",      date: "May 29, 2026", pages: 13, citations: 7,  type: "strategy",   risk: 29, verdict: "HOLD",      score: 7.4 },
  { id: 10, symbol: "MARUTI",     title: "Maruti Suzuki — Market Share Defence vs Hyundai & Kia",      date: "May 28, 2026", pages: 16, citations: 10, type: "competitive",risk: 28, verdict: "ACCUMULATE",score: 8.7 },
  { id: 11, symbol: "SUNPHARMA",  title: "Sun Pharma — US Specialty Launch Pipeline FY27",             date: "May 26, 2026", pages: 18, citations: 13, type: "deep-dive",  risk: 30, verdict: "BUY",       score: 8.9 },
  { id: 12, symbol: "ADANIENT",   title: "Adani Enterprises — Governance Red Flags & Risk Audit",      date: "May 24, 2026", pages: 22, citations: 16, type: "risk",       risk: 68, verdict: "AVOID",     score: 5.2 },
  { id: 13, symbol: "AXISBANK",   title: "Axis Bank — Credit Quality Normalization & NIMs Outlook",    date: "May 22, 2026", pages: 15, citations: 9,  type: "quarterly",  risk: 44, verdict: "HOLD",      score: 7.6 },
  { id: 14, symbol: "LT",         title: "L&T — Order Book at Record ₹5.8L Cr — Execution Analysis",  date: "May 20, 2026", pages: 20, citations: 14, type: "deep-dive",  risk: 36, verdict: "BUY",       score: 9.1 },
  { id: 15, symbol: "BHARTIARTL", title: "Bharti Airtel — 5G Monetization & ARPU Upgrade Cycle",      date: "May 18, 2026", pages: 17, citations: 11, type: "strategy",   risk: 40, verdict: "BUY",       score: 8.8 },
  { id: 16, symbol: "ITC",        title: "ITC — Hotels Demerger Impact & Cigarette Volume Resilience", date: "May 15, 2026", pages: 14, citations: 8,  type: "strategy",   risk: 26, verdict: "ACCUMULATE",score: 8.3 },
  { id: 17, symbol: "TITAN",      title: "Titan — Jewellery Demand Surge & Wedding Season Outlook",    date: "May 12, 2026", pages: 13, citations: 7,  type: "seasonal",   risk: 32, verdict: "BUY",       score: 9.0 },
  { id: 18, symbol: "ASIANPAINT", title: "Asian Paints — Competitive Pressure from Birla Opus",       date: "May 10, 2026", pages: 16, citations: 10, type: "competitive",risk: 24, verdict: "HOLD",      score: 7.9 },
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "deep-dive":   { bg: "#EEF2FF", color: "#4338CA" },
  "quarterly":   { bg: "#ECFDF5", color: "#059669" },
  "risk":        { bg: "#FFF1F2", color: "#DC2626" },
  "regulatory":  { bg: "#FFFBEB", color: "#D97706" },
  "strategy":    { bg: "#F0F9FF", color: "#0284C7" },
  "competitive": { bg: "#F5F3FF", color: "#7C3AED" },
  "seasonal":    { bg: "#FFF7ED", color: "#C2410C" },
};

const VERDICT_COLORS: Record<string, { bg: string; color: string }> = {
  "BUY":        { bg: "#ECFDF5", color: "#059669" },
  "ACCUMULATE": { bg: "#EEF2FF", color: "#4338CA" },
  "HOLD":       { bg: "#FFFBEB", color: "#D97706" },
  "SELL":       { bg: "#FFF1F2", color: "#DC2626" },
  "AVOID":      { bg: "#FFF1F2", color: "#DC2626" },
};

const REPORT_TYPES = ["All", "deep-dive", "quarterly", "risk", "regulatory", "strategy", "competitive"];

const STATS = [
  { label: "Reports Generated", value: "148", icon: FileText, cls: "kpi-indigo" },
  { label: "Companies Covered", value: "30", icon: BarChart3, cls: "kpi-emerald" },
  { label: "Avg Quality Score", value: "8.4/10", icon: Star, cls: "kpi-amber" },
  { label: "Risk Flags Raised", value: "23", icon: Shield, cls: "kpi-rose" },
];

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "score" | "risk">("date");

  const visible = REPORTS
    .filter((r) => {
      const matchSearch = r.symbol.includes(search.toUpperCase()) || r.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "All" || r.type === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "risk") return b.risk - a.risk;
      return 0; // date order (as listed)
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">Research Reports</h1>
        <p className="page-subtitle">AI-generated deep-dive analyses on NSE/BSE companies — grounded in filings, financials and news</p>
      </div>

      {/* Stats */}
      <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {STATS.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className={`card ${cls}`} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon size={14} />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "0 0 280px" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or report…" className="input-field" style={{ paddingLeft: 32, fontSize: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {REPORT_TYPES.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className="btn btn-sm" style={{
              background: filter === t ? "#4338CA" : "#F8FAFC",
              color: filter === t ? "#fff" : "#374151",
              border: `1px solid ${filter === t ? "#4338CA" : "#E2E8F0"}`,
              fontSize: 11,
            }}>{t === "deep-dive" ? "Deep Dive" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["date", "Latest"], ["score", "Top Rated"], ["risk", "High Risk"]].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key as any)} className="btn btn-sm" style={{
              background: sortBy === key ? "#EEF2FF" : "#F8FAFC",
              color: sortBy === key ? "#4338CA" : "#94A3B8",
              border: `1px solid ${sortBy === key ? "#C7D2FE" : "#E2E8F0"}`,
              fontSize: 11,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Report list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((r, i) => {
          const typeStyle = TYPE_COLORS[r.type] || { bg: "#F8FAFC", color: "#94A3B8" };
          const verdictStyle = VERDICT_COLORS[r.verdict] || VERDICT_COLORS.HOLD;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card card-hover" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <CompanyAvatar symbol={r.symbol} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 13, color: "#0F172A" }}>{r.symbol}</span>
                    <span style={{ ...typeStyle, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.type.replace("-", " ")}</span>
                    <span style={{ ...verdictStyle, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{r.verdict}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: `${riskColor(r.risk)}15`, color: riskColor(r.risk) }}>Risk {r.risk}/100</span>
                  </div>
                  <div style={{ color: "#0F172A", fontWeight: 600, fontSize: 14, lineHeight: 1.4, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 11 }}><Clock size={11} /> {r.date}</span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{r.pages} pages</span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{r.citations} citations</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#D97706", fontSize: 11, fontWeight: 700 }}>
                      <Star size={10} fill="#D97706" /> {r.score}/10
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = "#";
                      alert(`Downloading: ArthaDrishti_${r.symbol}_Report.pdf\n\nNote: PDF generation requires the backend to be deployed. The static analysis is available in the Research Terminal.`);
                    }}
                    style={{ fontSize: 11, gap: 5 }}
                  >
                    <Download size={12} /> PDF
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => window.location.href = `/research`} style={{ fontSize: 11 }}>
                    View Analysis
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "#94A3B8", fontSize: 14 }}>
            No reports match your filters. Try clearing the search.
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, color: "#92400E", fontSize: 11 }}>
        These reports are AI-generated for informational purposes only. Not SEBI-registered investment advice. PDF export requires backend deployment.
      </div>
    </div>
  );
}
