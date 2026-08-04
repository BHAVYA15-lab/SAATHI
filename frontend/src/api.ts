const RAW_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
const API_BASE = RAW_BASE.replace(/\/$/, "");

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

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
