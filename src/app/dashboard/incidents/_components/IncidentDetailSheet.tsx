"use client";

import * as React from "react";

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
import { Separator } from "@/components/ui/separator";

import { IncidentDetail } from "../_lib/types";
import { normalizeCauses, statusBadge } from "../_lib/utils";

import { useWord } from "@/context/AppContext";
import { printIncidentToPdf } from "./incident-print";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  selectedId: string | null;

  detailLoading: boolean;
  detail: IncidentDetail | null;

  onReload: () => void;

  onOpenCorrective?: (incidentId: string) => void;
  onCloseIncident?: (incidentId: string) => Promise<void> | void;
  closing?: boolean;
};

function pickFullName(u: any) {
  const emp = u?.employee;
  const nombres = emp?.nombres ?? "";
  const apellidos = emp?.apellidos ?? "";
  const full = `${nombres} ${apellidos}`.trim();
  return full || u?.username || u?.id || "—";
}

function fmtDate(d?: any) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileNameOf(f: any) {
  return f?.originalName || f?.filename || "archivo";
}
function fileMimeOf(f: any) {
  return f?.mime || f?.mimeType || f?.contentType || "—";
}
function fileStageOf(f: any) {
  return f?.stage || f?.fileStage || f?.type || "—";
}
function fileUrlOf(f: any) {
  return (f?.url || f?.publicUrl || f?.path || "") as string;
}
function isImageFile(f: any) {
  const imgExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
  return (
    imgExt.test(String(f?.originalName || "")) ||
    imgExt.test(String(f?.filename || "")) ||
    imgExt.test(String(f?.url || "")) ||
    String(f?.mime || "").startsWith("image/") ||
    String(f?.mimeType || "").startsWith("image/")
  );
}
function stageEs(stage: any) {
  const s = String(stage || "").toUpperCase().trim();
  if (s === "REPORT") return "Reporte";
  if (s === "CORRECTIVE") return "Correctivo";
  if (s === "CLOSURE") return "Cierre";
  return s ? s : "Adjunto";
}

