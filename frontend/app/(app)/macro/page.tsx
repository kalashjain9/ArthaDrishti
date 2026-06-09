"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Calendar, BarChart3, Globe, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";

/* ── Static macro data ─────────────────────────────────────── */
const INDICATORS = [
  { label: "Repo Rate",        value: "6.50%",   change: "Unchanged",  up: null,  icon: "🏦", detail: "RBI held rates for 4th consecutive meeting. Rate cut expected in Q3 FY26." },
  { label: "CPI Inflation",    value: "4.83%",   change: "-0.21%",     up: false, icon: "📈", detail: "CPI eased in May 2026. Food inflation cooling; core at 3.2%." },
  { label: "GDP Growth",       value: "7.2%",    change: "+0.1%",      up: true,  icon: "📊", detail: "India fastest-growing major economy. RBI projects 7.4% for FY27." },
  { label: "INR / USD",        value: "₹83.42",  change: "-0.18",      up: false, icon: "💱", detail: "INR relatively stable. RBI intervening to prevent sharp depreciation." },
  { label: "Crude Oil",        value: "$78.45",  change: "+$0.74",     up: true,  icon: "🛢️", detail: "Brent crude: $78.45/bbl. OPEC+ maintaining production cuts." },
  { label: "10Y G-Sec Yield",  value: "6.82%",   change: "-0.03%",     up: false, icon: "📑", detail: "Bond yields easing on rate cut expectations. FPI inflows supportive." },
  { label: "WPI Inflation",    value: "0.96%",   change: "+0.14%",     up: true,  icon: "🏭", detail: "WPI inching up on fuel and manufactured goods. Manageable." },
  { label: "Current Account",  value: "-1.2%",   change: "+0.3%",      up: true,  icon: "⚖️", detail: "CAD narrowing. Services exports remain strong at $340B annualised." },
  { label: "Forex Reserves",   value: "$651B",   change: "+$3.4B",     up: true,  icon: "🏛️", detail: "All-time high. Provides 12 months of import cover." },
  { label: "FII Net Flow",     value: "+₹8,420Cr",change: "YTD",       up: true,  icon: "💰", detail: "FII inflows turning positive in June after 3 months of outflows." },
  { label: "IIP Growth",       value: "5.8%",    change: "+0.6%",      up: true,  icon: "🔧", detail: "Industrial output expanding. Manufacturing PMI at 57.5 — 16-year high." },
  { label: "PMI Services",     value: "61.2",    change: "+1.8",       up: true,  icon: "⚡", detail: "Services PMI at 13-year high. Strong domestic demand driving expansion." },
];

/* ── RBI Event Calendar ─────────────────────────────────────── */
const RBI_CALENDAR = [
  { date: "Jun 06, 2026", event: "MPC Meeting Result", status: "past",     outcome: "Repo Rate unchanged at 6.50%. CRR cut by 50bps to 3.5%.", sentiment: "neutral" },
  { date: "Aug 08, 2026", event: "MPC Meeting Result", status: "upcoming", outcome: "Rate cut of 25bps widely expected by analysts.", sentiment: "positive" },
  { date: "Oct 09, 2026", event: "MPC Meeting Result", status: "upcoming", outcome: "Depends on monsoon, CPI trajectory.", sentiment: "neutral" },
  { date: "Dec 05, 2026", event: "MPC Meeting Result", status: "upcoming", outcome: "Year-end meeting; key for FY27 guidance.", sentiment: "neutral" },
  { date: "Jun 30, 2026", event: "Q1 GDP Advance Estimate", status: "upcoming", outcome: "Consensus: 7.1-7.4% growth.", sentiment: "positive" },
  { date: "Jul 12, 2026", event: "Union Budget FY27", status: "upcoming", outcome: "Focus on capex, tax reforms, rural demand.", sentiment: "positive" },
];

/* ── FII/DII flow data ──────────────────────────────────────── */
const FLOW_DATA = [
  { month: "Jan", fii: -4200, dii: 5800 },
  { month: "Feb", fii: -2100, dii: 4200 },
  { month: "Mar", fii: -6800, dii: 7400 },
  { month: "Apr", fii: 1200,  dii: 3100 },
  { month: "May", fii: 3400,  dii: 2800 },
  { month: "Jun", fii: 8420,  dii: 1900 },
];

/* ── NIFTY index historical data ────────────────────────────── */
const NIFTY_HISTORY = [
  { m: "Jan", v: 21450 }, { m: "Feb", v: 21890 }, { m: "Mar", v: 22240 },
  { m: "Apr", v: 22480 }, { m: "May", v: 23120 }, { m: "Jun", v: 24738 },
];

