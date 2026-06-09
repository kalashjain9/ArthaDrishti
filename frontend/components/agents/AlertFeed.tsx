"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { timeAgo, severityColor } from "@/lib/utils";
import { Bell, ChevronRight, AlertTriangle, TrendingDown, FileWarning, Activity } from "lucide-react";
import { useWatchlistStore } from "@/lib/store";
import Link from "next/link";

const ALERT_ICONS: Record<string, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
  risk_spike: TrendingDown,
  sentiment_shift: Activity,
  filing_detected: FileWarning,
  default: AlertTriangle,
};

export function AlertFeed() {
  const { alerts, fetchAlerts, unreadCount, markAlertRead } = useWatchlistStore();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Bell size={15} style={{ color: "var(--accent-primary)" }} />
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, flex: 1 }}>
          AI Alert Feed
        </span>
        {unreadCount > 0 && (
          <span
            style={{
              background: "var(--accent-hot)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 10,
              padding: "1px 7px",
            }}
          >
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Alert List */}
      <div style={{ maxHeight: 480, overflowY: "auto" }}>
        {alerts.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No alerts yet. Add companies to watchlist to start monitoring.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.alert_type] || ALERT_ICONS.default;
            const color = severityColor(alert.severity);
            return (
              <div
                key={alert.id}
                onClick={() => !alert.is_read && markAlertRead(alert.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  background: alert.is_read ? "transparent" : "rgba(245,158,11,0.03)",
                  transition: "background 0.15s",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--accent-primary)",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {alert.symbol}
                    </span>
                    <span
                      style={{
                        background: `${color}18`,
                        color,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      {alert.severity}
                    </span>
                    {!alert.is_read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--accent-primary)",
                          display: "inline-block",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: 1.4,
                      marginBottom: 4,
                    }}
                  >
                    {alert.title}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {timeAgo(alert.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
