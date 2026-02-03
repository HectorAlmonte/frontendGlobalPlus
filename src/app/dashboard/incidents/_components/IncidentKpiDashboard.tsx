"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import type { IncidentStats } from "../_lib/types";

type Props = {
  stats: IncidentStats;
};

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
    amber: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", icon: "text-amber-600 dark:text-amber-400" },
    blue: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400", icon: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
    red: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-600 dark:text-red-400", icon: "text-red-600 dark:text-red-400" },
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
              {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
            </div>
            {detail && <p className="text-[11px] text-muted-foreground truncate">{detail}</p>}
          </div>
          <div className={`rounded-lg ${c.bg} p-2 shrink-0`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

export default function IncidentKpiDashboard({ stats }: Props) {
  const s = stats;

  const open = s.byStatus.OPEN ?? 0;
  const inProgress = s.byStatus.IN_PROGRESS ?? 0;
  const closed = s.byStatus.CLOSED ?? 0;
  const highPriority = s.byPriority.ALTA ?? 0;

  const coverageRate = s.total > 0
    ? Math.round(((closed + inProgress) / s.total) * 100)
    : 0;

  const highPriorityRate = s.total > 0
    ? Math.round((highPriority / s.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total incidencias"
          value={s.total}
          icon={AlertTriangle}
          color="primary"
          detail={`${closed} cerradas`}
        />
        <KpiCard
          label="Tasa de resolucion"
          value={s.resolutionRate}
          suffix="%"
          icon={Target}
          color="emerald"
          detail={`${closed} de ${s.total}`}
        />
        <KpiCard
          label="Fuera de plazo"
          value={s.overdue}
          icon={AlertTriangle}
          color={s.overdue > 0 ? "red" : "emerald"}
          detail={s.overdue > 0 ? "Requieren atencion" : "Todo al dia"}
        />
        <KpiCard
          label="Dias promedio cierre"
          value={s.avgCloseDays}
          icon={Clock}
          color="blue"
          detail="Promedio de cierre"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Abiertas"
          value={open}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          label="En proceso"
          value={inProgress}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          label="Cerradas"
          value={closed}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          label="Alta prioridad"
          value={highPriority}
          icon={Zap}
          color={highPriority > 0 ? "amber" : "emerald"}
          detail="Con prioridad alta"
        />
      </div>

      {/* Progress bars summary */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Tasa de resolucion</span>
                <span className="font-bold">{s.resolutionRate}%</span>
              </div>
              <MiniProgressBar
                value={s.resolutionRate}
                color={s.resolutionRate >= 75 ? "bg-emerald-500" : s.resolutionRate >= 40 ? "bg-primary" : "bg-amber-500"}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Cobertura</span>
                <span className="font-bold">{coverageRate}%</span>
              </div>
              <MiniProgressBar
                value={coverageRate}
                color={coverageRate >= 75 ? "bg-emerald-500" : coverageRate >= 40 ? "bg-blue-500" : "bg-amber-500"}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Alta prioridad</span>
                <span className="font-bold">{highPriorityRate}%</span>
              </div>
              <MiniProgressBar
                value={highPriorityRate}
                color={highPriorityRate <= 20 ? "bg-emerald-500" : highPriorityRate <= 50 ? "bg-amber-500" : "bg-red-500"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
