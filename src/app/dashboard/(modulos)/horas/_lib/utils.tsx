import React from "react";
import type { DayType, AttendanceRecordStatus, OvertimeStatus } from "./types";

// ─── formatMinutes ────────────────────────────────────────────────────────────

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes === 0) return "0m";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = minutes < 0 ? "-" : "";
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

// ─── Day type labels and colors ───────────────────────────────────────────────

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  WORKED: "Trabajado",
  REST: "Descanso",
  HOLIDAY: "Feriado",
  VACATION: "Vacaciones",
  ABSENT: "Ausente",
  PERMIT: "Permiso",
  MEDICAL_LEAVE: "Licencia médica",
  TRAINING: "Capacitación",
  SUSPENSION: "Suspensión",
  COMPENSATORY_REST: "Descanso compensatorio",
};

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  WORKED: "#22c55e",
  REST: "#94a3b8",
  HOLIDAY: "#a78bfa",
  VACATION: "#38bdf8",
  ABSENT: "#ef4444",
  PERMIT: "#f59e0b",
  MEDICAL_LEAVE: "#fb923c",
  TRAINING: "#6366f1",
  SUSPENSION: "#dc2626",
  COMPENSATORY_REST: "#14b8a6",
};

export const DAY_TYPE_BG: Record<DayType, string> = {
  WORKED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REST: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  HOLIDAY: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  VACATION: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PERMIT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  MEDICAL_LEAVE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  TRAINING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  SUSPENSION: "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  COMPENSATORY_REST: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

// ─── Document reference required ─────────────────────────────────────────────

export const REQUIRE_DOC_REF = new Set<DayType>([
  "VACATION",
  "PERMIT",
  "MEDICAL_LEAVE",
  "TRAINING",
  "SUSPENSION",
  "COMPENSATORY_REST",
]);

export function needsDocRef(dayType: DayType): boolean {
  return REQUIRE_DOC_REF.has(dayType);
}

// ─── Day names ───────────────────────────────────────────────────────────────

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const DAY_NAMES_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// ─── Badges ──────────────────────────────────────────────────────────────────

export function dayTypeBadge(dayType: DayType): React.ReactElement {
  const cls = DAY_TYPE_BG[dayType] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {DAY_TYPE_LABELS[dayType] ?? dayType}
    </span>
  );
}

const STATUS_CLASSES: Record<AttendanceRecordStatus, string> = {
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INCOMPLETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PENDING_OVERTIME:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CLOSED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABELS: Record<AttendanceRecordStatus, string> = {
  COMPLETE: "Completo",
  INCOMPLETE: "Incompleto",
  PENDING_OVERTIME: "OT pendiente",
  CLOSED: "Cerrado",
};

export function statusBadge(status: AttendanceRecordStatus): React.ReactElement {
  const cls =
    STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const OT_STATUS_CLASSES: Record<OvertimeStatus, string> = {
  NONE: "bg-slate-100 text-slate-500",
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const OT_STATUS_LABELS: Record<OvertimeStatus, string> = {
  NONE: "Sin OT",
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export function overtimeStatusBadge(
  status: OvertimeStatus
): React.ReactElement {
  const cls = OT_STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {OT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Export xlsx (browser download from JSON) ─────────────────────────────────

export function downloadReportXlsx(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
