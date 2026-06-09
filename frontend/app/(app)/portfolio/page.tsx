"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { formatCurrency, riskColor, timeAgo } from "@/lib/utils";
import { Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PORTFOLIO_COLORS = ["#F59E0B", "#6366F1", "#10B981", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6", "#F97316"];

export default function PortfolioPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", quantity: "", avg_buy_price: "" });
  const qc = useQueryClient();

  const { data: holdings } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data } = await api.get("/portfolio/holdings");
      return data;
    },
    refetchInterval: 60 * 1000,
  });

  const { data: riskOverview } = useQuery({
    queryKey: ["portfolio-risk"],
    queryFn: async () => {
      const { data } = await api.get("/portfolio/risk-overview");
      return data;
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      await api.post("/portfolio/holdings", {
        symbol: form.symbol.toUpperCase(),
        quantity: parseFloat(form.quantity),
        avg_buy_price: parseFloat(form.avg_buy_price),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["portfolio-risk"] });
      setAddOpen(false);
      setForm({ symbol: "", quantity: "", avg_buy_price: "" });
    },
  });

  const removeMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/portfolio/holdings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["portfolio-risk"] });
    },
  });

  const totalValue = holdings?.reduce((s: number, h: any) => s + (h.current_value || 0), 0) || 0;
  const totalPnl = holdings?.reduce((s: number, h: any) => s + ((h.current_value || 0) - (h.buy_value || 0)), 0) || 0;
  const pnlPct = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const pieData = holdings?.map((h: any, i: number) => ({
    name: h.symbol,
    value: h.current_value || 0,
    fill: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
  })) || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: 0 }}>Portfolio</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            AI-powered risk analysis for your holdings
          </p>
        </div>
        <button
          onClick={() => setAddOpen(!addOpen)}
          style={{
            marginLeft: "auto",
            background: "var(--accent-primary)",
            color: "#000",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Plus size={15} /> Add Holding
        </button>
      </div>

      {/* Add Holding Form */}
      {addOpen && (
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}>
          {[
            { key: "symbol", label: "NSE Symbol", placeholder: "RELIANCE" },
            { key: "quantity", label: "Quantity", placeholder: "100", type: "number" },
            { key: "avg_buy_price", label: "Avg Buy Price (₹)", placeholder: "2450", type: "number" },
          ].map((field) => (
            <div key={field.key} style={{ flex: 1 }}>
              <label style={{ color: "var(--text-secondary)", fontSize: 12, display: "block", marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                value={(form as any)[field.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <button
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !form.symbol || !form.quantity || !form.avg_buy_price}
            style={{
              background: "var(--accent-primary)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <SummaryCard label="Portfolio Value" value={formatCurrency(totalValue)} icon="💼" />
        <SummaryCard
          label="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(totalPnl))} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`}
          icon={totalPnl >= 0 ? "📈" : "📉"}
          valueColor={totalPnl >= 0 ? "var(--accent-safe)" : "var(--accent-hot)"}
        />
        <SummaryCard
          label="Weighted Risk"
          value={`${(riskOverview?.weighted_risk_score || 0).toFixed(0)}/100`}
          icon="⚠️"
          valueColor={riskColor(riskOverview?.weighted_risk_score || 0)}
        />
        <SummaryCard label="Holdings" value={`${holdings?.length || 0} stocks`} icon="📊" />
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* Holdings Table */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>Holdings</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  {["Symbol", "Qty", "Avg Price", "Current", "P&L", "Risk Score", ""].map(h => (
                    <th key={h} style={{ padding: "9px 16px", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textAlign: h === "Symbol" ? "left" : "right" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!holdings || holdings.length === 0) ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      No holdings yet. Add your first stock.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h: any) => {
                    const pnl = (h.current_value || 0) - (h.buy_value || 0);
                    const pnlP = h.buy_value > 0 ? (pnl / h.buy_value) * 100 : 0;
                    const riskScore = h.risk_score || 0;
                    return (
                      <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                            {h.symbol}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{h.company_name?.substring(0, 20)}</div>
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right", color: "var(--text-secondary)", fontSize: 13 }}>{h.quantity}</td>
                        <td style={{ padding: "11px 16px", textAlign: "right", color: "var(--text-secondary)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                          ₹{h.avg_buy_price?.toFixed(2)}
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right", color: "var(--text-primary)", fontWeight: 600, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                          ₹{h.current_price?.toFixed(2) || "—"}
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right" }}>
                          <div style={{ color: pnl >= 0 ? "var(--accent-safe)" : "var(--accent-hot)", fontWeight: 600, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                            {pnl >= 0 ? "+" : ""}{formatCurrency(Math.abs(pnl))}
                          </div>
                          <div style={{ color: pnlP >= 0 ? "var(--accent-safe)" : "var(--accent-hot)", fontSize: 11 }}>
                            {pnlP >= 0 ? "+" : ""}{pnlP.toFixed(1)}%
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right" }}>
                          <span style={{
                            background: `${riskColor(riskScore)}20`,
                            color: riskColor(riskScore),
                            border: `1px solid ${riskColor(riskScore)}30`,
                            borderRadius: 12,
                            padding: "2px 9px",
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {riskScore.toFixed(0)}/100
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => removeMut.mutate(h.id)}
                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Allocation Pie + Concentration Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Allocation Chart */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Allocation</div>
            {pieData.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {pieData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}
                        formatter={(v: any) => [formatCurrency(v), "Value"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pieData.map((d: any) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: 12 }}>{d.name}</span>
                      <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>
                        {totalValue > 0 ? `${((d.value / totalValue) * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                No holdings to display
              </div>
            )}
          </div>

          {/* Concentration Alerts */}
          {riskOverview?.concentration_alerts?.length > 0 && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
                AI Risk Alerts
              </div>
              {riskOverview.concentration_alerts.map((alert: string, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                    padding: "8px 10px",
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 6,
                  }}
                >
                  <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "var(--text-muted)", fontSize: 11, lineHeight: 1.5 }}>
        <AlertTriangle size={11} style={{ display: "inline", marginRight: 6, color: "#F59E0B" }} />
        Portfolio values and risk scores are calculated using publicly available market data. This is not investment advice. ArthaDrishti AI is not a SEBI-registered investment advisor.
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, valueColor }: { label: string; value: string; icon: string; valueColor?: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: valueColor || "var(--text-primary)", fontWeight: 700, fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}
