"use client";

import { Package, Clock, CalendarDays } from "lucide-react";
import type { EppStats } from "../_lib/types";

interface Props {
  stats: EppStats | null;
  loading: boolean;
}

export function EppStatsCards({ stats, loading }: Props) {
  const cards = [
    {
      icon: Package,
      label: "Total Entregas",
      value: stats?.total ?? 0,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: Clock,
      label: "Sin Firmar",
      value: stats?.unsigned ?? 0,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: CalendarDays,
      label: "Este Mes",
      value: stats?.thisMonth ?? 0,
      iconColor: "text-green-600",
      iconBg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-card rounded-lg border p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
        >
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${c.iconBg}`}>
            <c.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.iconColor}`} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{c.label}</p>
            <p className="text-xl sm:text-2xl font-semibold">
              {loading ? "—" : c.value.toLocaleString("es-PE")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
