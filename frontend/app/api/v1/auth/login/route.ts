import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch { /* fall through to demo */ }
  }

  if (body.email === "demo@arthadrishti.ai" && body.password === "Demo@2024#") {
    return NextResponse.json({ access_token: "DEMO_TOKEN", token_type: "bearer" });
  }
  return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
}
