// lib/api/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = `${API_URL}/auth`;

async function parseError(res: Response) {
  const body = await res.json().catch(() => null);
  return body?.detail || body?.message || JSON.stringify(body) || res.statusText;
}

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json(); // { access_token, token_type, user }
}

export async function me(token: string) {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateMe(
  token: string,
  data: { name?: string; email?: string; phone?: string }
) {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
