"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import type { TaskStats } from "../_lib/types";

type Props = {
  stats: TaskStats;
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
    violet: { bg: "bg-violet-100 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", icon: "text-violet-600 dark:text-violet-400" },
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

export default function TaskKpiDashboard({ stats }: Props) {
  const s = stats;
  const subtaskRate = s.subtasks.total > 0
    ? Math.round((s.subtasks.completed / s.subtasks.total) * 100)
    : 0;

  const pending = s.byStatus.PENDING ?? 0;
  const inProgress = s.byStatus.IN_PROGRESS ?? 0;
  const completed = s.byStatus.COMPLETED ?? 0;
  const highPriority = s.byPriority.ALTA ?? 0;

  return (
    <div className="space-y-4">
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total tareas"
          value={s.total}
          icon={ListTodo}
          color="primary"
          detail={`${completed} completadas`}
        />
        <KpiCard
          label="Tasa de completado"
          value={s.completionRate}
          suffix="%"
          icon={Target}
          color="emerald"
          detail={`${completed} de ${s.total}`}
        />
        <KpiCard
          label="Vencidas"
          value={s.overdue}
          icon={AlertTriangle}
          color={s.overdue > 0 ? "red" : "emerald"}
          detail={s.overdue > 0 ? "Requieren atencion" : "Todo al dia"}
        />
        <KpiCard
          label="Alta prioridad"
          value={highPriority}
          icon={Zap}
          color={highPriority > 0 ? "amber" : "emerald"}
          detail="Activas sin completar"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Pendientes"
          value={pending}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          label="En progreso"
          value={inProgress}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          label="Personas asignadas"
          value={s.assignees}
          icon={Users}
          color="violet"
        />
        <KpiCard
          label="Subtareas"
          value={`${s.subtasks.completed}/${s.subtasks.total}`}
          icon={CheckCircle2}
          color="emerald"
          detail={`${subtaskRate}% completadas`}
        />
      </div>

      {/* Progress bars summary */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Completado general</span>
                <span className="font-bold">{s.completionRate}%</span>
              </div>
              <MiniProgressBar
                value={s.completionRate}
                color={s.completionRate >= 75 ? "bg-emerald-500" : s.completionRate >= 40 ? "bg-primary" : "bg-amber-500"}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Progreso promedio</span>
                <span className="font-bold">{s.avgProgress}%</span>
              </div>
              <MiniProgressBar
                value={s.avgProgress}
                color={s.avgProgress >= 75 ? "bg-emerald-500" : s.avgProgress >= 40 ? "bg-blue-500" : "bg-amber-500"}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Subtareas completadas</span>
                <span className="font-bold">{subtaskRate}%</span>
              </div>
              <MiniProgressBar
                value={subtaskRate}
                color={subtaskRate >= 75 ? "bg-emerald-500" : subtaskRate >= 40 ? "bg-violet-500" : "bg-amber-500"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
