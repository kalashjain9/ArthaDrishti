"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { riskColor, riskLabel, cn } from "@/lib/utils";

interface RiskScore {
  overall_score: number;
  financial?: { score: number };
  operational?: { score: number };
  geopolitical?: { score: number };
  legal?: { score: number };
  market?: { score: number };
  esg?: { score: number };
  fraud?: { score: number };
  macro?: { score: number };
}

interface RiskRadarProps {
  symbol: string;
  isActive?: boolean;
  size?: number;
}

const DIMENSIONS = [
  { key: "financial", label: "Financial" },
  { key: "operational", label: "Operational" },
  { key: "geopolitical", label: "Geopolitical" },
  { key: "legal", label: "Legal" },
  { key: "market", label: "Market" },
  { key: "esg", label: "ESG" },
  { key: "fraud", label: "Fraud" },
  { key: "macro", label: "Macro" },
];

export function RiskScoreBadge({
  score,
  isActive = false,
  size = "md",
}: {
  score: number;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const color = riskColor(score);
  const label = riskLabel(score);
  const fontSize = size === "sm" ? 11 : size === "lg" ? 18 : 14;
  const padding = size === "sm" ? "2px 8px" : size === "lg" ? "6px 16px" : "4px 10px";

  return (
    <span
      className={cn(isActive && "risk-pulse-active")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding,
        fontSize,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span
        className={isActive ? "agent-active-dot" : ""}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {score.toFixed(0)}/100
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: fontSize - 2 }}>
        {label}
      </span>
    </span>
  );
}

export function RiskRadarChart({ symbol, size = 280 }: RiskRadarProps) {
  const { data: riskData, isLoading } = useQuery({
    queryKey: ["risk", symbol],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${symbol}/risk`);
      return data.risk_index as RiskScore;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "var(--bg-elevated)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        Loading risk data...
      </div>
    );
  }

  if (!riskData) return null;

  // Convert to recharts data format
  const radarData = DIMENSIONS.map((d) => ({
    dimension: d.label,
    score: (riskData[d.key as keyof RiskScore] as { score: number } | undefined)?.score || 50,
    fullMark: 100,
  }));

  // Render using SVG polygon for the radar
  const center = size / 2;
  const radius = size * 0.35;
  const n = DIMENSIONS.length;
  const angleStep = (2 * Math.PI) / n;

  function getPoint(i: number, r: number) {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  // Background grid circles
  const gridLevels = [25, 50, 75, 100];
  const dataPoints = radarData.map((d, i) => getPoint(i, (d.score / 100) * radius));
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Overall score color
  const overallScore = riskData.overall_score || 50;
  const fillColor = riskColor(overallScore);

  return (
    <div style={{ position: "relative" }}>
      <svg width={size} height={size}>
        {/* Grid circles */}
        {gridLevels.map((level) => {
          const axisPoints = DIMENSIONS.map((_, i) =>
            getPoint(i, (level / 100) * radius)
          );
          return (
            <polygon
              key={level}
              points={axisPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.7}
            />
          );
        })}

        {/* Axis lines */}
        {DIMENSIONS.map((_, i) => {
          const outer = getPoint(i, radius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill={`${fillColor}25`}
          stroke={fillColor}
          strokeWidth={1.5}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => {
          const score = radarData[i].score;
          const pColor = riskColor(score);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={pColor} />;
        })}

        {/* Axis labels */}
        {DIMENSIONS.map((d, i) => {
          const labelRadius = radius + 22;
          const p = getPoint(i, labelRadius);
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9.5}
              fill="var(--text-secondary)"
              fontFamily="Inter, sans-serif"
            >
              {d.label}
            </text>
          );
        })}

        {/* Center score */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={20}
          fontWeight="700"
          fill={fillColor}
          fontFamily="'JetBrains Mono', monospace"
        >
          {overallScore.toFixed(0)}
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="var(--text-muted)"
          fontFamily="Inter, sans-serif"
        >
          RISK SCORE
        </text>
      </svg>
    </div>
  );
}
