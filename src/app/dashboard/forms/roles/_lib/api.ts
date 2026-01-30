import type { RoleRow, RoleCreateInput, RoleUpdateInput } from "./types";

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

export function apiListRoles(params?: {
  q?: string;
  includeDeleted?: boolean;
  active?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.includeDeleted !== undefined)
    sp.set("includeDeleted", params.includeDeleted ? "1" : "0");
  if (params?.active !== undefined)
    sp.set("active", params.active ? "1" : "0");

  return apiFetch<RoleRow[]>(full(`/api/roles?${sp.toString()}`));
}

export function apiCreateRole(input: RoleCreateInput) {
  return apiFetch<RoleRow>(full(`/api/roles`), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiUpdateRole(id: string, input: RoleUpdateInput) {
  return apiFetch<RoleRow>(full(`/api/roles/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function apiToggleRole(id: string, isActive: boolean) {
  return apiFetch<RoleRow>(full(`/api/roles/${id}/toggle`), {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function apiDeleteRole(id: string) {
  return apiFetch<RoleRow>(full(`/api/roles/${id}`), { method: "DELETE" });
}
