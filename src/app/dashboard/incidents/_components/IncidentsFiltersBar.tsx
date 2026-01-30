import * as React from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { IncidentStatus } from "../_lib/types";

type Props = {
  q: string;
  setQ: (v: string) => void;

  status: IncidentStatus | "ALL";
  setStatus: (v: IncidentStatus | "ALL") => void;

  loading: boolean;
  countLabel: string;

  onRefresh: () => void;

  // ✅ permite inyectar botones/acciones (ej: "Nueva incidencia")
  rightSlot?: React.ReactNode;
};

export default function IncidentsFiltersBar({
  q,
  setQ,
  status,
  setStatus,
  loading,
  countLabel,
  onRefresh,
  rightSlot,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Buscador + Estado + Acciones */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
        {/* Buscador */}
        <div className="lg:col-span-7">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, detalle, área, DNI..."
          />
        </div>

        {/* Filtro por estado */}
        <div className="lg:col-span-2">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as IncidentStatus | "ALL")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="OPEN">Pendientes</SelectItem>
              <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
              <SelectItem value="CLOSED">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Acciones derecha */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          {rightSlot}
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            Refrescar
          </Button>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : countLabel}
        </p>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {/* espacio para futuros hints */}
        </span>
      </div>

      <Separator />
    </div>
  );
}
