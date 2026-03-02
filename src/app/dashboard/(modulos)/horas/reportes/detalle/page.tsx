"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Clock,
  TrendingDown,
  TrendingUp,
  Timer,
} from "lucide-react";
import { apiReporteDetalle, apiSearchAllStaff } from "../../_lib/api";
import {
  formatMinutes,
  dayTypeBadge,
  statusBadge,
  downloadReportXlsx,
} from "../../_lib/utils";
import type {
  ReportDetailItem,
  AttendanceRecordStatus,
  DayType,
  ReporteDetalleParams,
} from "../../_lib/types";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: AttendanceRecordStatus; label: string }[] = [
  { value: "COMPLETE", label: "Completo" },
  { value: "INCOMPLETE", label: "Incompleto" },
  { value: "PENDING_OVERTIME", label: "OT pendiente" },
  { value: "CLOSED", label: "Cerrado" },
];

const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "WORKED", label: "Trabajado" },
  { value: "REST", label: "Descanso" },
  { value: "HOLIDAY", label: "Feriado" },
  { value: "VACATION", label: "Vacaciones" },
  { value: "ABSENT", label: "Ausente" },
  { value: "PERMIT", label: "Permiso" },
  { value: "MEDICAL_LEAVE", label: "Licencia médica" },
  { value: "TRAINING", label: "Capacitación" },
  { value: "SUSPENSION", label: "Suspensión" },
  { value: "COMPENSATORY_REST", label: "Descanso compensatorio" },
];

type EmployeeSummary = {
  employeeName: string;
  employeeDni: string;
  workedDays: number;
  totalScheduled: number;
  totalEffective: number;
  totalLate: number;
  totalOtPending: number;
};

