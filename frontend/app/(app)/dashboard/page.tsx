"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMotionValue, useSpring } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useWatchlistStore, useAuthStore } from "@/lib/store";
import { AlertFeed } from "@/components/agents/AlertFeed";
import { WatchlistRiskCards, CompanyAvatar } from "@/components/shared/MarketOverview";
import { COMPANIES, SECTORS, PORTFOLIO_STATS, AGENT_ACTIVITY } from "@/lib/market-data";
import { riskColor, riskLabel } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Shield, Zap, Eye, Bell,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, Globe, Cpu,
  BookOpen, Search,
} from "lucide-react";
import Link from "next/link";

/* ── Animated counter ─────────────────────────────────── */
function AnimCounter({ to, prefix = "", decimals = 0 }: { to: number; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 28, stiffness: 70 });
  const [display, setDisplay] = useState("0");
  const seen = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen.current) { seen.current = true; mv.set(to); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, mv]);

  useEffect(() => {
    return spring.on("change", (v) =>
      setDisplay(v.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }))
    );
  }, [spring, decimals]);

  return <span ref={ref}>{prefix}{display}</span>;
}

/* ── Sparkline ─────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const id = `sp${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <ResponsiveContainer width={72} height={32}>
      <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} fill={`url(#${id})`} dot={false} animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* stagger */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

