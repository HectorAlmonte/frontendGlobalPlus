import type { Pagination, ReporteIncidente, ReporteTarea, ReporteEpp, ReporteStorage } from "./types"

const API = process.env.NEXT_PUBLIC_API_URL || ""

async function apiFetch<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const url = new URL(`${API}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { credentials: "include", cache: "no-store" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || `Error ${res.status}`)
  }
  return res.json()
}

type Paged<T> = { data: T[]; pagination: Pagination }

export const apiReporteIncidentes = (params: Record<string, any> = {}) =>
  apiFetch<Paged<ReporteIncidente>>("/api/reportes/incidents", params)

export const apiReporteTareas = (params: Record<string, any> = {}) =>
  apiFetch<Paged<ReporteTarea>>("/api/reportes/tasks", params)

export const apiReporteEpp = (params: Record<string, any> = {}) =>
  apiFetch<Paged<ReporteEpp>>("/api/reportes/epp", params)

export const apiReporteStorage = (params: Record<string, any> = {}) =>
  apiFetch<Paged<ReporteStorage>>("/api/reportes/storage", params)
