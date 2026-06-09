"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { User, Bell, Shield, Key, Database, CheckCircle } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{ marginLeft: 20 }}>{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: enabled ? "var(--accent-primary)" : "var(--bg-elevated)",
        border: `1px solid ${enabled ? "var(--accent-primary)" : "var(--border)"}`,
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          top: 2,
          left: enabled ? 20 : 2,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();

  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [notifications, setNotifications] = useState({
    alert_on_risk: true,
    alert_on_news: true,
    alert_on_filing: true,
    email_digest: false,
  });
  const [riskThreshold, setRiskThreshold] = useState(10);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const showSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  };

  const saveProfile = async () => {
    setSaving("profile");
    try {
      await api.patch("/auth/me", { full_name: profile.full_name });
      showSaved("profile");
    } catch {
      alert("Failed to save profile.");
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      alert("New passwords do not match.");
      return;
    }
    if (passwords.next.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setSaving("password");
    try {
      await api.post("/auth/change-password", {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      showSaved("password");
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Password change failed.");
    } finally {
      setSaving(null);
    }
  };

  const inputStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    marginBottom: 10,
  };

  const SaveBtn = ({ id, onClick }: { id: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={saving === id}
      style={{
        background: "linear-gradient(135deg, #F59E0B, #D97706)",
        color: "#000",
        border: "none",
        borderRadius: 8,
        padding: "8px 18px",
        fontSize: 12,
        fontWeight: 700,
        cursor: saving === id ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: saving === id ? 0.7 : 1,
      }}
    >
      {saved === id ? <><CheckCircle size={13} /> Saved!</> : saving === id ? "Saving…" : "Save Changes"}
    </button>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Manage your profile, notifications, and platform preferences.
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 4 }}>Full Name</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 4 }}>Email</label>
            <input
              value={profile.email}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
            />
          </div>
        </div>
        <SaveBtn id="profile" onClick={saveProfile} />
      </Section>

      {/* Notifications */}
      <Section title="Alert Preferences">
        <Field label="Risk Score Change" description="Alert when a watchlisted company's risk score changes significantly">
          <Toggle enabled={notifications.alert_on_risk} onChange={(v) => setNotifications((n) => ({ ...n, alert_on_risk: v }))} />
        </Field>
        <Field label="New Filing Alert" description="Alert when a new regulatory filing is detected for watchlisted companies">
          <Toggle enabled={notifications.alert_on_filing} onChange={(v) => setNotifications((n) => ({ ...n, alert_on_filing: v }))} />
        </Field>
        <Field label="News Sentiment Shift" description="Alert when news sentiment changes more than 40% from baseline">
          <Toggle enabled={notifications.alert_on_news} onChange={(v) => setNotifications((n) => ({ ...n, alert_on_news: v }))} />
        </Field>
        <Field label="Weekly Email Digest" description="Receive a weekly summary of your portfolio and watchlist">
          <Toggle enabled={notifications.email_digest} onChange={(v) => setNotifications((n) => ({ ...n, email_digest: v }))} />
        </Field>

        <div style={{ marginTop: 8 }}>
          <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 8 }}>
            Risk Change Threshold — alert if delta &gt; {riskThreshold} points
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range"
              min={5}
              max={40}
              step={5}
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent-primary)" }}
            />
            <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", minWidth: 24 }}>
              {riskThreshold}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <SaveBtn id="notifications" onClick={() => showSaved("notifications")} />
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        <div style={{ marginBottom: 10 }}>
          <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 4 }}>Current Password</label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 4 }}>New Password</label>
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              placeholder="Min. 8 chars"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 4 }}>Confirm Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              style={inputStyle}
            />
          </div>
        </div>
        <SaveBtn id="password" onClick={changePassword} />
      </Section>

      {/* Platform Info */}
      <Section title="Platform Information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Platform", value: "ArthaDrishti AI v1.0" },
            { label: "LLM Engine", value: "GPT-4o / Groq llama-3.3-70b" },
            { label: "AI Agents", value: "9 Specialist Agents Active" },
            { label: "Risk Model", value: "RashtriyaRiskIndex™ v1.0" },
            { label: "Data Sources", value: "NSE, BSE, yFinance, GNews" },
            { label: "Compliance", value: "SEBI Circular Reference Only" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-elevated)",
                borderRadius: 8,
                padding: "10px 14px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
              <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "var(--text-muted)", fontSize: 11 }}>
        ArthaDrishti AI is not a SEBI-registered investment advisor. All content is for informational purposes only. Investment decisions should be made with due diligence and professional guidance.
      </div>
    </div>
  );
}
