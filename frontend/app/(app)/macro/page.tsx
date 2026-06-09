"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";

const MACRO_EVENTS = [
  "RBI rate hike by 25 bps",
  "RBI rate cut by 25 bps",
  "Rupee depreciates 5% vs USD",
  "Crude oil prices surge 20%",
  "US Federal Reserve rate hike",
  "India GDP growth slows to 5%",
  "GST reform — new rate structure",
  "China economic slowdown impact",
  "India-US trade tensions",
  "Monsoon deficit 20%",
];

const SECTOR_LABELS = ["Banking", "IT", "Energy", "Automobiles", "FMCG", "Pharma", "Infrastructure", "Real Estate", "Metals", "NBFC"];

const DISCLAIMER = "This macro analysis is illustrative and based on publicly available economic indicators. It is not investment advice. ArthaDrishti AI is not a SEBI-registered advisor.";

export default function MacroPage() {
  const [selectedEvent, setSelectedEvent] = useState(MACRO_EVENTS[0]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const { data: macroData } = useQuery({
    queryKey: ["macro"],
    queryFn: async () => {
      const { data } = await api.get("/market/macro");
      return data;
    },
  });

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const { data } = await api.post("/market/simulate", {
        event: selectedEvent,
        affected_sectors: SECTOR_LABELS,
      });
      setSimulationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const indicators = macroData?.indicators || {};
  const macroItems = [
    { label: "Repo Rate", key: "repo_rate", suffix: "%", icon: "🏦" },
    { label: "CPI Inflation", key: "cpi_inflation", suffix: "%", icon: "📈" },
    { label: "GDP Growth", key: "gdp_growth", suffix: "%", icon: "📊" },
    { label: "INR/USD", key: "inr_usd", prefix: "₹", icon: "💱" },
    { label: "Crude Oil", key: "crude_oil", prefix: "$", suffix: "/bbl", icon: "🛢️" },
    { label: "10Y G-Sec Yield", key: "gsec_10y", suffix: "%", icon: "📑" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Macro Intelligence
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          Indian macroeconomic snapshot + AI event impact simulator
        </p>
      </div>

      {/* Macro Snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {macroItems.map((item) => {
          const val = indicators[item.key];
          return (
            <div
              key={item.key}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {item.prefix || ""}{val?.toFixed(2) || "—"}{item.suffix || ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Simulator */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Zap size={16} style={{ color: "var(--accent-primary)" }} />
          <h2 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, margin: 0 }}>
            AI Event Impact Simulator
          </h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
          Select a macroeconomic event and let AI simulate sector impact across the Indian market
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {MACRO_EVENTS.map((event) => (
            <button
              key={event}
              onClick={() => setSelectedEvent(event)}
              style={{
                background: selectedEvent === event ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: selectedEvent === event ? "#000" : "var(--text-secondary)",
                border: `1px solid ${selectedEvent === event ? "var(--accent-primary)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: selectedEvent === event ? 600 : 400,
              }}
            >
              {event}
            </button>
          ))}
        </div>

        <button
          onClick={handleSimulate}
          disabled={simLoading}
          style={{
            background: simLoading ? "var(--border)" : "var(--accent-primary)",
            color: simLoading ? "var(--text-muted)" : "#000",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: simLoading ? "not-allowed" : "pointer",
          }}
        >
          {simLoading ? "Simulating..." : "Run AI Simulation"}
        </button>

        {simulationResult && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
              {simulationResult.analysis}
            </div>
            {simulationResult.sector_impacts && (
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                  Sector Impact Matrix
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={simulationResult.sector_impacts} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} width={100} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}
                        formatter={(value: any) => [`${value} (impact score)`, "Impact"]}
                      />
                      <Bar dataKey="impact_score" radius={4}>
                        {(simulationResult.sector_impacts || []).map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.impact_score > 0 ? "#10B981" : "#EF4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sector Sensitivity Matrix */}
      <SectorSensitivityMatrix />

      {/* Disclaimer */}
      <div style={{
        marginTop: 16,
        padding: "12px 16px",
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.15)",
        borderRadius: 8,
        color: "var(--text-muted)",
        fontSize: 11,
        lineHeight: 1.5,
      }}>
        <AlertTriangle size={11} style={{ display: "inline", marginRight: 6, color: "#F59E0B" }} />
        {DISCLAIMER}
      </div>
    </div>
  );
}

function SectorSensitivityMatrix() {
  // Hardcoded sector sensitivity for Indian market (mirrors backend SECTOR_SENSITIVITY)
  const factors = ["RBI Rate", "Crude Oil", "INR/USD", "FII Flow", "GDP Growth", "Inflation"];
  const sectorData = [
    { sector: "Banking", weights: [80, 20, 40, 60, 70, 50] },
    { sector: "IT", weights: [30, 10, 90, 70, 50, 20] },
    { sector: "Energy", weights: [40, 90, 60, 50, 40, 30] },
    { sector: "Autos", weights: [70, 60, 50, 40, 80, 60] },
    { sector: "FMCG", weights: [40, 30, 50, 30, 60, 80] },
    { sector: "Pharma", weights: [30, 20, 70, 40, 40, 30] },
  ];

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15 }}>
          Sector Sensitivity Matrix
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)" }}>
              <th style={{ padding: "10px 20px", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textAlign: "left" }}>Sector</th>
              {factors.map(f => (
                <th key={f} style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textAlign: "center" }}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectorData.map((row) => (
              <tr key={row.sector} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 20px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.sector}</td>
                {row.weights.map((w, i) => {
                  const bg = w > 70 ? "rgba(239,68,68,0.15)" : w > 40 ? "rgba(245,158,11,0.10)" : "rgba(16,185,129,0.08)";
                  const color = w > 70 ? "#EF4444" : w > 40 ? "#F59E0B" : "#10B981";
                  return (
                    <td key={i} style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: bg, color, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                        {w}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
