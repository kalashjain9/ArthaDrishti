import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const STATIC_OVERVIEW = {
  indices: {
    NIFTY50:   { value: 24738.25, change_pct: 1.17 },
    SENSEX:    { value: 81246.50, change_pct: 1.11 },
    BANKNIFTY: { value: 53214.90, change_pct: 1.19 },
    NIFTYMID:  { value: 44612.30, change_pct: 0.85 },
    VIX:       { value: 14.23,    change_pct: -5.21 },
    INRUSD:    { value: 83.42,    change_pct: -0.18 },
    CRUDE:     { value: 78.45,    change_pct: 0.94 },
    GOLD:      { value: 71250,    change_pct: 0.42 },
    US10Y:     { value: 4.42,     change_pct: 0.05 },
    DXY:       { value: 104.21,   change_pct: -0.31 },
  },
  market_status: "open",
  as_of: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/market/overview`, { headers: { Authorization: auth } });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }
  return NextResponse.json(STATIC_OVERVIEW);
}
