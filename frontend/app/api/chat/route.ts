import { NextRequest, NextResponse } from "next/server";

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are ArthaDrishti AI, an expert financial analyst specializing in Indian equity markets (NSE/BSE). You help investors understand:
- Company fundamentals, risk scores, and financial filings
- NSE/BSE market trends, sector rotation, and macro factors
- RashtriyaRiskIndex™ — an 8-dimension proprietary risk scoring model
- Portfolio analysis, diversification, and risk management
- SEBI regulatory compliance and corporate governance

Current market snapshot (as of today):
- NIFTY 50: 24,738.25 (+1.17%)
- SENSEX: 81,246.50 (+1.11%)
- BANK NIFTY: 53,214.90 (+1.19%)
- India VIX: 14.23 (calm, range-bound)
- INR/USD: 83.42 (stable)

Key companies in our coverage:
- RELIANCE: ₹2,847.50 (+1.23%), Risk Score 32/100 (Low) — Energy/Retail/Telecom conglomerate
- TCS: ₹3,562.15 (-0.34%), Risk Score 21/100 (Low) — IT Services leader
- HDFCBANK: ₹1,678.90 (+2.15%), Risk Score 38/100 (Medium) — Private banking
- TATAMOTORS: ₹987.45 (+3.42%), Risk Score 62/100 (High) — Auto + JLR EV
- BAJFINANCE: ₹7,234.50 (+0.88%), Risk Score 45/100 (Medium) — NBFC lending
- ICICIBANK: ₹1,134.20 (+1.67%), Risk Score 35/100 (Low) — Private banking
- INFY: ₹1,580.00 (-0.89%), Risk Score 25/100 (Low) — IT Services
- SBIN: ₹812.30 (+1.45%), Risk Score 42/100 (Medium) — Public sector banking

Always add this disclaimer at the end: "⚠️ Not SEBI-registered. For research purposes only."

Be concise, data-driven, and professional. Use Indian number formatting (₹, Cr, L) where appropriate.`;

export async function POST(request: NextRequest) {
  if (!GROQ_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured. Add it to Vercel environment variables." },
      { status: 503 }
    );
  }

  let body: { messages: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...body.messages.slice(-12), // keep last 12 messages for context
  ];

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return NextResponse.json({ error: `Groq API error: ${err}` }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    return NextResponse.json({ reply, model: data.model, tokens: data.usage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to call Groq" }, { status: 500 });
  }
}
