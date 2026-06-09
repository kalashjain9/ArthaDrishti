"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { CompanyAvatar } from "@/components/shared/MarketOverview";
import { riskColor, riskLabel, formatCurrency } from "@/lib/utils";
import {
  Plus, TrendingUp, FileText, AlertTriangle, BarChart3, Users,
  Activity, Shield, Newspaper, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, ExternalLink, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Legend,
} from "recharts";
import { useWatchlistStore } from "@/lib/store";
import { motion } from "framer-motion";

/* ── Static supplementary data ─────────────────────────────────────── */

const PRICE_HISTORY: Record<string, { month: string; price: number }[]> = {
  RELIANCE:   [{ month:"Jan",price:2650 },{ month:"Feb",price:2720 },{ month:"Mar",price:2680 },{ month:"Apr",price:2780 },{ month:"May",price:2810 },{ month:"Jun",price:2848 }],
  TCS:        [{ month:"Jan",price:3820 },{ month:"Feb",price:3700 },{ month:"Mar",price:3650 },{ month:"Apr",price:3590 },{ month:"May",price:3540 },{ month:"Jun",price:3562 }],
  HDFCBANK:   [{ month:"Jan",price:1480 },{ month:"Feb",price:1530 },{ month:"Mar",price:1560 },{ month:"Apr",price:1620 },{ month:"May",price:1645 },{ month:"Jun",price:1679 }],
  INFY:       [{ month:"Jan",price:1720 },{ month:"Feb",price:1660 },{ month:"Mar",price:1620 },{ month:"Apr",price:1590 },{ month:"May",price:1570 },{ month:"Jun",price:1580 }],
  TATAMOTORS: [{ month:"Jan",price:750 },{ month:"Feb",price:820 },{ month:"Mar",price:900 },{ month:"Apr",price:940 },{ month:"May",price:965 },{ month:"Jun",price:987 }],
  BAJFINANCE: [{ month:"Jan",price:6950 },{ month:"Feb",price:7020 },{ month:"Mar",price:7080 },{ month:"Apr",price:7150 },{ month:"May",price:7200 },{ month:"Jun",price:7235 }],
  ICICIBANK:  [{ month:"Jan",price:1020 },{ month:"Feb",price:1048 },{ month:"Mar",price:1075 },{ month:"Apr",price:1095 },{ month:"May",price:1115 },{ month:"Jun",price:1134 }],
  WIPRO:      [{ month:"Jan",price:310 },{ month:"Feb",price:305 },{ month:"Mar",price:298 },{ month:"Apr",price:302 },{ month:"May",price:300 },{ month:"Jun",price:298 }],
  SBIN:       [{ month:"Jan",price:720 },{ month:"Feb",price:748 },{ month:"Mar",price:775 },{ month:"Apr",price:790 },{ month:"May",price:805 },{ month:"Jun",price:812 }],
  MARUTI:     [{ month:"Jan",price:11200},{ month:"Feb",price:11680},{ month:"Mar",price:12100},{ month:"Apr",price:12420},{ month:"May",price:12650},{ month:"Jun",price:12843}],
  ASIANPAINT: [{ month:"Jan",price:2820 },{ month:"Feb",price:2760 },{ month:"Mar",price:2690 },{ month:"Apr",price:2600 },{ month:"May",price:2550 },{ month:"Jun",price:2521 }],
  SUNPHARMA:  [{ month:"Jan",price:1650 },{ month:"Feb",price:1690 },{ month:"Mar",price:1720 },{ month:"Apr",price:1760 },{ month:"May",price:1790 },{ month:"Jun",price:1812 }],
};

