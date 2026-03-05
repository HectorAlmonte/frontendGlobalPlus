import type {
  ChecklistTemplate,
  ChecklistRecord,
  ChecklistStats,
  PaginatedRecords,
  PendingReport,
  RecordFilters,
  TemplateFilters,
  TemplateCreateInput,
  TemplateItemInput,
  RecordCreateInput,
  FillRecordInput,
  UnitOption,
  StaffOption,
  AreaOption,
  ProductOption,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const full = (path: string) => `${BASE}${path}`;

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Convierte un objeto de filtros a query string, omitiendo vacíos y nullish */
function buildQs(params?: Record<string, string | number | undefined> | null): string {
  if (!params) return "";
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== "" && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return qs ? `?${qs}` : "";
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const apiListTemplates = (filters?: TemplateFilters) =>
  apiFetch<ChecklistTemplate[]>(
    full(`/api/checklist-templates${buildQs(filters as Record<string, string>)}`)
  );

export const apiGetTemplatesByProduct = (productId: string) =>
  apiFetch<ChecklistTemplate[]>(
    full(`/api/checklist-templates/by-product/${productId}`)
  );

export const apiGetTemplate = (id: string) =>
  apiFetch<ChecklistTemplate>(full(`/api/checklist-templates/${id}`));

export const apiCreateTemplate = (body: TemplateCreateInput) =>
  apiFetch<ChecklistTemplate>(full("/api/checklist-templates"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiUpdateTemplate = (
  id: string,
  body: Partial<{ name: string; description: string; isActive: boolean }>
) =>
  apiFetch<ChecklistTemplate>(full(`/api/checklist-templates/${id}`), {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const apiUpdateTemplateItems = (
  id: string,
  items: TemplateItemInput[]
) =>
  apiFetch<ChecklistTemplate>(full(`/api/checklist-templates/${id}/items`), {
    method: "PUT",
    body: JSON.stringify({ items }),
  });

export const apiDeleteTemplate = (id: string) =>
  apiFetch<void>(full(`/api/checklist-templates/${id}`), {
    method: "DELETE",
  });

// ─── Records ─────────────────────────────────────────────────────────────────

export const apiListRecords = (filters?: RecordFilters) =>
  apiFetch<PaginatedRecords>(
    full(
      `/api/checklist-records${buildQs(
        filters as unknown as Record<string, string | number>
      )}`
    )
  );

export const apiGetPendingRecords = () =>
  apiFetch<ChecklistRecord[]>(full("/api/checklist-records/pending"));

export const apiGetChecklistStats = (
  filters?: Pick<RecordFilters, "dateFrom" | "dateTo" | "productId">
) =>
  apiFetch<ChecklistStats>(
    full(
      `/api/checklist-records/stats${buildQs(
        filters as Record<string, string>
      )}`
    )
  );

export const apiGetRecord = (id: string) =>
  apiFetch<ChecklistRecord>(full(`/api/checklist-records/${id}`));

export const apiCreateRecord = (body: RecordCreateInput) =>
  apiFetch<ChecklistRecord>(full("/api/checklist-records"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiFillRecord = (id: string, body: FillRecordInput) =>
  apiFetch<ChecklistRecord>(full(`/api/checklist-records/${id}/fill`), {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── Firmas ───────────────────────────────────────────────────────────────────

export const apiSignWorker = (id: string, signature: string) =>
  apiFetch<ChecklistRecord>(full(`/api/checklist-records/${id}/sign/worker`), {
    method: "POST",
    body: JSON.stringify({ signature }),
  });

export const apiSignSecurity = (id: string, signature: string) =>
  apiFetch<ChecklistRecord>(
    full(`/api/checklist-records/${id}/sign/security`),
    {
      method: "POST",
      body: JSON.stringify({ signature }),
    }
  );

export const apiSignSupervisor = (id: string, signature: string) =>
  apiFetch<ChecklistRecord>(
    full(`/api/checklist-records/${id}/sign/supervisor`),
    {
      method: "POST",
      body: JSON.stringify({ signature }),
    }
  );

// ─── Fotos por ítem ───────────────────────────────────────────────────────────

/** Sube (o reemplaza) la foto de un ítem. Usar fetch directo — NO Content-Type */
export async function apiUploadItemPhoto(
  recordId: string,
  itemId: string,
  file: File
): Promise<ChecklistRecord> {
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(
    full(`/api/checklist-records/${recordId}/items/${itemId}/photo`),
    {
      method: "POST",
      credentials: "include",
      body: formData,
      // Sin Content-Type — el browser lo añade con boundary
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const apiDeleteItemPhoto = (recordId: string, itemId: string) =>
  apiFetch<void>(
    full(`/api/checklist-records/${recordId}/items/${itemId}/photo`),
    { method: "DELETE" }
  );

// ─── Reportes ────────────────────────────────────────────────────────────────

export const apiGetPendingReport = (productId?: string) =>
  apiFetch<PendingReport>(
    full(`/api/reportes/checklists/pendientes${buildQs({ productId })}`)
  );

// ─── Lookups (unidades, staff, áreas, productos) ──────────────────────────────

export const apiSearchEquipmentUnits = (q?: string) =>
  apiFetch<unknown>(
    full(`/api/storage/units${buildQs(q ? { q } : {})}`)
  ).then((r) => {
    let list: UnitOption[] = [];
    if (Array.isArray(r)) {
      list = r as UnitOption[];
    } else if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>;
      const inner = obj.data;
      if (Array.isArray(inner)) {
        list = inner as UnitOption[];
      } else if (inner && typeof inner === "object" && Array.isArray((inner as any).data)) {
        list = (inner as any).data as UnitOption[];
      }
    }
    return list;
  });

export const apiSearchWorkers = (q?: string) =>
  apiFetch<StaffOption[]>(
    full(`/api/staff/search${buildQs({ role: "TRABAJADOR", ...(q ? { q } : {}) })}`)
  );

export const apiSearchAreas = () =>
  apiFetch<AreaOption[]>(full("/api/areas?active=1"))
    .then((r) => (Array.isArray(r) ? r : []))
    .catch(() => [] as AreaOption[]);

export const apiSearchEquipmentProducts = (q?: string) =>
  apiFetch<unknown>(
    full(
      `/api/storage/products${buildQs({
        type: "EQUIPMENT",
        ...(q ? { q } : {}),
      })}`
    )
  ).then((r) => {
    let list: ProductOption[] = [];
    if (Array.isArray(r)) {
      list = r as ProductOption[];
    } else if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>;
      const inner = obj.data;
      if (Array.isArray(inner)) {
        list = inner as ProductOption[];
      } else if (inner && typeof inner === "object" && Array.isArray((inner as any).data)) {
        list = (inner as any).data as ProductOption[];
      }
    }
    return list;
  });
