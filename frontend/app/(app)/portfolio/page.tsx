"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { CompanyAvatar } from "@/components/shared/MarketOverview";
import { COMPANIES, PORTFOLIO_STATS } from "@/lib/market-data";
import { riskColor, riskLabel } from "@/lib/utils";
import { TrendingUp, TrendingDown, Briefcase, Shield, BarChart3, DollarSign } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = ["#4338CA","#059669","#D97706","#DC2626","#0284C7","#7C3AED","#DB2777","#0891B2"];

export default function PortfolioPage() {
  const { data: holdings } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data } = await api.get("/portfolio");
      return data;
    },
  });

  const rows = holdings || [];

  const totalInvested = rows.reduce((s: number, h: any) => s + h.avg_buy_price * h.quantity, 0);
  const totalCurrent  = rows.reduce((s: number, h: any) => s + h.current_price * h.quantity, 0);
  const totalPnl = totalCurrent - totalInvested;
  const pnlPct   = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const pieData = rows.map((h: any, i: number) => ({
    name: h.symbol,
    value: Math.round(h.current_price * h.quantity),
    fill: COLORS[i % COLORS.length],
  }));

  const sectorMap: Record<string, number> = {};
  rows.forEach((h: any) => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.current_price * h.quantity;
  });
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  const isUp = totalPnl >= 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Portfolio</h1>
        <p className="page-subtitle">AI-powered risk analysis across {rows.length} holdings</p>
      </div>

      {/* KPI row */}
      <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Portfolio Value", value: `₹${(totalCurrent || PORTFOLIO_STATS.totalValue).toLocaleString("en-IN")}`, sub: "Current market value", icon: Briefcase, cls: "kpi-indigo" },
          { label: "Total Invested", value: `₹${(totalInvested || PORTFOLIO_STATS.invested).toLocaleString("en-IN")}`, sub: "Cost basis", icon: DollarSign, cls: "kpi-sky" },
          { label: "Total P&L", value: `${isUp ? "+" : ""}₹${Math.abs(totalPnl || PORTFOLIO_STATS.totalPL).toLocaleString("en-IN")}`, sub: `${(pnlPct || PORTFOLIO_STATS.totalPct).toFixed(2)}% overall return`, icon: isUp ? TrendingUp : TrendingDown, cls: isUp ? "kpi-emerald" : "kpi-rose" },
          { label: "Holdings", value: String(rows.length || PORTFOLIO_STATS.holdings), sub: "Companies tracked", icon: BarChart3, cls: "kpi-amber" },
        ].map(({ label, value, sub, icon: Icon, cls }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`card ${cls}`}>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Icon size={15} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
              <div style={{ fontSize: 11, marginTop: 3, opacity: 0.7 }}>{sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Pie */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header"><BarChart3 size={14} style={{ color: "var(--primary)" }} /><span className="section-title">Allocation by Stock</span></div>
          <div style={{ marginTop: 12, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector bar */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header"><Shield size={14} style={{ color: "var(--primary)" }} /><span className="section-title">Sector Allocation</span></div>
          <div style={{ marginTop: 12, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Bar dataKey="value" fill="#4338CA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="section-header"><Briefcase size={14} style={{ color: "var(--primary)" }} /><span className="section-title">Holdings Detail</span></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                {["Company", "Qty", "Avg Buy", "Current", "Invested", "Current Value", "P&L", "P&L %", "Risk"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((h: any) => {
                const invested = h.avg_buy_price * h.quantity;
                const current  = h.current_price * h.quantity;
                const pnl      = current - invested;
                const pct      = (pnl / invested) * 100;
                const up       = pnl >= 0;
                const cd       = COMPANIES[h.symbol];
                return (
                  <tr key={h.id} style={{ borderBottom: "1px solid #F8FAFC" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CompanyAvatar symbol={h.symbol} size={32} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{h.symbol}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>{h.company_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#374151" }}>{h.quantity}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#374151" }}>₹{h.avg_buy_price.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#0F172A", fontWeight: 600 }}>₹{(h.current_price || cd?.price || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#64748B" }}>₹{invested.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#64748B" }}>₹{current.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: up ? "#059669" : "#DC2626", fontWeight: 600 }}>
                        {up ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: up ? "#ECFDF5" : "#FFF1F2", color: up ? "#059669" : "#DC2626" }}>
                        {up ? "+" : ""}{pct.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {cd && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: `${riskColor(cd.riskScore)}18`, color: riskColor(cd.riskScore), border: `1px solid ${riskColor(cd.riskScore)}35` }}>
                        {riskLabel(cd.riskScore)}
                      </span>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "#94A3B8" }}>Loading portfolio data…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
