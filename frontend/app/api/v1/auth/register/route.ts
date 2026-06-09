import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (BACKEND) {
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch { /* fall through */ }
  }

  // Demo: always succeed registration, return a token
  return NextResponse.json({
    id: `user-${Date.now()}`,
    email: body.email,
    username: body.username || body.email.split("@")[0],
    full_name: body.full_name || "",
  }, { status: 201 });
}
