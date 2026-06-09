import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function POST(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const body = await request.json();
      const res = await fetch(`${BACKEND}/api/v1/watchlist/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify(body),
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { /* fall through */ }
  }
  return NextResponse.json({ id: `w-${symbol}`, symbol, company_name: symbol, last_risk_score: 35, agent_active: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (BACKEND && token && token !== "DEMO_TOKEN") {
    try {
      const res = await fetch(`${BACKEND}/api/v1/watchlist/${symbol}`, {
        method: "DELETE",
        headers: { Authorization: auth },
      });
      return NextResponse.json({}, { status: res.status });
    } catch { /* fall through */ }
  }
  return NextResponse.json({ deleted: true });
}
