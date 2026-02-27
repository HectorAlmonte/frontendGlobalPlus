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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3, Download, RefreshCw, AlertCircle,
  ShieldAlert, ClipboardList, HardHat, Package,
} from "lucide-react"
import { downloadXlsx, todayStr } from "@/lib/exportExcel"
import {
  apiReporteIncidentes, apiReporteTareas, apiReporteEpp, apiReporteStorage,
} from "./_lib/api"
import type {
  Pagination, ReporteIncidente, ReporteTarea, ReporteEpp, ReporteStorage,
} from "./_lib/types"

const PAGE_LIMIT = 50

/* ── Helpers ── */
function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

const STATUS_INCIDENT: Record<string, string> = {
  OPEN: "Abierta", IN_PROGRESS: "En progreso", CLOSED: "Cerrada",
}
const TYPE_INCIDENT: Record<string, string> = {
  HALLAZGO_ANORMAL: "Hallazgo anormal",
  INCIDENTE: "Incidente",
  CONDICION_SUB_ESTANDAR: "Cond. subestándar",
  ACTO_SUB_ESTANDAR: "Acto subestándar",
}
const STATUS_TASK: Record<string, string> = {
  PENDING: "Pendiente", IN_PROGRESS: "En progreso", COMPLETED: "Completada", CANCELLED: "Cancelada",
}
const PRIORITY_TASK: Record<string, string> = {
  BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", CRITICA: "Crítica",
}
const REASON_EPP: Record<string, string> = {
  PRIMERA_ENTREGA: "Primera entrega", RENOVACION: "Renovación", PERDIDA: "Pérdida",
}
const MOVEMENT_TYPE: Record<string, string> = {
  ENTRY: "Entrada", EXIT: "Salida", ADJUSTMENT: "Ajuste", RETURN: "Devolución",
}

/* ── Pagination controls ── */
function PagerRow({ pagination, page, setPage }: { pagination: Pagination; page: number; setPage: (p: number) => void }) {
  const { total, totalPages } = pagination
  if (totalPages <= 1 && total === 0) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 border-t text-sm text-muted-foreground">
      <span>{total} resultado{total !== 1 ? "s" : ""}</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
          <span className="px-3 py-1 rounded border text-xs font-medium min-w-[70px] text-center">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
        </div>
      )}
    </div>
  )
}

