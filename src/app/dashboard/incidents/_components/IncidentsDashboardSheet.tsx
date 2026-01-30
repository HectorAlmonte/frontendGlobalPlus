"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Timer,
  Activity,
  RefreshCw,
  CalendarDays,
  XCircle,
} from "lucide-react";

// --- INTERFACES ---
export type RangeKey = "7D" | "15D" | "1M" | "1A" | "ALL";

export interface MetricsStatus {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  overdue: number;
}

export interface SeriesPoint {
  date: string;
  total: number;
}
export interface TopReporter {
  userId: string;
  name: string;
  count: number;
}
export interface BreakdownRow {
  label: string;
  count: number;
}

export interface IncidentsMetricsDTO {
  range: { from: string | null; to: string | null; key: string };
  status: MetricsStatus;
  series: SeriesPoint[];
  topReporters: TopReporter[];
  byType: BreakdownRow[];
  byPriority: BreakdownRow[];
  byArea: BreakdownRow[];
  avgCloseDays: number | null;
}

interface Props {
  open: boolean;
  onOpenChange?: (v: boolean) => void;
  defaultRange?: RangeKey;
  fetchMetrics?: (args: { range: RangeKey }) => Promise<IncidentsMetricsDTO>;
  data?: IncidentsMetricsDTO | null;
  loading?: boolean;
}

// --- HELPERS ---
const formatNumber = (n: number | undefined | null) =>
  new Intl.NumberFormat("es-PE").format(n ?? 0);

const formatDays = (n: number | null | undefined) => {
  if (n == null || Number.isNaN(Number(n))) return "0d";
  return `${Math.round(Number(n) * 10) / 10}d`;
};

const prettyLabel = (s: string) => {
  const raw = String(s || "").trim();
  if (!raw) return "—";
  const cleaned = raw.replace(/[_\-]+/g, " ").toLowerCase();
  return cleaned.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
};

