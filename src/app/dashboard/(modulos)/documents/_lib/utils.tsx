import React from "react";
import { Badge } from "@/components/ui/badge";

export function statusBadge(isExpired?: boolean, isActive?: boolean) {
  if (!isActive) {
    return <Badge variant="secondary">Inactivo</Badge>;
  }
  if (isExpired) {
    return <Badge variant="destructive">Expirado</Badge>;
  }
  return (
    <Badge className="bg-green-600 hover:bg-green-700 text-white">
      Vigente
    </Badge>
  );
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "\u2014";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "\u2014";
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

const MODULE_KEY_LABELS: Record<string, string> = {
  INCIDENTS: "Incidencias",
  INSPECTIONS: "Inspecciones",
  TRAININGS: "Capacitaciones",
  AUDITS: "Auditorías",
};

export function moduleKeyLabel(key: string | null | undefined) {
  if (!key) return "\u2014";
  return MODULE_KEY_LABELS[key] ?? key;
}

export const MODULE_OPTIONS = [
  { value: "__none", label: "Ninguno" },
  { value: "INCIDENTS", label: "Incidencias" },
  { value: "INSPECTIONS", label: "Inspecciones" },
  { value: "TRAININGS", label: "Capacitaciones" },
  { value: "AUDITS", label: "Auditorías" },
];
