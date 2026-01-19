import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { IncidentDetail } from "../_lib/types";
import { normalizeCauses, statusBadge } from "../_lib/utils";
import EvidenceList from "./EvidenceList";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  selectedId: string | null;

  detailLoading: boolean;
  detail: IncidentDetail | null;

  onReload: () => void;
};

export default function IncidentDetailSheet({
  open,
  onOpenChange,
  selectedId,
  detailLoading,
  detail,
  onReload,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Detalle de incidencia</SheetTitle>
          <SheetDescription>{selectedId ? `ID: ${selectedId}` : "—"}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {detailLoading && (
            <div className="text-sm text-muted-foreground">Cargando detalle...</div>
          )}

          {!detailLoading && detail && (
            <>
              <Card className="border-muted/60">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Estado</p>
                      {statusBadge(detail.status)}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium">{detail.type}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Título</p>
                    <p className="font-medium">{detail.title ?? "—"}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {detail.locationLabel && (
                    <div>
                      <p className="text-xs text-muted-foreground">Zona / Lugar</p>
                      <p className="text-sm">{detail.locationLabel}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Detalle</p>
                    <p className="text-sm leading-relaxed">{detail.detail}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Reportado por</p>
                      <p className="text-sm">{detail.reportedBy?.username ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Observado</p>
                      <p className="text-sm">
                        {detail.observedKind === "USER"
                          ? detail.observedUser?.username ?? "Usuario"
                          : detail.observedKind === "AREA"
                            ? detail.observedArea?.name ?? "Área"
                            : "—"}
                      </p>
                    </div>
                  </div>

                  {normalizeCauses(detail.causes).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Posibles causas</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {normalizeCauses(detail.causes).map((c, idx) => (
                          <Badge key={`${c}-${idx}`} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60">
                <CardHeader>
                  <CardTitle className="text-base">Evidencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <EvidenceList files={detail.files ?? []} />
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onReload} disabled={!selectedId}>
                  Recargar detalle
                </Button>

                <Button variant="secondary" disabled>
                  Registrar correctivo (Supervisor)
                </Button>
                <Button disabled>Cerrar incidencia (Supervisor)</Button>
              </div>
            </>
          )}

          {!detailLoading && !detail && (
            <div className="text-sm text-muted-foreground">
              Selecciona una incidencia para ver el detalle.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
