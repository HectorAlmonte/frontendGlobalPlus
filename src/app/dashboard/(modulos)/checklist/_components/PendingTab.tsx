"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiGetPendingRecords } from "../_lib/api";
import {
  StatusBadge,
  getPendingAction,
  getUnitLabel,
  formatRecordDate,
} from "../_lib/utils";
import type { ChecklistRecord } from "../_lib/types";

interface Props {
  refreshKey?: number;
}

export default function PendingTab({ refreshKey = 0 }: Props) {
  const router = useRouter();
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiGetPendingRecords()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <ClipboardList className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Sin pendientes</p>
        <p className="text-xs">No hay checklists que requieran tu acción</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Desktop table — oculta en mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Operador</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acción pendiente</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((rec) => (
              <tr
                key={rec.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/checklist/${rec.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium leading-none">
                    {rec.unit.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getUnitLabel(rec.unit)}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="leading-none">
                    {rec.operator.nombres} {rec.operator.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.operator.dni}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {formatRecordDate(rec.date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={rec.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground font-medium">
                    {getPendingAction(rec.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — card list */}
      <div className="sm:hidden divide-y">
        {records.map((rec) => (
          <button
            key={rec.id}
            className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-muted/30 active:bg-muted/50 transition-colors"
            onClick={() => router.push(`/dashboard/checklist/${rec.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm leading-none">
                  {rec.unit.product.name}
                </p>
                <StatusBadge status={rec.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getUnitLabel(rec.unit)} · {formatRecordDate(rec.date)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {rec.operator.nombres} {rec.operator.apellidos}
              </p>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1.5">
                → {getPendingAction(rec.status)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
