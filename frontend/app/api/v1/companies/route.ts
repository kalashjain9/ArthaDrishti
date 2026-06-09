import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const DEMO_COMPANIES = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy", market_cap: 19000000000000, risk_score: 32, fraud_score: 8, sentiment_score: 42, esg_score: 58 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", market_cap: 13500000000000, risk_score: 21, fraud_score: 5, sentiment_score: 18, esg_score: 72 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking", market_cap: 12000000000000, risk_score: 38, fraud_score: 9, sentiment_score: 35, esg_score: 65 },
  { symbol: "INFY", name: "Infosys Ltd", sector: "IT", market_cap: 7200000000000, risk_score: 25, fraud_score: 6, sentiment_score: 22, esg_score: 78 },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automobiles", market_cap: 3200000000000, risk_score: 62, fraud_score: 15, sentiment_score: 55, esg_score: 51 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "NBFC", market_cap: 4500000000000, risk_score: 45, fraud_score: 11, sentiment_score: 30, esg_score: 60 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking", market_cap: 8100000000000, risk_score: 35, fraud_score: 8, sentiment_score: 28, esg_score: 63 },
  { symbol: "WIPRO", name: "Wipro Ltd", sector: "IT", market_cap: 2900000000000, risk_score: 29, fraud_score: 7, sentiment_score: 20, esg_score: 70 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", market_cap: 7100000000000, risk_score: 42, fraud_score: 12, sentiment_score: 38, esg_score: 55 },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", sector: "Automobiles", market_cap: 4200000000000, risk_score: 28, fraud_score: 6, sentiment_score: 24, esg_score: 68 },
];

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/companies`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }
  return NextResponse.json(DEMO_COMPANIES);
}
