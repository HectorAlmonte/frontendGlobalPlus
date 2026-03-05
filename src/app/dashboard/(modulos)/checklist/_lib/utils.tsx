import type { ChecklistStatus, ItemResult, ItemKind } from "./types";

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  ChecklistStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  ASSIGNED: {
    label: "Asignado",
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gray-100 dark:bg-gray-800",
    dot: "bg-gray-400",
  },
  FILLED: {
    label: "Llenado",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    dot: "bg-blue-500",
  },
  NO_CONFORME: {
    label: "No conforme",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/40",
    dot: "bg-red-500",
  },
  WORKER_SIGNED: {
    label: "Firmado operador",
    color: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    dot: "bg-yellow-500",
  },
  SECURITY_SIGNED: {
    label: "Firmado seguridad",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    dot: "bg-orange-500",
  },
  COMPLETED: {
    label: "Completado",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-100 dark:bg-green-900/40",
    dot: "bg-green-500",
  },
};

/** Badge inline de estado del checklist */
export function StatusBadge({ status }: { status: ChecklistStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Result badge ─────────────────────────────────────────────────────────────

const RESULT_CONFIG: Record<
  ItemResult,
  { label: string; color: string; bg: string }
> = {
  OK: {
    label: "OK",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-100 dark:bg-green-900/40",
  },
  NOK: {
    label: "NOK",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/40",
  },
  NA: {
    label: "N/A",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
};

export function ResultBadge({ result }: { result: ItemResult | null }) {
  if (!result) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = RESULT_CONFIG[result];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Kind label ───────────────────────────────────────────────────────────────

export const KIND_LABELS: Record<ItemKind, string> = {
  BOOLEAN: "Sí / No",
  NUMERIC: "Numérico",
  SELECT: "Selección",
  TEXT: "Texto libre",
};

// ─── Helpers de permiso ───────────────────────────────────────────────────────

import type { ChecklistRecord } from "./types";

/** El registro puede ser llenado (antes de la primera firma) */
export function canFill(status: ChecklistStatus): boolean {
  return ["ASSIGNED", "FILLED", "NO_CONFORME"].includes(status);
}

/** Cualquier usuario autenticado puede capturar la firma del trabajador */
export function canSignWorker(status: ChecklistStatus): boolean {
  return status === "FILLED" || status === "NO_CONFORME";
}

export function canSignSecurity(
  roles: string[],
  status: ChecklistStatus
): boolean {
  return (
    status === "WORKER_SIGNED" &&
    roles.some((r) => ["ADMIN", "SUPERVISOR", "SEGURIDAD"].includes(r))
  );
}

export function canSignSupervisor(
  roles: string[],
  status: ChecklistStatus
): boolean {
  return (
    status === "SECURITY_SIGNED" &&
    roles.some((r) => ["ADMIN", "SUPERVISOR"].includes(r))
  );
}

// ─── Firma image ──────────────────────────────────────────────────────────────

/** Asegura que la firma tenga el prefijo data URI correcto para mostrarla */
export function getSignatureUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("data:")) return value;
  return `data:image/png;base64,${value}`;
}

// ─── Unidad label ─────────────────────────────────────────────────────────────

export function getUnitLabel(unit: {
  serialNumber: string | null;
  assetCode: string | null;
}): string {
  return unit.serialNumber ?? unit.assetCode ?? "Sin código";
}

// ─── Acción pendiente ────────────────────────────────────────────────────────

export function getPendingAction(status: ChecklistStatus): string {
  switch (status) {
    case "ASSIGNED":
    case "FILLED":
    case "NO_CONFORME":
      return "Firma del operador";
    case "WORKER_SIGNED":
      return "Firma de seguridad";
    case "SECURITY_SIGNED":
      return "Firma del supervisor";
    case "COMPLETED":
      return "Completado";
  }
}

// ─── Fecha ───────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formatea un ISO date de solo fecha: "2026-03-03T00:00:00.000Z" → "03/03/2026" */
export function formatRecordDate(iso: string): string {
  // Parsear como fecha local para evitar desfase por timezone
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

export const STATUS_ORDER: ChecklistStatus[] = [
  "ASSIGNED",
  "FILLED",
  "NO_CONFORME",
  "WORKER_SIGNED",
  "SECURITY_SIGNED",
  "COMPLETED",
];

/** Devuelve el índice del estado en el flujo lineal (NO_CONFORME y FILLED al mismo nivel = 1) */
export function getStatusStep(status: ChecklistStatus): number {
  switch (status) {
    case "ASSIGNED": return 0;
    case "FILLED":
    case "NO_CONFORME": return 1;
    case "WORKER_SIGNED": return 2;
    case "SECURITY_SIGNED": return 3;
    case "COMPLETED": return 4;
  }
}

export const STEPPER_STEPS = [
  { label: "Asignado" },
  { label: "Llenado" },
  { label: "Firma operador" },
  { label: "Firma seguridad" },
  { label: "Completado" },
];
