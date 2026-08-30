const API_URL = process.env.NEXT_PUBLIC_API_URL;
export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const check = await res.json()
  console.log(check)
  if (!res.ok) {
    console.error(check.error, res.status)
  }

  return check;
}