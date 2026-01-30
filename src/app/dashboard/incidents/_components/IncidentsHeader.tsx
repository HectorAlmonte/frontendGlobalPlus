import { CardHeader, CardTitle } from "@/components/ui/card";

type Props = {};

export default function IncidentsHeader({}: Props) {
  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <CardTitle>Reporte de incidencias</CardTitle>
        <p className="text-sm text-muted-foreground">
          Historial, seguimiento, correctivos y levantamientos.
        </p>
      </div>
    </CardHeader>
  );
}
