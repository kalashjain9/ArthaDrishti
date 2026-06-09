/**
 * SSE streaming client for research queries.
 */
export interface ResearchChunk {
  type: "thinking" | "answer" | "citation" | "agent_start" | "agent_end" | "error";
  content: string;
  agent?: string;
  citations?: Citation[];
  metadata?: Record<string, unknown>;
}

export interface Citation {
  source_file: string;
  page_number: number;
  section: string;
  excerpt: string;
  relevance_score: number;
}

export interface AlertPayload {
  id: string;
  symbol: string;
  company_name: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  body: string;
  evidence: Record<string, unknown>;
  is_read: boolean;
  risk_delta: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("arthadrishti_token") || "";
  }
  return "";
}

/**
 * Stream research query responses via SSE (POST with EventSource polyfill).
 * Uses fetch + ReadableStream since EventSource doesn't support POST.
 */
export async function* streamResearch(
  query: string,
  symbol: string
): AsyncGenerator<ResearchChunk> {
  const token = getToken();
  const response = await fetch(`${API_URL}/research/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, symbol }),
  });

  if (!response.ok) {
    throw new Error(`Research query failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        if (data) {
          try {
            yield JSON.parse(data) as ResearchChunk;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  }
}

/**
 * Connect to alerts SSE stream.
 * Returns a cleanup function.
 */
export function connectAlertStream(
  onAlert: (alert: AlertPayload) => void,
  onPing?: () => void
): () => void {
  const token = getToken();
  // Use EventSource with auth header via URL param (SSE doesn't support headers)
  // Backend should accept token as query param for SSE endpoints
  const url = `${API_URL}/watchlist/alerts/stream?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    if (!e.data || e.data === "[DONE]") return;
    try {
      const payload = JSON.parse(e.data);
      if (payload.type === "ping") {
        onPing?.();
        return;
      }
      onAlert(payload as AlertPayload);
    } catch {
      // Skip
    }
  };

  eventSource.onerror = () => {
    // Auto-reconnect handled by browser
  };

  return () => eventSource.close();
}
