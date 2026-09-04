const API_URL = process.env.NEXT_PUBLIC_API_URL;
export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  const check = await res.json()
  console.log(check)
  if (!res.ok) {
    console.log(check.error, res.status)
    throw new Error(`API error: ${check.error} `);
  }
  return check;
}
export async function getSession() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
    credentials: "include",
  });
  if (!res.ok) return null; 

  const data = await res.json().catch(() => null); 

  if (!data || typeof data !== "object") return null;

  return Object.keys(data).length > 0 ? data : null;
}