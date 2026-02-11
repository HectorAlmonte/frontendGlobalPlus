// incidents/_lib/api.ts
import { CreateIncidentInput, IncidentDetail, IncidentListItem, IncidentPeriod, IncidentStats, IncidentStatus } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

type Option = { value: string; label: string };

/**
 * =========================
 * INCIDENCIAS
 * =========================
 */

export async function apiListIncidents(params?: {
  q?: string;
  status?: IncidentStatus;
  period?: IncidentPeriod;
  dateFrom?: string;
  dateTo?: string;
}): Promise<IncidentListItem[]> {
  const url = new URL(`${API_BASE}/api/incidents`);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.period && params.period !== "all") url.searchParams.set("period", params.period);
  if (params?.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params?.dateTo) url.searchParams.set("dateTo", params.dateTo);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error listando incidencias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function apiGetIncidentStats(period?: IncidentPeriod): Promise<IncidentStats> {
  const url = new URL(`${API_BASE}/api/incidents/stats`);
  if (period && period !== "all") url.searchParams.set("period", period);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error cargando estadísticas");
  return await res.json();
}

export async function apiGetIncidentDetail(id: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error cargando detalle");
  return await res.json();
}

export async function apiCreateIncident(input: CreateIncidentInput) {
  const causesArr =
    input.causes.trim().length > 0
      ? input.causes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const payload: any = {
    title: input.title.trim() ? input.title.trim() : null,
    type: input.type,
    detail: input.detail.trim(),
    locationLabel: input.locationLabel.trim()
      ? input.locationLabel.trim()
      : null,
    causes: causesArr,

    // área
    areaId: input.areaId.trim() ? input.areaId.trim() : null,

    observedKind: input.observedKind,
    observedUserId:
      input.observedKind === "USER" && input.observedUserId.trim()
        ? input.observedUserId.trim()
        : null,
    observedAreaId:
      input.observedKind === "AREA" && input.observedAreaId.trim()
        ? input.observedAreaId.trim()
        : null,
  };

  const res = await fetch(`${API_BASE}/api/incidents`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("No se pudo crear la incidencia");
  const created = await res.json();

  // subir archivos (si hay)
  if (input.files.length > 0) {
    const fd = new FormData();
    input.files.forEach((f) => fd.append("files", f));

    const up = await fetch(
      `${API_BASE}/api/incidents/${created.id}/files?stage=REPORT`,
      {
        method: "POST",
        credentials: "include",
        body: fd,
      }
    );

    if (!up.ok) {
      throw new Error("Incidencia creada, pero falló subida de evidencias");
    }
  }

  return created;
}

export async function apiCloseIncidentForm(
  incidentId: string,
  payload: { detail: string; files: File[] }
) {
  const fd = new FormData();
  fd.append("detail", payload.detail);

  for (const f of payload.files || []) {
    fd.append("files", f);
  }

  const res = await fetch(
    `${API_BASE}/api/incidents/${incidentId}/close`,
    {
      method: "POST",
      body: fd,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Error cerrando incidencia");
  }

  return res.json();
}

/**
 * =========================
 * SEARCH SELECTS (Observed)
 * =========================
 */

export async function apiSearchObservedUsers(q: string): Promise<Option[]> {
  const url = new URL(`${API_BASE}/api/staff/search`);
  const qTrim = q.trim();
  if (qTrim) url.searchParams.set("q", qTrim);

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error buscando trabajadores");

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.label),
  }));
}

/**
 * =========================
 * EDICIÓN / ELIMINACIÓN
 * =========================
 */

export async function apiPatchIncident(
  id: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Error al editar la incidencia";
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiPatchCorrective(
  incidentId: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/corrective`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Error al editar el correctivo";
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiPatchClosure(
  incidentId: string,
  body: { detail: string }
) {
  const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/closure`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Error al editar el cierre";
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDeleteIncident(id: string) {
  const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Error al eliminar la incidencia";
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDeleteIncidentFile(fileId: string) {
  const res = await fetch(`${API_BASE}/api/incidents/files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Error al eliminar el archivo";
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * =========================
 * SEARCH SELECTS (Observed)
 * =========================
 */

export async function apiSearchAreas(q: string): Promise<Option[]> {
  const url = new URL(`${API_BASE}/api/areas/search`);
  const qTrim = q.trim();
  if (qTrim) url.searchParams.set("q", qTrim);

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error buscando áreas");

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.label),
  }));
}
