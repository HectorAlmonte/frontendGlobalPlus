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
};

export default function IncidentsFiltersBar({
  q,
  setQ,
  status,
  setStatus,
  loading,
  countLabel,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, detalle, área, DNI..."
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="OPEN">Pendientes</SelectItem>
            <SelectItem value="CORRECTIVE_SET">En correctivo</SelectItem>
            <SelectItem value="CLOSED">Cerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : countLabel}
        </p>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          Refrescar
        </Button>
      </div>

      <Separator />
    </div>
  );
}
