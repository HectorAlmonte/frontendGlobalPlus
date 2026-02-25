"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Package,
  UserCheck,
  RotateCcw,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiGetUnitLogs } from "../_lib/api";
import type { EquipmentLog, EquipmentLogType } from "../_lib/types";
import {
  ConditionBadge,
  fmtDateTime,
  employeeName,
  performedByName,
  logTypeLabel,
} from "../_lib/utils";

interface Props {
  unitId: string;
  refreshKey?: number;
}

const LOG_ICON: Record<EquipmentLogType, React.ReactNode> = {
  ENTRY: <Package className="h-4 w-4" />,
  ASSIGNMENT: <UserCheck className="h-4 w-4" />,
  RETURN: <RotateCcw className="h-4 w-4" />,
  MAINTENANCE: <Wrench className="h-4 w-4" />,
  MAINTENANCE_FINISH: <CheckCircle2 className="h-4 w-4" />,
  RETIREMENT: <XCircle className="h-4 w-4" />,
};

const LOG_COLOR: Record<EquipmentLogType, string> = {
  ENTRY: "bg-green-100 text-green-600",
  ASSIGNMENT: "bg-blue-100 text-blue-600",
  RETURN: "bg-sky-100 text-sky-600",
  MAINTENANCE: "bg-orange-100 text-orange-600",
  MAINTENANCE_FINISH: "bg-teal-100 text-teal-600",
  RETIREMENT: "bg-gray-100 text-gray-500",
};

export default function UnitTimeline({ unitId, refreshKey }: Props) {
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetUnitLogs(unitId);
      setLogs(data);
    } catch {
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshKey]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">Cargando historial...</p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">Sin eventos registrados</p>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const iconClass =
          LOG_COLOR[log.type] ?? "bg-gray-100 text-gray-500";
        const icon = LOG_ICON[log.type] ?? <Package className="h-4 w-4" />;
        const isLast = i === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-1.5 ${iconClass} shrink-0`}>{icon}</div>
              {!isLast && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            {/* Content */}
            <div className="pb-5 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm">{logTypeLabel(log.type)}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtDateTime(log.createdAt)}
                </span>
              </div>
              {log.employee && (
                <p className="text-sm text-muted-foreground">
                  Empleado: {employeeName(log.employee)}
                  {log.employee.dni && (
                    <span className="ml-1 text-xs">({log.employee.dni})</span>
                  )}
                </p>
              )}
              {log.condition && (
                <div className="mt-0.5">
                  <ConditionBadge condition={log.condition} />
                </div>
              )}
              {log.notes && (
                <p className="text-sm text-muted-foreground mt-0.5">{log.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Registrado por: {performedByName(log.performedBy)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
