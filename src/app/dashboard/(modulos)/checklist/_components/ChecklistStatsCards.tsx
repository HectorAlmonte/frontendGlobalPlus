"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGetChecklistStats } from "../_lib/api";
import type { ChecklistStats } from "../_lib/types";

interface Props {
  refreshKey?: number;
}

export default function ChecklistStatsCards({ refreshKey = 0 }: Props) {
  const [stats, setStats] = useState<ChecklistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGetChecklistStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const cards = [
    {
      label: "Total registros",
      value: stats?.total ?? 0,
      icon: ClipboardList,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Completados",
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      sub: stats
        ? `${stats.completionRate.toFixed(0)}% tasa`
        : undefined,
    },
    {
      label: "Issues críticos",
      value: stats?.critical ?? 0,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Pendientes firma",
      value: stats?.pendingSignatures ?? 0,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg, sub }) => (
        <div
          key={label}
          className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            {sub && (
              <p className={`text-xs font-medium mt-0.5 ${color}`}>{sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
