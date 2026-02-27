"use client"

import { useCallback, useEffect, useState } from "react"
import { useWord } from "@/context/AppContext"
import { hasRole } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertCircle, ClipboardList, Download, RefreshCw, ShieldAlert,
} from "lucide-react"
import { downloadXlsx, todayStr } from "@/lib/exportExcel"
import { apiListAudit } from "./_lib/api"
import type { AuditLog, AuditPagination } from "./_lib/types"

const PAGE_LIMIT = 20

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Actualización", DELETE: "Eliminación",
  LOGIN: "Inicio sesión", LOGOUT: "Cierre sesión",
}
const ACTION_CLASS: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700 border-green-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  LOGIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOGOUT: "bg-slate-50 text-slate-600 border-slate-200",
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AuditPage() {
  const { setWord, user, loadingUser } = useWord()
  useEffect(() => { setWord("Auditoría") }, [setWord])

  const isAdmin = !loadingUser && hasRole(user, "ADMIN")

  const [rows, setRows] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<AuditPagination>({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  // Filtros
  const [entity, setEntity]     = useState("")
  const [action, setAction]     = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true); setError(false)
    try {
      const res = await apiListAudit({
        page, limit: PAGE_LIMIT,
        entity: entity.trim() || undefined,
        action: action !== "ALL" ? action : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setRows(res.data)
      setPagination(res.pagination)
    } catch (e: any) {
      setError(true)
      toast.error(e?.message || "Error al cargar el log de auditoría")
    } finally { setLoading(false) }
  }, [isAdmin, page, entity, action, dateFrom, dateTo])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [entity, action, dateFrom, dateTo])

  function handleExport() {
    downloadXlsx(rows.map(r => ({
      "Fecha": fmtDateTime(r.createdAt),
      "Acción": ACTION_LABEL[r.action] ?? r.action,
      "Entidad": r.entity,
      "ID entidad": r.entityId,
      "Actor": r.actor?.name ?? "—",
      "IP": r.ip,
    })), `auditoria_${todayStr()}`)
  }

  if (loadingUser) return null

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-base font-semibold">Acceso restringido</p>
          <p className="text-sm text-muted-foreground">Solo los administradores pueden ver el log de auditoría.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Log de Auditoría</h1>
            <p className="text-sm text-muted-foreground">Registro de acciones realizadas por los usuarios</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold">Eventos</p>
            <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              value={entity}
              onChange={e => setEntity(e.target.value)}
              placeholder="Entidad (ej: Employee)"
              className="h-8 text-xs w-40"
            />
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Acción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las acciones</SelectItem>
                <SelectItem value="CREATE">Creación</SelectItem>
                <SelectItem value="UPDATE">Actualización</SelectItem>
                <SelectItem value="DELETE">Eliminación</SelectItem>
                <SelectItem value="LOGIN">Inicio sesión</SelectItem>
                <SelectItem value="LOGOUT">Cierre sesión</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs shrink-0">Desde</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs shrink-0">Hasta</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} title="Recargar">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleExport} disabled={loading || rows.length === 0} title="Exportar Excel">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Acción</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Entidad</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">ID Entidad</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Actor</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Error al cargar el log</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No se pudo conectar con el servidor</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" />Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <ClipboardList className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Sin eventos registrados</p>
                      <p className="text-xs text-muted-foreground">No se encontraron eventos con los filtros aplicados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${ACTION_CLASS[r.action] ?? ""}`}>
                      {ACTION_LABEL[r.action] ?? r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{r.entity}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell max-w-[120px] truncate">
                    {r.entityId}
                  </TableCell>
                  <TableCell className="text-sm">{r.actor?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell">{r.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t text-sm text-muted-foreground">
            <span>{pagination.total} evento{pagination.total !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
              <span className="px-3 py-1 rounded border text-xs font-medium min-w-[70px] text-center">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)}>»</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
