import type {
  EppStats,
  EppDeliveriesResponse,
  EppDeliveryDetail,
  EppCreateInput,
  ProductOption,
  UnitOption,
  StaffOption,
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

export const apiGetEppStats = () =>
  apiFetch<EppStats>(full("/api/epp/stats"));

export const apiListDeliveries = (
  params: Record<string, string | number>
) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== "" && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return apiFetch<EppDeliveriesResponse>(
    full(`/api/epp/deliveries?${qs}`)
  );
};

export const apiGetDelivery = (id: string) =>
  apiFetch<EppDeliveryDetail>(full(`/api/epp/deliveries/${id}`));

export const apiCreateDelivery = (body: EppCreateInput) =>
  apiFetch<EppDeliveryDetail>(full("/api/epp/deliveries"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiSignDelivery = (id: string, signatureData: string) =>
  apiFetch<EppDeliveryDetail>(full(`/api/epp/deliveries/${id}/sign`), {
    method: "PATCH",
    body: JSON.stringify({ signatureData }),
  });

export const apiSearchStaffAll = () =>
  apiFetch<StaffOption[]>(full("/api/staff/search/all"));

export const apiSearchEppProducts = (
  kind: "CONSUMABLE" | "EQUIPMENT",
  q = ""
) => {
  const qs = new URLSearchParams({ kind, ...(q ? { q } : {}) }).toString();
  return apiFetch<ProductOption[]>(
    full(`/api/storage/products/search?${qs}`)
  );
};

export const apiGetAvailableUnits = (productId: string) =>
  apiFetch<UnitOption[]>(
    full(`/api/storage/units?productId=${productId}&status=AVAILABLE`)
  );