/* ── Severity config ──────────────────────────────────── */
const SEV: Record<string, { bg: string; color: string; badge: string }> = {
  high:   { bg: "#FFF1F2", color: "#DC2626", badge: "badge-red" },
  medium: { bg: "#FFFBEB", color: "#D97706", badge: "badge-amber" },
  low:    { bg: "#ECFDF5", color: "#059669", badge: "badge-emerald" },
  info:   { bg: "#F0F9FF", color: "#0284C7", badge: "badge-sky" },
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { items: watchlist, alerts, fetchWatchlist, fetchAlerts } = useWatchlistStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchWatchlist(); fetchAlerts(); }, [fetchWatchlist, fetchAlerts]);

  const unread = alerts.filter((a) => !a.is_read).length;
  const avgRisk = watchlist.length
    ? Math.round(watchlist.reduce((s, i) => s + (i.last_risk_score || 0), 0) / watchlist.length)
    : 47;
  const firstName = user?.full_name?.split(" ")[0] || "Analyst";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Hero banner ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 0,
          minHeight: 180,
          background: "#0F172A",
          boxShadow: "0 4px 20px rgba(15,23,42,0.15)",
        }}
      >
        {/* Left content */}
        <div style={{ padding: "28px 32px", position: "relative", zIndex: 2 }}>
          <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>
            {greeting}, <span style={{ color: "#A5B4FC", fontWeight: 600 }}>{firstName}</span>
          </div>
          <h1 style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2 }}>
            Intelligence Dashboard
          </h1>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20, maxWidth: 380 }}>
            9 AI agents monitoring 50+ NSE/BSE companies in real-time. Risk-rated, fraud-screened, sentiment-analyzed.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/research" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary btn-sm" style={{ fontSize: 13, padding: "8px 18px" }}>
                <Search size={13} /> Run Research
              </button>
            </Link>
            <Link href="/watchlist" style={{ textDecoration: "none" }}>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: 13, padding: "8px 16px", background: "rgba(255,255,255,0.08)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Eye size={13} /> View Watchlist
              </button>
            </Link>
          </div>
        </div>

        {/* Right — portfolio card */}
        <div
          style={{
            padding: "28px 32px",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 230,
            background: "rgba(255,255,255,0.03)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Portfolio Value
          </div>
          <div style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1, marginBottom: 6 }}>
            ₹<AnimCounter to={PORTFOLIO_STATS.totalValue} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ background: "#ECFDF5", color: "#059669", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
              <ArrowUpRight size={11} /> +₹{PORTFOLIO_STATS.todayPL.toLocaleString("en-IN")} today
            </span>
          </div>
          <div style={{ color: "#475569", fontSize: 11 }}>
            +{PORTFOLIO_STATS.totalPct}% all-time · {PORTFOLIO_STATS.holdings} holdings
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748B", fontSize: 11 }}>Invested</span>
              <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{PORTFOLIO_STATS.invested.toLocaleString("en-IN")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B", fontSize: 11 }}>Total P&L</span>
              <span style={{ color: "#059669", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                +₹{PORTFOLIO_STATS.totalPL.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative stock image overlay */}
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=60&fit=crop"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.07,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* ── KPI cards ───────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
      >
        {[
          {
            icon: Eye,    label: "Companies Watched", value: String(watchlist.length || 5),
            sub: "Under AI surveillance", cls: "kpi-indigo", iconColor: "#4338CA",
          },
          {
            icon: Bell,   label: "Live Alerts", value: String(unread || 2),
            sub: "Unread risk signals", cls: unread > 0 ? "kpi-rose" : "kpi-emerald", iconColor: unread > 0 ? "#DC2626" : "#059669",
          },
          {
            icon: Shield, label: "Avg Portfolio Risk", value: String(avgRisk),
            sub: "RashtriyaRiskIndex score", cls: "kpi-amber", iconColor: "#D97706",
          },
          {
            icon: Zap,    label: "AI Agents Online", value: "9",
            sub: "Running continuously", cls: "kpi-indigo", iconColor: "#4338CA",
          },
        ].map(({ icon: Icon, label, value, sub, cls, iconColor }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            className={`${cls} card-hover`}
            style={{ borderRadius: 12, padding: "18px 20px", cursor: "default", border: "1px solid transparent" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color: iconColor }} />
              </div>
              <span style={{ color: "#475569", fontSize: 12, fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: iconColor, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{value}</div>
            <div style={{ color: "#94A3B8", fontSize: 11 }}>{sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 3-col layout ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px 264px", gap: 20, alignItems: "start" }}>

        {/* Col 1: table + heatmap + agents */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <HoldingsTable />
          <SectorHeatmap />
          <AgentLog />
        </div>

        {/* Col 2: Alert feed */}
        <AlertFeed />

        {/* Col 3: Watchlist */}
        <WatchlistRiskCards />
      </div>
    </div>
  );
}

/* ── Holdings table ─────────────────────────────────── */
function HoldingsTable() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-header">
        <BarChart3 size={14} style={{ color: "#4338CA" }} />
        <span className="section-title">Top Holdings — Live Prices</span>
        <span className="badge badge-indigo">NSE</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Price</th>
              <th>Change</th>
              <th style={{ textAlign: "center" }}>7-Day</th>
              <th style={{ textAlign: "center" }}>Risk</th>
              <th style={{ textAlign: "right" }}>Mkt Cap</th>
              <th style={{ textAlign: "right" }}>P/E</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(COMPANIES).slice(0, 9).map(([sym, d], i) => {
              const isUp = d.changePct >= 0;
              const upColor = "#059669";
              const dnColor = "#DC2626";
              const clr = isUp ? upColor : dnColor;
              const rc = riskColor(d.riskScore);
              return (
                <tr key={sym} onClick={() => window.location.href = `/company/${sym}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CompanyAvatar symbol={sym} size={30} />
                      <div>
                        <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 13 }}>{sym}</div>
                        <div style={{ color: "#94A3B8", fontSize: 11 }}>{d.name.slice(0, 22)}{d.name.length > 22 ? "…" : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{d.price.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: clr, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 3, background: isUp ? "#ECFDF5" : "#FFF1F2", padding: "2px 7px", borderRadius: 6, width: "fit-content" }}>
                      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {isUp ? "+" : ""}{d.changePct.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Sparkline data={d.sparkline} color={clr} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`risk-badge risk-badge-${riskLabel(d.riskScore).toLowerCase()}`}>
                      {d.riskScore}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{d.mktCap}</td>
                  <td style={{ textAlign: "right", color: "#94A3B8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{d.pe}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Sector Heatmap ─────────────────────────────────── */
function SectorHeatmap() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-header">
        <Globe size={14} style={{ color: "#4338CA" }} />
        <span className="section-title">Sector Performance — 9 Jun 2026</span>
      </div>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {SECTORS.map((s) => {
          const isUp = s.ret >= 0;
          const bg = isUp ? "#ECFDF5" : "#FFF1F2";
          const border = isUp ? "#A7F3D0" : "#FECACA";
          const color = isUp ? "#059669" : "#DC2626";
          const intensity = Math.min(Math.abs(s.ret) / 4, 1);
          const bgIntense = isUp
            ? `rgba(5,150,105,${0.06 + intensity * 0.14})`
            : `rgba(220,38,38,${0.06 + intensity * 0.14})`;
          return (
            <motion.div
              key={s.name}
              whileHover={{ scale: 1.04, y: -2 }}
              style={{
                background: bgIntense,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "10px 8px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ color: "#374151", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>
                {s.name.length > 9 ? s.name.slice(0, 9) + "…" : s.name}
              </div>
              <div style={{ color, fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                {isUp ? "+" : ""}{s.ret.toFixed(2)}%
              </div>
              <div style={{ color: "#94A3B8", fontSize: 9.5, marginTop: 3 }}>{s.volume}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Agent Activity Log ─────────────────────────────── */
const AGENT_ICONS: Record<string, React.ElementType> = {
  FilingAgent: BookOpen,
  RiskAgent: Shield,
  NewsAgent: Globe,
  SentimentAgent: Activity,
  MacroAgent: TrendingUp,
  FraudAgent: Zap,
};

function AgentLog() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-header">
        <Cpu size={14} style={{ color: "#4338CA" }} />
        <span className="section-title">AI Agent Activity</span>
        <span className="badge badge-emerald">
          <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
          Live
        </span>
      </div>
      {AGENT_ACTIVITY.map((a, i) => {
        const cfg = SEV[a.severity] || SEV.info;
        const Icon = AGENT_ICONS[a.agent] || Activity;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: cfg.bg,
                border: `1px solid ${cfg.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={15} style={{ color: cfg.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                <span className="badge badge-indigo" style={{ fontSize: 10 }}>{a.agent}</span>
                {a.symbol !== "SYSTEM" && a.symbol !== "MACRO" && (
                  <span className="badge badge-gray" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{a.symbol}</span>
                )}
                <span className={`badge ${cfg.badge}`} style={{ fontSize: 9, textTransform: "uppercase" }}>{a.severity}</span>
              </div>
              <div style={{ color: "#374151", fontSize: 12, lineHeight: 1.55 }}>{a.text}</div>
              <div style={{ color: "#94A3B8", fontSize: 10.5, marginTop: 3 }}>{a.time}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
