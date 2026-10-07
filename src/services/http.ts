async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function uploadImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.set("file", file);
  return api("/api/uploads", { method: "POST", body });
}

export { api, uploadImage };
