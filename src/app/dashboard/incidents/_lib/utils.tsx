import React from "react";
import { Badge } from "@/components/ui/badge";
import { IncidentStatus } from "./types";

export function statusBadge(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return <Badge variant="secondary">Pendiente</Badge>;
    case "CORRECTIVE_SET":
      return <Badge>En correctivo</Badge>;
    case "CLOSED":
      return <Badge variant="outline">Cerrada</Badge>;
  }
}

export function normalizeCauses(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string")
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
