"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompanyAvatar } from "@/components/shared/MarketOverview";
import { COMPANIES } from "@/lib/market-data";
import { riskColor, riskLabel } from "@/lib/utils";
import { Search, Send, Bot, User, FileText, Download, TrendingUp, Shield, ChevronRight, Loader2, X } from "lucide-react";

/* ── 30 NSE companies ─────────────────────────────────────── */
const UNIVERSE = [
  { s: "RELIANCE",   n: "Reliance Industries",         sector: "Energy",          price: "₹2,847", risk: 32, pe: 27.4 },
  { s: "TCS",        n: "Tata Consultancy Services",    sector: "IT",              price: "₹3,562", risk: 21, pe: 29.8 },
  { s: "HDFCBANK",   n: "HDFC Bank",                   sector: "Banking",         price: "₹1,678", risk: 38, pe: 18.4 },
  { s: "INFY",       n: "Infosys",                     sector: "IT",              price: "₹1,580", risk: 25, pe: 24.6 },
  { s: "ICICIBANK",  n: "ICICI Bank",                  sector: "Banking",         price: "₹1,134", risk: 35, pe: 16.8 },
  { s: "TATAMOTORS", n: "Tata Motors",                 sector: "Auto",            price: "₹987",   risk: 62, pe: 9.2  },
  { s: "BAJFINANCE", n: "Bajaj Finance",               sector: "NBFC",            price: "₹7,234", risk: 45, pe: 32.1 },
  { s: "SBIN",       n: "State Bank of India",         sector: "Banking",         price: "₹812",   risk: 42, pe: 10.4 },
  { s: "WIPRO",      n: "Wipro",                       sector: "IT",              price: "₹298",   risk: 29, pe: 21.3 },
  { s: "MARUTI",     n: "Maruti Suzuki",               sector: "Auto",            price: "₹12,842",risk: 28, pe: 28.5 },
  { s: "SUNPHARMA",  n: "Sun Pharmaceutical",          sector: "Pharma",          price: "₹1,812", risk: 30, pe: 35.8 },
  { s: "ASIANPAINT", n: "Asian Paints",                sector: "Consumer",        price: "₹2,521", risk: 24, pe: 52.3 },
  { s: "AXISBANK",   n: "Axis Bank",                   sector: "Banking",         price: "₹1,182", risk: 44, pe: 14.2 },
  { s: "KOTAKBANK",  n: "Kotak Mahindra Bank",         sector: "Banking",         price: "₹1,892", risk: 33, pe: 22.6 },
  { s: "LT",         n: "Larsen & Toubro",             sector: "Infrastructure",  price: "₹3,678", risk: 36, pe: 32.4 },
  { s: "HCLTECH",    n: "HCL Technologies",            sector: "IT",              price: "₹1,652", risk: 23, pe: 26.8 },
  { s: "BHARTIARTL", n: "Bharti Airtel",               sector: "Telecom",         price: "₹1,842", risk: 40, pe: 88.2 },
  { s: "HINDUNILVR", n: "Hindustan Unilever",          sector: "FMCG",            price: "₹2,418", risk: 20, pe: 56.4 },
  { s: "ITC",        n: "ITC Ltd",                     sector: "FMCG",            price: "₹464",   risk: 26, pe: 27.3 },
  { s: "POWERGRID",  n: "Power Grid Corp",             sector: "Utilities",       price: "₹328",   risk: 28, pe: 18.2 },
  { s: "NTPC",       n: "NTPC Ltd",                    sector: "Utilities",       price: "₹382",   risk: 30, pe: 17.4 },
  { s: "TITAN",      n: "Titan Company",               sector: "Consumer",        price: "₹3,284", risk: 32, pe: 84.2 },
  { s: "ADANIPORTS", n: "Adani Ports & SEZ",           sector: "Infrastructure",  price: "₹1,342", risk: 58, pe: 28.6 },
  { s: "ADANIENT",   n: "Adani Enterprises",           sector: "Diversified",     price: "₹2,814", risk: 68, pe: 72.4 },
  { s: "ONGC",       n: "ONGC",                        sector: "Energy",          price: "₹284",   risk: 35, pe: 8.4  },
  { s: "COALINDIA",  n: "Coal India",                  sector: "Mining",          price: "₹478",   risk: 38, pe: 7.8  },
  { s: "DMART",      n: "Avenue Supermarts (DMart)",   sector: "Retail",          price: "₹4,214", risk: 22, pe: 98.4 },
  { s: "BAJAJFINSV", n: "Bajaj Finserv",               sector: "Finance",         price: "₹1,642", risk: 42, pe: 18.7 },
  { s: "ULTRACEMCO", n: "UltraTech Cement",            sector: "Cement",          price: "₹11,284",risk: 31, pe: 38.6 },
  { s: "TECHM",      n: "Tech Mahindra",               sector: "IT",              price: "₹1,284", risk: 34, pe: 28.4 },
];