const initials = (name: string) => {
  const n = String(name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

const formatRangeLabel = (
  r?: { from: string | null; to: string | null; key: string } | null
) => {
  if (!r) return null;
  const key = (r.key || "").toUpperCase();
  const map: Record<string, string> = {
    "7D": "Últimos 7 días",
    "15D": "Últimos 15 días",
    "1M": "Último mes",
    "1A": "Último año",
    "ALL": "Todo",
  };
  const title = map[key] || key;
  if (!r.from || !r.to) return title;
  return `${title} • ${r.from} → ${r.to}`;
};

// --- COMPONENTES AUXILIARES ---
function MiniBarList({ title, rows }: { title: string; rows?: BreakdownRow[] }) {
  const safe = Array.isArray(rows) ? rows : [];
  const max = safe.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  const getColor = (label: string) => {
    const l = String(label || "").toUpperCase();
    if (l === "ALTA" || l === "URGENTE") return "bg-rose-500";
    if (l === "MEDIA") return "bg-amber-500";
    if (l === "BAJA") return "bg-emerald-500";
    return "bg-primary/80";
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3 px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        {safe.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            No hay datos disponibles
          </div>
        ) : (
          safe.map((r, idx) => (
            <div key={`${r.label}-${idx}`} className="group space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground truncate">
                  {prettyLabel(r.label)}
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {r.count}
                </span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.count / max) * 100}%` }}
                  className={`absolute h-full rounded-full ${getColor(r.label)}`}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  hint,
  accent = "blue",
  badge,
}: any) {
  const variants = {
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    green: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    red: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-600 bg-violet-500/10 border-violet-500/20",
    neutral: "text-muted-foreground bg-muted border-border",
  };

  return (
    <Card className="relative overflow-hidden border-border shadow-sm transition-all hover:shadow-md bg-card">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/80 via-primary/30 to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          {hint && <p className="text-[10px] text-muted-foreground/80">{hint}</p>}
        </div>
        <div
          className={`rounded-xl border p-2.5 transition-transform hover:scale-105 ${
            variants[accent as keyof typeof variants] || variants.neutral
          }`}
        >
          <Icon size={16} />
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatNumber(value)}
          </div>
          {badge}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IncidentsDashboardPanel({
  open,
  defaultRange = "7D",
  fetchMetrics,
  data,
  loading,
}: Props) {
  const [range, setRange] = React.useState<RangeKey>(defaultRange);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localData, setLocalData] = React.useState<IncidentsMetricsDTO | null>(
    data ?? null
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isLoading = Boolean(loading ?? localLoading);

  const load = React.useCallback(
    async (selectedRange: RangeKey) => {
      if (!fetchMetrics) return;
      try {
        setErrorMsg(null);
        setLocalLoading(true);
        const res = await fetchMetrics({ range: selectedRange });
        setLocalData(res);
      } catch (e: any) {
        console.error("Error al obtener métricas:", e);
        setErrorMsg(e?.message || "No se pudieron cargar las métricas");
      } finally {
        setLocalLoading(false);
      }
    },
    [fetchMetrics]
  );

  React.useEffect(() => {
    if (open) load(range);
  }, [open, range, load]);

  const status: MetricsStatus =
    localData?.status || { total: 0, open: 0, inProgress: 0, closed: 0, overdue: 0 };

  const series = Array.isArray(localData?.series) ? localData!.series : [];
  const maxTotal = Math.max(...(series.map((s) => s.total) || [0]));
  const activeDays = series.filter((s) => s.total > 0).length;

  const rangeLabel = formatRangeLabel(localData?.range ?? null);

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm overflow-hidden mt-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Dashboard de Incidencias
                </h3>

                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px] font-bold tracking-tighter uppercase"
                >
                  En Vivo
                </Badge>

                {errorMsg ? (
                  <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Error
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {rangeLabel || "Rango seleccionado"}
                <span className="mx-1">•</span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  Análisis de {formatNumber(status.total)} registros
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
          {(["7D", "15D", "1M", "1A", "ALL"] as RangeKey[]).map((r) => (
            <button
              key={r}
              disabled={isLoading}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === r
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {r === "ALL" ? "TODO" : r}
            </button>
          ))}
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => load(range)}
            disabled={isLoading}
            title="Actualizar"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-foreground">
          <p className="text-sm font-semibold">No se pudieron cargar las métricas</p>
          <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
          <div className="mt-3">
            <Button size="sm" onClick={() => load(range)} disabled={isLoading}>
              Reintentar
            </Button>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KPICard
                title="Total Reportado"
                value={status.total}
                icon={TrendingUp}
                accent="blue"
                badge={
                  <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-md">
                    General
                  </Badge>
                }
              />
              <KPICard
                title="Abiertos"
                value={status.open}
                icon={AlertTriangle}
                accent="amber"
                hint="Pendientes de revisión"
              />
              <KPICard
                title="En Proceso"
                value={status.inProgress}
                icon={Timer}
                accent="violet"
                badge={
                  <Badge className="bg-violet-500/10 text-violet-600 border border-violet-500/20 rounded-md">
                    En proceso
                  </Badge>
                }
              />
              <KPICard title="Cerrados" value={status.closed} icon={CheckCircle2} accent="green" />
              <KPICard
                title="Días de Cierre"
                value={localData?.avgCloseDays ?? 0}
                icon={Activity}
                accent="neutral"
                hint="Promedio del rango"
                badge={
                  <span className="text-sm font-bold text-muted-foreground">
                    {formatDays(localData?.avgCloseDays)} prom.
                  </span>
                }
              />
              <KPICard
                title="Fuera de Plazo"
                value={status.overdue}
                icon={AlertTriangle}
                accent={status.overdue > 0 ? "red" : "neutral"}
                hint={status.overdue > 0 ? "Requiere atención" : "Sin pendientes"}
                badge={
                  status.overdue > 0 ? (
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : null
                }
              />
            </div>

            {/* Actividad + Top */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <Card className="xl:col-span-8 border-border overflow-hidden bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Actividad Temporal
                    </CardTitle>
                    <div className="text-[10px] text-muted-foreground">
                      {activeDays} día(s) con actividad • Máx {maxTotal || 0}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex h-36 items-end gap-1.5 pb-2">
                    {series.length > 0 ? (
                      series.map((p, idx) => {
                        const heightPct = maxTotal > 0 ? (p.total / maxTotal) * 100 : 0;
                        const minPct = p.total > 0 ? 6 : 0;
                        const finalPct = Math.max(heightPct, minPct);

                        return (
                          <div
                            key={idx}
                            className="group relative flex-1 flex flex-col items-center justify-end h-full"
                          >
                            <div className="absolute -top-8 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-1 rounded z-20 whitespace-nowrap">
                              {p.total} inc. ({p.date})
                            </div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${finalPct}%` }}
                              className={`w-full rounded-t-md transition-colors ${
                                p.total === maxTotal && maxTotal > 0
                                  ? "bg-primary"
                                  : "bg-primary/20 hover:bg-primary/35"
                              }`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full flex items-center justify-center text-xs text-muted-foreground h-full italic border border-dashed border-border rounded-lg">
                        Sin datos en este rango
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-4 border-border overflow-hidden bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Principales Reporteros
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {localData?.topReporters && localData.topReporters.length > 0 ? (
                        localData.topReporters.map((r, i) => (
                          <TableRow key={i} className="hover:bg-muted/50 border-none">
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-primary">
                                  {initials(r.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold text-foreground">
                                    {r.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatNumber(r.count)} reporte(s)
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-extrabold text-sm py-3 pr-6 tabular-nums text-foreground">
                              {r.count}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-center py-10 text-xs text-muted-foreground italic">
                            No hay registros
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown + tasa */}
            <Tabs defaultValue="type" className="w-full">
              <TabsList className="bg-muted p-1 rounded-xl h-auto gap-1 border border-border">
                <TabsTrigger value="type" className="rounded-lg px-4 py-2 text-xs font-bold">
                  POR TIPO
                </TabsTrigger>
                <TabsTrigger value="priority" className="rounded-lg px-4 py-2 text-xs font-bold">
                  POR PRIORIDAD
                </TabsTrigger>
                <TabsTrigger value="area" className="rounded-lg px-4 py-2 text-xs font-bold">
                  POR ÁREA
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-2">
                  <TabsContent value="type" className="m-0">
                    <MiniBarList title="Categorización" rows={localData?.byType} />
                  </TabsContent>
                  <TabsContent value="priority" className="m-0">
                    <MiniBarList title="Nivel de Riesgo" rows={localData?.byPriority} />
                  </TabsContent>
                  <TabsContent value="area" className="m-0">
                    <MiniBarList title="Ubicación" rows={localData?.byArea} />
                  </TabsContent>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden border border-slate-800/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase mb-2">
                    Tasa de Resolución
                  </p>
                  <h4 className="text-5xl font-extrabold mb-1 tabular-nums">
                    {status.total > 0 ? Math.round((status.closed / status.total) * 100) : 0}%
                  </h4>

                  <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${status.total > 0 ? (status.closed / status.total) * 100 : 0}%`,
                      }}
                      className="bg-emerald-500 h-full transition-all"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-300">
                    <span>Basado en incidencias cerradas</span>
                    <span className="tabular-nums">
                      {formatNumber(status.closed)} / {formatNumber(status.total)}
                    </span>
                  </div>
                </div>
              </div>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