/* ── Error / Empty rows ── */
function ErrorRow({ colSpan, onRetry }: { colSpan: number; onRetry: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">Error al cargar el reporte</p>
            <p className="text-xs text-muted-foreground mt-0.5">No se pudo conectar con el servidor</p>
          </div>
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Reintentar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Sin resultados</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/* ════════════════════════════════════════
   TAB: INCIDENCIAS
════════════════════════════════════════ */
function ReporteIncidentesTab() {
  const [rows, setRows] = useState<ReporteIncidente[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  // Filtros
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [status, setStatus]     = useState("ALL")
  const [type, setType]         = useState("ALL")

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await apiReporteIncidentes({
        page, limit: PAGE_LIMIT,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status !== "ALL" ? status : undefined,
        type: type !== "ALL" ? type : undefined,
      })
      setRows(res.data)
      setPagination(res.pagination)
    } catch (e: any) {
      setError(true)
      toast.error(e?.message || "Error al cargar reporte de incidencias")
    } finally { setLoading(false) }
  }, [page, dateFrom, dateTo, status, type])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo, status, type])

  function handleExport() {
    downloadXlsx(rows.map(r => ({
      "Folio": `#${String(r.number).padStart(3, "0")}`,
      "Título": r.title,
      "Tipo": TYPE_INCIDENT[r.type] ?? r.type,
      "Estado": STATUS_INCIDENT[r.status] ?? r.status,
      "Área": r.areaName,
      "Reportado por": r.reportedBy,
      "Fecha reporte": fmtDate(r.reportedAt),
      "Fecha cierre": fmtDate(r.closedAt),
      "Prioridad correctivo": r.correctivePriority ?? "—",
      "Vencimiento correctivo": fmtDate(r.correctiveDueDate),
    })), `reporte_incidencias_${todayStr()}`)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Incidencias</p>
          <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Desde</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Hasta</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="OPEN">Abierta</SelectItem>
              <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
              <SelectItem value="CLOSED">Cerrada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="HALLAZGO_ANORMAL">Hallazgo anormal</SelectItem>
              <SelectItem value="INCIDENTE">Incidente</SelectItem>
              <SelectItem value="CONDICION_SUB_ESTANDAR">Cond. subestándar</SelectItem>
              <SelectItem value="ACTO_SUB_ESTANDAR">Acto subestándar</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} title="Recargar">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleExport} disabled={loading || rows.length === 0} title="Exportar Excel">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-16">Folio</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Título</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Estado</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Área</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Reportado por</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Prioridad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <SkeletonRows cols={8} /> : error ? <ErrorRow colSpan={8} onRetry={load} /> : rows.length === 0 ? (
              <EmptyRow colSpan={8} label="No se encontraron incidencias con los filtros aplicados" />
            ) : rows.map((r, i) => (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-primary">#{String(r.number).padStart(3, "0")}</TableCell>
                <TableCell className="text-sm font-medium max-w-[180px] truncate">{r.title}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">{TYPE_INCIDENT[r.type] ?? r.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{STATUS_INCIDENT[r.status] ?? r.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{r.areaName}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{r.reportedBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{fmtDate(r.reportedAt)}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {r.correctivePriority
                    ? <Badge variant="secondary" className="text-xs">{r.correctivePriority}</Badge>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PagerRow pagination={pagination} page={page} setPage={setPage} />
    </div>
  )
}