/* ── Static AI analysis for key companies ─────────────────── */
const STATIC_ANALYSES: Record<string, { summary: string; positives: string[]; risks: string[]; verdict: string; target: string }> = {
  RELIANCE: {
    summary: "Reliance Industries is a conglomerate giant with diversified revenue streams across O2C (Oil-to-Chemicals), retail and digital. The company has successfully pivoted from a pure energy play to a consumer-tech conglomerate. Jio's 450M+ subscriber base and JioMart's rapid grocery expansion provide strong growth visibility.",
    positives: ["Jio: India's largest 5G network, ARPU growing steadily (+12% YoY)", "Retail: ₹3,06,000 Cr revenue, fastest-growing retail network in India", "New Energy: 100GW solar target by 2030, green hydrogen initiative", "O2C margins stable at 11.4% despite crude volatility"],
    risks: ["High capital intensity: ongoing capex of ₹1.5L Cr for 5G + green energy", "Debt levels elevated at ₹3.06L Cr net debt post acquisitions", "Regulatory risk in telecom (AGR dues, spectrum costs)", "Succession planning uncertainty at promoter level"],
    verdict: "ACCUMULATE",
    target: "₹3,200 (12-month)",
  },
  TCS: {
    summary: "TCS remains the gold standard in Indian IT with best-in-class margins (~25% EBIT) and the largest revenue base in the sector. Near-term headwinds from BFSI client caution and slower deal ramp-ups are offset by a record $42.7B order book and AI/GenAI deal momentum.",
    positives: ["$42.7B TCV deal wins in FY25 — highest ever", "GenAI deal wins accelerating across BFSI, retail, manufacturing", "Cash conversion superior: FCF yield of ~4.5% at CMP", "Dividend yield of ~1.5% + buybacks ensure shareholder value"],
    risks: ["BFSI vertical (32% revenue) showing caution on new discretionary spending", "US recession risk could defer 10-15% of pipeline", "Visa/wage inflation in key markets (US, UK)", "Attrition stabilized but mid-level talent retention costly"],
    verdict: "BUY",
    target: "₹4,100 (12-month)",
  },
  TATAMOTORS: {
    summary: "Tata Motors is undergoing a structural transformation — JLR's EV pivot and India's domestic passenger + commercial vehicle dominance make it a high-risk, high-reward story. JLR delivered record £4.2B PAT in FY25, but high debt and EV execution risk keep the risk score elevated.",
    positives: ["JLR: £4.2B PAT in FY25, Range Rover/Defender demand backlog of 100K units", "India PV market share: 14.8%, Nexon remains best-selling SUV", "EV leadership: Tata EV holds 60%+ domestic EV market share", "Net Automotive Debt nearly zero — significant deleveraging achieved"],
    risks: ["JLR EV transition capex of £2.5B/year through FY27", "China JLR volumes weak — down 18% YoY amid local competition", "Raw material (steel, aluminium, lithium) cost volatility", "UK labor strike risk at JLR Castle Bromwich and Solihull plants"],
    verdict: "HOLD",
    target: "₹1,050 (12-month)",
  },
  HDFCBANK: {
    summary: "HDFC Bank post-merger is navigating a complex integration of HDFC Ltd's ₹7.3L Cr mortgage book. LDR (Loan-Deposit Ratio) normalization and deposit mobilization are key near-term priorities. Long-term competitive moat remains intact with 8,700+ branches and #1 private sector lending position.",
    positives: ["#1 private bank in India by advances (₹25.4L Cr) and deposits (₹23.5L Cr)", "Asset quality pristine: GNPA 1.24%, NNPA 0.31%", "Capital adequacy strong: CAR 19.3%, Tier-1 at 17.8%", "Digital: 72% transactions via digital channels"],
    risks: ["LDR elevated at 108% — deposit mobilization pressure", "CASA ratio declining: 38.2% vs 44% a year ago", "Credit cost normalization risk as retail NPAs edge up", "Integration complexity: HDFC Ltd merger synergies slower than expected"],
    verdict: "BUY",
    target: "₹1,950 (12-month)",
  },
  BAJFINANCE: {
    summary: "Bajaj Finance is the undisputed king of Indian NBFC with the most sophisticated underwriting engine in the country. 80M+ customers, ₹3.7L Cr AUM, and a diversified product mix across consumer, SME and mortgage lending. Near-term, RBI's regulatory scrutiny on NBFC lending is a key overhang.",
    positives: ["80M customer franchise — largest in NBFC space", "ROA 4.8%, ROE 22.8% — best-in-class profitability", "AUM grew 28% YoY to ₹3.7L Cr — market share gains accelerating", "Digital lending platform (Bajaj Pay) gaining traction"],
    risks: ["RBI circular on top-up loans and NTC (New-to-Credit) segment may impact growth", "Competition intensifying from banks and digital lenders", "Valuation premium (6.4x P/B) leaves little room for disappointment", "Credit cost uptick in consumer and SME segments during rate cycle"],
    verdict: "HOLD",
    target: "₹7,800 (12-month)",
  },
};

