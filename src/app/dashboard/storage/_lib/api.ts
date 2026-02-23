import type {
  StorageCategory,
  StorageProduct,
  StorageProductDetail,
  ProductCreateInput,
  ProductUpdateInput,
  StockMovement,
  MovementCreateInput,
  StorageUnit,
  UnitCreateInput,
  UnitAssignInput,
  UnitReturnInput,
  UnitMaintenanceInput,
  UnitMaintenanceFinishInput,
  EquipmentLog,
  StorageStats,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

function full(path: string) {
  return `${API_BASE}${path}`;
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
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function apiListCategories() {
  return apiFetch<{ ok: boolean; data: StorageCategory[] }>(
    full("/api/storage/categories")
  ).then((r) => r.data ?? r);
}

export function apiCreateCategory(input: { name: string; description?: string }) {
  return apiFetch<{ ok: boolean; data: StorageCategory }>(
    full("/api/storage/categories"),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiUpdateCategory(
  id: string,
  input: { name?: string; description?: string; isActive?: boolean }
) {
  return apiFetch<{ ok: boolean; data: StorageCategory }>(
    full(`/api/storage/categories/${id}`),
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function apiCategoriesForSelect(): Promise<
  { value: string; label: string }[]
> {
  const cats = await apiListCategories();
  return cats.map((c) => ({ value: c.id, label: c.name }));
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ListProductsParams {
  q?: string;
  kind?: string;
  categoryId?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

export function apiListProducts(params?: ListProductsParams) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.kind) sp.set("kind", params.kind);
  if (params?.categoryId) sp.set("categoryId", params.categoryId);
  if (params?.lowStock) sp.set("lowStock", "true");
  if (params?.isActive !== undefined) sp.set("isActive", String(params.isActive));
  return apiFetch<{ ok: boolean; data: StorageProduct[] }>(
    full(`/api/storage/products?${sp.toString()}`)
  ).then((r) => (Array.isArray(r) ? r : (r as any).data ?? []));
}

export function apiGetProduct(id: string) {
  return apiFetch<{ ok: boolean; data: StorageProductDetail }>(
    full(`/api/storage/products/${id}`)
  ).then((r) => (r as any).data ?? r);
}

export function apiCreateProduct(input: ProductCreateInput) {
  return apiFetch<{ ok: boolean; data: StorageProduct }>(
    full("/api/storage/products"),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiUpdateProduct(id: string, input: ProductUpdateInput) {
  return apiFetch<{ ok: boolean; data: StorageProduct }>(
    full(`/api/storage/products/${id}`),
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export function apiDeleteProduct(id: string) {
  return apiFetch<{ ok: boolean }>(full(`/api/storage/products/${id}`), {
    method: "DELETE",
  });
}

export async function apiProductQr(id: string): Promise<Blob> {
  const res = await fetch(full(`/api/storage/products/${id}/qr`), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export async function apiSearchProducts(
  q: string,
  kind?: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  if (kind) sp.set("kind", kind);
  const res = await fetch(full(`/api/storage/products/search?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error buscando productos");
  const data = await res.json();
  return (Array.isArray(data) ? data : data.data ?? []).map((x: any) => ({
    value: String(x.id ?? x.value),
    label: String(x.label ?? x.name),
  }));
}

// ─── Movements (consumable) ───────────────────────────────────────────────────

export interface ListMovementsParams {
  type?: string;
  from?: string;
  to?: string;
}

export function apiListMovements(productId: string, params?: ListMovementsParams) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);
  return apiFetch<{ ok: boolean; data: StockMovement[] }>(
    full(`/api/storage/products/${productId}/movements?${sp.toString()}`)
  ).then((r) => (Array.isArray(r) ? r : (r as any).data ?? []));
}

export function apiCreateMovement(productId: string, input: MovementCreateInput) {
  return apiFetch<{ ok: boolean; data: StockMovement }>(
    full(`/api/storage/products/${productId}/movements`),
    { method: "POST", body: JSON.stringify(input) }
  );
}

// ─── Units (equipment) ────────────────────────────────────────────────────────

export interface ListUnitsParams {
  productId?: string;
  status?: string;
  q?: string;
}

export function apiListUnits(params?: ListUnitsParams) {
  const sp = new URLSearchParams();
  if (params?.productId) sp.set("productId", params.productId);
  if (params?.status) sp.set("status", params.status);
  if (params?.q) sp.set("q", params.q);
  return apiFetch<{ ok: boolean; data: StorageUnit[] }>(
    full(`/api/storage/units?${sp.toString()}`)
  ).then((r) => (Array.isArray(r) ? r : (r as any).data ?? []));
}

export function apiCreateUnit(input: UnitCreateInput) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full("/api/storage/units"),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiGetUnit(id: string) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}`)
  ).then((r) => (r as any).data ?? r);
}

export async function apiUnitQr(id: string): Promise<Blob> {
  const res = await fetch(full(`/api/storage/units/${id}/qr`), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export function apiGetUnitLogs(id: string) {
  return apiFetch<{ ok: boolean; data: EquipmentLog[] }>(
    full(`/api/storage/units/${id}/logs`)
  ).then((r) => (Array.isArray(r) ? r : (r as any).data ?? []));
}

export function apiAssignUnit(id: string, input: UnitAssignInput) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}/assign`),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiReturnUnit(id: string, input: UnitReturnInput) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}/return`),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiStartMaintenance(id: string, input: UnitMaintenanceInput) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}/maintenance`),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiFinishMaintenance(id: string, input: UnitMaintenanceFinishInput) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}/maintenance/finish`),
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function apiRetireUnit(id: string, input?: { notes?: string }) {
  return apiFetch<{ ok: boolean; data: StorageUnit }>(
    full(`/api/storage/units/${id}/retire`),
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function apiGetStorageStats() {
  return apiFetch<{ ok: boolean; data: StorageStats }>(
    full("/api/storage/stats")
  ).then((r) => (r as any).data ?? r);
}

// ─── Staff search (for requestedBy / assignedTo) ──────────────────────────────

// Todos los empleados activos sin filtro de rol (para almacén)
export async function apiSearchAllEmployees(
  q: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set("q", q.trim());
  const res = await fetch(full(`/api/staff/search/all?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error buscando empleados");
  const data = await res.json();
  return (Array.isArray(data) ? data : data.data ?? []).map((x: any) => ({
    value: String(x.id ?? x.value),
    label: String(x.label ?? `${x.nombres} ${x.apellidos}`),
  }));
}
