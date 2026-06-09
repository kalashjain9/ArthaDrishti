"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (form.password !== form.confirm) { setLocalError("Passwords do not match"); return; }
    if (form.password.length < 8) { setLocalError("Password must be at least 8 characters"); return; }
    const success = await register(form.email, form.password, form.full_name);
    if (success) router.push("/dashboard");
  };

  const displayError = localError || error;

  const inputStyle: React.CSSProperties = { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #FBBF24)", marginBottom: 14, boxShadow: "0 0 28px rgba(245,158,11,0.25)" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#000" }}>&#9673;</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", background: "linear-gradient(135deg, #F59E0B, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px", marginBottom: 4 }}>
          ArthaDrishti AI
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Join India&apos;s AI-powered equity intelligence platform</div>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, margin: "0 0 4px 0" }}>Create account</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>Start AI-powered equity monitoring in minutes</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Rahul Sharma" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required placeholder="Min 8 characters" style={{ ...inputStyle, paddingRight: 42 }} onFocus={onFocus} onBlur={onBlur} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} required placeholder="Re-enter password" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {displayError && <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, marginBottom: 16, color: "#EF4444", fontSize: 13 }}>&#9888; {displayError}</div>}

          <button type="submit" disabled={isLoading} style={{ width: "100%", background: isLoading ? "var(--border)" : "linear-gradient(135deg, #F59E0B, #D97706)", color: isLoading ? "var(--text-muted)" : "#000", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: isLoading ? "none" : "0 2px 16px rgba(245,158,11,0.3)" }}>
            {isLoading ? "Creating account..." : "Create Account ->"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Already have an account?{" "}</span>
          <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>Sign in -&gt;</Link>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, color: "var(--text-muted)", fontSize: 11, lineHeight: 1.5, opacity: 0.7 }}>Not SEBI-registered. For informational and research purposes only.</div>
    </div>
  );
}