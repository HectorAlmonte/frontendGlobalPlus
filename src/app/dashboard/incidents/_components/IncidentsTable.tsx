import { Button } from "@/components/ui/button";
import { IncidentListItem } from "../_lib/types";
import { statusBadge } from "../_lib/utils";

type Props = {
  loading: boolean;
  items: IncidentListItem[];
  onOpen: (id: string) => void;
};

export default function IncidentsTable({ loading, items, onOpen }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="p-3">Estado</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Título</th>
            <th className="p-3">Reportado</th>
            <th className="p-3 w-[1%]" />
          </tr>
        </thead>

        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-t hover:bg-muted/30">
              <td className="p-3">{statusBadge(it.status)}</td>
              <td className="p-3">{it.type}</td>
              <td className="p-3">
                {it.title ?? <span className="text-muted-foreground">—</span>}
              </td>
              <td className="p-3">
                {it.reportedBy?.username ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="p-3">
                <Button variant="ghost" onClick={() => onOpen(it.id)}>
                  Ver
                </Button>
              </td>
            </tr>
          ))}

          {!loading && items.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                No hay incidencias para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
