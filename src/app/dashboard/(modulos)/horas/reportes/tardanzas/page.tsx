"use client";

import { useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Search, Download, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { apiReporteTardanzas, apiSearchStaff } from "../../_lib/api";
import { formatMinutes, downloadReportXlsx } from "../../_lib/utils";
import type { ReportTardanzaItem, ReporteTardanzasParams } from "../../_lib/types";

const PAGE_SIZE = 20;

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReporteTardanzasPage() {
  const { user } = useWord();
  const canAccess = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState("");
  const [empResults, setEmpResults] = useState<{ id: string; label: string }[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [rows, setRows] = useState<ReportTardanzaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const search = useCallback(
    async (p: number = 1) => {
      if (!dateFrom || !dateTo) { toast.error("Selecciona el rango de fechas"); return; }
      setLoading(true);
      setSearched(true);
      const params: ReporteTardanzasParams = { dateFrom, dateTo, page: p, limit: PAGE_SIZE };
      if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
      try {
        const res = await apiReporteTardanzas(params);
        setRows(res.data);
        setTotal(res.total);
        setPage(p);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al generar reporte");
      } finally {
        setLoading(false);
      }
    },
    [dateFrom, dateTo, selectedEmployeeId]
  );

  function handleEmpSearch(q: string) {
    setEmployeeSearch(q);
    if (q.length < 2) { setEmpResults([]); return; }
    setEmpLoading(true);
    apiSearchStaff(q).then(setEmpResults).catch(() => {}).finally(() => setEmpLoading(false));
  }

  function handleExport() {
    if (rows.length === 0) return;
    downloadReportXlsx(
      rows.map((r) => ({
        Empleado: `${r.employee.nombres} ${r.employee.apellidos}`,
        DNI: r.employee.dni,
        Fecha: r.date,
        "Tardanza (min)": r.lateMinutes,
        "Prog. (min)": r.scheduledMinutes,
        "Efect. (min)": r.effectiveMinutes,
      })),
      `reporte_tardanzas_${dateFrom}_${dateTo}`
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

  return (
    <div className="space-y-6 px-4 py-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-none">Reporte de tardanzas</h1>
          <p className="text-xs text-muted-foreground mt-1">Registros de ingreso tardío por período</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold leading-none">Filtros</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setSelectedEmployeeId(""); setSelectedEmployeeLabel(""); setEmployeeSearch(""); }}>✕</button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Buscar empleado..." value={employeeSearch} onChange={(e) => handleEmpSearch(e.target.value)} />
                {empResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {empResults.map((e) => (
                      <button key={e.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        onClick={() => { setSelectedEmployeeId(e.id); setSelectedEmployeeLabel(e.label); setEmployeeSearch(""); setEmpResults([]); }}>
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}
                {empLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
              </div>
            )}
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => search(1)}>
              <Search className="h-4 w-4 mr-1.5" />
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">{total} registro(s)</span>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Sin tardanzas en el período</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Empleado</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Tardanza</TableHead>
                      <TableHead className="text-right">Prog.</TableHead>
                      <TableHead className="text-right">Efect.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.recordId}>
                        <TableCell className="font-medium text-sm">{r.employee.nombres} {r.employee.apellidos}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.employee.dni}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-red-600 dark:text-red-400 font-medium">
                          {formatMinutes(r.lateMinutes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatMinutes(r.scheduledMinutes)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatMinutes(r.effectiveMinutes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pageCount > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => search(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs text-muted-foreground">Página {page} de {pageCount}</span>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => search(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
