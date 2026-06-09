import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const QUOTES: Record<string, any> = {
  RELIANCE:   { price: 2847.50, change: 34.60,  change_pct: 1.23,  open: 2815.00, high: 2861.20, low: 2808.35, volume: 8432156, week52_high: 3024.90, week52_low: 2220.30 },
  TCS:        { price: 3562.15, change: -12.15, change_pct: -0.34, open: 3578.00, high: 3585.40, low: 3541.80, volume: 2187432, week52_high: 4592.25, week52_low: 3056.05 },
  HDFCBANK:   { price: 1678.90, change: 35.45,  change_pct: 2.15,  open: 1645.00, high: 1682.50, low: 1641.20, volume: 12456789, week52_high: 1880.00, week52_low: 1363.55 },
  INFY:       { price: 1580.00, change: -14.25, change_pct: -0.89, open: 1594.00, high: 1601.85, low: 1573.10, volume: 6234521, week52_high: 2006.45, week52_low: 1358.35 },
  TATAMOTORS: { price: 987.45,  change: 32.80,  change_pct: 3.42,  open: 956.00, high: 992.30, low: 952.15, volume: 18934521, week52_high: 1179.05, week52_low: 732.05 },
  BAJFINANCE: { price: 7234.50, change: 63.20,  change_pct: 0.88,  open: 7172.00, high: 7261.90, low: 7141.45, volume: 1234567, week52_high: 8192.00, week52_low: 6187.85 },
  ICICIBANK:  { price: 1134.20, change: 18.75,  change_pct: 1.67,  open: 1116.00, high: 1138.40, low: 1112.30, volume: 14523678, week52_high: 1362.35, week52_low: 985.90 },
  WIPRO:      { price: 298.25,  change: -2.65,  change_pct: -0.88, open: 301.00, high: 303.40, low: 296.80, volume: 8765432, week52_high: 557.45, week52_low: 205.90 },
  SBIN:       { price: 812.30,  change: 11.65,  change_pct: 1.45,  open: 801.00, high: 815.70, low: 798.50, volume: 24567891, week52_high: 912.10, week52_low: 543.20 },
  MARUTI:     { price: 12842.60, change: 187.40, change_pct: 1.48, open: 12660.00, high: 12879.30, low: 12621.45, volume: 345678, week52_high: 13680.00, week52_low: 9883.80 },
  ASIANPAINT: { price: 2521.35, change: -31.45, change_pct: -1.23, open: 2556.00, high: 2559.80, low: 2509.45, volume: 876543, week52_high: 3439.00, week52_low: 2225.25 },
  SUNPHARMA:  { price: 1812.40, change: 22.15,  change_pct: 1.24,  open: 1791.00, high: 1818.90, low: 1785.30, volume: 2345678, week52_high: 1960.45, week52_low: 1116.60 },
};

function makeQuote(symbol: string) {
  const base = 500 + Math.random() * 2000;
  const chg = (Math.random() - 0.5) * 40;
  return {
    price: parseFloat(base.toFixed(2)), change: parseFloat(chg.toFixed(2)),
    change_pct: parseFloat(((chg / base) * 100).toFixed(2)),
    open: parseFloat((base - 10).toFixed(2)), high: parseFloat((base + 15).toFixed(2)),
    low: parseFloat((base - 20).toFixed(2)), volume: Math.floor(Math.random() * 5000000 + 500000),
    week52_high: parseFloat((base * 1.3).toFixed(2)), week52_low: parseFloat((base * 0.75).toFixed(2)),
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/companies/${sym}/quote`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }
  return NextResponse.json(QUOTES[sym] || makeQuote(sym));
}
