"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { IncidentDetail } from "../_lib/types";
import { normalizeCauses, statusBadge } from "../_lib/utils";
import { apiDeleteIncidentFile } from "../_lib/api";

import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { printIncidentToPdf } from "./incident-print";
import { apiGetModuleDocument } from "@/app/dashboard/(modulos)/documents/_lib/api";
import { formatDate } from "@/app/dashboard/(modulos)/documents/_lib/utils";
import {
  ArrowLeft,
  Printer,
  Pencil,
  Trash2,
  Info,
  FileText,
  Paperclip,
  Wrench,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import SubtaskSection from "./SubtaskSection";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  onEditIncident?: (detail: IncidentDetail) => void;
  onDeleteIncident?: (id: string) => void;
  onEditCorrective?: (id: string) => void;
  onEditClosure?: (id: string) => void;
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

function fileNameOf(f: any) { return f?.originalName || f?.filename || "archivo"; }
function fileMimeOf(f: any) { return f?.mime || f?.mimeType || f?.contentType || "—"; }
function fileStageOf(f: any) { return f?.stage || f?.fileStage || f?.type || "—"; }
function fileUrlOf(f: any) { return (f?.url || f?.publicUrl || f?.path || "") as string; }
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

/* ── Subcomponente: fila de campo ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
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
  onEditIncident,
  onDeleteIncident,
  onEditCorrective,
  onEditClosure,
}: Props) {
  const { user, loadingUser } = useWord();

  const isSupervisor =
    !loadingUser && (hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR") || hasRole(user, "SEGURIDAD"));

  const isClosed = (detail as any)?.status === "CLOSED";

  const canRegisterCorrective =
    !!detail && !loadingUser && isSupervisor &&
    (detail as any).status === "OPEN" && !detailLoading;

  const canCloseIncident =
    !!detail && !loadingUser &&
    (hasRole(user, "ADMIN") || hasRole(user, "SEGURIDAD")) &&
    (detail as any).status === "IN_PROGRESS" && !detailLoading && !closing;

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

  const observedLabel = React.useMemo(() => {
    if (!detail) return "—";
    const snap = (detail as any).observedLabelSnapshot ?? null;
    if ((detail as any).observedKind === "USER") {
      const u = (detail as any).observedEmployee;
      if (!u) return snap ?? "—";
      const full = `${u.nombres ?? ""} ${u.apellidos ?? ""}`.trim();
      const dni = u?.dni;
      if (full && dni) return `${full} (DNI ${dni})`;
      return full || snap || "—";
    }
    if ((detail as any).observedKind === "AREA") return (detail as any).observedArea?.name ?? snap ?? "—";
    if ((detail as any).observedKind === "OTRO") return (detail as any).observedOtherDetail ?? snap ?? "Otro";
    return snap ?? "—";
  }, [detail]);

  const incidentFolio = (detail as any)?.number != null
    ? `#${String((detail as any).number).padStart(3, "0")}`
    : null;
  const incidentIdLabel = selectedId || (detail as any)?.id || "—";
  const incidentDateLabel = fmtDate((detail as any)?.reportedAt || (detail as any)?.createdAt) || "—";

  const filesAll = React.useMemo(() => {
    const arr = (((detail as any)?.files || []) as any[]) ?? [];
    return arr.map((f) => {
      const st = fileStageOf(f);
      return { ...f, __name: fileNameOf(f), __mime: fileMimeOf(f), __stage: st, __stageEs: stageEs(st), __url: fileUrlOf(f), __isImg: isImageFile(f) };
    });
  }, [detail]);

  const corrective = React.useMemo(() => {
    const d: any = detail || {};
    const corr: any = d.corrective || null;
    const correctiveAction = d.correctiveAction ?? corr?.detail ?? null;
    const correctiveDueAt = d.correctiveDueAt ?? corr?.dueDate ?? null;
    const correctiveSetAt = d.correctiveSetAt ?? corr?.createdAt ?? corr?.updatedAt ?? null;
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
      d.status === "IN_PROGRESS" || !!corr || !!correctiveAction || !!correctiveDueAt || !!correctiveSetAt || !!correctiveSetBy;
    const priority = corr?.priority ?? null;
    return { hasCorrective, correctiveAction, correctiveDueAt, correctiveSetAt, correctiveByLabel, priority };
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
    const hasClosure = d.status === "CLOSED" || !!clo || !!closureDetail || !!closedAt || !!closedBy;
    return { hasClosure, closureDetail, closedAt, closedByLabel };
  }, [detail]);

  const [printing, setPrinting] = React.useState(false);

  const handlePrint = React.useCallback(async () => {
    if (!detail) return;
    setPrinting(true);
    try {
      const moduleDoc = await apiGetModuleDocument("INCIDENTS").catch(() => null);
      const header =
        moduleDoc?.currentVersion && !moduleDoc.currentVersion.isExpired
          ? {
              codigo: moduleDoc.code,
              version: String(moduleDoc.currentVersion.versionNumber).padStart(2, "0"),
              fechaVigencia: formatDate(moduleDoc.currentVersion.validFrom),
            }
          : undefined;
      await printIncidentToPdf({ detail, selectedId: incidentIdLabel, header });
    } catch (e) {
      console.error("Error al obtener cabecera dinámica:", e);
      await printIncidentToPdf({ detail, selectedId: incidentIdLabel });
    } finally {
      setPrinting(false);
    }
  }, [detail, incidentIdLabel]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 h-dvh flex flex-col">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 sm:px-6 py-3 flex flex-col gap-3">
          {/* Fila 1: volver + folio + imprimir */}
          <div className="flex items-center justify-between gap-3">
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 -ml-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver al listado</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            </SheetClose>

            <p className="text-sm font-semibold truncate">
              {incidentFolio ? `Incidencia ${incidentFolio}` : "Detalle de incidencia"}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!detail || detailLoading || printing}
              className="gap-1.5 shrink-0"
            >
              {printing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Printer className="h-4 w-4" />}
              <span className="hidden sm:inline">{printing ? "Preparando..." : "Imprimir"}</span>
            </Button>
          </div>

          {/* Fila 2: acciones de flujo */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!canRegisterCorrective}
              title={
                loadingUser ? "Cargando usuario..."
                  : !isSupervisor ? "Solo disponible para Supervisores"
                  : (detail as any)?.status !== "OPEN" ? "Solo cuando la incidencia está abierta"
                  : ""
              }
              onClick={() => { if ((detail as any)?.id) onOpenCorrective?.((detail as any).id); }}
              className={!canRegisterCorrective ? "cursor-not-allowed opacity-60" : ""}
            >
              Registrar correctivo
            </Button>

            <Button
              size="sm"
              disabled={!canCloseIncident}
              title={
                loadingUser ? "Cargando usuario..."
                  : !isSupervisor ? "Solo Supervisor/Admin"
                  : (detail as any)?.status !== "IN_PROGRESS" ? "Primero registra el correctivo"
                  : isClosed ? "Incidencia cerrada"
                  : ""
              }
              onClick={async () => { if ((detail as any)?.id) await onCloseIncident?.((detail as any).id); }}
              className={!canCloseIncident ? "cursor-not-allowed opacity-60" : ""}
            >
              Cerrar incidencia
            </Button>

            <div className="flex-1" />

            {isSupervisor && detail && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar esta incidencia?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se marcará como eliminada y ya no aparecerá en el listado. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDeleteIncident?.((detail as any).id)}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* ── Body scrollable ── */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-3xl mx-auto space-y-4">

            {detailLoading && (
              <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando detalle...
              </div>
            )}

            {!detailLoading && !detail && (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                Selecciona una incidencia para ver el detalle.
              </div>
            )}

            {!detailLoading && detail && (
              <>
                {/* ── Card: Información general ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Info className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold leading-none">Información General</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge((detail as any).status)}
                      {isSupervisor && !isClosed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar incidencia" onClick={() => onEditIncident?.(detail)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Título */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</p>
                      <p className="text-base font-semibold mt-0.5">{(detail as any).title ?? "—"}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <Field label="Folio">
                        <p className="font-semibold font-mono">{incidentFolio ?? incidentIdLabel}</p>
                      </Field>
                      <Field label="Tipo">
                        <Badge variant="outline">{(detail as any).type}</Badge>
                      </Field>
                      <Field label="Fecha de reporte">
                        <p className="font-medium">{incidentDateLabel}</p>
                      </Field>
                      <Field label="Fecha de ocurrencia">
                        <p className="font-medium">{fmtDate((detail as any).occurredAt) ?? "—"}</p>
                      </Field>
                      {(detail as any).locationLabel && (
                        <Field label="Zona / Lugar">
                          <p className="font-medium">{(detail as any).locationLabel}</p>
                        </Field>
                      )}
                      <Field label="Área">
                        <p className="font-medium">
                          {(detail as any).area?.name ?? (detail as any).areaNameSnapshot ?? "—"}
                        </p>
                      </Field>
                      <Field label="Reportado por">
                        <p className="font-medium">{reportedLabel}</p>
                      </Field>
                      <Field label="Observado">
                        <p className="font-medium">{observedLabel}</p>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── Card: Detalle y causas ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold leading-none">Detalle y Causas</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">
                        {(detail as any).detail}
                      </p>
                    </div>
                    {causes.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posibles causas</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {causes.map((c, idx) => (
                            <Badge key={`${c}-${idx}`} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card: Evidencias ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold leading-none">Evidencias</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {filesAll.length > 0 ? `${filesAll.length} archivo${filesAll.length !== 1 ? "s" : ""}` : "Sin archivos"}
                    </span>
                  </div>
                  <div className="p-5">
                    {filesAll.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin evidencias adjuntas.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filesAll.map((f: any) => (
                          <div key={String(f.id || f.__url || f.__name)} className="flex items-center gap-3 rounded-xl border border-muted p-3">
                            {f.__isImg && f.__url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.__url} alt="Evidencia" className="h-14 w-14 rounded-lg border border-muted object-cover shrink-0" />
                            ) : (
                              <div className="h-14 w-14 rounded-lg border border-muted bg-muted/40 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{f.__name}</p>
                              <p className="text-xs text-muted-foreground">{String(f.__stageEs)} · {String(f.__mime)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {f.__url && (
                                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(f.__url, "_blank")}>
                                  Abrir
                                </Button>
                              )}
                              {isSupervisor && f.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar archivo">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar este archivo?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={async () => {
                                          try {
                                            await apiDeleteIncidentFile(f.id);
                                            toast.success("Archivo eliminado");
                                            onReload();
                                          } catch (e: any) {
                                            toast.error(e?.message || "Error al eliminar archivo");
                                          }
                                        }}
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card: Correctivo ── */}
                {corrective.hasCorrective && (
                  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                          <Wrench className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none">Acción Correctiva</p>
                          {corrective.priority && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Prioridad: <span className="font-medium">{String(corrective.priority)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {isSupervisor && !isClosed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar correctivo" onClick={() => onEditCorrective?.((detail as any).id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <Field label="Fecha tentativa">
                        <p className="font-medium">{corrective.correctiveDueAt ? fmtDate(corrective.correctiveDueAt) : "—"}</p>
                      </Field>
                      <Field label="Registrado">
                        <p className="font-medium">{corrective.correctiveSetAt ? fmtDate(corrective.correctiveSetAt) : "—"}</p>
                      </Field>
                      <Field label="Registrado por">
                        <p className="font-medium">{corrective.correctiveByLabel}</p>
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Acción correctiva">
                          <p className="text-sm whitespace-pre-wrap mt-1">
                            {corrective.correctiveAction ? String(corrective.correctiveAction) : "—"}
                          </p>
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Card: Cierre ── */}
                {closure.hasClosure && (
                  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold leading-none">Cierre de Incidencia</p>
                      </div>
                      {isSupervisor && isClosed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar cierre" onClick={() => onEditClosure?.((detail as any).id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <Field label="Fecha de cierre">
                        <p className="font-medium">{closure.closedAt ? fmtDate(closure.closedAt) : "—"}</p>
                      </Field>
                      <Field label="Cerrado por">
                        <p className="font-medium">{closure.closedByLabel}</p>
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Detalle de cierre">
                          <p className="text-sm whitespace-pre-wrap mt-1">
                            {closure.closureDetail ? String(closure.closureDetail) : "—"}
                          </p>
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Objetivos ── */}
                <SubtaskSection
                  incidentId={(detail as any).id}
                  initialSubtasks={(detail as any).subtasks}
                  isSupervisor={isSupervisor}
                  isClosed={isClosed}
                  onReload={onReload}
                />

                <div className="h-4" />
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
