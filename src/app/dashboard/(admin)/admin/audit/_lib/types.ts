export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT"

export type AuditLog = {
  id: string
  action: AuditAction
  entity: string
  entityId: string
  actor: { id: string; name: string }
  meta: Record<string, any>
  ip: string
  createdAt: string
}

export type AuditPagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}
