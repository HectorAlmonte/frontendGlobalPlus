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
import { BarChart3, Search, Download, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { apiReporteMensual, apiSearchStaff } from "../../_lib/api";
import { formatMinutes, downloadReportXlsx } from "../../_lib/utils";
import type { ReportMonthlyItem, ReporteMensualParams } from "../../_lib/types";

const PAGE_SIZE = 20;

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ReporteMensualPage() {
  const { user } = useWord();
  const canAccess = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState("");
  const [empResults, setEmpResults] = useState<{ id: string; label: string }[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [rows, setRows] = useState<ReportMonthlyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const search = useCallback(
    async (p: number = 1) => {
      setLoading(true);
      setSearched(true);
      const params: ReporteMensualParams = { year, month, page: p, limit: PAGE_SIZE };
      if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
      try {
        const res = await apiReporteMensual(params);
        setRows(res.data);
        setTotal(res.total);
        setPage(p);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al generar reporte");
      } finally {
        setLoading(false);
      }
    },
    [year, month, selectedEmployeeId]
  );

  function handleEmpSearch(q: string) {
    setEmployeeSearch(q);
    if (q.length < 2) { setEmpResults([]); return; }
    setEmpLoading(true);
    apiSearchStaff(q)
      .then(setEmpResults)
      .catch(() => {})
      .finally(() => setEmpLoading(false));
  }

  function handleExport() {
    if (rows.length === 0) return;
    downloadReportXlsx(
      rows.map((r) => ({
        Empleado: `${r.employee.nombres} ${r.employee.apellidos}`,
        DNI: r.employee.dni,
        Año: r.year,
        Mes: r.month,
        "Días trabajados": r.workedDays,
        "Horas efectivas": formatMinutes(r.effectiveMinutes),
        "Tardanzas": formatMinutes(r.lateMinutes),
        "OT aprobadas": formatMinutes(r.approvedOvertimeMinutes),
        "Banco horas": formatMinutes(r.hourBankBalance),
        "Vacaciones (días)": r.vacationBalance,
      })),
      `reporte_mensual_${year}_${String(month).padStart(2, "0")}`
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
    <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-none">Reporte mensual</h1>
          <p className="text-xs text-muted-foreground mt-1">Resumen consolidado por empleado y mes</p>
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
            <Label>Año <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={now.getFullYear() + 1}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mes <span className="text-red-500">*</span></Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Empleado (opcional)</Label>
            {selectedEmployeeId ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 h-10">
                <span className="flex-1 text-sm truncate">{selectedEmployeeLabel}</span>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setSelectedEmployeeId(""); setSelectedEmployeeLabel(""); setEmployeeSearch(""); }}>✕</button>
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

      {/* Table */}
      {searched && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">{total} empleado(s)</span>
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
            <p className="text-sm text-muted-foreground text-center py-12">Sin resultados</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Empleado</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead className="text-right">Días trab.</TableHead>
                      <TableHead className="text-right">Horas efect.</TableHead>
                      <TableHead className="text-right">Tardanzas</TableHead>
                      <TableHead className="text-right">OT aprob.</TableHead>
                      <TableHead className="text-right">Banco</TableHead>
                      <TableHead className="text-right">Vacaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.employeeId}>
                        <TableCell className="font-medium text-sm">{r.employee.nombres} {r.employee.apellidos}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.employee.dni}</TableCell>
                        <TableCell className="text-right text-sm">{r.workedDays}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatMinutes(r.effectiveMinutes)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${r.lateMinutes > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                          {r.lateMinutes > 0 ? formatMinutes(r.lateMinutes) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{r.approvedOvertimeMinutes > 0 ? formatMinutes(r.approvedOvertimeMinutes) : "—"}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${r.hourBankBalance < 0 ? "text-red-600 dark:text-red-400" : r.hourBankBalance > 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                          {formatMinutes(r.hourBankBalance)}
                        </TableCell>
                        <TableCell className="text-right text-sm">{r.vacationBalance}d</TableCell>
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
