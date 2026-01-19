// incidents/_lib/api.ts
import { CreateIncidentInput, IncidentDetail, IncidentListItem } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

type Option = { value: string; label: string };

/**
 * =========================
 * INCIDENCIAS
 * =========================
 */

export async function apiListIncidents(): Promise<IncidentListItem[]> {
  const url = new URL(`${API_BASE}/api/incidents`);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error listando incidencias");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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
    type: input.type.trim(),
    detail: input.detail.trim(),
    locationLabel: input.locationLabel.trim() ? input.locationLabel.trim() : null,
    causes: causesArr,

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

/**
 * =========================
 * SEARCH SELECTS (Observed)
 * =========================
 * Tu SearchSelect espera: { value, label }
 * Backend staff.search devuelve: [{ id, label, ... }]
 * Backend areas.search devuelve: [{ id, label }]
 */

export async function apiSearchObservedUsers(q: string): Promise<Option[]> {
  const url = new URL(`${API_BASE}/api/staff/search`);
  const qTrim = q.trim();
  if (qTrim) url.searchParams.set("q", qTrim);

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error buscando trabajadores");

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),   // ✅ aquí x.id = User.id por el fix del backend
    label: String(x.label),
  }));
}

export async function apiSearchAreas(q: string): Promise<Option[]> {
  const url = new URL(`${API_BASE}/api/areas/search`);
  const qTrim = q.trim();
  if (qTrim) url.searchParams.set("q", qTrim);

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error("Error buscando áreas");

  const data = await res.json(); // [{ id, label }]
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.label),
  }));
}
