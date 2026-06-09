import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const DEMO_PORTFOLIO = [
  { id: "p1", symbol: "RELIANCE", company_name: "Reliance Industries Ltd", quantity: 50, avg_buy_price: 2650.0, current_price: 2847.50, sector: "Energy", pnl: 9875.0, pnl_pct: 7.45 },
  { id: "p2", symbol: "TCS", company_name: "Tata Consultancy Services", quantity: 20, avg_buy_price: 3800.0, current_price: 3562.15, sector: "IT", pnl: -4756.0, pnl_pct: -6.26 },
  { id: "p3", symbol: "HDFCBANK", company_name: "HDFC Bank Ltd", quantity: 100, avg_buy_price: 1580.0, current_price: 1678.90, sector: "Banking", pnl: 9890.0, pnl_pct: 6.26 },
  { id: "p4", symbol: "INFY", company_name: "Infosys Ltd", quantity: 75, avg_buy_price: 1520.0, current_price: 1580.00, sector: "IT", pnl: 4500.0, pnl_pct: 3.95 },
  { id: "p5", symbol: "TATAMOTORS", company_name: "Tata Motors Ltd", quantity: 200, avg_buy_price: 820.0, current_price: 987.45, sector: "Automobiles", pnl: 33490.0, pnl_pct: 20.42 },
  { id: "p6", symbol: "BAJFINANCE", company_name: "Bajaj Finance Ltd", quantity: 30, avg_buy_price: 6800.0, current_price: 7234.50, sector: "NBFC", pnl: 13035.0, pnl_pct: 6.39 },
  { id: "p7", symbol: "ICICIBANK", company_name: "ICICI Bank Ltd", quantity: 150, avg_buy_price: 1050.0, current_price: 1134.20, sector: "Banking", pnl: 12630.0, pnl_pct: 8.02 },
  { id: "p8", symbol: "WIPRO", company_name: "Wipro Ltd", quantity: 300, avg_buy_price: 450.0, current_price: 298.25, sector: "IT", pnl: -45525.0, pnl_pct: -33.72 },
];

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/portfolio`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }
  return NextResponse.json(DEMO_PORTFOLIO);
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const body = await request.json();
      const res = await fetch(`${BACKEND}/api/v1/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify(body),
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { /* fall through */ }
  }
  return NextResponse.json({ id: `p-${Date.now()}`, ...(await request.json()) }, { status: 201 });
}
