import React from "react";
import { Badge } from "@/components/ui/badge";
import { IncidentStatus } from "./types";

export function statusBadge(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return <Badge variant="secondary">Pendiente</Badge>;

    case "IN_PROGRESS":
      return <Badge>En proceso</Badge>;

    case "CLOSED":
      return <Badge variant="outline">Cerrada</Badge>;

    default:
      return <Badge variant="secondary">—</Badge>;
  }
}

export function priorityBadge(priority?: "BAJA" | "MEDIA" | "ALTA" | null) {
  switch (priority) {
    case "ALTA":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
          Alta
        </Badge>
      );
    case "MEDIA":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
          Media
        </Badge>
      );
    case "BAJA":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          Baja
        </Badge>
      );
    default:
      return <Badge variant="secondary">—</Badge>;
  }
}

export function normalizeCauses(raw: any): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}
