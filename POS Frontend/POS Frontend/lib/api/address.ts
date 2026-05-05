const BASE_URL = "http://127.0.0.1:8000/api/addresses";

export async function getMyAddresses(token: string) {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch addresses");
  }

  return res.json();
}

export async function addAddress(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to add address");
  }

  return res.json();
}

export async function deleteAddress(token: string, id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to delete address");
  }

  return res.json();
}