/* ── Static recent research reports ──────────────────────── */
const STATIC_REPORTS = [
  { symbol: "RELIANCE",   query: "Analyse JLR's new energy investment impact on balance sheet", date: "2026-06-08 14:32", citations: 7, pages: 12 },
  { symbol: "TCS",        query: "Q4 FY26 earnings — GenAI deal momentum analysis", date: "2026-06-07 11:15", citations: 5, pages: 9  },
  { symbol: "TATAMOTORS", query: "JLR EV transition — risk-reward for FY27", date: "2026-06-06 09:44", citations: 8, pages: 14 },
  { symbol: "HDFCBANK",   query: "Post-merger LDR normalization timeline analysis", date: "2026-06-05 16:22", citations: 6, pages: 11 },
  { symbol: "BAJFINANCE", query: "RBI NBFC circular — impact on growth guidance", date: "2026-06-04 10:08", citations: 4, pages: 8  },
  { symbol: "ICICIBANK",  query: "Digital banking leadership — competitive moat analysis", date: "2026-06-03 15:47", citations: 5, pages: 10 },
  { symbol: "INFY",       query: "Large deal wins FY26 — client concentration risk", date: "2026-06-02 13:21", citations: 4, pages: 7  },
  { symbol: "SBIN",       query: "NPA recovery trajectory and credit quality improvement", date: "2026-05-30 09:55", citations: 6, pages: 11 },
];

interface ChatMsg { role: "user" | "assistant"; content: string; ts: number; }

