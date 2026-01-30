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
