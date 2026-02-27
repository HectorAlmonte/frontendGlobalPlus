"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FilterPopover } from "@/components/filter-popover";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ClipboardList, Search, RefreshCw, Download, AlertCircle } from "lucide-react";
import { downloadXlsx, todayStr } from "@/lib/exportExcel";

import type { IncidentListItem, IncidentStatus } from "../_lib/types";
import { statusBadge, priorityBadge } from "../_lib/utils";

/* -- Helpers -- */
const formatFolio = (num?: number) => {
  if (num == null) return "\u2014";
  return `#${String(num).padStart(3, "0")}`;
};

const formatType = (type: string) =>
  type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDate = (d: string | null | undefined) => {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* -- Component -- */
type Filters = {
  q: string;
  status: IncidentStatus | "ALL";
  dateFrom?: Date;
  dateTo?: Date;
};

type Props = {
  items: IncidentListItem[];
  loading?: boolean;
  error?: boolean;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onOpen: (id: string) => void;
  onRefresh?: () => void;
};

export default function IncidentsTable({
  items,
  loading,
  error,
  filters,
  onFiltersChange,
  onOpen,
  onRefresh,
}: Props) {
  /* -- Pagination -- */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedRows = useMemo(
    () => items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [items, pageIndex, pageSize]
  );

  // Reset page when data or filters change
  useMemo(() => { setPageIndex(0); }, [items.length, pageSize]);

  /* -- Filter helpers -- */
  const activeFilterCount =
    (filters.status !== "ALL" ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0);

  const clearFilters = () => {
    onFiltersChange({ q: filters.q, status: "ALL" });
  };

  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Pendiente",
    IN_PROGRESS: "En proceso",
    CLOSED: "Cerrada",
  };

  function handleExport() {
    const rows = items.map((it) => ({
      Folio: formatFolio(it.number),
      Estado: STATUS_LABEL[it.status] ?? it.status,
      Tipo: formatType(it.type),
      Título: it.title ?? "",
      Área: it.area?.name ?? it.areaNameSnapshot ?? "",
      Prioridad: it.corrective?.priority ?? "—",
      Objetivos:
        (it._count?.subtasks ?? 0) > 0
          ? `${it._count?.subtasksCompleted ?? 0}/${it._count?.subtasks}`
          : "—",
      "Reportado por": it.reportedBy?.employee
        ? `${it.reportedBy.employee.nombres} ${it.reportedBy.employee.apellidos ?? ""}`.trim()
        : "—",
      Fecha: formatDate(it.reportedAt),
    }));
    downloadXlsx(rows, `incidencias_${todayStr()}`);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* ── Card header: título + filtros ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Listado de incidencias</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} resultado{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
              placeholder="Buscar por título, área, tipo..."
              className="pl-8 h-9 w-full"
            />
          </div>

          <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, status: v as IncidentStatus | "ALL" })
                }
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="OPEN">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
                  <SelectItem value="CLOSED">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rango de fechas</Label>
              <DateRangePicker
                value={{ from: filters.dateFrom, to: filters.dateTo }}
                onChange={(range) =>
                  onFiltersChange({ ...filters, dateFrom: range.from, dateTo: range.to })
                }
              />
            </div>
          </FilterPopover>

          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            onClick={handleExport}
            disabled={loading || items.length === 0}
            title="Exportar a Excel"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            onClick={onRefresh}
            disabled={loading}
            title="Recargar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left border-b">
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Folio</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Tipo</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Título</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Área</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Prioridad</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Objetivos</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Reportado por</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-7 w-7 rounded" /></td>
              </tr>
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Error al cargar las incidencias</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No se pudo conectar con el servidor</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={onRefresh} className="gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reintentar
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Sin incidencias</p>
                    <p className="text-xs text-muted-foreground">No se encontraron resultados con los filtros aplicados</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && paginatedRows.map((it) => (
              <tr
                key={it.id}
                className="border-t hover:bg-muted/40 active:bg-muted cursor-pointer transition-colors"
                onClick={() => onOpen(it.id)}
              >
                <td className="px-4 py-3 font-mono font-semibold text-primary text-xs">
                  {formatFolio(it.number)}
                </td>

                <td className="px-4 py-3">{statusBadge(it.status)}</td>

                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">{formatType(it.type)}</Badge>
                </td>

                <td className="px-4 py-3">
                  <p className="font-medium text-sm leading-tight line-clamp-1">
                    {it.title || <span className="text-muted-foreground">{"\u2014"}</span>}
                  </p>
                  {/* Tipo visible solo en móvil */}
                  <div className="mt-0.5 sm:hidden">
                    <Badge variant="outline" className="text-xs">{formatType(it.type)}</Badge>
                  </div>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                  {it.area?.name || it.areaNameSnapshot || <span>{"\u2014"}</span>}
                </td>

                <td className="px-4 py-3 hidden sm:table-cell">
                  {priorityBadge(it.corrective?.priority)}
                </td>

                <td className="px-4 py-3 hidden md:table-cell">
                  {(() => {
                    const total = it._count?.subtasks ?? 0;
                    const done = it._count?.subtasksCompleted ?? 0;
                    if (total === 0) return <span className="text-xs text-muted-foreground">{"\u2014"}</span>;
                    const allDone = done === total;
                    return (
                      <Badge
                        variant="secondary"
                        className={
                          allDone
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }
                      >
                        {done}/{total} obj.
                      </Badge>
                    );
                  })()}
                </td>

                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {it.reportedBy?.employee
                      ? `${it.reportedBy.employee.nombres} ${it.reportedBy.employee.apellidos ?? ""}`.trim()
                      : "\u2014"}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                  {formatDate(it.reportedAt)}
                </td>

                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={(e) => { e.stopPropagation(); onOpen(it.id); }}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginación (footer) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Label htmlFor="incidents-page-size" className="text-xs">
            Filas por página
          </Label>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-16 h-8 text-xs" id="incidents-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>«</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={pageIndex === 0}>‹</Button>
          <span className="px-3 py-1 rounded border text-xs font-medium min-w-[70px] text-center">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))} disabled={pageIndex >= pageCount - 1}>›</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>»</Button>
        </div>
      </div>
    </div>
  );
}
