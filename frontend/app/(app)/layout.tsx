"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { Sidebar } from "@/components/shared/Sidebar";
import { MarketOverview } from "@/components/shared/MarketOverview";

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = ["Connecting to NSE/BSE…", "Loading AI agents…", "Fetching market data…", "Initializing risk models…"];
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F8FAFC",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #4338CA, #6366F1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(67,56,202,0.3)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="12" width="4" height="7" rx="1" fill="white" opacity="0.5"/>
          <rect x="8" y="6" width="4" height="13" rx="1" fill="white" opacity="0.75"/>
          <rect x="15" y="1" width="4" height="18" rx="1" fill="white"/>
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 18, marginBottom: 2 }}>ArthaDrishti AI</div>
        <div style={{ color: "#94A3B8", fontSize: 12 }}>Financial Intelligence Platform</div>
      </div>

      <div
        style={{
          width: 200,
          height: 4,
          background: "#E2E8F0",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{ height: "100%", background: "linear-gradient(90deg, #4338CA, #6366F1)", borderRadius: 4 }}
          animate={{ width: ["0%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div style={{ color: "#94A3B8", fontSize: 12 }}>{steps[step]}</div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, fetchMe, user } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("arthadrishti_token");
    if (!stored && !token) { router.replace("/login"); return; }
    if (!user && (stored || token)) {
      fetchMe().then(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked) return <LoadingScreen />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <MarketOverview />
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
