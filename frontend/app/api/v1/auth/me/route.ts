import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

const DEMO_USER = {
  id: "demo-001",
  email: "demo@arthadrishti.ai",
  username: "demo_analyst",
  full_name: "Demo Analyst",
  is_demo: true,
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (token === "DEMO_TOKEN") return NextResponse.json(DEMO_USER);

  if (BACKEND && token) {
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/me`, {
        headers: { Authorization: auth },
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch { /* fall through */ }
  }

  return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
}

export async function PATCH(request: NextRequest) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (token === "DEMO_TOKEN") return NextResponse.json(DEMO_USER);

  if (BACKEND) {
    try {
      const body = await request.json();
      const res = await fetch(`${BACKEND}/api/v1/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify(body),
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { /* fall through */ }
  }
  return NextResponse.json(DEMO_USER);
}