/* ── Macro events and pre-computed impacts ──────────────────── */
const MACRO_EVENTS = [
  "RBI rate cut by 25 bps",
  "RBI rate hike by 25 bps",
  "Rupee depreciates 5% vs USD",
  "Crude oil prices surge 20%",
  "US Federal Reserve rate hike",
  "India GDP growth slows to 5.5%",
  "Monsoon deficit 20%",
  "Union Budget — capital gains tax hike",
  "China economic slowdown impact",
  "FII sell-off of ₹50,000 Cr",
];

const SIMULATION_RESULTS: Record<string, { analysis: string; impacts: { sector: string; score: number }[] }> = {
  "RBI rate cut by 25 bps": {
    analysis: "A 25 bps rate cut would be marginally positive for rate-sensitive sectors. Banking NIMs may compress 8-12 bps near-term, but loan growth acceleration (estimated +2-3% incremental) offsets this. NBFCs benefit from lower cost of funds. Autos and real estate see demand pull-forward as EMIs reduce. IT and FMCG largely unaffected. Overall NIFTY impact: +1.2% to +2.0% in the near term.",
    impacts: [
      { sector: "Banking", score: 55 }, { sector: "NBFC", score: 72 }, { sector: "Automobiles", score: 68 },
      { sector: "Real Estate", score: 80 }, { sector: "Infrastructure", score: 60 }, { sector: "IT", score: 5 },
      { sector: "FMCG", score: 15 }, { sector: "Energy", score: 20 }, { sector: "Pharma", score: 10 }, { sector: "Metals", score: 30 },
    ],
  },
  "RBI rate hike by 25 bps": {
    analysis: "A surprise rate hike would be negative for markets, especially rate-sensitive sectors. Banking NIMs improve but loan growth slows. NBFCs face margin pressure. Real estate demand dips sharply. NIFTY could correct 2-3%. However, a rate hike signal of inflation control might support INR, benefiting import-heavy sectors.",
    impacts: [
      { sector: "Banking", score: 20 }, { sector: "NBFC", score: -45 }, { sector: "Automobiles", score: -55 },
      { sector: "Real Estate", score: -70 }, { sector: "Infrastructure", score: -35 }, { sector: "IT", score: 10 },
      { sector: "FMCG", score: -15 }, { sector: "Energy", score: -20 }, { sector: "Pharma", score: 5 }, { sector: "Metals", score: -25 },
    ],
  },
  "Rupee depreciates 5% vs USD": {
    analysis: "INR at ₹87.5 would be a tailwind for IT and pharma (USD earners) but a headwind for energy (crude import cost), FMCG (raw material imports) and auto OEMs (component imports). IT companies would see 3-5% EPS upgrade. Inflation risks emerge as fuel and commodity prices spike. RBI may intervene aggressively using forex reserves.",
    impacts: [
      { sector: "IT", score: 75 }, { sector: "Pharma", score: 65 }, { sector: "Banking", score: -20 },
      { sector: "NBFC", score: -15 }, { sector: "Automobiles", score: -40 }, { sector: "Real Estate", score: -25 },
      { sector: "Infrastructure", score: -30 }, { sector: "Energy", score: -60 }, { sector: "FMCG", score: -35 }, { sector: "Metals", score: 40 },
    ],
  },
  "Crude oil prices surge 20%": {
    analysis: "Brent at $94/bbl would severely impact India as a net crude importer. CAD widens by ~$25B annualised. Upstream oil companies (ONGC, Oil India) benefit. OMCs (HPCL, BPCL) face margin pressure if retail prices are not raised. Aviation, paints, tyre companies see significant cost inflation. Inflation uptick may delay RBI rate cuts.",
    impacts: [
      { sector: "Energy (Upstream)", score: 80 }, { sector: "Chemicals/Paints", score: -65 }, { sector: "Aviation", score: -75 },
      { sector: "Automobiles", score: -35 }, { sector: "FMCG", score: -40 }, { sector: "Cement", score: -45 },
      { sector: "Banking", score: -20 }, { sector: "IT", score: -5 }, { sector: "Pharma", score: -15 }, { sector: "Metals", score: 35 },
    ],
  },
  "Monsoon deficit 20%": {
    analysis: "A 20% below-normal monsoon would be the worst in a decade. Direct impact: Kharif crop output falls 15%, rural income contracts, two-wheeler volumes decline 10-12%. Food inflation spikes 200-300 bps, delaying rate cuts. FMCG rural demand drops sharply. Agri-input companies (fertilizers, pesticides) see inventory build-up. Urban demand remains resilient, supporting IT/Banking.",
    impacts: [
      { sector: "FMCG (Rural)", score: -70 }, { sector: "Two-Wheeler", score: -65 }, { sector: "Agri-Inputs", score: -55 },
      { sector: "Banking (Rural)", score: -45 }, { sector: "NBFC (Agri)", score: -60 }, { sector: "Infrastructure", score: 20 },
      { sector: "IT", score: 5 }, { sector: "Pharma", score: 5 }, { sector: "Energy", score: -10 }, { sector: "Urban FMCG", score: -15 },
    ],
  },
  "US Federal Reserve rate hike": {
    analysis: "A surprise Fed rate hike would trigger global risk-off. India would face FII outflows (historically ₹30,000-50,000 Cr), INR depreciation pressure, and NIFTY correction of 3-5%. However, India's domestic growth story remains intact. Banking sector faces tighter global liquidity. IT benefits from stronger USD but faces demand slowdown. A good entry point for long-term investors.",
    impacts: [
      { sector: "Banking", score: -40 }, { sector: "NBFC", score: -35 }, { sector: "IT", score: 30 },
      { sector: "Pharma", score: 15 }, { sector: "Automobiles", score: -45 }, { sector: "Real Estate", score: -50 },
      { sector: "Infrastructure", score: -30 }, { sector: "Energy", score: -20 }, { sector: "FMCG", score: -20 }, { sector: "Metals", score: -35 },
    ],
  },
};