export default function ResearchPage() {
  const [selected, setSelected] = useState(UNIVERSE[0]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "analysis">("analysis");
  const bottomRef = useRef<HTMLDivElement>(null);

  const filtered = UNIVERSE.filter((u) =>
    u.s.includes(searchQ.toUpperCase()) || u.n.toLowerCase().includes(searchQ.toLowerCase())
  );

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const staticData = STATIC_ANALYSES[selected.s];

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setActiveTab("chat");
    const newMsgs: ChatMsg[] = [...messages, { role: "user", content: q, ts: Date.now() }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map((m) => ({ role: m.role, content: `[Company: ${selected.s}] ${m.content}` })) }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply || data.error || "No response.", ts: Date.now() }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Connection error. Please check your GROQ_API_KEY configuration.", ts: Date.now() }]);
    } finally { setLoading(false); }
  };

  const QUICK_QUESTIONS = [
    `What is the risk score for ${selected.s}?`,
    `Summarise the latest quarterly results for ${selected.s}`,
    `What are the key risks for ${selected.s} investors?`,
    `Is ${selected.s} overvalued at current P/E of ${selected.pe}x?`,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Research Terminal</h1>
        <p className="page-subtitle">AI-powered deep analysis on 30 NSE/BSE companies — grounded in filings, financials and market data</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Company Sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search company…"
              className="input-field"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>

          {/* Company list */}
          <div className="card" style={{ overflow: "hidden", maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {(showSearch && searchQ ? filtered : UNIVERSE).map((co) => (
              <button
                key={co.s}
                onClick={() => { setSelected(co); setSearchQ(""); setShowSearch(false); setMessages([]); setActiveTab("analysis"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", background: selected.s === co.s ? "#EEF2FF" : "transparent",
                  border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (selected.s !== co.s) (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC"; }}
                onMouseLeave={(e) => { if (selected.s !== co.s) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <CompanyAvatar symbol={co.s} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: selected.s === co.s ? "#4338CA" : "#0F172A" }}>{co.s}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{co.n}</div>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskColor(co.risk), flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Main panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Company header */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <CompanyAvatar symbol={selected.s} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ color: "#0F172A", fontWeight: 800, fontSize: 20, margin: 0 }}>{selected.s}</h2>
                  <span className="badge badge-gray">{selected.sector}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12, background: `${riskColor(selected.risk)}15`, color: riskColor(selected.risk), border: `1px solid ${riskColor(selected.risk)}30` }}>
                    Risk {selected.risk}/100 — {riskLabel(selected.risk)}
                  </span>
                </div>
                <div style={{ color: "#64748B", fontSize: 13, marginTop: 3 }}>{selected.n}</div>
                <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                  <div><span style={{ color: "#94A3B8", fontSize: 10 }}>CMP</span><br /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{selected.price}</span></div>
                  <div><span style={{ color: "#94A3B8", fontSize: 10 }}>P/E</span><br /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{selected.pe}x</span></div>
                  <div><span style={{ color: "#94A3B8", fontSize: 10 }}>RISK INDEX</span><br /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15, color: riskColor(selected.risk) }}>{selected.risk}/100</span></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setActiveTab("analysis"); setMessages([]); }} className={`btn btn-sm ${activeTab === "analysis" ? "btn-primary" : "btn-secondary"}`}>AI Analysis</button>
                <button onClick={() => setActiveTab("chat")} className={`btn btn-sm ${activeTab === "chat" ? "btn-primary" : "btn-secondary"}`}>Ask AI</button>
              </div>
            </div>
          </div>

          {/* Analysis tab */}
          <AnimatePresence mode="wait">
          {activeTab === "analysis" && (
            <motion.div key="analysis" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {staticData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Summary */}
                  <div className="card" style={{ padding: 20 }}>
                    <div className="section-header" style={{ marginBottom: 12 }}>
                      <Bot size={14} style={{ color: "#4338CA" }} />
                      <span className="section-title">AI Research Summary</span>
                      <span className="badge badge-indigo" style={{ marginLeft: "auto" }}>ArthaDrishti AI</span>
                    </div>
                    <p style={{ color: "#374151", fontSize: 13.5, lineHeight: 1.8, margin: 0 }}>{staticData.summary}</p>
                  </div>

                  {/* Positives + Risks */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="card" style={{ padding: 18 }}>
                      <div style={{ color: "#059669", fontWeight: 700, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <TrendingUp size={13} /> BULL CASE
                      </div>
                      {staticData.positives.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            <span style={{ color: "#059669", fontSize: 10, fontWeight: 700 }}>+</span>
                          </div>
                          <span style={{ color: "#374151", fontSize: 12, lineHeight: 1.6 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="card" style={{ padding: 18 }}>
                      <div style={{ color: "#DC2626", fontWeight: 700, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Shield size={13} /> BEAR CASE / RISKS
                      </div>
                      {staticData.risks.map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            <span style={{ color: "#DC2626", fontSize: 10, fontWeight: 700 }}>!</span>
                          </div>
                          <span style={{ color: "#374151", fontSize: 12, lineHeight: 1.6 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="card" style={{ padding: 18, background: staticData.verdict === "BUY" ? "#ECFDF5" : staticData.verdict === "HOLD" ? "#FFFBEB" : "#EEF2FF", border: `1px solid ${staticData.verdict === "BUY" ? "#A7F3D0" : staticData.verdict === "HOLD" ? "#FDE68A" : "#C7D2FE"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 }}>AI Verdict</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: staticData.verdict === "BUY" ? "#059669" : staticData.verdict === "HOLD" ? "#D97706" : "#4338CA" }}>{staticData.verdict}</div>
                      </div>
                      <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 }}>Price Target</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", fontFamily: "'JetBrains Mono',monospace" }}>{staticData.target}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 8, color: "#64748B", fontSize: 10.5 }}>
                      ⚠️ Not SEBI-registered. For research and informational purposes only. Consult a SEBI-registered advisor before investing.
                    </div>
                  </div>

                  {/* Quick questions */}
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Ask AI about {selected.s}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {QUICK_QUESTIONS.map((q) => (
                        <button key={q} onClick={() => sendMessage(q)} className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}>{q}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 32, textAlign: "center" }}>
                  <Bot size={32} style={{ color: "#C7D2FE", marginBottom: 12 }} />
                  <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>No static analysis for {selected.s}. Use the AI chat to ask specific questions.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {QUICK_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => sendMessage(q)} className="btn btn-sm btn-primary" style={{ fontSize: 11 }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Chat tab */}
          {activeTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card" style={{ display: "flex", flexDirection: "column", height: 500 }}>
                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {messages.length === 0 && (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                      <Bot size={28} style={{ color: "#C7D2FE", marginBottom: 8 }} />
                      <div style={{ color: "#94A3B8", fontSize: 13 }}>Ask me anything about <strong style={{ color: "#4338CA" }}>{selected.s}</strong></div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "user" ? "#4338CA" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {m.role === "user" ? <User size={13} color="#fff" /> : <Bot size={13} color="#4338CA" />}
                      </div>
                      <div style={{ maxWidth: "80%", background: m.role === "user" ? "#EEF2FF" : "#F8FAFC", border: `1px solid ${m.role === "user" ? "#C7D2FE" : "#E2E8F0"}`, borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", padding: "10px 14px" }}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#0F172A", whiteSpace: "pre-wrap" }}>{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bot size={13} color="#4338CA" />
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px 14px 14px 14px", padding: "12px 16px" }}>
                        <Loader2 size={14} style={{ color: "#4338CA", animation: "spin 1s linear infinite" }} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: "10px 14px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    placeholder={`Ask about ${selected.s}…`}
                    className="input-field"
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="btn btn-primary btn-sm">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="section-header"><FileText size={14} style={{ color: "#4338CA" }} /><span className="section-title">Recent AI Research Reports</span><span className="badge badge-gray" style={{ marginLeft: "auto" }}>{STATIC_REPORTS.length} reports</span></div>
        {STATIC_REPORTS.map((r, i) => (
          <div key={i} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFC", display: "flex", alignItems: "center", gap: 12 }}>
            <CompanyAvatar symbol={r.symbol} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#0F172A", fontWeight: 600, fontSize: 13 }}>{r.query}</div>
              <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{r.symbol}</span>
                {" · "}{r.date}{" · "}{r.citations} citations · {r.pages} pages
              </div>
            </div>
            <button onClick={() => { setSelected(UNIVERSE.find((u) => u.s === r.symbol) || UNIVERSE[0]); setActiveTab("analysis"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-sm btn-secondary" style={{ flexShrink: 0, fontSize: 11 }}>
              View <ChevronRight size={11} />
            </button>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
