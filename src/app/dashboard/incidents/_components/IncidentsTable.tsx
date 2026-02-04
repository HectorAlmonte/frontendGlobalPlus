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

import type { IncidentListItem, IncidentStatus } from "../_lib/types";
import { statusBadge } from "../_lib/utils";

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
type Props = {
  items: IncidentListItem[];
  loading?: boolean;
  onOpen: (id: string) => void;
  onRefresh?: () => void;
};

export default function IncidentsTable({
  items,
  loading,
  onOpen,
  onRefresh,
}: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "ALL">("ALL");

  /* -- Pagination -- */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let out = items;

    if (statusFilter !== "ALL") out = out.filter((x) => x.status === statusFilter);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter(
        (x) =>
          (x.title ?? "").toLowerCase().includes(needle) ||
          x.type.toLowerCase().includes(needle) ||
          x.detail.toLowerCase().includes(needle) ||
          (x.area?.name ?? "").toLowerCase().includes(needle) ||
          (x.reportedBy?.username ?? "").toLowerCase().includes(needle) ||
          String(x.number ?? "").toLowerCase().includes(needle)
      );
    }

    return out;
  }, [items, q, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filtered, pageIndex, pageSize]
  );

  // Reset page when data or filters change
  const resetPage = () => setPageIndex(0);
  useMemo(() => { resetPage(); }, [filtered.length, pageSize]);

  return (
    <div className="space-y-3">
      {/* -- Filtros -- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por titulo, area, tipo..."
            className="w-full sm:w-[260px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as IncidentStatus | "ALL")}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="OPEN">Pendiente</SelectItem>
              <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
              <SelectItem value="CLOSED">Cerrada</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            ↻
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
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
                  colSpan={7}
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
                  {it.area?.name && (
                    <div className="text-xs text-muted-foreground">
                      {it.area.name}
                    </div>
                  )}
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
