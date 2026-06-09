export const INDICES = [
  { key: "nifty50", label: "NIFTY 50", value: 24738.25, change: 287.45, changePct: 1.17 },
  { key: "sensex", label: "SENSEX", value: 81246.5, change: 893.25, changePct: 1.11 },
  { key: "banknifty", label: "BANK NIFTY", value: 53214.9, change: 624.15, changePct: 1.19 },
  { key: "niftyit", label: "NIFTY IT", value: 38472.3, change: -234.6, changePct: -0.61 },
  { key: "midcap", label: "NIFTY MIDCAP", value: 56834.2, change: 412.85, changePct: 0.73 },
  { key: "vix", label: "INDIA VIX", value: 14.23, change: -0.87, changePct: -5.76 },
  { key: "inrusd", label: "INR/USD", value: 83.42, change: -0.12, changePct: -0.14 },
  { key: "crude", label: "CRUDE OIL", value: 78.45, change: 1.23, changePct: 1.59 },
  { key: "gold", label: "GOLD MCX", value: 71250, change: 420, changePct: 0.59 },
  { key: "us10y", label: "US 10Y", value: 4.42, change: -0.03, changePct: -0.67 },
];

export const COMPANIES: Record<string, {
  name: string; price: number; change: number; changePct: number;
  mktCap: string; riskScore: number; sector: string; pe: number;
  sparkline: number[];
}> = {
  RELIANCE: {
    name: "Reliance Industries Ltd",
    price: 2847.5, change: 34.6, changePct: 1.23,
    mktCap: "₹19.2L Cr", riskScore: 42, sector: "Energy", pe: 28.4,
    sparkline: [2780, 2795, 2810, 2820, 2830, 2825, 2840, 2847],
  },
  TCS: {
    name: "Tata Consultancy Services",
    price: 3562.15, change: -12.3, changePct: -0.34,
    mktCap: "₹13.0L Cr", riskScore: 28, sector: "IT", pe: 31.2,
    sparkline: [3580, 3575, 3570, 3568, 3562, 3565, 3560, 3562],
  },
  HDFCBANK: {
    name: "HDFC Bank Ltd",
    price: 1678.9, change: 35.3, changePct: 2.15,
    mktCap: "₹12.7L Cr", riskScore: 58, sector: "Banking", pe: 19.8,
    sparkline: [1630, 1640, 1648, 1655, 1660, 1668, 1675, 1678],
  },
  INFY: {
    name: "Infosys Ltd",
    price: 1456.3, change: -9.8, changePct: -0.67,
    mktCap: "₹6.1L Cr", riskScore: 32, sector: "IT", pe: 29.5,
    sparkline: [1470, 1468, 1462, 1460, 1458, 1457, 1456, 1456],
  },
  TATAMOTORS: {
    name: "Tata Motors Ltd",
    price: 987.45, change: 32.7, changePct: 3.42,
    mktCap: "₹3.6L Cr", riskScore: 72, sector: "Automobiles", pe: 12.1,
    sparkline: [940, 950, 958, 964, 972, 978, 984, 987],
  },
  BAJFINANCE: {
    name: "Bajaj Finance Ltd",
    price: 6892.0, change: 126.5, changePct: 1.87,
    mktCap: "₹4.2L Cr", riskScore: 48, sector: "NBFC", pe: 36.4,
    sparkline: [6720, 6740, 6775, 6800, 6830, 6856, 6875, 6892],
  },
  ICICIBANK: {
    name: "ICICI Bank Ltd",
    price: 1234.6, change: 30.9, changePct: 2.56,
    mktCap: "₹8.7L Cr", riskScore: 35, sector: "Banking", pe: 21.3,
    sparkline: [1195, 1205, 1212, 1218, 1225, 1229, 1232, 1234],
  },
  WIPRO: {
    name: "Wipro Ltd",
    price: 498.75, change: -6.2, changePct: -1.23,
    mktCap: "₹2.6L Cr", riskScore: 38, sector: "IT", pe: 24.8,
    sparkline: [508, 505, 504, 502, 500, 499, 498, 498],
  },
  SBIN: {
    name: "State Bank of India",
    price: 824.35, change: 18.6, changePct: 2.31,
    mktCap: "₹7.4L Cr", riskScore: 55, sector: "Banking", pe: 11.4,
    sparkline: [798, 803, 808, 812, 816, 820, 822, 824],
  },
  MARUTI: {
    name: "Maruti Suzuki India Ltd",
    price: 11420.0, change: -85.3, changePct: -0.74,
    mktCap: "₹3.5L Cr", riskScore: 30, sector: "Automobiles", pe: 33.2,
    sparkline: [11540, 11520, 11505, 11490, 11475, 11460, 11435, 11420],
  },
};