/* ════════════════════════════════════════
   TAB: TAREAS
════════════════════════════════════════ */
function ReporteTareasTab() {
  const [rows, setRows] = useState<ReporteTarea[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [status, setStatus]     = useState("ALL")
  const [priority, setPriority] = useState("ALL")

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await apiReporteTareas({
        page, limit: PAGE_LIMIT,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status !== "ALL" ? status : undefined,
        priority: priority !== "ALL" ? priority : undefined,
      })
      setRows(res.data); setPagination(res.pagination)
    } catch (e: any) {
      setError(true); toast.error(e?.message || "Error al cargar reporte de tareas")
    } finally { setLoading(false) }
  }, [page, dateFrom, dateTo, status, priority])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo, status, priority])

  function handleExport() {
    downloadXlsx(rows.map(r => ({
      "Folio": `#${String(r.number).padStart(3, "0")}`,
      "Título": r.title,
      "Estado": STATUS_TASK[r.status] ?? r.status,
      "Prioridad": PRIORITY_TASK[r.priority] ?? r.priority,
      "Progreso": `${r.progress}%`,
      "Vencimiento": fmtDate(r.dueDate),
      "Área de trabajo": r.workAreaName ?? "—",
      "Asignados": r.assignees.join(", "),
      "Creado": fmtDate(r.createdAt),
    })), `reporte_tareas_${todayStr()}`)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Tareas</p>
          <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Desde</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Hasta</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
              <SelectItem value="COMPLETED">Completada</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
              <SelectItem value="MEDIA">Media</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="CRITICA">Crítica</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} title="Recargar">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleExport} disabled={loading || rows.length === 0} title="Exportar Excel">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-16">Folio</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Título</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Estado</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Prioridad</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Progreso</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Vencimiento</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Asignados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <SkeletonRows cols={7} /> : error ? <ErrorRow colSpan={7} onRetry={load} /> : rows.length === 0 ? (
              <EmptyRow colSpan={7} label="No se encontraron tareas con los filtros aplicados" />
            ) : rows.map((r, i) => (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-primary">#{String(r.number).padStart(3, "0")}</TableCell>
                <TableCell className="text-sm font-medium max-w-[200px] truncate">{r.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{STATUS_TASK[r.status] ?? r.status}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-xs">{PRIORITY_TASK[r.priority] ?? r.priority}</Badge></TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{r.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{fmtDate(r.dueDate)}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-[160px] truncate">
                  {r.assignees.length > 0 ? r.assignees.join(", ") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PagerRow pagination={pagination} page={page} setPage={setPage} />
    </div>
  )
}

/* ════════════════════════════════════════
   TAB: EPP
════════════════════════════════════════ */
function ReporteEppTab() {
  const [rows, setRows] = useState<ReporteEpp[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [reason, setReason]     = useState("ALL")

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await apiReporteEpp({
        page, limit: PAGE_LIMIT,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        reason: reason !== "ALL" ? reason : undefined,
      })
      setRows(res.data); setPagination(res.pagination)
    } catch (e: any) {
      setError(true); toast.error(e?.message || "Error al cargar reporte de EPP")
    } finally { setLoading(false) }
  }, [page, dateFrom, dateTo, reason])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo, reason])

  function handleExport() {
    downloadXlsx(rows.map(r => ({
      "N°": r.number,
      "Trabajador": r.employeeName,
      "DNI": r.employeeDni,
      "Motivo": REASON_EPP[r.reason] ?? r.reason,
      "Fecha entrega": fmtDate(r.deliveredAt),
      "Firmado": r.signed ? "Sí" : "No",
      "Fecha firma": fmtDate(r.signedAt),
      "Ítems": r.itemCount,
      "Entregado por": r.createdBy,
    })), `reporte_epp_${todayStr()}`)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <HardHat className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">EPP</p>
          <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Desde</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Hasta</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Motivo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los motivos</SelectItem>
              <SelectItem value="PRIMERA_ENTREGA">Primera entrega</SelectItem>
              <SelectItem value="RENOVACION">Renovación</SelectItem>
              <SelectItem value="PERDIDA">Pérdida</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} title="Recargar">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleExport} disabled={loading || rows.length === 0} title="Exportar Excel">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-14">N°</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Trabajador</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Motivo</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground text-center">Firmado</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell text-center">Ítems</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Entregado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <SkeletonRows cols={7} /> : error ? <ErrorRow colSpan={7} onRetry={load} /> : rows.length === 0 ? (
              <EmptyRow colSpan={7} label="No se encontraron entregas con los filtros aplicados" />
            ) : rows.map((r, i) => (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">#{String(r.number).padStart(4, "0")}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium leading-tight">{r.employeeName}</p>
                  <p className="text-xs text-muted-foreground">DNI: {r.employeeDni}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">{REASON_EPP[r.reason] ?? r.reason}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{fmtDate(r.deliveredAt)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`text-xs ${r.signed ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {r.signed ? "Firmado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm hidden md:table-cell">{r.itemCount}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{r.createdBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PagerRow pagination={pagination} page={page} setPage={setPage} />
    </div>
  )
}

