// lib/api/admin.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function parseError(res: Response) {
  const body = await res.json().catch(() => null);
  return body?.detail || body?.message || JSON.stringify(body) || res.statusText;
}

export async function adminCreateUser(
  token: string,
  payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "customer" | "employee" | "admin";
  }
) {
  const res = await fetch(`${API_URL}/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
