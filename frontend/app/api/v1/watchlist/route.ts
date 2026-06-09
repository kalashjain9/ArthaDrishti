import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const DEMO_WATCHLIST = [
  { id: "w1", symbol: "RELIANCE", company_name: "Reliance Industries Ltd", last_risk_score: 32, agent_active: true, alert_on_new_filing: true, alert_on_risk_change: true, last_checked_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "w2", symbol: "TCS", company_name: "Tata Consultancy Services", last_risk_score: 21, agent_active: true, alert_on_new_filing: true, alert_on_risk_change: false, last_checked_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "w3", symbol: "HDFCBANK", company_name: "HDFC Bank Ltd", last_risk_score: 38, agent_active: true, alert_on_new_filing: true, alert_on_risk_change: true, last_checked_at: new Date(Date.now() - 1800000).toISOString() },
  { id: "w4", symbol: "INFY", company_name: "Infosys Ltd", last_risk_score: 25, agent_active: false, alert_on_new_filing: false, alert_on_risk_change: true, last_checked_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "w5", symbol: "TATAMOTORS", company_name: "Tata Motors Ltd", last_risk_score: 62, agent_active: true, alert_on_new_filing: true, alert_on_risk_change: true, last_checked_at: new Date(Date.now() - 900000).toISOString() },
];

async function proxyOrMock(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/watchlist`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }
  return NextResponse.json(DEMO_WATCHLIST);
}

export async function GET(request: NextRequest) {
  return proxyOrMock(request);
}
