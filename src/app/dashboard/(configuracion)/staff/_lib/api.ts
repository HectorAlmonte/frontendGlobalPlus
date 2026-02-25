import type { StaffRow, StaffCreateInput, StaffUpdateInput } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;

function full(path: string) {
  return API ? `${API}${path}` : path;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = "Error en la solicitud";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/* ── List ── */
export async function apiListStaff(params?: { q?: string }) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  const res = await apiFetch<{ ok: boolean; data: StaffRow[]; meta?: any }>(
    full(`/api/staff?${sp.toString()}`)
  );
  return Array.isArray(res?.data) ? res.data : [];
}

/* ── Get one ── */
export async function apiGetStaff(id: string) {
  const res = await apiFetch<{ ok: boolean; data: StaffRow }>(
    full(`/api/staff/${id}`)
  );
  return res.data;
}

/* ── Create ── */
export function apiCreateStaff(input: StaffCreateInput) {
  return apiFetch<{ ok: boolean; data: StaffRow; message?: string }>(
    full(`/api/staff`),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

/* ── Update ── */
export function apiUpdateStaff(id: string, input: StaffUpdateInput) {
  return apiFetch<{ ok: boolean; data: StaffRow; message?: string }>(
    full(`/api/staff/${id}`),
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

/* ── Delete (soft) ── */
export function apiDeleteStaff(id: string) {
  return apiFetch<{ ok: boolean; message: string }>(
    full(`/api/staff/${id}`),
    { method: "DELETE" }
  );
}

/* ── Deactivate ── */
export function apiDeactivateStaff(id: string) {
  return apiFetch<{ ok: boolean; message: string }>(
    full(`/api/staff/${id}/deactivate`),
    { method: "PATCH" }
  );
}

/* ── Reset password ── */
export function apiResetPassword(id: string) {
  return apiFetch<{
    ok: boolean;
    message: string;
    username: string;
    email: string;
    tempPassword?: string;
  }>(full(`/api/staff/${id}/reset-password`), { method: "POST" });
}

/* ── Roles for select ── */
export async function apiListRolesForSelect(): Promise<
  { value: string; label: string; key: string }[]
> {
  const data = await apiFetch<any>(full(`/api/roles?active=1`));
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return arr.map((r: any) => ({
    value: r.id,
    label: r.name,
    key: r.key,
  }));
}