/* ════════════════════════════════════════
   TAB: ALMACÉN (MOVIMIENTOS)
════════════════════════════════════════ */
function ReporteAlmacenTab() {
  const [rows, setRows] = useState<ReporteStorage[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const [dateFrom, setDateFrom]           = useState("")
  const [dateTo, setDateTo]               = useState("")
  const [kind, setKind]                   = useState("ALL")
  const [movementType, setMovementType]   = useState("ALL")

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await apiReporteStorage({
        page, limit: PAGE_LIMIT,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        kind: kind !== "ALL" ? kind : undefined,
        movementType: movementType !== "ALL" ? movementType : undefined,
      })
      setRows(res.data); setPagination(res.pagination)
    } catch (e: any) {
      setError(true); toast.error(e?.message || "Error al cargar reporte de almacén")
    } finally { setLoading(false) }
  }, [page, dateFrom, dateTo, kind, movementType])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo, kind, movementType])

  function handleExport() {
    downloadXlsx(rows.map(r => ({
      "Fecha": fmtDate(r.createdAt),
      "Producto": r.productName,
      "Código": r.productCode,
      "Tipo movimiento": MOVEMENT_TYPE[r.movementType] ?? r.movementType,
      "Cantidad": r.quantity,
      "Notas": r.notes ?? "—",
      "Realizado por": r.performedBy,
      "Solicitado por": r.requestedBy ?? "—",
    })), `reporte_almacen_${todayStr()}`)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Almacén — Movimientos</p>
          <Badge variant="secondary" className="ml-1 text-xs">{pagination.total}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Desde</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs shrink-0">Hasta</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
          </div>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tipo producto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="CONSUMABLE">Consumible</SelectItem>
              <SelectItem value="EQUIPMENT">Equipo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Movimiento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ENTRY">Entrada</SelectItem>
              <SelectItem value="EXIT">Salida</SelectItem>
              <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
              <SelectItem value="RETURN">Devolución</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} title="Recargar">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleExport} disabled={loading || rows.length === 0} title="Exportar Excel">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Producto</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground text-right">Cantidad</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Realizado por</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Solicitado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <SkeletonRows cols={6} /> : error ? <ErrorRow colSpan={6} onRetry={load} /> : rows.length === 0 ? (
              <EmptyRow colSpan={6} label="No se encontraron movimientos con los filtros aplicados" />
            ) : rows.map((r, i) => (
              <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">{fmtDate(r.createdAt)}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium leading-tight">{r.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.productCode}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{MOVEMENT_TYPE[r.movementType] ?? r.movementType}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">{r.quantity}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{r.performedBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{r.requestedBy ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PagerRow pagination={pagination} page={page} setPage={setPage} />
    </div>
  )
}

/* ════════════════════════════════════════
   PAGE
════════════════════════════════════════ */
export default function ReportesPage() {
  const { setWord, user, loadingUser } = useWord()
  useEffect(() => { setWord("Reportes") }, [setWord])

  if (loadingUser) return null

  const isAdmin    = hasRole(user, "ADMIN")
  const isSup      = hasRole(user, "SUPERVISOR")
  const isSeg      = hasRole(user, "SEGURIDAD")

  const canIncidents = isAdmin || isSup || isSeg
  const canTasks     = isAdmin || isSup
  const canEpp       = isAdmin || isSup || isSeg
  const canStorage   = isAdmin || isSup || isSeg

  if (!canIncidents && !canTasks && !canEpp && !canStorage) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 text-center text-muted-foreground">
        No tienes permisos para ver reportes.
      </div>
    )
  }

  const defaultTab = canIncidents ? "incidents" : canTasks ? "tasks" : canEpp ? "epp" : "storage"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Consulta y exportación de datos por módulo</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {canIncidents && (
            <TabsTrigger value="incidents" className="gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Incidencias
            </TabsTrigger>
          )}
          {canTasks && (
            <TabsTrigger value="tasks" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Tareas
            </TabsTrigger>
          )}
          {canEpp && (
            <TabsTrigger value="epp" className="gap-1.5">
              <HardHat className="h-4 w-4" />
              EPP
            </TabsTrigger>
          )}
          {canStorage && (
            <TabsTrigger value="storage" className="gap-1.5">
              <Package className="h-4 w-4" />
              Almacén
            </TabsTrigger>
          )}
        </TabsList>

        {canIncidents && (
          <TabsContent value="incidents" className="mt-5">
            <ReporteIncidentesTab />
          </TabsContent>
        )}
        {canTasks && (
          <TabsContent value="tasks" className="mt-5">
            <ReporteTareasTab />
          </TabsContent>
        )}
        {canEpp && (
          <TabsContent value="epp" className="mt-5">
            <ReporteEppTab />
          </TabsContent>
        )}
        {canStorage && (
          <TabsContent value="storage" className="mt-5">
            <ReporteAlmacenTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
