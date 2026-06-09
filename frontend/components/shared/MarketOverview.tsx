"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { INDICES } from "@/lib/market-data";
import { ArrowUpRight, ArrowDownRight, Wifi } from "lucide-react";
import Link from "next/link";
import { riskColor, riskLabel } from "@/lib/utils";
import { COMPANIES } from "@/lib/market-data";

function TickerItem({ label, value, changePct }: {
  label: string; value: number; changePct: number;
}) {
  const isUp = changePct >= 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 18px",
        borderRight: "1px solid #E2E8F0",
        flexShrink: 0,
        height: "100%",
      }}
    >
      <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
        {value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
      <span
        style={{
          color: isUp ? "#059669" : "#DC2626",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: isUp ? "#ECFDF5" : "#FFF1F2",
          padding: "1px 5px",
          borderRadius: 4,
        }}
      >
        {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {isUp ? "+" : ""}{changePct.toFixed(2)}%
      </span>
    </div>
  );
}

export function MarketOverview() {
  const [time, setTime] = useState("");
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata",
      }) + " IST");
      setTick((t) => !t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const { data: macroData } = useQuery({
    queryKey: ["market-overview"],
    queryFn: async () => {
      const { data } = await api.get("/market/overview");
      return data;
    },
    refetchInterval: 60_000,
  });

  const liveIndices = macroData?.indices || {};
  const items = INDICES.map((item) => {
    const live = liveIndices[item.key];
    return live ? { ...item, value: live.value, changePct: live.change_pct } : item;
  });

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        height: 44,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}
    >
      {/* Live pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 16px",
          borderRight: "1px solid #E2E8F0",
          flexShrink: 0,
          height: "100%",
        }}
      >
        <span
          className="pulse-dot"
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }}
        />
        <span style={{ color: "#059669", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
        <Wifi size={10} style={{ color: "#059669" }} />
      </div>

      {/* Ticker */}
      <div style={{ flex: 1, overflow: "hidden", height: "100%", display: "flex", alignItems: "center" }}>
        <div className="ticker-track" style={{ height: "100%", display: "flex", alignItems: "center" }}>
          {[...items, ...items].map((item, i) => (
            <TickerItem key={`${item.key}-${i}`} label={item.label} value={item.value} changePct={item.changePct} />
          ))}
        </div>
      </div>

      {/* Clock */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderLeft: "1px solid #E2E8F0",
          flexShrink: 0,
          height: "100%",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: tick ? "#4338CA" : "#E2E8F0",
            transition: "background 0.3s",
          }}
        />
        <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          {time}
        </span>
      </div>
    </div>
  );
}

/* ── Company letter avatar ── */
const BRAND: Record<string, string> = {
  RELIANCE: "#E31837", TCS: "#3355A0", HDFCBANK: "#004A7C",
  INFY: "#007CC3", TATAMOTORS: "#003D7A", BAJFINANCE: "#003D7A",
  ICICIBANK: "#F76F20", WIPRO: "#341C61", SBIN: "#22377B", MARUTI: "#003399",
};
export function CompanyAvatar({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const bg = BRAND[symbol] || "#4338CA";
  return (
    <div
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.28),
        background: bg, display: "flex", alignItems: "center",
        justifyContent: "center", color: "#fff",
        fontWeight: 800, fontSize: Math.round(size * 0.42),
        fontFamily: "'Inter', sans-serif", flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      {symbol[0]}
    </div>
  );
}

export function WatchlistRiskCards() {
  const { data: watchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const { data } = await api.get("/watchlist");
      return data;
    },
  });

  const displayList = watchlist?.length
    ? watchlist
    : Object.entries(COMPANIES).slice(0, 5).map(([symbol, d]) => ({
        id: symbol, symbol, company_name: d.name,
        last_risk_score: d.riskScore, agent_active: true, last_checked_at: null,
      }));

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-header">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="#4338CA" opacity=".3"/><path d="M10 6v4l3 3" stroke="#4338CA" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <span className="section-title">Watchlist Risk</span>
      </div>
      {displayList.map((item: any) => {
        const score = item.last_risk_score || 0;
        const color = riskColor(score);
        const cd = COMPANIES[item.symbol] || {};
        return (
          <Link key={item.id} href={`/company/${item.symbol}`} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <CompanyAvatar symbol={item.symbol} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 13 }}>{item.symbol}</div>
                {cd.price && (
                  <div style={{ display: "flex", gap: 5, marginTop: 1 }}>
                    <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{cd.price.toLocaleString("en-IN")}
                    </span>
                    <span style={{ color: (cd.changePct || 0) >= 0 ? "#059669" : "#DC2626", fontSize: 10, fontWeight: 600 }}>
                      {(cd.changePct || 0) >= 0 ? "+" : ""}{cd.changePct?.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  background: `${color}18`,
                  color,
                  border: `1px solid ${color}35`,
                  borderRadius: 16,
                  padding: "2px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}
              >
                {score.toFixed(0)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