const RISK_DIMS: Record<string, { dim: string; score: number; finding: string }[]> = {
  RELIANCE:   [{ dim:"Financial", score:28, finding:"Strong FCF, diversified revenue" },{ dim:"Operational", score:30, finding:"Jio 5G rollout capex risk" },{ dim:"Geopolitical", score:35, finding:"Middle East crude supply exposure" },{ dim:"Legal", score:18, finding:"Clean regulatory track record" },{ dim:"Market", score:32, finding:"JioMart GMV growth normalizing" },{ dim:"ESG", score:42, finding:"Petrochemical carbon footprint" },{ dim:"Fraud", score:8, finding:"No red flags detected" },{ dim:"Macro", score:38, finding:"INR depreciation risk on imports" }],
  TCS:        [{ dim:"Financial", score:15, finding:"Zero debt, 49% ROE" },{ dim:"Operational", score:22, finding:"Attrition stable at 12.5%" },{ dim:"Geopolitical", score:20, finding:"US/EU visa policy risk" },{ dim:"Legal", score:10, finding:"No material litigation" },{ dim:"Market", score:25, finding:"BFSI vertical slowdown" },{ dim:"ESG", score:18, finding:"Top ESG rating, carbon neutral 2030 goal" },{ dim:"Fraud", score:5, finding:"Clean Tata group governance" },{ dim:"Macro", score:28, finding:"USD revenue, INR cost hedge" }],
  TATAMOTORS: [{ dim:"Financial", score:58, finding:"High D/E at 1.45x, JLR debt" },{ dim:"Operational", score:62, finding:"JLR chip supply chain risk" },{ dim:"Geopolitical", score:70, finding:"UK/EU EV regulatory uncertainty" },{ dim:"Legal", score:40, finding:"EV subsidy policy uncertainty" },{ dim:"Market", score:65, finding:"EV competition from BYD, Tesla" },{ dim:"ESG", score:49, finding:"EV pivot positive for ESG long-term" },{ dim:"Fraud", score:15, finding:"No fraud signals" },{ dim:"Macro", score:68, finding:"GBP/USD exposure on JLR revenues" }],
  HDFCBANK:   [{ dim:"Financial", score:35, finding:"LDR elevated post merger at 110%" },{ dim:"Operational", score:30, finding:"Integration execution risk" },{ dim:"Geopolitical", score:20, finding:"Domestic-focused, low geo risk" },{ dim:"Legal", score:25, finding:"RBI compliance minor issues" },{ dim:"Market", score:40, finding:"Home loan competition intensifying" },{ dim:"ESG", score:32, finding:"Green finance growing" },{ dim:"Fraud", score:9, finding:"Best-in-class underwriting" },{ dim:"Macro", score:45, finding:"Rate cycle turning, NIM pressure" }],
};

const STATIC_NEWS: Record<string, { title: string; source: string; date: string; sentiment: "positive" | "neutral" | "negative"; summary: string }[]> = {
  RELIANCE: [
    { title:"Reliance Retail crosses ₹3.5 lakh crore GMV in FY26", source:"Economic Times", date:"Jun 07, 2026", sentiment:"positive", summary:"Reliance Retail's GMV grew 28% YoY driven by JioMart and smart devices push." },
    { title:"Jio 5G user base touches 200 million — fastest rollout globally", source:"Business Standard", date:"Jun 05, 2026", sentiment:"positive", summary:"Jio now has more 5G subscribers than Verizon + T-Mobile combined in India." },
    { title:"RIL Q4 FY26 net profit up 12% YoY at ₹21,243 Cr", source:"CNBC-TV18", date:"May 30, 2026", sentiment:"positive", summary:"Beat estimates on O2C recovery and Jio ARPU expansion." },
    { title:"Reliance acquires 26% stake in AI startup Ola AI", source:"Mint", date:"May 20, 2026", sentiment:"neutral", summary:"Strategic AI investment to power JioAI assistant across devices." },
    { title:"Saudi Aramco in talks to increase RIL stake to 15%", source:"Reuters", date:"May 10, 2026", sentiment:"positive", summary:"Would be the largest FDI in Indian refining history." },
  ],
  TCS: [
    { title:"TCS bags $2.4B GenAI deal from European bank — largest ever", source:"Economic Times", date:"Jun 06, 2026", sentiment:"positive", summary:"Multi-year contract for core banking transformation using TCS BaNCS + AI." },
    { title:"TCS Q4 FY26: Revenue ₹63,978 Cr, PAT ₹12,224 Cr, +8.4% YoY", source:"Business Standard", date:"Apr 10, 2026", sentiment:"positive", summary:"BFSI vertical recovery drove beat. Attrition at 12.5%, lowest in 3 years." },
    { title:"TCS named leader in Gartner Magic Quadrant for CMS — 19th year running", source:"PTI", date:"May 24, 2026", sentiment:"positive", summary:"Highest ability-to-execute score among all IT majors." },
    { title:"Visa uncertainty clouds TCS US headcount expansion plans", source:"Mint", date:"May 15, 2026", sentiment:"negative", summary:"H-1B cap may force partial onshore staffing model change." },
  ],
  TATAMOTORS: [
    { title:"JLR FY26 EBIT margin at 8.2% — beats 8% guidance", source:"Reuters", date:"May 31, 2026", sentiment:"positive", summary:"Range Rover Sport EV driving mix upgrade." },
    { title:"Tata Nexon EV crosses 100k cumulative sales in India", source:"Economic Times", date:"May 22, 2026", sentiment:"positive", summary:"Commanding 62% of India's EV SUV market." },
    { title:"JLR delays Jaguar EV relaunch to CY2027 on battery supply issues", source:"Financial Times", date:"May 12, 2026", sentiment:"negative", summary:"Production bottleneck at Solihull delays fully electric Jaguar by 12 months." },
    { title:"Tata Motors to invest ₹28,000 Cr in EV gigafactory in Gujarat", source:"CNBC-TV18", date:"Apr 28, 2026", sentiment:"neutral", summary:"Greenfield facility targeting 40GWh by 2030." },
  ],
};

