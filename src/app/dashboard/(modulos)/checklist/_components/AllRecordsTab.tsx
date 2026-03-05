"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, X, AlertTriangle, ClipboardX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersistedState } from "@/hooks/usePersistedState";
import { apiListRecords } from "../_lib/api";
import {
  StatusBadge,
  getUnitLabel,
  formatRecordDate,
} from "../_lib/utils";
import type { ChecklistRecord, ChecklistStatus, PaginatedRecords } from "../_lib/types";

const STATUS_OPTIONS: { value: ChecklistStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "FILLED", label: "Llenado" },
  { value: "NO_CONFORME", label: "No conforme" },
  { value: "WORKER_SIGNED", label: "Firmado operador" },
  { value: "SECURITY_SIGNED", label: "Firmado seguridad" },
  { value: "COMPLETED", label: "Completado" },
];

const PAGE_SIZE = 15;

interface Props {
  refreshKey?: number;
}

export default function AllRecordsTab({ refreshKey = 0 }: Props) {
  const router = useRouter();

  const [search, setSearch] = usePersistedState("checklist-all-search", "");
  const [status, setStatus] = usePersistedState<ChecklistStatus | "">("checklist-all-status", "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedRecords | null>(null);
  const [loading, setLoading] = useState(true);

  const hasActiveFilters = !!(search || status || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const load = useCallback(() => {
    setLoading(true);
    apiListRecords({
      ...(status ? { status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page,
      limit: PAGE_SIZE,
    })
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, dateFrom, dateTo, page, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [status, dateFrom, dateTo, search]);

  // Filtrado client-side por search (búsqueda sobre el resultado del servidor)
  const records: ChecklistRecord[] = result?.data ?? [];
  const filtered = search
    ? records.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.unit.product.name.toLowerCase().includes(q) ||
          (r.unit.serialNumber?.toLowerCase().includes(q) ?? false) ||
          (r.unit.assetCode?.toLowerCase().includes(q) ?? false) ||
          r.operator.nombres.toLowerCase().includes(q) ||
          r.operator.apellidos.toLowerCase().includes(q)
        );
      })
    : records;

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row gap-2 px-4 py-3 border-b bg-muted/30">
          {/* Search — crece para llenar el espacio */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              data-search-input
              placeholder="Buscar por equipo u operador…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Estado */}
          <Select value={status} onValueChange={(v) => setStatus(v as ChecklistStatus | "")}>
            <SelectTrigger className="h-10 w-full md:w-48 shrink-0">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || "__all__"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Fechas — inline siempre en PC, apiladas en mobile */}
          <div className="flex gap-2 shrink-0">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-full md:w-36"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-full md:w-36"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 gap-1.5 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Desktop table */}
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
            <ClipboardX className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sin resultados</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equipo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Template</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Operador</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Crítico</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/checklist/${rec.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium leading-none">{rec.unit.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getUnitLabel(rec.unit)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {rec.template.name}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {rec.operator.nombres} {rec.operator.apellidos}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRecordDate(rec.date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {rec.hasCriticalIssues && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Crítico
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y">
              {filtered.map((rec) => (
                <button
                  key={rec.id}
                  className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-muted/30 active:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/checklist/${rec.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm leading-none">{rec.unit.product.name}</p>
                      {rec.hasCriticalIssues && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getUnitLabel(rec.unit)} · {formatRecordDate(rec.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.operator.nombres} {rec.operator.apellidos}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={rec.status} />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paginación */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {total} registros · Pág. {page} de {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
