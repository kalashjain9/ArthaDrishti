"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWatchlistStore } from "@/lib/store";
import { CompanyAvatar } from "@/components/shared/MarketOverview";
import { COMPANIES } from "@/lib/market-data";
import { riskColor, riskLabel, timeAgo } from "@/lib/utils";
import { Plus, Trash2, Bell, Search, TrendingUp, TrendingDown, Shield, X } from "lucide-react";
import Link from "next/link";

const NSE = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","SBIN","BAJFINANCE",
  "BHARTIARTL","ASIANPAINT","KOTAKBANK","AXISBANK","LT","DMART","SUNPHARMA",
  "TATAMOTORS","WIPRO","ULTRACEMCO","HCLTECH","TITAN","MARUTI","NTPC","POWERGRID",
  "ITC","ONGC","ADANIPORTS","BAJAJFINSV","INDUSINDBK","TECHM",
];

export default function WatchlistPage() {
  const { items, fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchAlerts } = useWatchlistStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => { fetchWatchlist(); fetchAlerts(); }, [fetchWatchlist, fetchAlerts]);

  const filtered = NSE.filter((s) => s.includes(q.toUpperCase().trim()));

  const handleAdd = async (symbol: string) => {
    setAdding(symbol);
    try { await addToWatchlist(symbol); }
    catch { alert(`${symbol} may already be in your watchlist.`); }
    finally { setAdding(null); }
  };

  const handleRemove = async (symbol: string) => {
    setRemoving(symbol);
    try { await removeFromWatchlist(symbol); }
    finally { setRemoving(null); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">AI Watchlist</h1>
          <p className="page-subtitle">
            {items.length} {items.length === 1 ? "company" : "companies"} under continuous AI surveillance
          </p>
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="btn btn-primary"
          style={{ flexShrink: 0, gap: 7 }}
        >
          <Plus size={15} /> Add Company
        </button>
      </div>

      {/* Search panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 20 }}
          >
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search NSE symbol (e.g. RELIANCE, TCS)…"
                    className="input-field"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <button className="btn btn-ghost" onClick={() => { setSearchOpen(false); setQ(""); }}>
                  <X size={15} />
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filtered.slice(0, 24).map((s) => {
                  const already = items.some((w) => w.symbol === s);
                  const cd = COMPANIES[s];
                  return (
                    <button
                      key={s}
                      onClick={() => !already && handleAdd(s)}
                      disabled={already || adding === s}
                      className="btn btn-sm"
                      style={{
                        background: already ? "#ECFDF5" : "#F8FAFC",
                        color: already ? "#059669" : "#374151",
                        border: `1px solid ${already ? "#A7F3D0" : "#E2E8F0"}`,
                        gap: 6,
                        cursor: already ? "default" : "pointer",
                      }}
                    >
                      <CompanyAvatar symbol={s} size={18} />
                      {s}
                      {cd && (
                        <span style={{ color: (cd.changePct || 0) >= 0 ? "#059669" : "#DC2626", fontSize: 10 }}>
                          {(cd.changePct || 0) >= 0 ? "+" : ""}{cd.changePct?.toFixed(1)}%
                        </span>
                      )}
                      <span style={{ color: "#94A3B8", fontSize: 11 }}>
                        {already ? "✓" : adding === s ? "…" : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {items.length === 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px dashed #E2E8F0",
            borderRadius: 16,
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=60&fit=crop"
            alt=""
            style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 12, marginBottom: 20, opacity: 0.5 }}
          />
          <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            No companies under watch
          </div>
          <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 24 }}>
            Add NSE/BSE companies to activate 24/7 AI monitoring with risk alerts
          </div>
          <button className="btn btn-primary" onClick={() => setSearchOpen(true)}>
            <Plus size={15} /> Add first company
          </button>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <WatchlistCard item={item} removing={removing === item.symbol} onRemove={() => handleRemove(item.symbol)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WatchlistCard({ item, onRemove, removing }: { item: any; onRemove: () => void; removing: boolean }) {
  const score = item.last_risk_score || 0;
  const color = riskColor(score);
  const label = riskLabel(score);
  const cd = COMPANIES[item.symbol];
  const isUp = cd ? cd.changePct >= 0 : true;

  return (
    <div
      className="card card-hover"
      style={{ overflow: "hidden", transition: "all 0.2s" }}
    >
      {/* Risk color top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <CompanyAvatar symbol={item.symbol} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Link href={`/company/${item.symbol}`} style={{ textDecoration: "none" }}>
              <span style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>{item.symbol}</span>
            </Link>
            {item.agent_active && (
              <span className="badge badge-emerald" style={{ fontSize: 9 }}>
                <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                LIVE
              </span>
            )}
          </div>
          <div style={{ color: "#94A3B8", fontSize: 11 }}>{item.company_name}</div>
          {cd && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{cd.price.toLocaleString("en-IN")}
              </span>
              <span style={{ color: isUp ? "#059669" : "#DC2626", fontSize: 11, fontWeight: 600, background: isUp ? "#ECFDF5" : "#FFF1F2", padding: "1px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isUp ? "+" : ""}{cd.changePct.toFixed(2)}%
              </span>
              <span style={{ color: "#94A3B8", fontSize: 10.5, marginLeft: "auto" }}>{cd.mktCap}</span>
            </div>
          )}
        </div>

        {/* Risk circle */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `conic-gradient(${color} ${score * 3.6}deg, #F1F5F9 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ color, fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{score.toFixed(0)}</div>
              <div style={{ color: "#94A3B8", fontSize: 8, lineHeight: 1 }}>RISK</div>
            </div>
          </div>
          <div style={{ color, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>{label}</div>
        </div>
      </div>

      {/* Alert config */}
      <div style={{ padding: "10px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {item.alert_on_new_filing && <span className="badge badge-indigo" style={{ fontSize: 10 }}><Bell size={9} /> Filing alerts</span>}
        {item.alert_on_risk_change && <span className="badge badge-emerald" style={{ fontSize: 10 }}><Shield size={9} /> Risk alerts</span>}
        {item.last_checked_at && (
          <span style={{ color: "#94A3B8", fontSize: 10, marginLeft: "auto" }}>
            Checked {timeAgo(item.last_checked_at)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 18px", display: "flex", gap: 8 }}>
        <Link href={`/company/${item.symbol}`} style={{ textDecoration: "none", flex: 1 }}>
          <button className="btn btn-secondary" style={{ width: "100%", fontSize: 12, padding: "7px 0" }}>
            View Analysis
          </button>
        </Link>
        <button
          onClick={onRemove}
          disabled={removing}
          className="btn"
          style={{ background: "#FFF1F2", color: "#DC2626", border: "1px solid #FECACA", padding: "7px 12px", opacity: removing ? 0.5 : 1 }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