const SECTOR_SENSITIVITY = [
  { sector: "Banking",    rbi: 80, crude: 20, inrusd: 40, fii: 70, gdp: 75, inflation: 55 },
  { sector: "IT",         rbi: 20, crude: 10, inrusd: 90, fii: 65, gdp: 50, inflation: 15 },
  { sector: "Energy",     rbi: 35, crude: 90, inrusd: 55, fii: 45, gdp: 40, inflation: 30 },
  { sector: "Autos",      rbi: 72, crude: 65, inrusd: 50, fii: 40, gdp: 80, inflation: 60 },
  { sector: "FMCG",       rbi: 35, crude: 30, inrusd: 45, fii: 25, gdp: 65, inflation: 85 },
  { sector: "Pharma",     rbi: 25, crude: 20, inrusd: 70, fii: 35, gdp: 40, inflation: 25 },
  { sector: "Infra",      rbi: 60, crude: 50, inrusd: 35, fii: 55, gdp: 85, inflation: 45 },
  { sector: "Real Estate",rbi: 88, crude: 30, inrusd: 30, fii: 45, gdp: 75, inflation: 55 },
];

export default function MacroPage() {
  const [selectedEvent, setSelectedEvent] = useState(MACRO_EVENTS[0]);

  const simResult = SIMULATION_RESULTS[selectedEvent] || SIMULATION_RESULTS["RBI rate cut by 25 bps"];
  const positiveImpacts = simResult.impacts.filter((i) => i.score > 0);
  const negativeImpacts = simResult.impacts.filter((i) => i.score < 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">Macro Intelligence</h1>
        <p className="page-subtitle">Indian macroeconomic dashboard — real-time indicators, RBI calendar & AI event impact simulator</p>
      </div>

      {/* ── Key Indicators ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {INDICATORS.slice(0, 8).map((ind, i) => (
          <motion.div key={ind.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20 }}>{ind.icon}</span>
              {ind.up !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, color: ind.up ? "#059669" : "#DC2626", background: ind.up ? "#ECFDF5" : "#FFF1F2", padding: "2px 7px", borderRadius: 12, display: "flex", alignItems: "center", gap: 3 }}>
                  {ind.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {ind.change}
                </span>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ color: "#94A3B8", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ind.label}</div>
              <div style={{ color: "#0F172A", fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{ind.value}</div>
              <div style={{ color: "#94A3B8", fontSize: 10.5, marginTop: 5, lineHeight: 1.4 }}>{ind.detail}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* NIFTY trend */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <Activity size={14} style={{ color: "#4338CA" }} />
            <span className="section-title">NIFTY 50 — 2026 YTD</span>
            <span style={{ color: "#059669", fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>+15.3% YTD</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={NIFTY_HISTORY}>
              <defs>
                <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338CA" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4338CA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[20000, 26000]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString("en-IN")}`, "NIFTY 50"]} />
              <Area type="monotone" dataKey="v" stroke="#4338CA" strokeWidth={2.5} fill="url(#niftyGrad)" dot={{ fill: "#4338CA", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* FII/DII Flows */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <Globe size={14} style={{ color: "#4338CA" }} />
            <span className="section-title">FII / DII Monthly Flows (₹ Cr)</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={FLOW_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any, n: string) => [`₹${Number(v).toLocaleString("en-IN")} Cr`, n.toUpperCase()]} />
              <Legend />
              <Bar dataKey="fii" name="FII" fill="#4338CA" radius={[3, 3, 0, 0]}>
                {FLOW_DATA.map((d, i) => <Cell key={i} fill={d.fii >= 0 ? "#4338CA" : "#DC2626"} />)}
              </Bar>
              <Bar dataKey="dii" name="DII" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── RBI Calendar ── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="section-header"><Calendar size={14} style={{ color: "#4338CA" }} /><span className="section-title">RBI / Key Economic Calendar</span></div>
        {RBI_CALENDAR.map((ev, i) => (
          <div key={i} style={{ padding: "13px 18px", borderBottom: "1px solid #F8FAFC", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ minWidth: 110 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ev.status === "past" ? "#94A3B8" : "#0F172A", fontFamily: "'JetBrains Mono',monospace" }}>{ev.date}</div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: ev.status === "past" ? "#F1F5F9" : "#EEF2FF", color: ev.status === "past" ? "#94A3B8" : "#4338CA", textTransform: "uppercase" }}>{ev.status}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#0F172A", fontWeight: 600, fontSize: 13 }}>{ev.event}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{ev.outcome}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: ev.sentiment === "positive" ? "#ECFDF5" : ev.sentiment === "negative" ? "#FFF1F2" : "#F1F5F9", color: ev.sentiment === "positive" ? "#059669" : ev.sentiment === "negative" ? "#DC2626" : "#64748B", flexShrink: 0 }}>
              {ev.sentiment === "positive" ? "▲ Positive" : ev.sentiment === "negative" ? "▼ Negative" : "◆ Neutral"}
            </span>
          </div>
        ))}
      </div>

      {/* ── AI Event Simulator ── */}
      <div className="card" style={{ padding: 24 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <Zap size={14} style={{ color: "#D97706" }} />
          <span className="section-title">AI Macro Event Impact Simulator</span>
          <span className="badge badge-amber" style={{ marginLeft: "auto" }}>Pre-computed · ArthaDrishti AI</span>
        </div>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 16 }}>Select a macro event to see AI-computed sector impact across the Indian market.</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {MACRO_EVENTS.map((ev) => (
            <button key={ev} onClick={() => setSelectedEvent(ev)} className="btn btn-sm" style={{
              background: selectedEvent === ev ? "#4338CA" : "#F8FAFC",
              color: selectedEvent === ev ? "#fff" : "#374151",
              border: `1px solid ${selectedEvent === ev ? "#4338CA" : "#E2E8F0"}`,
              fontWeight: selectedEvent === ev ? 700 : 400,
              fontSize: 11,
            }}>{ev}</button>
          ))}
        </div>

        {/* Analysis text */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#4338CA,#6366F1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={12} color="#fff" />
            </div>
            <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 13 }}>ArthaDrishti AI Analysis — <em>{selectedEvent}</em></span>
          </div>
          <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.8, margin: 0 }}>{simResult.analysis}</p>
        </div>

        {/* Impact bars */}
        <div style={{ height: Math.max(200, simResult.impacts.length * 36) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simResult.impacts} layout="vertical" margin={{ left: 14, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}`} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={110} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => [`${v > 0 ? "+" : ""}${v} (impact score)`, "Sector Impact"]} />
              <Bar dataKey="score" radius={4}>
                {simResult.impacts.map((e, i) => <Cell key={i} fill={e.score > 0 ? "#059669" : "#DC2626"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Sector Sensitivity Matrix ── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="section-header"><BarChart3 size={14} style={{ color: "#4338CA" }} /><span className="section-title">Sector Sensitivity Matrix — Indian Market</span></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "10px 18px", textAlign: "left", color: "#94A3B8", fontSize: 11, fontWeight: 600 }}>Sector</th>
                {["RBI Rate", "Crude Oil", "INR/USD", "FII Flow", "GDP Growth", "Inflation"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "center", color: "#94A3B8", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTOR_SENSITIVITY.map((row) => (
                <tr key={row.sector} style={{ borderTop: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 18px", color: "#0F172A", fontWeight: 600, fontSize: 13 }}>{row.sector}</td>
                  {[row.rbi, row.crude, row.inrusd, row.fii, row.gdp, row.inflation].map((w, i) => {
                    const bg = w > 70 ? "#FFF1F2" : w > 40 ? "#FFFBEB" : "#ECFDF5";
                    const color = w > 70 ? "#DC2626" : w > 40 ? "#D97706" : "#059669";
                    return (
                      <td key={i} style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ background: bg, color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{w}%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, color: "#92400E", fontSize: 11.5, lineHeight: 1.6 }}>
        <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
        This macro analysis is for informational purposes only based on publicly available economic data. It does not constitute investment advice. ArthaDrishti AI is not a SEBI-registered investment advisor.
      </div>
    </div>
  );
}
