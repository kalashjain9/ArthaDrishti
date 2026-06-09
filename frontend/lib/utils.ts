import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "₹"): string {
  if (value >= 1e12) return `${currency}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${currency}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `${currency}${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${currency}${(value / 1e5).toFixed(2)}L`;
  return `${currency}${value.toLocaleString("en-IN")}`;
}

export function formatNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  return value.toLocaleString("en-IN");
}

export function riskColor(score: number): string {
  if (score <= 30) return "#10B981";
  if (score <= 60) return "#F59E0B";
  if (score <= 80) return "#EF4444";
  return "#DC2626";
}

export function riskLabel(score: number): string {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
}

export function riskBadgeClass(score: number): string {
  if (score <= 30) return "risk-badge-low";
  if (score <= 60) return "risk-badge-medium";
  if (score <= 80) return "risk-badge-high";
  return "risk-badge-critical";
}

export function sentimentColor(score: number): string {
  if (score > 0.3) return "#10B981";
  if (score < -0.3) return "#EF4444";
  return "#94A3B8";
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
    critical: "#DC2626",
  };
  return map[severity] || "#94A3B8";
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
