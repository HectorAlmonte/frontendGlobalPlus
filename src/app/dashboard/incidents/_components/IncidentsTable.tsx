import { Button } from "@/components/ui/button";
import { IncidentListItem } from "../_lib/types";
import { statusBadge } from "../_lib/utils";

type Props = {
  loading: boolean;
  items: IncidentListItem[];
  onOpen: (id: string) => void;
};

export default function IncidentsTable({ loading, items, onOpen }: Props) {
  // Función interna para formatear el número (Ej: 1 -> #001)
  const formatFolio = (num?: number) => {
    if (num == null) return "—";
    return `#${String(num).padStart(3, "0")}`;
  };

  // Formatea el tipo a texto legible
  const formatType = (type: string) =>
    type
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="p-3">Folio</th>
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
              {/* Folio */}
              <td className="p-3 font-mono font-medium text-primary">
                {formatFolio(it.number)}
              </td>

              {/* Estado (OPEN | IN_PROGRESS | CLOSED) */}
              <td className="p-3">
                {statusBadge(it.status)}
              </td>

              {/* Tipo */}
              <td className="p-3">
                {formatType(it.type)}
              </td>

              {/* Título */}
              <td className="p-3">
                {it.title ? (
                  it.title
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>

              {/* Reportado por */}
              <td className="p-3">
                {it.reportedBy?.employee ? (
                  `${it.reportedBy.employee.nombres} ${it.reportedBy.employee.apellidos ?? ""}`.trim()
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>

              {/* Acción */}
              <td className="p-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpen(it.id)}
                >
                  Ver
                </Button>
              </td>
            </tr>
          ))}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <tr>
              <td
                className="p-6 text-center text-muted-foreground"
                colSpan={6}
              >
                No hay incidencias para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
