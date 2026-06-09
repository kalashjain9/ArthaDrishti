"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, Eye, Search, TrendingUp, Briefcase,
  FileText, Settings, LogOut, Zap, Bell, ChevronRight, Menu, X,
} from "lucide-react";
import { useWatchlistStore, useAuthStore } from "@/lib/store";

const NAV = [
  { label: "Dashboard",    href: "/dashboard",  icon: LayoutDashboard },
  { label: "Watchlist",    href: "/watchlist",  icon: Eye,        badge: true },
  { label: "Research",     href: "/research",   icon: Search },
  { label: "Macro Events", href: "/macro",       icon: TrendingUp },
  { label: "Portfolio",    href: "/portfolio",   icon: Briefcase },
  { label: "Reports",      href: "/reports",     icon: FileText },
  { label: "Settings",     href: "/settings",    icon: Settings },
];

/* Bar-chart SVG logo — clearly financial, no AI symbols */
function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1"  y="12" width="4" height="7" rx="1" fill="white" opacity="0.4"/>
      <rect x="8"  y="6"  width="4" height="13" rx="1" fill="white" opacity="0.7"/>
      <rect x="15" y="1"  width="4" height="18" rx="1" fill="white"/>
    </svg>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { unreadCount } = useWatchlistStore();
  const { user, logout } = useAuthStore();
  const initials = (user?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "#0F172A",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none" }} onClick={onClose}>
        <div style={{ padding: "20px 16px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4338CA, #6366F1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                flexShrink: 0,
              }}
            >
              <LogoIcon />
            </div>
            <div>
              <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                ArthaDrishti
              </div>
              <div style={{ color: "#475569", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                AI · NSE / BSE
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 6 }}>
              <X size={16} />
            </button>
          )}
        </div>
      </Link>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 14px 8px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {NAV.map((item, i) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              style={{ marginBottom: 2 }}
            >
              <Link href={item.href} style={{ textDecoration: "none", display: "block" }} onClick={onClose}>
                <div className={`sidebar-item${active ? " active" : ""}`}>
                  <Icon size={16} className="sidebar-icon" strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span
                      style={{
                        background: "#EF4444",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: "1px 7px",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                  {active && <ChevronRight size={13} style={{ color: "#818CF8" }} />}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Agent status */}
      <div
        style={{
          margin: "0 10px 10px",
          padding: "12px 14px",
          background: "rgba(52,211,153,0.07)",
          border: "1px solid rgba(52,211,153,0.15)",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span
            className="pulse-dot"
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block" }}
          />
          <span style={{ color: "#34D399", fontSize: 12, fontWeight: 700 }}>9 Agents Active</span>
          <Zap size={11} style={{ color: "#34D399", marginLeft: "auto" }} />
        </div>
        <div style={{ color: "#475569", fontSize: 10.5 }}>Monitoring NSE/BSE markets 24/7</div>
      </div>

      {/* User footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4338CA, #6366F1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name || user?.username || "User"}
            </div>
            <div style={{ color: "#475569", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email || ""}
            </div>
          </div>
          <button
            onClick={logout}
            style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", borderRadius: 6, transition: "color 0.15s" }}
            title="Sign out"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-mobile-hidden">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          position: "fixed", top: 12, left: 12, zIndex: 300,
          width: 40, height: 40, borderRadius: 10,
          background: "#0F172A", border: "none", cursor: "pointer",
          display: "none", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
        aria-label="Open menu"
      >
        <Menu size={18} color="#F1F5F9" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 }}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "tween", duration: 0.22 }}
              style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 200 }}
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
