import { Badge } from "@/components/ui/badge";
import type {
  StorageItemKind,
  StockMovementType,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentLogType,
  StockAlertLevel,
} from "./types";

// ─── Kind badge ───────────────────────────────────────────────────────────────

export function KindBadge({ kind }: { kind: StorageItemKind }) {
  if (kind === "CONSUMABLE") {
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
        Consumible
      </Badge>
    );
  }
  return (
    <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
      Equipo
    </Badge>
  );
}

// ─── Movement type badge ──────────────────────────────────────────────────────

const MOVEMENT_MAP: Record<
  StockMovementType,
  { label: string; className: string }
> = {
  ENTRY: {
    label: "Ingreso",
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  EXIT: {
    label: "Salida",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
  RETURN: {
    label: "Devolución",
    className: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
};

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
  const cfg = MOVEMENT_MAP[type] ?? {
    label: type,
    className: "bg-gray-100 text-gray-700",
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ─── Equipment status badge ───────────────────────────────────────────────────

const STATUS_MAP: Record<EquipmentStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Disponible",
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  ASSIGNED: {
    label: "Asignado",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  IN_MAINTENANCE: {
    label: "En mantenimiento",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  RETIRED: {
    label: "Retirado",
    className: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
  },
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ─── Condition badge ──────────────────────────────────────────────────────────

const CONDITION_MAP: Record<
  EquipmentCondition,
  { label: string; className: string }
> = {
  GOOD: {
    label: "Buena",
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  FAIR: {
    label: "Regular",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
  POOR: {
    label: "Deficiente",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
};

export function ConditionBadge({ condition }: { condition: EquipmentCondition }) {
  const cfg = CONDITION_MAP[condition] ?? {
    label: condition,
    className: "bg-gray-100 text-gray-700",
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ─── Stock alert level badge ──────────────────────────────────────────────────

const ALERT_MAP: Record<StockAlertLevel, { label: string; className: string }> = {
  CRITICAL: {
    label: "CRÍTICO",
    className: "bg-red-600 text-white hover:bg-red-600",
  },
  LOW: {
    label: "BAJO",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  CAUTION: {
    label: "PRECAUCIÓN",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
};

export function StockAlertBadge({ level }: { level: StockAlertLevel }) {
  const cfg = ALERT_MAP[level] ?? {
    label: level,
    className: "bg-gray-100 text-gray-700",
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ─── Equipment log type label ─────────────────────────────────────────────────

const LOG_TYPE_MAP: Record<EquipmentLogType, { label: string; color: string }> = {
  ENTRY: { label: "Ingreso", color: "text-green-600" },
  ASSIGNMENT: { label: "Asignación", color: "text-blue-600" },
  RETURN: { label: "Devolución", color: "text-sky-600" },
  MAINTENANCE: { label: "Mantenimiento", color: "text-orange-600" },
  MAINTENANCE_FINISH: { label: "Fin mantenimiento", color: "text-teal-600" },
  RETIREMENT: { label: "Retiro", color: "text-gray-500" },
};

export function logTypeLabel(type: EquipmentLogType): string {
  return LOG_TYPE_MAP[type]?.label ?? type;
}

export function logTypeColor(type: EquipmentLogType): string {
  return LOG_TYPE_MAP[type]?.color ?? "text-gray-600";
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function employeeName(emp?: {
  nombres: string;
  apellidos: string;
}): string {
  if (!emp) return "—";
  return `${emp.nombres} ${emp.apellidos}`;
}

export function performedByName(pb: {
  username: string;
  employee?: { nombres: string; apellidos: string };
}): string {
  if (pb.employee) return `${pb.employee.nombres} ${pb.employee.apellidos}`;
  return pb.username;
}
