import type { AuditLog, AuditPagination } from "./types"

const API = process.env.NEXT_PUBLIC_API_URL || ""

export async function apiListAudit(params: Record<string, any> = {}): Promise<{ data: AuditLog[]; pagination: AuditPagination }> {
  const url = new URL(`${API}/api/audit`)
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
