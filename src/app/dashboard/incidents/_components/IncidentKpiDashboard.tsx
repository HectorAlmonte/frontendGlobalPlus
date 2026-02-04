"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Zap,
  RefreshCw,
  Users,
} from "lucide-react";

import type { IncidentPeriod } from "../_lib/types";

/* ── Types from metrics endpoint ── */
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

/* ── Helpers ── */
const formatNumber = (n: number | undefined | null) =>
  new Intl.NumberFormat("es-PE").format(n ?? 0);

const prettyLabel = (s: string) => {
  const raw = String(s || "").trim();
  if (!raw) return "\u2014";
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

const periodToRange = (p: IncidentPeriod): string => {
  const map: Record<IncidentPeriod, string> = {
    "7d": "7D",
    "15d": "15D",
    "1m": "1M",
    "1y": "1A",
    all: "ALL",
  };
  return map[p] || "ALL";
};

/* ── KpiCard ── */
function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  detail,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: any;
  color: string;
  detail?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", icon: "text-primary" },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-950",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-600 dark:text-red-400",
      icon: "text-red-600 dark:text-red-400",
    },
  };

  const c = colorClasses[color] || colorClasses.primary;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {label}
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
              {suffix && (
                <span className="text-sm font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
            {detail && (
              <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
            )}
          </div>
          <div className={`rounded-lg ${c.bg} p-2 shrink-0`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── MiniProgressBar ── */
function MiniProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

/* ── BreakdownBarList ── */
function BreakdownBarList({
  title,
  rows,
}: {
  title: string;
  rows?: BreakdownRow[];
}) {
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
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3 px-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {safe.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic">
            No hay datos disponibles
          </div>
        ) : (
          safe.map((r, idx) => (
            <div key={`${r.label}-${idx}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-foreground truncate">
                  {prettyLabel(r.label)}
                </span>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {r.count}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute h-full rounded-full transition-all ${getColor(r.label)}`}
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════ */
type Props = {
  period: IncidentPeriod;
  fetchMetrics: (args: { range: string }) => Promise<IncidentsMetricsDTO>;
};

export default function IncidentKpiDashboard({ period, fetchMetrics }: Props) {
  const [data, setData] = React.useState<IncidentsMetricsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (p: IncidentPeriod) => {
      try {
        setErrorMsg(null);
        setLoading(true);
        const res = await fetchMetrics({ range: periodToRange(p) });
        setData(res);
      } catch (e: any) {
        console.error("Error loading metrics:", e);
        setErrorMsg(e?.message || "No se pudieron cargar las metricas");
      } finally {
        setLoading(false);
      }
    },
    [fetchMetrics]
  );

  React.useEffect(() => {
    load(period);
  }, [period, load]);

  /* ── Computed values ── */
  const st = data?.status || {
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    overdue: 0,
  };

  const resolutionRate =
    st.total > 0 ? Math.round((st.closed / st.total) * 100) : 0;
  const coverageRate =
    st.total > 0
      ? Math.round(((st.closed + st.inProgress) / st.total) * 100)
      : 0;
  const avgCloseDays = data?.avgCloseDays ?? 0;

  const series = Array.isArray(data?.series) ? data!.series : [];
  const maxTotal = series.length > 0 ? Math.max(...series.map((s) => s.total)) : 0;
  const activeDays = series.filter((s) => s.total > 0).length;

  /* ── Loading skeleton ── */
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (errorMsg && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          No se pudieron cargar las metricas
        </p>
        <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => load(period)}
            disabled={loading}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total incidencias"
          value={st.total}
          icon={AlertTriangle}
          color="primary"
          detail={`${st.closed} cerradas`}
        />
        <KpiCard
          label="Tasa de resolucion"
          value={resolutionRate}
          suffix="%"
          icon={Target}
          color="emerald"
          detail={`${st.closed} de ${st.total}`}
        />
        <KpiCard
          label="Fuera de plazo"
          value={st.overdue}
          icon={AlertTriangle}
          color={st.overdue > 0 ? "red" : "emerald"}
          detail={st.overdue > 0 ? "Requieren atencion" : "Todo al dia"}
        />
        <KpiCard
          label="Dias promedio cierre"
          value={Math.round(Number(avgCloseDays) * 10) / 10}
          icon={Clock}
          color="blue"
          detail="Promedio de cierre"
        />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Abiertas" value={st.open} icon={Clock} color="amber" />
        <KpiCard
          label="En proceso"
          value={st.inProgress}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          label="Cerradas"
          value={st.closed}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          label="Cobertura"
          value={coverageRate}
          suffix="%"
          icon={Zap}
          color={coverageRate >= 75 ? "emerald" : coverageRate >= 40 ? "amber" : "red"}
          detail="Cerradas + en proceso"
        />
      </div>

      {/* ── Progress bars ── */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Tasa de resolucion
                </span>
                <span className="font-bold">{resolutionRate}%</span>
              </div>
              <MiniProgressBar
                value={resolutionRate}
                color={
                  resolutionRate >= 75
                    ? "bg-emerald-500"
                    : resolutionRate >= 40
                    ? "bg-primary"
                    : "bg-amber-500"
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Cobertura</span>
                <span className="font-bold">{coverageRate}%</span>
              </div>
              <MiniProgressBar
                value={coverageRate}
                color={
                  coverageRate >= 75
                    ? "bg-emerald-500"
                    : coverageRate >= 40
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Dias promedio cierre
                </span>
                <span className="font-bold">
                  {Math.round(Number(avgCloseDays) * 10) / 10}d
                </span>
              </div>
              <MiniProgressBar
                value={Math.min(Number(avgCloseDays) * 3, 100)}
                color={
                  Number(avgCloseDays) <= 7
                    ? "bg-emerald-500"
                    : Number(avgCloseDays) <= 15
                    ? "bg-amber-500"
                    : "bg-red-500"
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Actividad temporal ── */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Actividad temporal
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">
                {activeDays} dia(s) con actividad
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => load(period)}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1 pb-2">
            {series.length > 0 ? (
              series.map((p, idx) => {
                const heightPct =
                  maxTotal > 0 ? (p.total / maxTotal) * 100 : 0;
                const minPct = p.total > 0 ? 6 : 0;
                const finalPct = Math.max(heightPct, minPct);

                return (
                  <div
                    key={idx}
                    className="group relative flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div className="absolute -top-7 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-0.5 rounded z-20 whitespace-nowrap">
                      {p.total} inc. ({p.date})
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        p.total === maxTotal && maxTotal > 0
                          ? "bg-primary"
                          : "bg-primary/20 hover:bg-primary/35"
                      }`}
                      style={{ height: `${finalPct}%` }}
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

      {/* ── Top reporteros + Tasa de resolucion card ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top reporteros */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Principales reporteros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.topReporters && data.topReporters.length > 0 ? (
              data.topReporters.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                      {initials(r.name)}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {r.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {formatNumber(r.count)} reporte{r.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                No hay registros
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasa de resolucion highlight */}
        <Card className="border-none shadow-sm bg-slate-950 text-white dark:bg-slate-900">
          <CardContent className="p-5 flex flex-col justify-center h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">
              Tasa de Resolucion
            </p>
            <p className="text-4xl font-extrabold tabular-nums mb-1">
              {resolutionRate}%
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{
                  width: `${resolutionRate}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Incidencias cerradas</span>
              <span className="tabular-nums">
                {formatNumber(st.closed)} / {formatNumber(st.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Desglose por tipo / prioridad / area ── */}
      <Tabs defaultValue="type" className="w-full">
        <TabsList className="bg-muted/50 p-0.5 rounded-lg h-auto gap-0.5 border">
          <TabsTrigger
            value="type"
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
          >
            Por tipo
          </TabsTrigger>
          <TabsTrigger
            value="priority"
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
          >
            Por prioridad
          </TabsTrigger>
          <TabsTrigger
            value="area"
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
          >
            Por area
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <TabsContent value="type" className="m-0">
            <BreakdownBarList title="Categorizacion" rows={data?.byType} />
          </TabsContent>
          <TabsContent value="priority" className="m-0">
            <BreakdownBarList title="Nivel de riesgo" rows={data?.byPriority} />
          </TabsContent>
          <TabsContent value="area" className="m-0">
            <BreakdownBarList title="Ubicacion" rows={data?.byArea} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