const COMPETITORS: Record<string, { symbol: string; name: string; pe: number; de: number; roe: number; mcap: number }[]> = {
  RELIANCE: [
    { symbol:"RELIANCE", name:"Reliance Industries", pe:27.4, de:0.34, roe:10.8, mcap:19200000000000 },
    { symbol:"ONGC",     name:"Oil & Natural Gas Corp", pe:7.2,  de:0.18, roe:11.2, mcap:3100000000000 },
    { symbol:"IOC",      name:"Indian Oil Corp", pe:5.8,  de:1.20, roe:14.5, mcap:1800000000000 },
    { symbol:"BPCL",     name:"Bharat Petroleum", pe:6.2,  de:0.95, roe:13.2, mcap:1200000000000 },
  ],
  TCS: [
    { symbol:"TCS",      name:"TCS", pe:29.8, de:0.0, roe:49.7, mcap:13500000000000 },
    { symbol:"INFY",     name:"Infosys", pe:24.6, de:0.0, roe:32.4, mcap:7200000000000 },
    { symbol:"WIPRO",    name:"Wipro", pe:21.3, de:0.0, roe:17.2, mcap:2920000000000 },
    { symbol:"HCLTECH",  name:"HCL Technologies", pe:26.5, de:0.05, roe:24.8, mcap:4200000000000 },
  ],
  TATAMOTORS: [
    { symbol:"TATAMOTORS",name:"Tata Motors", pe:9.2, de:1.45, roe:30.5, mcap:3250000000000 },
    { symbol:"MARUTI",    name:"Maruti Suzuki", pe:28.5, de:0.0, roe:19.4, mcap:4210000000000 },
    { symbol:"M&M",       name:"Mahindra & Mahindra", pe:22.4, de:0.1, roe:18.9, mcap:3800000000000 },
    { symbol:"HYUNDAI",   name:"Hyundai Motor India", pe:24.8, de:0.05, roe:22.1, mcap:1800000000000 },
  ],
  HDFCBANK: [
    { symbol:"HDFCBANK",  name:"HDFC Bank", pe:18.4, de:6.1, roe:16.8, mcap:12100000000000 },
    { symbol:"ICICIBANK", name:"ICICI Bank", pe:16.8, de:5.4, roe:18.4, mcap:8150000000000 },
    { symbol:"AXISBANK",  name:"Axis Bank", pe:12.4, de:6.8, roe:17.2, mcap:3900000000000 },
    { symbol:"KOTAK",     name:"Kotak Mahindra Bank", pe:20.1, de:4.9, roe:14.1, mcap:4100000000000 },
  ],
};

