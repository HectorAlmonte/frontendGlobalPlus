import { CardHeader, CardTitle } from "@/components/ui/card";
import CreateIncidentDialog from "./CreateIncidentDialog";
import { CreateIncidentInput } from "../_lib/types";

type Props = {
  openCreate: boolean;
  setOpenCreate: (v: boolean) => void;
  creating: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<void> | void;
};

export default function IncidentsHeader({
  openCreate,
  setOpenCreate,
  creating,
  onCreate,
}: Props) {
  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <CardTitle>Reporte de incidencias</CardTitle>
        <p className="text-sm text-muted-foreground">
          Historial, seguimiento, correctivos y levantamientos.
        </p>
      </div>

      <CreateIncidentDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        creating={creating}
        onCreate={onCreate}
      />
    </CardHeader>
  );
}
