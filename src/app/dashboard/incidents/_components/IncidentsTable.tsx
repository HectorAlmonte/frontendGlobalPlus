"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FilterPopover } from "@/components/filter-popover";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onOpen: (id: string) => void;
  onRefresh?: () => void;
};

export default function IncidentsTable({
  items,
  loading,
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

  return (
    <div className="space-y-3">
      {/* -- Filtros -- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            value={filters.q}
            onChange={(e) =>
              onFiltersChange({ ...filters, q: e.target.value })
            }
            placeholder="Buscar por titulo, area, tipo..."
            className="w-full sm:w-[260px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            activeCount={activeFilterCount}
            onClear={clearFilters}
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    status: v as IncidentStatus | "ALL",
                  })
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
                value={{
                  from: filters.dateFrom,
                  to: filters.dateTo,
                }}
                onChange={(range) =>
                  onFiltersChange({
                    ...filters,
                    dateFrom: range.from,
                    dateTo: range.to,
                  })
                }
              />
            </div>
          </FilterPopover>

          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            ↻
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      {/* -- Tabla -- */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Folio</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Titulo</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Prioridad</th>
              <th className="px-3 py-2">Objetivos</th>
              <th className="px-3 py-2">Reportado por</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={10}
                >
                  {loading ? "Cargando..." : "No hay incidencias para mostrar."}
                </td>
              </tr>
            )}

            {paginatedRows.map((it) => (
              <tr key={it.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono font-medium text-primary">
                  {formatFolio(it.number)}
                </td>

                <td className="px-3 py-2">{statusBadge(it.status)}</td>

                <td className="px-3 py-2">
                  <Badge variant="outline">{formatType(it.type)}</Badge>
                </td>

                <td className="px-3 py-2">
                  <button
                    className="font-medium text-left hover:underline"
                    onClick={() => onOpen(it.id)}
                  >
                    {it.title || <span className="text-muted-foreground">{"\u2014"}</span>}
                  </button>
                </td>

                <td className="px-3 py-2 text-xs">
                  {it.area?.name || it.areaNameSnapshot || <span className="text-muted-foreground">{"\u2014"}</span>}
                </td>

                <td className="px-3 py-2">
                  {priorityBadge(it.corrective?.priority)}
                </td>

                <td className="px-3 py-2">
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

                <td className="px-3 py-2">
                  <span className="text-xs">
                    {it.reportedBy?.employee
                      ? `${it.reportedBy.employee.nombres} ${it.reportedBy.employee.apellidos ?? ""}`.trim()
                      : "\u2014"}
                  </span>
                </td>

                <td className="px-3 py-2 text-xs">{formatDate(it.reportedAt)}</td>

                <td className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpen(it.id)}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -- Paginacion -- */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="incidents-page-size" className="text-sm font-medium">
            Filas por pagina
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-16 sm:w-20 h-8" id="incidents-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pagina {pageIndex + 1} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
}
