import type { WorkAreaRow, WorkAreaCreateInput, WorkAreaUpdateInput } from "./types";

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
export function apiListWorkAreas(params?: { q?: string }) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  return apiFetch<WorkAreaRow[]>(full(`/api/work-areas?${sp.toString()}`));
}

/* ── Get one ── */
export function apiGetWorkArea(id: string) {
  return apiFetch<WorkAreaRow>(full(`/api/work-areas/${id}`));
}

/* ── Create ── */
export function apiCreateWorkArea(input: WorkAreaCreateInput) {
  return apiFetch<WorkAreaRow>(full(`/api/work-areas`), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ── Update ── */
export function apiUpdateWorkArea(id: string, input: WorkAreaUpdateInput) {
  return apiFetch<WorkAreaRow>(full(`/api/work-areas/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* ── Toggle active ── */
export function apiToggleWorkArea(id: string) {
  return apiFetch<WorkAreaRow>(full(`/api/work-areas/${id}/toggle`), {
    method: "PATCH",
  });
}

/* ── Delete ── */
export function apiDeleteWorkArea(id: string) {
  return apiFetch<WorkAreaRow>(full(`/api/work-areas/${id}`), {
    method: "DELETE",
  });
}

/* ── Search (for SearchSelect in documents) ── */
export async function apiSearchWorkAreas(
  q: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  const qTrim = q.trim();
  if (qTrim) sp.set("q", qTrim);

  const res = await fetch(full(`/api/work-areas/search?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error buscando áreas de trabajo");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id ?? x.value),
    label: String(x.label ?? x.name),
  }));
}
