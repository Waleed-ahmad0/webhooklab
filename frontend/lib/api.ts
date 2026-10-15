export async function apiFetch(path: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(path, {
    credentials: "include",
    ...options,
    headers,
  });
  const check = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof check?.error === "string" ? check.error : check?.message;
    throw new Error(typeof message === "string" ? message : `Request failed (${res.status}). Please try again.`);
  }
  return check;
}
export async function getSession() {
  const res = await fetch(`/auth/session`, {
    credentials: "include",
  });
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);

  if (!data || typeof data !== "object") return null;

  return Object.keys(data).length > 0 ? data : null;
}
