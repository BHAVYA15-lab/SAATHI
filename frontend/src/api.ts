const RAW_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
const API_BASE = RAW_BASE.replace(/\/$/, "");

// Render free tier cold-starts take up to 60s. 90s timeout gives a full cold-start window.
const FETCH_TIMEOUT_MS = 90_000;

interface RequestOptions extends RequestInit {
  json?: any;
  form?: Record<string, string>;
}

export async function request(endpoint: string, options: RequestOptions = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const headers = new Headers(options.headers || {});
  
  // Set Authorization Header
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.json) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  } else if (options.form) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.form)) {
      searchParams.append(key, value);
    }
    options.body = searchParams.toString();
  }

  // Abort controller for timeout — covers Render free-tier cold-starts on mobile
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      throw new Error(
        "Server is waking up — this can take up to 60 seconds on a cold start. Please wait a moment and try again."
      );
    }
    throw new Error("Network error: unable to reach the server. Check your internet connection and try again.");
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    let detail = "An error occurred";
    try {
      const parsed = JSON.parse(errText);
      detail = parsed.detail || detail;
    } catch {
      detail = errText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),
  post: (endpoint: string, body?: any) => request(endpoint, { method: "POST", json: body }),
  postForm: (endpoint: string, form: Record<string, string>) => request(endpoint, { method: "POST", form }),
  postEmpty: (endpoint: string) => request(endpoint, { method: "POST" }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
  put: (endpoint: string, body?: any) => request(endpoint, { method: "PUT", json: body }),
};
