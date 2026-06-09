import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          localStorage.setItem("arthadrishti_token", data.access_token);
          set({ token: data.access_token });
          await get().fetchMe();
          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.detail || "Invalid email or password";
          set({ error: msg });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, fullName = "") => {
        set({ isLoading: true, error: null });
        try {
          const username = email.split("@")[0];
          await api.post("/auth/register", { email, username, password, full_name: fullName });
          return await get().login(email, password);
        } catch (err: any) {
          const msg = err?.response?.data?.detail || "Registration failed";
          set({ error: msg });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("arthadrishti_token");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: "arthadrishti-auth",
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// ── Watchlist Store ────────────────────────────────────────────────────────

interface WatchlistItem {
  id: string;
  symbol: string;
  company_name: string;
  last_risk_score: number;
  agent_active: boolean;
  last_checked_at: string | null;
}

interface AlertItem {
  id: string;
  symbol: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface WatchlistState {
  items: WatchlistItem[];
  alerts: AlertItem[];
  unreadCount: number;
  fetchWatchlist: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  addToWatchlist: (symbol: string) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  markAlertRead: (alertId: string) => Promise<void>;
  addAlert: (alert: AlertItem) => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  alerts: [],
  unreadCount: 0,

  fetchWatchlist: async () => {
    const { data } = await api.get("/watchlist");
    set({ items: data });
  },

  fetchAlerts: async () => {
    const { data } = await api.get("/watchlist/alerts?unread_only=false&limit=50");
    const unread = data.filter((a: AlertItem) => !a.is_read).length;
    set({ alerts: data, unreadCount: unread });
  },

  addToWatchlist: async (symbol) => {
    await api.post(`/watchlist/${symbol}`, {
      alert_on_new_filing: true,
      alert_on_risk_change: true,
      risk_threshold: 10,
    });
    await get().fetchWatchlist();
  },

  removeFromWatchlist: async (symbol) => {
    await api.delete(`/watchlist/${symbol}`);
    set((state) => ({ items: state.items.filter((i) => i.symbol !== symbol) }));
  },

  markAlertRead: async (alertId) => {
    await api.patch(`/watchlist/alerts/${alertId}/read`);
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