/** Formatea minutos soportando negativos y cero ("—" = nunca, 0 → "0m") */
function fmtMin(mins: number): string {
  if (mins === 0) return "0m";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = mins < 0 ? "-" : "";
  return m > 0 ? `${sign}${h}h ${m}m` : `${sign}${h}h`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export default function ReporteDetallePage() {
  const { user } = useWord();
  const canAccess = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState("");
  const [empResults, setEmpResults] = useState<{ id: string; label: string }[]>([]);
  const [allStaff, setAllStaff] = useState<{ id: string; label: string }[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    apiSearchAllStaff().then(setAllStaff).catch(() => {});
  }, []);
  const [status, setStatus] = useState<AttendanceRecordStatus | "">("");
  const [dayType, setDayType] = useState<DayType | "">("");

  // Data
  const [allRows, setAllRows] = useState<ReportDetailItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);

  // Client-side pagination over allRows
  const pagedRows = useMemo(
    () => allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allRows, page]
  );
  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));

  // Summary aggregated by employee
  const summaryByEmployee = useMemo<EmployeeSummary[]>(() => {
    const map = new Map<string, EmployeeSummary>();
    for (const r of allRows) {
      const key = r.employeeDni || r.employeeName;
      if (!map.has(key)) {
        map.set(key, {
          employeeName: r.employeeName,
          employeeDni: r.employeeDni,
          workedDays: 0,
          totalScheduled: 0,
          totalEffective: 0,
          totalLate: 0,
          totalOtPending: 0,
        });
      }
      const s = map.get(key)!;
      if (r.dayType === "WORKED") s.workedDays++;
      s.totalScheduled += r.scheduledMinutes ?? 0;
      s.totalEffective += r.effectiveMinutes ?? 0;
      s.totalLate += r.lateMinutes ?? 0;
      if (r.overtimeStatus === "PENDING") {
        s.totalOtPending += r.overtimeEffectiveMinutes ?? 0;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );
  }, [allRows]);

  const search = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Selecciona el rango de fechas");
      return;
    }
    setLoading(true);
    setSearched(true);
    setPage(1);
    const params: ReporteDetalleParams = {
      dateFrom,
      dateTo,
      page: 1,
      limit: 9999,
    };
    if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
    if (status) params.status = status as AttendanceRecordStatus;
    if (dayType) params.dayType = dayType as DayType;
    try {
      const res = await apiReporteDetalle(params);
      setAllRows(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar reporte");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedEmployeeId, status, dayType]);

  function handleEmpSearch(q: string) {
    setEmployeeSearch(q);
    if (q.length < 2) { setEmpResults([]); return; }
    const lower = q.toLowerCase();
    setEmpResults(allStaff.filter((e) => e.label.toLowerCase().includes(lower)).slice(0, 10));
  }

  function handleExport() {
    if (allRows.length === 0) return;
    downloadReportXlsx(
      allRows.map((r) => ({
        Empleado: r.employeeName,
        DNI: r.employeeDni,
        Fecha: r.date,
        "Tipo de día": r.dayType,
        Estado: r.status,
        "Prog. (min)": r.scheduledMinutes,
        "Efect. (min)": r.effectiveMinutes,
        "Tardanza (min)": r.lateMinutes,
        "OT (min)": r.overtimeEffectiveMinutes,
      })),
      `reporte_detalle_${dateFrom}_${dateTo}`
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  const isSingleEmployee = !!selectedEmployeeId && summaryByEmployee.length === 1;
  const singleSummary = isSingleEmployee ? summaryByEmployee[0] : null;

  return (
    <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-none">Reporte detallado de asistencia</h1>
          <p className="text-xs text-muted-foreground mt-1">Registros día a día por empleado</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30 rounded-t-xl overflow-hidden">
          <Search className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold leading-none">Filtros</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Desde <span className="text-red-500">*</span></Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Hasta <span className="text-red-500">*</span></Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Empleado</Label>
            {selectedEmployeeId ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 h-10">
                <span className="flex-1 text-sm truncate">{selectedEmployeeLabel}</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setSelectedEmployeeId(""); setSelectedEmployeeLabel(""); setEmployeeSearch(""); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Buscar empleado..."
                  value={employeeSearch}
                  onChange={(e) => handleEmpSearch(e.target.value)}
                />
                {empResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {empResults.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        onClick={() => {
                          setSelectedEmployeeId(e.id);
                          setSelectedEmployeeLabel(e.label);
                          setEmployeeSearch("");
                          setEmpResults([]);
                        }}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}
                {empLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select
              value={status || "_all"}
              onValueChange={(v) => setStatus(v === "_all" ? "" : v as AttendanceRecordStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de día</Label>
            <Select
              value={dayType || "_all"}
              onValueChange={(v) => setDayType(v === "_all" ? "" : v as DayType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {DAY_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={search}>
              <Search className="h-4 w-4 mr-1.5" />
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      {searched && !loading && allRows.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Header toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 border-b bg-muted/30 hover:bg-muted/50 transition-colors"
            onClick={() => setSummaryOpen((o) => !o)}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold leading-none">Resumen del período</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {summaryByEmployee.length} empleado{summaryByEmployee.length !== 1 ? "s" : ""}
              </span>
            </div>
            {summaryOpen
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {summaryOpen && (
            <div className="p-5">
              {/* Single employee: KPI cards */}
              {isSingleEmployee && singleSummary ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Días trabajados
                    </div>
                    <p className="text-2xl font-bold leading-none">{singleSummary.workedDays}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Total efectivo
                    </div>
                    <p className="text-2xl font-bold leading-none font-mono">{fmtMin(singleSummary.totalEffective)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {singleSummary.totalEffective - singleSummary.totalScheduled >= 0
                        ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                      Diferencia
                    </div>
                    <p className={`text-2xl font-bold leading-none font-mono ${
                      singleSummary.totalEffective - singleSummary.totalScheduled >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {fmtMin(singleSummary.totalEffective - singleSummary.totalScheduled)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Timer className="h-3.5 w-3.5" />
                      Tardanzas
                    </div>
                    <p className={`text-2xl font-bold leading-none font-mono ${singleSummary.totalLate > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                      {singleSummary.totalLate > 0 ? fmtMin(singleSummary.totalLate) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      OT pendiente
                    </div>
                    {singleSummary.totalOtPending > 0 ? (
                      <p className="text-2xl font-bold leading-none font-mono text-amber-600 dark:text-amber-400">
                        {fmtMin(singleSummary.totalOtPending)}
                      </p>
                    ) : (
                      <p className="text-2xl font-bold leading-none text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Multiple employees: summary table */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>Empleado</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead className="text-right">Días reg.</TableHead>
                        <TableHead className="text-right">Total Prog.</TableHead>
                        <TableHead className="text-right">Total Efect.</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead className="text-right">Tardanzas</TableHead>
                        <TableHead className="text-right">OT Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryByEmployee.map((s) => {
                        const diff = s.totalEffective - s.totalScheduled;
                        return (
                          <TableRow key={s.employeeDni}>
                            <TableCell className="font-medium text-sm">{s.employeeName}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{s.employeeDni}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{s.workedDays}</TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">{fmtMin(s.totalScheduled)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtMin(s.totalEffective)}</TableCell>
                            <TableCell className={`text-right font-mono text-xs font-semibold ${
                              diff >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {diff >= 0 ? "+" : ""}{fmtMin(diff)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {s.totalLate > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">{fmtMin(s.totalLate)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {s.totalOtPending > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-xs font-medium font-mono">
                                  {fmtMin(s.totalOtPending)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail table */}
      {searched && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">{allRows.length} registro(s)</span>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={allRows.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : allRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Sin resultados</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Empleado</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Prog.</TableHead>
                      <TableHead className="text-right">Efect.</TableHead>
                      <TableHead className="text-right">Tardanza</TableHead>
                      <TableHead className="text-right">OT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((r) => (
                      <TableRow key={`${r.employeeDni}-${r.date}`}>
                        <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.employeeDni}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                        <TableCell>{dayTypeBadge(r.dayType)}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatMinutes(r.scheduledMinutes)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatMinutes(r.effectiveMinutes)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${r.lateMinutes > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                          {r.lateMinutes > 0 ? formatMinutes(r.lateMinutes) : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs ${r.overtimeEffectiveMinutes > 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                          {r.overtimeEffectiveMinutes > 0 ? formatMinutes(r.overtimeEffectiveMinutes) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pageCount > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {page} de {pageCount}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
