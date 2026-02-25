import type {
  NavSection,
  NavRole,
  SectionInput,
  ItemInput,
  ItemUpdateInput,
} from "./types";

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

/* ── Sections ── */
export function apiListSections() {
  return apiFetch<NavSection[]>(full("/api/navigation/sections"));
}

export function apiCreateSection(input: SectionInput) {
  return apiFetch<NavSection>(full("/api/navigation/sections"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiUpdateSection(id: string, input: Partial<SectionInput>) {
  return apiFetch<NavSection>(full(`/api/navigation/sections/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function apiDeleteSection(id: string) {
  return apiFetch<void>(full(`/api/navigation/sections/${id}`), {
    method: "DELETE",
  });
}

/* ── Items ── */
export function apiCreateItem(input: ItemInput) {
  return apiFetch<any>(full("/api/navigation/items"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function apiUpdateItem(id: string, input: ItemUpdateInput) {
  return apiFetch<any>(full(`/api/navigation/items/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function apiDeleteItem(id: string) {
  return apiFetch<void>(full(`/api/navigation/items/${id}`), {
    method: "DELETE",
  });
}

export function apiSetItemRoles(itemId: string, roleIds: string[]) {
  return apiFetch<any>(full(`/api/navigation/items/${itemId}/roles`), {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  });
}

/* ── Roles ── */
export function apiListRoles() {
  return apiFetch<NavRole[]>(full("/api/roles"));
}
