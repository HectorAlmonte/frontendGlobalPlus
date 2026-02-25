import type { AreaRow, AreaCreateInput, AreaUpdateInput } from "./types";

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
export function apiListAreas(params?: {
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

  return apiFetch<AreaRow[]>(full(`/api/areas?${sp.toString()}`));
}

/* ── Get one ── */
export function apiGetArea(id: string) {
  return apiFetch<AreaRow>(full(`/api/areas/${id}`));
}

/* ── Search (for SearchSelect) ── */
export async function apiSearchAreas(
  q: string,
  parentId?: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  const qTrim = q.trim();
  if (qTrim) sp.set("q", qTrim);
  if (parentId) sp.set("parentId", parentId);

  const res = await fetch(full(`/api/areas/search?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error buscando áreas");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.label ?? x.name),
  }));
}

/* ── Create ── */
export function apiCreateArea(input: AreaCreateInput) {
  return apiFetch<AreaRow>(full(`/api/areas`), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ── Update ── */
export function apiUpdateArea(id: string, input: AreaUpdateInput) {
  return apiFetch<AreaRow>(full(`/api/areas/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* ── Soft delete ── */
export function apiSoftDeleteArea(id: string) {
  return apiFetch<AreaRow>(full(`/api/areas/${id}`), { method: "DELETE" });
}

/* ── Restore ── */
export function apiRestoreArea(id: string) {
  return apiFetch<AreaRow>(full(`/api/areas/${id}/restore`), {
    method: "PATCH",
  });
}

/* ── Toggle active ── */
export function apiToggleArea(id: string) {
  return apiFetch<AreaRow>(full(`/api/areas/${id}/toggle`), {
    method: "PATCH",
  });
}