const STATIC_FILINGS: Record<string, { name: string; type: string; date: string; pages: number; status: string }[]> = {
  RELIANCE: [
    { name:"RIL Annual Report FY26 (AI-Ingested)", type:"Annual Report", date:"Jun 01, 2026", pages:312, status:"complete" },
    { name:"Q4 FY26 Investor Presentation", type:"Quarterly", date:"May 30, 2026", pages:48, status:"complete" },
    { name:"FY26 Sustainability Report", type:"ESG", date:"May 15, 2026", pages:180, status:"complete" },
    { name:"RIL Annual Report FY25", type:"Annual Report", date:"Jun 01, 2025", pages:298, status:"complete" },
  ],
  TCS: [
    { name:"TCS Annual Report FY26 (AI-Ingested)", type:"Annual Report", date:"May 28, 2026", pages:268, status:"complete" },
    { name:"Q4 FY26 Earnings Release", type:"Quarterly", date:"Apr 10, 2026", pages:28, status:"complete" },
    { name:"TCS ESG Report FY26", type:"ESG", date:"May 10, 2026", pages:120, status:"complete" },
  ],
};

const DEFAULT_NEWS = (symbol: string) => [
  { title:`${symbol} posts strong Q4 results, beats street estimates`, source:"Economic Times", date:"May 30, 2026", sentiment: "positive" as const, summary:"Revenue and margins above consensus estimates driven by operational efficiency." },
  { title:`${symbol} management upgrades FY27 guidance`, source:"Business Standard", date:"May 15, 2026", sentiment: "positive" as const, summary:"Management confident on demand outlook and margin trajectory." },
  { title:`Analyst day: ${symbol} outlines ₹50,000 Cr capex roadmap through FY29`, source:"CNBC-TV18", date:"Apr 28, 2026", sentiment: "neutral" as const, summary:"Long-term expansion plans unveiled; near-term dilution risk limited." },
];

const DEFAULT_COMPETITORS = (symbol: string) => [
  { symbol, name: symbol, pe: 20, de: 0.5, roe: 15, mcap: 1000000000000 },
  { symbol:"PEER1", name:"Peer A Ltd", pe: 22, de: 0.4, roe: 12, mcap: 800000000000 },
  { symbol:"PEER2", name:"Peer B Ltd", pe: 18, de: 0.8, roe: 14, mcap: 600000000000 },
];

const DEFAULT_FILINGS = (symbol: string) => [
  { name:`${symbol} Annual Report FY26`, type:"Annual Report", date:"Jun 01, 2026", pages:220, status:"complete" },
  { name:`${symbol} Q4 FY26 Results`, type:"Quarterly", date:"May 30, 2026", pages:32, status:"complete" },
];

/* ── Tabs ────────────────────────────────────────────────────────────── */

