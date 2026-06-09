"use client";
import * as Toast from "@radix-ui/react-toast";
import { useState, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: { type?: ToastType; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    ({ type = "info", title, description }: { type?: ToastType; title: string; description?: string }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const ICON = {
    success: <CheckCircle size={15} style={{ color: "#10B981", flexShrink: 0 }} />,
    error: <AlertTriangle size={15} style={{ color: "#EF4444", flexShrink: 0 }} />,
    info: <Info size={15} style={{ color: "#6366F1", flexShrink: 0 }} />,
  };

  const BORDER_COLOR = {
    success: "rgba(16,185,129,0.3)",
    error: "rgba(239,68,68,0.3)",
    info: "rgba(99,102,241,0.3)",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <Toast.Provider swipeDirection="right">
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open={true}
            onOpenChange={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            style={{
              background: "var(--bg-elevated)",
              border: `1px solid ${BORDER_COLOR[t.type]}`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              minWidth: 280,
              maxWidth: 380,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {ICON[t.type]}
            <div style={{ flex: 1 }}>
              <Toast.Title style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
                {t.title}
              </Toast.Title>
              {t.description && (
                <Toast.Description style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
              <X size={13} />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 9999,
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