export default function IncidentDetailSheet({
  open,
  onOpenChange,
  selectedId,
  detailLoading,
  detail,
  onReload,
  onOpenCorrective,
  onCloseIncident,
  closing,
}: Props) {
  const { user, loadingUser } = useWord();

  const roleKey = (user as any)?.role?.key ?? "";
  const isSupervisor =
    !loadingUser && (roleKey === "SUPERVISOR" || roleKey === "ADMIN");

  const isClosed = (detail as any)?.status === "CLOSED";

  const canRegisterCorrective =
    !!detail &&
    !loadingUser &&
    isSupervisor &&
    (detail as any).status === "OPEN" &&
    !detailLoading;

  const canCloseIncident =
    !!detail &&
    !loadingUser &&
    isSupervisor &&
    (detail as any).status === "IN_PROGRESS" && // ✅ antes: CORRECTIVE_SET
    !detailLoading &&
    !closing;

  const causes = React.useMemo(
    () => (detail ? normalizeCauses((detail as any).causes) : []),
    [detail]
  );

  const reportedLabel = React.useMemo(() => {
    if (!(detail as any)?.reportedBy) return "—";
    const full = pickFullName((detail as any).reportedBy);
    const dni = (detail as any).reportedBy?.username;
    if (dni && full !== dni) return `${full} (DNI ${dni})`;
    return full;
  }, [detail]);

  // ✅ Observado con fallback a observedLabelSnapshot
  const observedLabel = React.useMemo(() => {
    if (!detail) return "—";

    const snap = (detail as any).observedLabelSnapshot ?? null;

    if ((detail as any).observedKind === "USER") {
      const u = (detail as any).observedUser;
      if (!u) return snap ?? "—";
      const full = pickFullName(u);
      const dni = u?.username;
      if (dni && full !== dni) return `${full} (DNI ${dni})`;
      return full || snap || "—";
    }

    if ((detail as any).observedKind === "AREA") {
      return (detail as any).observedArea?.name ?? snap ?? "—";
    }

    return snap ?? "—";
  }, [detail]);

  const incidentIdLabel = selectedId || (detail as any)?.id || "—";
  const incidentDateLabel =
    fmtDate((detail as any)?.reportedAt || (detail as any)?.createdAt) || "—";

  const filesAll = React.useMemo(() => {
    const arr = (((detail as any)?.files || []) as any[]) ?? [];
    return arr.map((f) => {
      const st = fileStageOf(f);
      return {
        ...f,
        __name: fileNameOf(f),
        __mime: fileMimeOf(f),
        __stage: st,
        __stageEs: stageEs(st),
        __url: fileUrlOf(f),
        __isImg: isImageFile(f),
      };
    });
  }, [detail]);

  const corrective = React.useMemo(() => {
    const d: any = detail || {};
    const corr: any = d.corrective || null;

    const correctiveAction = d.correctiveAction ?? corr?.detail ?? null;
    const correctiveDueAt = d.correctiveDueAt ?? corr?.dueDate ?? null;
    const correctiveSetAt =
      d.correctiveSetAt ?? corr?.createdAt ?? corr?.updatedAt ?? null;
    const correctiveSetBy = d.correctiveSetBy ?? corr?.createdBy ?? null;

    const correctiveByLabel = correctiveSetBy
      ? (() => {
          const full = pickFullName(correctiveSetBy);
          const dni = correctiveSetBy?.username;
          if (dni && full !== dni) return `${full} (DNI ${dni})`;
          return full;
        })()
      : "—";

    const hasCorrective =
      d.status === "IN_PROGRESS" || // ✅ antes: CORRECTIVE_SET
      !!corr ||
      !!correctiveAction ||
      !!correctiveDueAt ||
      !!correctiveSetAt ||
      !!correctiveSetBy;

    const priority = corr?.priority ?? null;

    return {
      hasCorrective,
      correctiveAction,
      correctiveDueAt,
      correctiveSetAt,
      correctiveByLabel,
      priority,
    };
  }, [detail]);

  const closure = React.useMemo(() => {
    const d: any = detail || {};
    const clo: any = d.closure || null;

    const closureDetail = d.closureDetail ?? clo?.detail ?? null;
    const closedAt = d.closedAt ?? clo?.createdAt ?? null;
    const closedBy = d.closedBy ?? clo?.closedBy ?? null;

    const closedByLabel = closedBy
      ? (() => {
          const full = pickFullName(closedBy);
          const dni = closedBy?.username;
          if (dni && full !== dni) return `${full} (DNI ${dni})`;
          return full;
        })()
      : "—";

    const hasClosure =
      d.status === "CLOSED" || !!clo || !!closureDetail || !!closedAt || !!closedBy;

    return {
      hasClosure,
      closureDetail,
      closedAt,
      closedByLabel,
    };
  }, [detail]);

  const btnInteractive =
    "transition-all duration-150 hover:shadow-sm active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const handlePrint = React.useCallback(() => {
    if (!detail) return;
    printIncidentToPdf({ detail, selectedId: incidentIdLabel });
  }, [detail, incidentIdLabel]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 h-dvh flex flex-col">
        {/* ===== HEADER STICKY ===== */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>Detalle de incidencia</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span className="text-xs">ID: {incidentIdLabel}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {incidentDateLabel}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={onReload}
                disabled={!selectedId || detailLoading}
                className={`${btnInteractive} ${
                  !selectedId || detailLoading
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                Recargar
              </Button>

              <Button
                variant="secondary"
                onClick={handlePrint}
                disabled={!detail || detailLoading}
                className={`${btnInteractive} ${
                  !detail || detailLoading
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-muted/70"
                }`}
              >
                Imprimir / PDF
              </Button>

              <div className="flex-1" />

              <Button
                variant="secondary"
                disabled={!canRegisterCorrective}
                title={
                  loadingUser
                    ? "Cargando usuario..."
                    : !isSupervisor
                    ? "Solo disponible para Supervisores"
                    : (detail as any)?.status !== "OPEN"
                    ? "Solo disponible cuando la incidencia está abierta"
                    : ""
                }
                onClick={() => {
                  if (!(detail as any)?.id) return;
                  onOpenCorrective?.((detail as any).id);
                }}
                className={`${btnInteractive} ${
                  !canRegisterCorrective
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-muted/70"
                }`}
              >
                Registrar correctivo
              </Button>

              <Button
                disabled={!canCloseIncident}
                title={
                  loadingUser
                    ? "Cargando usuario..."
                    : !isSupervisor
                    ? "Solo Supervisor/Admin"
                    : (detail as any)?.status !== "IN_PROGRESS"
                    ? "Primero registra el correctivo"
                    : isClosed
                    ? "Incidencia cerrada"
                    : ""
                }
                onClick={async () => {
                  if (!(detail as any)?.id) return;
                  await onCloseIncident?.((detail as any).id);
                }}
                className={`${btnInteractive} ${
                  !canCloseIncident
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:brightness-110"
                }`}
              >
                Cerrar incidencia
              </Button>
            </div>
          </div>
        </div>

        {/* ===== BODY SCROLL ===== */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {detailLoading && (
              <div className="text-sm text-muted-foreground">
                Cargando detalle...
              </div>
            )}

            {!detailLoading && !detail && (
              <div className="text-sm text-muted-foreground">
                Selecciona una incidencia para ver el detalle.
              </div>
            )}

            {!detailLoading && detail && (
              <>
                <Card className="border-muted/60">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Estado</p>
                        {statusBadge((detail as any).status)}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="font-semibold tracking-wide">
                          {(detail as any).type}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Título</p>
                      <p className="text-base font-semibold">
                        {(detail as any).title ?? "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          ID de incidencia
                        </p>
                        <p className="font-medium">{incidentIdLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Fecha de reporte
                        </p>
                        <p className="font-medium">{incidentDateLabel}</p>
                      </div>
                    </div>

                    <Separator />
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(detail as any).locationLabel ? (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Zona / Lugar
                          </p>
                          <p className="text-sm">
                            {(detail as any).locationLabel}
                          </p>
                        </div>
                      ) : null}

                      <div>
                        <p className="text-xs text-muted-foreground">Área</p>
                        <p className="text-sm">
                          {(detail as any).area?.name ??
                            (detail as any).areaNameSnapshot ??
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Reportado por
                        </p>
                        <p className="text-sm">{reportedLabel}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Observado</p>
                        <p className="text-sm">{observedLabel}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Detalle</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {(detail as any).detail}
                      </p>
                    </div>

                    {causes.length > 0 ? (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Posibles causas
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {causes.map((c, idx) => (
                            <Badge key={`${c}-${idx}`} variant="secondary">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Evidencias</p>
                        <span className="text-xs text-muted-foreground">
                          {filesAll.length > 0
                            ? `${filesAll.length} archivo(s)`
                            : "—"}
                        </span>
                      </div>

                      {filesAll.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Sin evidencias adjuntas.
                        </p>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filesAll.map((f: any) => (
                            <div
                              key={String(f.id || f.__url || f.__name)}
                              className="flex items-center gap-3 rounded-xl border border-muted p-3"
                            >
                              {f.__isImg && f.__url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={f.__url}
                                  alt="Evidencia"
                                  className="h-14 w-14 rounded-lg border border-muted object-cover"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-lg border border-muted bg-muted/40" />
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {f.__name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {String(f.__stageEs)} • {String(f.__mime)}
                                </p>
                              </div>

                              {f.__url ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => window.open(f.__url, "_blank")}
                                >
                                  Abrir
                                </Button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {corrective.hasCorrective && (
                  <Card className="border-muted/60 mt-5">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base">Correctivo</CardTitle>
                      {corrective.priority ? (
                        <p className="text-xs text-muted-foreground">
                          Prioridad:{" "}
                          <span className="font-medium">
                            {String(corrective.priority)}
                          </span>
                        </p>
                      ) : null}
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Fecha tentativa
                        </p>
                        <p className="text-sm">
                          {corrective.correctiveDueAt
                            ? fmtDate(corrective.correctiveDueAt)
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Registrado</p>
                        <p className="text-sm">
                          {corrective.correctiveSetAt
                            ? fmtDate(corrective.correctiveSetAt)
                            : "—"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Registrado por
                        </p>
                        <p className="text-sm">{corrective.correctiveByLabel}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Acción correctiva
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {corrective.correctiveAction
                            ? String(corrective.correctiveAction)
                            : "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {closure.hasClosure && (
                  <Card className="border-muted/60 mt-5">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base">
                        Cierre de incidencia
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Estado final: <span className="font-medium">CLOSED</span>
                      </p>
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Fecha de cierre
                        </p>
                        <p className="text-sm">
                          {closure.closedAt ? fmtDate(closure.closedAt) : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Cerrado por</p>
                        <p className="text-sm">{closure.closedByLabel}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Detalle de cierre
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {closure.closureDetail
                            ? String(closure.closureDetail)
                            : "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
