"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ClipboardList,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { EppStatsCards } from "./_components/EppStatsCards";
import { EppCreateForm } from "./_components/EppCreateForm";
import { EppDetailSheet } from "./_components/EppDetailSheet";
import { ReasonBadge, formatDateTime } from "./_lib/utils";
import { apiGetEppStats, apiListDeliveries } from "./_lib/api";
import type { EppStats, EppDeliveryRow } from "./_lib/types";

const PAGE_SIZE = 20;

export default function EppPage() {
  const { user } = useWord();
  const canCreate =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const [activeTab, setActiveTab] = useState("historial");

  const [stats, setStats] = useState<EppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [rows, setRows] = useState<EppDeliveryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Load stats
  useEffect(() => {
    setStatsLoading(true);
    apiGetEppStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [refreshKey]);

  // Load deliveries — un solo effect, se dispara ante cualquier cambio
  useEffect(() => {
    setTableLoading(true);
    const params: Record<string, string | number> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (search) params.search = search;
    if (reasonFilter !== "ALL") params.reason = reasonFilter;

    apiListDeliveries(params)
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }, [page, search, reasonFilter, refreshKey]);

  // Reset a página 1 cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [search, reasonFilter]);

  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab("historial");
  };

  const handleSigned = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Entregas de EPP</h1>
          <p className="text-sm text-muted-foreground">
            Equipos de protección personal — constancias y firma digital
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="historial" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Historial
          </TabsTrigger>
          {canCreate && (
            <TabsTrigger value="nueva" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva Entrega
            </TabsTrigger>
          )}
        </TabsList>

        {/* ──────────── TAB: Historial ──────────── */}
        <TabsContent value="historial" className="space-y-4 mt-5">
          {/* Stats */}
          <EppStatsCards stats={stats} loading={statsLoading} />

          {/* Table card */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Card header — filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center px-5 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3 sm:flex-1 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-none">Registro de Entregas</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:shrink-0">
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar trabajador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-full"
                  />
                </div>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-9">
                    <SelectValue placeholder="Motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los motivos</SelectItem>
                    <SelectItem value="PRIMERA_ENTREGA">Primera Entrega</SelectItem>
                    <SelectItem value="RENOVACION">Renovación</SelectItem>
                    <SelectItem value="PERDIDA">Pérdida</SelectItem>
                  </SelectContent>
                </Select>
                {(search || reasonFilter !== "ALL") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearch(""); setReasonFilter("ALL"); }}
                    className="text-muted-foreground h-9 shrink-0"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Table — scroll horizontal en móvil */}
            <div className="overflow-x-auto">
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-14">N°</TableHead>
                    <TableHead>Trabajador</TableHead>
                    <TableHead className="hidden sm:table-cell">Motivo</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha entrega</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Ítems</TableHead>
                    <TableHead className="text-center">Firmado</TableHead>
                    <TableHead className="hidden lg:table-cell">Entregado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-12"
                      >
                        No se encontraron entregas
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                        onClick={() => setSelectedId(row.id)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{String(row.number).padStart(4, "0")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium leading-tight">
                              {row.employee.nombres} {row.employee.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              DNI: {row.employee.dni}
                            </p>
                            {/* Motivo visible solo en móvil */}
                            <div className="mt-1 sm:hidden">
                              <ReasonBadge reason={row.reason} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ReasonBadge reason={row.reason} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(row.deliveredAt)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-semibold">
                            {row.itemCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.isSigned ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs"
                            >
                              Firmado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            >
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {row.createdBy.username}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination — dentro del card, en el footer */}
            {!tableLoading && total > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t text-sm text-muted-foreground">
                <span className="text-center sm:text-left">
                  Mostrando{" "}
                  <strong className="text-foreground">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
                  </strong>{" "}
                  de <strong className="text-foreground">{total}</strong> entregas
                </span>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 rounded border text-xs font-medium min-w-[60px] text-center">
                    {page} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ──────────── TAB: Nueva Entrega ──────────── */}
        {canCreate && (
          <TabsContent value="nueva" className="mt-5">
            <EppCreateForm onCreated={handleCreated} />
          </TabsContent>
        )}
      </Tabs>

      {/* Detail Sheet (aplica en cualquier pestaña) */}
      <EppDetailSheet
        deliveryId={selectedId}
        onClose={() => setSelectedId(null)}
        onSigned={handleSigned}
      />
    </div>
  );
}
