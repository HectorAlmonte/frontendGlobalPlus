"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { IncidentListItem, IncidentStatus, IncidentPeriod } from "../_lib/types";
import { apiListIncidents } from "../_lib/api";
import { statusBadge } from "../_lib/utils";

/* ── Helpers ── */
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

/* ── Component ── */
type Props = {
  items?: IncidentListItem[]; 
  loading?: boolean;
  onOpen: (id: string) => void;
  refreshKey?: number;
  period?: IncidentPeriod;
  onCreateClick?: () => void;
};

export default function IncidentsTable({
  items,        // 👈 Agrégalo aquí
  loading: loadingProp, // 👈 Agrégalo aquí (le cambio el nombre para no chocar con el estado interno)
  refreshKey,
  period,
  onCreateClick,
  onOpen,
}: Props) {
  const [rows, setRows] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "ALL">("ALL");

  /* ── Pagination ── */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let out = rows;

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
  }, [rows, q, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filtered, pageIndex, pageSize]
  );

  useEffect(() => setPageIndex(0), [filtered, pageSize]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListIncidents({ period });
      setRows(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, period]);

  return (
    <div className="space-y-3">
      {/* ── Filters ── */}
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
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="OPEN">Pendiente</SelectItem>
              <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
              <SelectItem value="CLOSED">Cerrada</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            ↻
          </Button>

          <Button size="sm" onClick={onCreateClick}>
            Nueva
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      {/* ── Table ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Folio</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Titulo</th>
              <th className="px-3 py-2">Reportado</th>
              <th className="px-3 py-2 w-[1%]" />
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={6}
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

                <td className="px-3 py-2">{formatType(it.type)}</td>

                <td className="px-3 py-2">
                  {it.title ? (
                    it.title
                  ) : (
                    <span className="text-muted-foreground">{"\u2014"}</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  {it.reportedBy?.employee ? (
                    `${it.reportedBy.employee.nombres} ${it.reportedBy.employee.apellidos ?? ""}`.trim()
                  ) : (
                    <span className="text-muted-foreground">{"\u2014"}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
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

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="incidents-page-size" className="text-sm font-medium">
            Filas por pagina
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-20 h-8" id="incidents-page-size">
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