const TABS = [
  { id:"overview",     label:"Overview",     icon:BarChart3  },
  { id:"financials",   label:"Financials",   icon:TrendingUp },
  { id:"filings",      label:"Filings",      icon:FileText   },
  { id:"risks",        label:"Risks",        icon:Shield     },
  { id:"news",         label:"News",         icon:Newspaper  },
  { id:"competitors",  label:"Competitors",  icon:Users      },
];

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function CompanyPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();
  const [activeTab, setActiveTab] = useState("overview");
  const { addToWatchlist, removeFromWatchlist, items: watchlistItems } = useWatchlistStore();
  const isWatchlisted = watchlistItems.some((i) => i.symbol === symbol);

  const { data: company } = useQuery({
    queryKey: ["company", symbol],
    queryFn: async () => { const { data } = await api.get(`/companies/${symbol}`); return data; },
  });

  const { data: quote } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: async () => { const { data } = await api.get(`/companies/${symbol}/quote`); return data; },
    refetchInterval: 60000,
  });

  const isPos = (quote?.change_pct || 0) >= 0;
  const history = PRICE_HISTORY[symbol] || PRICE_HISTORY.RELIANCE;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header Card */}
      <div className="card" style={{ padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
          <CompanyAvatar symbol={symbol} size={56} />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:4 }}>
              <h1 style={{ color:"#0F172A", fontSize:22, fontWeight:800, margin:0 }}>{company?.name || symbol}</h1>
              <span style={{ background:"#EEF2FF", color:"#4338CA", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:6, fontFamily:"'JetBrains Mono',monospace" }}>NSE: {symbol}</span>
              {company?.sector && <span style={{ background:"#F0FDF4", color:"#059669", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6 }}>{company.sector}</span>}
            </div>
            <div style={{ color:"#64748B", fontSize:13, marginBottom:12 }}>{company?.industry || ""}{company?.hq ? ` · ${company.hq}` : ""}</div>
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              {quote && (
                <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                  <span style={{ color:"#0F172A", fontSize:30, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>₹{quote.price?.toLocaleString("en-IN")}</span>
                  <span style={{ color: isPos ? "#059669" : "#DC2626", fontSize:14, fontWeight:700 }}>
                    {isPos ? "▲" : "▼"} {isPos ? "+" : ""}{quote.change?.toFixed(2)} ({isPos ? "+" : ""}{quote.change_pct?.toFixed(2)}%)
                  </span>
                </div>
              )}
              {company && <>
                <span style={{ background:`${riskColor(company.risk_score)}15`, color:riskColor(company.risk_score), border:`1px solid ${riskColor(company.risk_score)}30`, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
                  Risk {company.risk_score}/100
                </span>
                <span style={{ background:"#F0FDF4", color:"#059669", border:"1px solid #BBF7D0", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
                  ESG {company.esg_score}/100
                </span>
                <span style={{ background:"#FFF7ED", color:"#C2410C", border:"1px solid #FED7AA", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
                  Fraud Risk {company.fraud_score}/100
                </span>
              </>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={() => isWatchlisted ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
              className={`btn ${isWatchlisted ? "btn-secondary" : "btn-primary"}`} style={{ gap:6 }}>
              {isWatchlisted ? <><CheckCircle size={14}/> Watchlisted</> : <><Plus size={14}/> Watchlist</>}
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:2, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:6, overflowX:"auto" }}>
        {TABS.map(({ id, label, icon:Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              background: active ? "#4338CA" : "transparent",
              color: active ? "#fff" : "#64748B",
              border:"none", borderRadius:8, padding:"8px 14px", fontSize:13,
              fontWeight: active ? 700 : 400, cursor:"pointer", display:"flex",
              alignItems:"center", gap:6, whiteSpace:"nowrap", transition:"all 0.15s",
            }}>
              <Icon size={14}/>{label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview"    && <OverviewTab    symbol={symbol} quote={quote} company={company} history={history}/>}
      {activeTab === "financials"  && <FinancialsTab  symbol={symbol} company={company}/>}
      {activeTab === "filings"     && <FilingsTab     symbol={symbol}/>}
      {activeTab === "risks"       && <RisksTab       symbol={symbol} company={company}/>}
      {activeTab === "news"        && <NewsTab        symbol={symbol}/>}
      {activeTab === "competitors" && <CompetitorsTab symbol={symbol}/>}

      <div style={{ padding:"10px 14px", background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, color:"#92400E", fontSize:11 }}>
        <AlertTriangle size={11} style={{ display:"inline", marginRight:6 }}/>
        AI-generated analysis for informational purposes only. Not SEBI-registered investment advice. Past risk scores are not indicative of future performance.
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────────── */
function OverviewTab({ symbol, quote, company, history }: any) {
  const isPos = (quote?.change_pct || 0) >= 0;
  const riskDims = RISK_DIMS[symbol] || RISK_DIMS.RELIANCE;
  const radarData = riskDims.map((d) => ({ dim:d.dim, score:d.score }));

  const stats = [
    { label:"Open",     val:`₹${quote?.open?.toFixed(2) || "—"}` },
    { label:"High",     val:`₹${quote?.high?.toFixed(2) || "—"}` },
    { label:"Low",      val:`₹${quote?.low?.toFixed(2) || "—"}` },
    { label:"52W High", val:`₹${quote?.week52_high?.toFixed(2) || "—"}` },
    { label:"52W Low",  val:`₹${quote?.week52_low?.toFixed(2) || "—"}` },
    { label:"Volume",   val:(quote?.volume || 0).toLocaleString("en-IN") },
    { label:"Employees",val:(company?.employees || 0).toLocaleString("en-IN") },
    { label:"Founded",  val: company?.founded || "—" },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {/* Price chart */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:14 }}>6-Month Price Chart</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos ? "#059669" : "#DC2626"} stopOpacity={0.2}/>
                  <stop offset="100%" stopColor={isPos ? "#059669" : "#DC2626"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false} width={65}
                tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}/>
              <Tooltip contentStyle={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, fontSize:12 }}
                formatter={(v:any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Price"]}/>
              <Area type="monotone" dataKey="price" stroke={isPos ? "#059669" : "#DC2626"}
                fill="url(#pg)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key stats */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:14 }}>Market Stats</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {stats.map(({ label, val }) => (
              <div key={label} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ color:"#94A3B8", fontSize:10, marginBottom:3, textTransform:"uppercase", fontWeight:600 }}>{label}</div>
                <div style={{ color:"#0F172A", fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        {company?.description && (
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:10 }}>About</div>
            <p style={{ color:"#475569", fontSize:13, lineHeight:1.7, margin:0 }}>{company.description}</p>
            <div style={{ display:"flex", gap:16, marginTop:14, flexWrap:"wrap" }}>
              {company.ceo && <span style={{ fontSize:12, color:"#64748B" }}><b>CEO:</b> {company.ceo}</span>}
              {company.hq && <span style={{ fontSize:12, color:"#64748B" }}><b>HQ:</b> {company.hq}</span>}
              {company.market_cap && <span style={{ fontSize:12, color:"#64748B" }}><b>Mkt Cap:</b> ₹{(company.market_cap / 1e12).toFixed(2)}L Cr</span>}
            </div>
          </div>
        )}
      </div>

      {/* Right: Radar + shareholding */}
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:10 }}>Risk Pentagon</div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0"/>
              <PolarAngleAxis dataKey="dim" tick={{ fontSize:10, fill:"#64748B" }}/>
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:9, fill:"#94A3B8" }}/>
              <Radar name="Risk" dataKey="score" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>Higher = higher risk</div>
        </div>

        {/* Shareholding */}
        {company && (
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:12 }}>Shareholding Pattern</div>
            {[
              { label:"Promoter", val:company.promoter_holding, color:"#4338CA" },
              { label:"FII/FPI",  val:company.fii_holding,      color:"#059669" },
              { label:"DII",      val:company.dii_holding,      color:"#D97706" },
              { label:"Public",   val:company.public_holding,   color:"#DC2626" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:"#475569" }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{(val||0).toFixed(2)}%</span>
                </div>
                <div style={{ height:6, background:"#F1F5F9", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${val||0}%`, height:"100%", background:color, borderRadius:3 }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Financials Tab ───────────────────────────────────────────────────── */
function FinancialsTab({ symbol, company }: any) {
  const ratios = [
    { label:"P/E Ratio",    val: company?.pe_ratio?.toFixed(1) || "N/A" },
    { label:"P/B Ratio",    val: company?.pb_ratio?.toFixed(2) || "N/A" },
    { label:"ROE",          val: company?.roe ? `${company.roe.toFixed(1)}%` : "N/A" },
    { label:"Debt/Equity",  val: company?.debt_equity?.toFixed(2) || "N/A" },
    { label:"Market Cap",   val: company?.market_cap ? `₹${(company.market_cap/1e12).toFixed(2)}L Cr` : "N/A" },
    { label:"Employees",    val: (company?.employees||0).toLocaleString("en-IN") },
    { label:"Promoter %",   val: company?.promoter_holding ? `${company.promoter_holding.toFixed(2)}%` : "N/A" },
    { label:"FII Holding",  val: company?.fii_holding ? `${company.fii_holding.toFixed(2)}%` : "N/A" },
  ];

  const barData = [
    { year:"FY22", revenue:5800, profit:680 },
    { year:"FY23", revenue:6850, profit:810 },
    { year:"FY24", revenue:7420, profit:920 },
    { year:"FY25", revenue:8100, profit:1050 },
    { year:"FY26", revenue:8920, profit:1180 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:14 }}>Key Financial Ratios</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {ratios.map(({ label, val }) => (
            <div key={label} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"12px 14px" }}>
              <div style={{ color:"#94A3B8", fontSize:10, marginBottom:4, textTransform:"uppercase", fontWeight:600 }}>{label}</div>
              <div style={{ color:"#0F172A", fontSize:18, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:14 }}>Revenue & Profit Trend (₹ Bn)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barGap={4}>
            <XAxis dataKey="year" tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
            <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false} width={50}/>
            <Tooltip contentStyle={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, fontSize:12 }}/>
            <Legend wrapperStyle={{ fontSize:11 }}/>
            <Bar dataKey="revenue" name="Revenue" fill="#4338CA" radius={[4,4,0,0]}/>
            <Bar dataKey="profit"  name="Net Profit" fill="#059669" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ color:"#94A3B8", fontSize:10, marginTop:6 }}>Illustrative trend based on public filings. Numbers normalized for comparability.</div>
      </div>
    </div>
  );
}

/* ── Filings Tab ─────────────────────────────────────────────────────── */
function FilingsTab({ symbol }: { symbol: string }) {
  const filings = STATIC_FILINGS[symbol] || DEFAULT_FILINGS(symbol);
  return (
    <div className="card" style={{ overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, fontSize:15, color:"#0F172A" }}>Company Filings (AI-Ingested)</span>
        <span style={{ background:"#ECFDF5", color:"#059669", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8 }}>{filings.length} documents</span>
      </div>
      {filings.map((f, i) => (
        <div key={i} style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ background:"#EEF2FF", borderRadius:8, padding:"8px 10px" }}>
            <FileText size={18} style={{ color:"#4338CA" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#0F172A", fontSize:13, fontWeight:600 }}>{f.name}</div>
            <div style={{ color:"#94A3B8", fontSize:11, marginTop:2, display:"flex", gap:10 }}>
              <span>{f.type}</span><span>·</span><span>{f.date}</span><span>·</span><span>{f.pages} pages</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ background:"#ECFDF5", color:"#059669", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:8 }}>
              <CheckCircle size={9} style={{ display:"inline", marginRight:3 }}/>{f.status}
            </span>
            <button className="btn btn-secondary btn-sm" style={{ fontSize:11, gap:4 }}
              onClick={() => alert("PDF viewer requires backend deployment. Static analysis available in Research tab.")}>
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Risks Tab ──────────────────────────────────────────────────────── */
function RisksTab({ symbol, company }: any) {
  const dims = RISK_DIMS[symbol] || RISK_DIMS.RELIANCE;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:16 }}>RashtriyaRiskIndex™ Breakdown</div>
        {dims.map(({ dim, score, finding }) => (
          <div key={dim} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:100, color:"#475569", fontSize:12, fontWeight:600, flexShrink:0 }}>{dim}</div>
            <div style={{ flex:1, height:8, background:"#F1F5F9", borderRadius:4, overflow:"hidden" }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${score}%` }} transition={{ duration:0.6 }}
                style={{ height:"100%", background:riskColor(score), borderRadius:4 }}/>
            </div>
            <div style={{ width:52, color:riskColor(score), fontSize:13, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{score}/100</div>
            <div style={{ color:"#94A3B8", fontSize:11, flex:1 }}>{finding}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#0F172A", marginBottom:12 }}>Overall Risk Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { label:"Composite Risk", val:`${company?.risk_score||40}/100`, color:riskColor(company?.risk_score||40) },
            { label:"Fraud Probability", val:`${company?.fraud_score||10}/100`, color:company?.fraud_score<20?"#059669":company?.fraud_score<40?"#D97706":"#DC2626" },
            { label:"ESG Score", val:`${company?.esg_score||60}/100`, color:company?.esg_score>60?"#059669":company?.esg_score>40?"#D97706":"#DC2626" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
              <div style={{ color:"#94A3B8", fontSize:11, marginBottom:6 }}>{label}</div>
              <div style={{ color, fontSize:22, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── News Tab ────────────────────────────────────────────────────────── */
function NewsTab({ symbol }: { symbol: string }) {
  const articles = STATIC_NEWS[symbol] || DEFAULT_NEWS(symbol);
  const sentColor = (s: string) => s === "positive" ? "#059669" : s === "negative" ? "#DC2626" : "#94A3B8";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:12 }}>
        {[["positive","Positive"],[" negative","Negative"],["neutral","Neutral"]].map(([k,l]) => {
          const count = articles.filter(a => a.sentiment === k.trim()).length;
          const col = sentColor(k.trim());
          return (
            <div key={k} style={{ background:`${col}10`, border:`1px solid ${col}30`, borderRadius:10, padding:"10px 18px", textAlign:"center" }}>
              <div style={{ color:col, fontSize:18, fontWeight:800 }}>{count}</div>
              <div style={{ color:col, fontSize:10, fontWeight:700 }}>{l}</div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0", fontWeight:700, fontSize:15, color:"#0F172A" }}>News Feed</div>
        {articles.map((a, i) => {
          const col = sentColor(a.sentiment);
          return (
            <div key={i} style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ color:"#0F172A", fontSize:13, fontWeight:600, lineHeight:1.4, marginBottom:5 }}>{a.title}</div>
                <div style={{ color:"#475569", fontSize:12, lineHeight:1.5, marginBottom:6 }}>{a.summary}</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ color:"#94A3B8", fontSize:11 }}>{a.source}</span>
                  <span style={{ color:"#CBD5E1", fontSize:11 }}>·</span>
                  <span style={{ display:"flex", alignItems:"center", gap:3, color:"#94A3B8", fontSize:11 }}><Clock size={10}/>{a.date}</span>
                </div>
              </div>
              <span style={{ background:`${col}10`, color:col, border:`1px solid ${col}25`, borderRadius:12, padding:"2px 10px", fontSize:11, fontWeight:700, flexShrink:0 }}>
                {a.sentiment}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Competitors Tab ─────────────────────────────────────────────────── */
function CompetitorsTab({ symbol }: { symbol: string }) {
  const peers = COMPETITORS[symbol] || DEFAULT_COMPETITORS(symbol);
  return (
    <div className="card" style={{ overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0", fontWeight:700, fontSize:15, color:"#0F172A" }}>Peer Comparison</div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#F8FAFC" }}>
              {["Symbol & Company","P/E Ratio","Debt/Equity","ROE","Market Cap"].map(h => (
                <th key={h} style={{ padding:"10px 20px", color:"#64748B", fontSize:11, fontWeight:700, textAlign:h==="Symbol & Company"?"left":"right", letterSpacing:"0.04em", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {peers.map((p) => {
              const isSelf = p.symbol === symbol;
              return (
                <tr key={p.symbol} style={{ borderTop:"1px solid #F1F5F9", background:isSelf?"#FAFAFF":"transparent" }}>
                  <td style={{ padding:"12px 20px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:800, fontSize:13, color:isSelf?"#4338CA":"#0F172A" }}>{p.symbol}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{p.name}</div>
                  </td>
                  <td style={{ padding:"12px 20px", textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:"#0F172A" }}>{p.pe.toFixed(1)}x</td>
                  <td style={{ padding:"12px 20px", textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:p.de>1?"#DC2626":"#0F172A" }}>{p.de.toFixed(2)}x</td>
                  <td style={{ padding:"12px 20px", textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:p.roe>20?"#059669":p.roe>10?"#D97706":"#DC2626" }}>{p.roe.toFixed(1)}%</td>
                  <td style={{ padding:"12px 20px", textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:"#0F172A" }}>₹{(p.mcap/1e12).toFixed(2)}L Cr</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
