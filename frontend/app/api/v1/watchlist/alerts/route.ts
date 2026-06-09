import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const DEMO_ALERTS = [
  {
    id: "a1", symbol: "TATAMOTORS", company_name: "Tata Motors Ltd",
    alert_type: "risk_spike", severity: "high",
    title: "TATAMOTORS: Gross Debt increased ₹4,200 Cr QoQ — Q3 FY25 Filing, Page 34",
    body: "Tata Motors reported a significant increase in gross debt in Q3 FY25. Total automotive debt rose from ₹18,400 Cr to ₹22,600 Cr. Management cited JLR production ramp-up investment as primary driver. Free cash flow turned negative at -₹800 Cr for the quarter.",
    is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), risk_delta: 14.2,
  },
  {
    id: "a2", symbol: "HDFCBANK", company_name: "HDFC Bank Ltd",
    alert_type: "sentiment_shift", severity: "medium",
    title: "HDFCBANK: Narrative Divergence Score = 67% — Management vs. News",
    body: "Management commentary in Q2 FY26 emphasized 'robust deposit growth'. However, news coverage highlights CASA ratio declining to 38.2% (from 44% YoY) and rising credit costs. AI divergence model flagged inconsistency.",
    is_read: false, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), risk_delta: 8.5,
  },
  {
    id: "a3", symbol: "RELIANCE", company_name: "Reliance Industries Ltd",
    alert_type: "new_filing", severity: "low",
    title: "RELIANCE: Q3 FY26 Quarterly Results Filed with BSE/NSE",
    body: "Reliance Industries Limited has filed its Q3 FY26 quarterly results. Revenue ₹2,31,426 Cr (+8.2% YoY). EBITDA margin improved to 18.4%. Jio and Retail segments showed strong growth.",
    is_read: true, created_at: new Date(Date.now() - 18 * 3600000).toISOString(), risk_delta: -3.1,
  },
  {
    id: "a4", symbol: "TCS", company_name: "Tata Consultancy Services",
    alert_type: "macro_impact", severity: "medium",
    title: "TCS: USD/INR appreciation may impact IT exports revenue by ~2.3%",
    body: "Macro agent detected INR strengthening 1.8% against USD this week. For TCS with ~45% USD revenue exposure, this translates to an estimated 2.3% headwind on reported INR revenue. Q4 guidance may be revised.",
    is_read: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString(), risk_delta: 5.2,
  },
];

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const url = new URL(request.url);
      const res = await fetch(`${BACKEND}/api/v1/watchlist/alerts${url.search}`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread_only") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const data = unreadOnly ? DEMO_ALERTS.filter((a) => !a.is_read) : DEMO_ALERTS;
  return NextResponse.json(data.slice(0, limit));
}