export const SECTORS = [
  { name: "Banking", ret: 2.15, volume: "₹12,430 Cr", companies: 12 },
  { name: "IT", ret: -0.67, volume: "₹9,845 Cr", companies: 9 },
  { name: "Energy", ret: 1.23, volume: "₹8,230 Cr", companies: 7 },
  { name: "Automobiles", ret: 3.42, volume: "₹6,780 Cr", companies: 8 },
  { name: "FMCG", ret: 0.45, volume: "₹5,120 Cr", companies: 11 },
  { name: "Pharma", ret: -0.32, volume: "₹4,890 Cr", companies: 14 },
  { name: "Infrastructure", ret: 1.87, volume: "₹7,340 Cr", companies: 10 },
  { name: "Real Estate", ret: 2.34, volume: "₹3,210 Cr", companies: 6 },
  { name: "Metals", ret: -1.12, volume: "₹4,560 Cr", companies: 8 },
  { name: "NBFC", ret: 1.56, volume: "₹5,870 Cr", companies: 7 },
];

export const PORTFOLIO_STATS = {
  totalValue: 4728350,
  todayPL: 32450,
  todayPct: 0.69,
  totalPL: 842350,
  totalPct: 21.7,
  holdings: 8,
  invested: 3886000,
};

export const AGENT_ACTIVITY = [
  {
    agent: "FilingAgent",
    emoji: "📑",
    text: "Scanned RELIANCE Q4 FY25 Annual Report — 3 risk factors flagged (contingent liabilities: ₹12,400Cr)",
    time: "2m ago",
    severity: "medium",
    symbol: "RELIANCE",
  },
  {
    agent: "RiskAgent",
    emoji: "⚠️",
    text: "TATAMOTORS financial risk elevated to 72/100 — Gross debt up ₹4,200Cr QoQ to ₹22,600Cr",
    time: "18m ago",
    severity: "high",
    symbol: "TATAMOTORS",
  },
  {
    agent: "NewsAgent",
    emoji: "📰",
    text: "HDFCBANK — 15 articles analyzed, aggregate sentiment: −0.32 (deteriorating), CASA ratio concerns",
    time: "45m ago",
    severity: "medium",
    symbol: "HDFCBANK",
  },
  {
    agent: "SentimentAgent",
    emoji: "🔍",
    text: "INFY narrative divergence score = 28% (low) — management and news sentiment well aligned",
    time: "1h 12m ago",
    severity: "low",
    symbol: "INFY",
  },
  {
    agent: "MacroAgent",
    emoji: "🏦",
    text: "RBI MPC minutes released — Repo rate held at 6.5%, dovish tone signals possible cut in Q2",
    time: "2h 30m ago",
    severity: "info",
    symbol: "MACRO",
  },
  {
    agent: "FraudAgent",
    emoji: "🛡️",
    text: "Beneish M-Score scan complete across 50 companies — 3 companies flagged for earnings manipulation indicators",
    time: "4h ago",
    severity: "high",
    symbol: "SYSTEM",
  },
];
