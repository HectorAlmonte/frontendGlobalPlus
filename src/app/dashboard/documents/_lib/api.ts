import type {
  DocumentRow,
  DocumentDetail,
  DocumentType,
  ModuleDocumentInfo,
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

async function apiFetchRaw(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = "Error en la solicitud";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res;
}

/* ── List documents ── */
export function apiListDocuments(params?: {
  q?: string;
  typeId?: string;
  expired?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.typeId) sp.set("typeId", params.typeId);
  if (params?.expired !== undefined)
    sp.set("expired", params.expired ? "1" : "0");

  return apiFetch<DocumentRow[]>(full(`/api/documents?${sp.toString()}`));
}

/* ── Get one ── */
export function apiGetDocument(id: string) {
  return apiFetch<DocumentDetail>(full(`/api/documents/${id}`));
}

/* ── Create (FormData) ── */
export async function apiCreateDocument(input: {
  name: string;
  documentTypeId: string;
  workAreaId: string;
  moduleKey?: string;
  notes?: string;
  file?: File | null;
  validFrom?: string;
  validUntil?: string;
  code?: string;
}) {
  const fd = new FormData();
  fd.append("name", input.name);
  fd.append("documentTypeId", input.documentTypeId);
  fd.append("workAreaId", input.workAreaId);
  if (input.moduleKey) fd.append("moduleKey", input.moduleKey);
  if (input.notes) fd.append("notes", input.notes);
  if (input.file) fd.append("file", input.file);
  if (input.validFrom) fd.append("validFrom", input.validFrom);
  if (input.validUntil) fd.append("validUntil", input.validUntil);
  if (input.code) fd.append("code", input.code);

  return apiFetchRaw(full("/api/documents"), {
    method: "POST",
    body: fd,
  });
}

/* ── Update metadata ── */
export function apiUpdateDocument(
  id: string,
  input: {
    name?: string;
    moduleKey?: string;
    code?: string;
    documentTypeId?: string;
    workAreaId?: string;
  }
) {
  return apiFetch<DocumentRow>(full(`/api/documents/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* ── Delete ── */
export function apiDeleteDocument(id: string) {
  return apiFetch<DocumentRow>(full(`/api/documents/${id}`), {
    method: "DELETE",
  });
}

/* ── New version (FormData) ── */
export async function apiCreateNewVersion(
  docId: string,
  file: File,
  notes?: string
) {
  const fd = new FormData();
  fd.append("file", file);
  if (notes) fd.append("notes", notes);

  return apiFetchRaw(full(`/api/documents/${docId}/new-version`), {
    method: "POST",
    body: fd,
  });
}

/* ── Get module document ── */
export function apiGetModuleDocument(moduleKey: string) {
  return apiFetch<ModuleDocumentInfo>(
    full(`/api/documents/by-module/${moduleKey}`)
  );
}

/* ── Download version ── */
export async function apiDownloadVersion(versionId: string) {
  const res = await fetch(
    full(`/api/documents/versions/${versionId}/download`),
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (res.status === 403) {
    throw new Error("El documento está expirado. No se puede descargar.");
  }

  if (!res.ok) {
    throw new Error("Error al descargar el archivo.");
  }

  return res.blob();
}

/* ── List document types ── */
export function apiListDocumentTypes() {
  return apiFetch<DocumentType[]>(full("/api/document-types"));
}

/* ── Search work areas ── */
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

/* ── Search work areas (con code para preview) ── */
export async function apiSearchWorkAreasRaw(
  q: string
): Promise<{ value: string; label: string; code: string }[]> {
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
    code: String(x.code ?? ""),
  }));
}
