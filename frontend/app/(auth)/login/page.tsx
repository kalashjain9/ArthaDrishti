"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Shield, Zap, TrendingUp, BarChart3, CheckCircle } from "lucide-react";

const FEATURES = [
  { icon: BarChart3,  text: "Real-time NSE & BSE data with live risk scoring" },
  { icon: Shield,     text: "8-dimension RashtriyaRiskIndex across all filings" },
  { icon: TrendingUp, text: "Macro impact simulation on your portfolio" },
  { icon: Zap,        text: "Instant AI alerts for risk spikes & fraud signals" },
];

export default function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("demo@arthadrishti.ai");
  const [password, setPassword] = useState("Demo@2024#");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) router.push("/dashboard");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>

      {/* ── Left: Hero ── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 52px",
        }}
      >
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000&q=75&fit=crop"
          alt="Stock market"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.88) 100%)", zIndex: 1 }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #4338CA, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(67,56,202,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="12" width="4" height="7" rx="1" fill="white" opacity="0.5"/>
              <rect x="8" y="6" width="4" height="13" rx="1" fill="white" opacity="0.75"/>
              <rect x="15" y="1" width="4" height="18" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 15, lineHeight: 1.2, letterSpacing: "-0.01em" }}>ArthaDrishti</div>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>AI FINANCIAL PLATFORM</div>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <h2 style={{ color: "#F1F5F9", fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Smarter investing<br />through AI intelligence
          </h2>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 380 }}>
            India's first autonomous AI platform monitoring NSE/BSE equities in real-time — powered by 9 specialist AI agents.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <Icon size={14} style={{ color: "#818CF8" }} />
                </div>
                <span style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block", boxShadow: "0 0 8px #34D399" }} />
            <span style={{ color: "#334155", fontSize: 11 }}>
              Built for <strong style={{ color: "#64748B" }}>Capgemini Exceller AgentifAI Buildathon 2026</strong> — Team Five Stars
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Right: Form ── */}
      <div
        style={{
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 52px",
          borderLeft: "1px solid #E2E8F0",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          style={{ width: "100%", maxWidth: 380 }}
        >
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ color: "#0F172A", fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.02em" }}>
              Sign in to your account
            </h1>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Welcome back. Your dashboard is ready.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#374151", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ color: "#374151", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="input-field"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4, display: "flex" }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "#FFF1F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 16, color: "#DC2626", fontSize: 13 }}>
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                background: isLoading ? "#E2E8F0" : "linear-gradient(135deg, #4338CA, #6366F1)",
                color: isLoading ? "#94A3B8" : "#fff",
                border: "none",
                borderRadius: 10,
                padding: "13px",
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: isLoading ? "none" : "0 4px 16px rgba(67,56,202,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
                transition: "all 0.18s",
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.15)", borderTop: "2px solid #4338CA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>

          {/* Demo box */}
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
              <CheckCircle size={13} style={{ color: "#4338CA" }} />
              <span style={{ color: "#3730A3", fontWeight: 700, fontSize: 12 }}>Demo account pre-filled</span>
            </div>
            <div style={{ color: "#4338CA", fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.9 }}>
              demo@arthadrishti.ai<br />Demo@2024#
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
            <span style={{ color: "#94A3B8" }}>New user? </span>
            <Link href="/register" style={{ color: "#4338CA", fontWeight: 600, textDecoration: "none" }}>
              Create account
            </Link>
          </div>

          <div style={{ marginTop: 24, color: "#CBD5E1", fontSize: 10.5, textAlign: "center", lineHeight: 1.6 }}>
            Not SEBI-registered. For research and informational purposes only.<br />
            Investment decisions should be made with professional guidance.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
