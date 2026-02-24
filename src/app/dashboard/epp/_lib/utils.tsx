import type { EppReason } from "./types";

export const REASON_LABELS: Record<EppReason, string> = {
  PRIMERA_ENTREGA: "Primera Entrega",
  RENOVACION: "Renovación",
  PERDIDA: "Pérdida",
};

const REASON_STYLES: Record<EppReason, string> = {
  PRIMERA_ENTREGA:
    "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400",
  RENOVACION:
    "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  PERDIDA:
    "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

export function ReasonBadge({ reason }: { reason: EppReason }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REASON_STYLES[reason]}`}
    >
      {REASON_LABELS[reason]}
    </span>
  );
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getUnitLabel(unit: {
  serialNumber: string | null;
  assetCode: string | null;
}) {
  return unit.serialNumber ?? unit.assetCode ?? "Sin código";
}
