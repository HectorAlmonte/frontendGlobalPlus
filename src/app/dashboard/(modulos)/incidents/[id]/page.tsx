"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Upload,
  Users,
} from "lucide-react";
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

import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import type { IncidentDetail } from "../_lib/types";
import { normalizeCauses, statusBadge } from "../_lib/utils";
import {
  apiGetIncidentDetail,
  apiDeleteIncidentFile,
  apiUploadIncidentFiles,
  apiCloseIncidentForm,
  apiDeleteIncident,
  API_BASE,
} from "../_lib/api";
import { printIncidentToPdf } from "../_components/incident-print";
import { apiGetModuleDocument } from "@/app/dashboard/(modulos)/documents/_lib/api";
import { formatDate } from "@/app/dashboard/(modulos)/documents/_lib/utils";
import SubtaskSection from "../_components/SubtaskSection";
import CorrectiveModal from "../_components/CorrectiveModal";
import CloseIncidentModal from "../_components/CloseIncidentModal";
import EditIncidentDialog from "../_components/EditIncidentDialog";
import EditCorrectiveDialog from "../_components/EditCorrectiveDialog";
import EditClosureDialog from "../_components/EditClosureDialog";

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    shift?: { startTime: string; endTime: string } | null;
  } | null;
};

/* ── Helpers ── */
function pickFullName(u: any) {
  const emp = u?.employee;
  const full = `${emp?.nombres ?? ""} ${emp?.apellidos ?? ""}`.trim();
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
  return s || "Adjunto";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, loadingUser } = useWord();

  const [detail, setDetail] = React.useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<MeProfile | null>(null);

  // Modals
  const [correctiveOpen, setCorrectiveOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [editIncidentOpen, setEditIncidentOpen] = React.useState(false);
  const [editCorrectiveOpen, setEditCorrectiveOpen] = React.useState(false);
  const [editClosureOpen, setEditClosureOpen] = React.useState(false);

  // Upload
  const [printing, setPrinting] = React.useState(false);
  const [uploadingReport, setUploadingReport] = React.useState(false);
  const [uploadingCorrective, setUploadingCorrective] = React.useState(false);
  const [uploadingClosure, setUploadingClosure] = React.useState(false);
  const fileInputReportRef = React.useRef<HTMLInputElement>(null);
  const fileInputCorrectiveRef = React.useRef<HTMLInputElement>(null);
  const fileInputClosureRef = React.useRef<HTMLInputElement>(null);

  const fetchDetail = React.useCallback(async () => {
    setDetailLoading(true);
    try {
      const data = await apiGetIncidentDetail(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  React.useEffect(() => { fetchDetail(); }, [fetchDetail]);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/users/me/profile`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setProfile(d); })
      .catch(() => {});
  }, []);

  /* ── Permisos ── */
  const isSupervisor =
    !loadingUser &&
    (hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR") || hasRole(user, "SEGURIDAD"));
  const isClosed = (detail as any)?.status === "CLOSED";
  const canRegisterCorrective =
    !!detail && !loadingUser && isSupervisor &&
    (detail as any).status === "OPEN" && !detailLoading;
  const canCloseIncident =
    !!detail && !loadingUser &&
    (hasRole(user, "ADMIN") || hasRole(user, "SEGURIDAD")) &&
    (detail as any).status === "IN_PROGRESS" && !detailLoading && !closing;

  const roleKey: RoleKey | undefined = profile?.user?.role?.key;

  /* ── Computed ── */
  const incidentFolio = (detail as any)?.number != null
    ? `#${String((detail as any).number).padStart(3, "0")}`
    : null;
  const incidentDateLabel = fmtDate((detail as any)?.reportedAt || (detail as any)?.createdAt) || "—";

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
      d.status === "IN_PROGRESS" || !!corr || !!correctiveAction || !!correctiveDueAt ||
      !!correctiveSetAt || !!correctiveSetBy;
    const priority = corr?.priority ?? null;
    const responsible: { id: string; nombres: string; apellidos: string }[] =
      corr?.responsible ?? [];
    return { hasCorrective, correctiveAction, correctiveDueAt, correctiveSetAt, correctiveByLabel, priority, responsible };
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

  /* ── Handlers ── */
  async function handleCloseSubmit({ detail: closeDetail, files }: { detail: string; files: File[] }) {
    setClosing(true);
    try {
      await apiCloseIncidentForm(id, { detail: closeDetail, files });
      setCloseOpen(false);
      await fetchDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setClosing(false);
    }
  }

  async function handleDelete() {
    try {
      await apiDeleteIncident(id);
      toast.success("Incidencia eliminada");
      router.push("/dashboard/incidents");
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    }
  }

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
      await printIncidentToPdf({ detail, selectedId: id, header });
    } catch {
      await printIncidentToPdf({ detail, selectedId: id });
    } finally {
      setPrinting(false);
    }
  }, [detail, id]);

  function makeUploadHandler(
    stage: "REPORT" | "CORRECTIVE" | "CLOSURE",
    setUploading: (v: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length || !(detail as any)?.id) return;
      setUploading(true);
      try {
        await apiUploadIncidentFiles((detail as any).id, files, stage);
        toast.success(`${files.length} archivo(s) subido(s)`);
        fetchDetail();
      } catch (err: any) {
        toast.error(err?.message || "Error subiendo archivos");
      } finally {
        setUploading(false);
        if (ref.current) ref.current.value = "";
      }
    };
  }

  const handleUploadReport = makeUploadHandler("REPORT", setUploadingReport, fileInputReportRef);
  const handleUploadCorrective = makeUploadHandler("CORRECTIVE", setUploadingCorrective, fileInputCorrectiveRef);
  const handleUploadClosure = makeUploadHandler("CLOSURE", setUploadingClosure, fileInputClosureRef);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 sm:px-6 py-3 flex flex-col gap-3">
        {/* Fila 1: volver + folio + imprimir */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/dashboard/incidents")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al listado</span>
            <span className="sm:hidden">Volver</span>
          </Button>

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
            onClick={() => setCorrectiveOpen(true)}
            className={!canRegisterCorrective ? "cursor-not-allowed opacity-60" : ""}
          >
            Registrar correctivo
          </Button>

          <Button
            size="sm"
            disabled={!canCloseIncident}
            onClick={() => setCloseOpen(true)}
            className={!canCloseIncident ? "cursor-not-allowed opacity-60" : ""}
          >
            Cerrar incidencia
          </Button>

          <div className="flex-1" />

          {isSupervisor && detail && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
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
                    onClick={handleDelete}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-3xl mx-auto space-y-4">

        {detailLoading && (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando detalle...
          </div>
        )}

        {!detailLoading && !detail && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-sm text-muted-foreground">
            <p>No se encontró la incidencia.</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/incidents")}>
              Volver al listado
            </Button>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Editar incidencia"
                      onClick={() => setEditIncidentOpen(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</p>
                  <p className="text-base font-semibold mt-0.5">{(detail as any).title ?? "—"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <Field label="Folio">
                    <p className="font-semibold font-mono">{incidentFolio ?? id}</p>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                    {filesAll.length > 0
                      ? `${filesAll.length} archivo${filesAll.length !== 1 ? "s" : ""}`
                      : "Sin archivos"}
                  </span>
                  {isSupervisor && (
                    <>
                      <input
                        ref={fileInputReportRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleUploadReport}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        disabled={uploadingReport}
                        onClick={() => fileInputReportRef.current?.click()}
                      >
                        {uploadingReport
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Upload className="h-3.5 w-3.5" />}
                        {uploadingReport ? "Subiendo..." : "Agregar"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {filesAll.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin evidencias adjuntas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="h-14 w-14 rounded-lg border border-muted object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg border border-muted bg-muted/40 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{f.__name}</p>
                          <p className="text-xs text-muted-foreground">
                            {String(f.__stageEs)} · {String(f.__mime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {f.__url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => window.open(f.__url, "_blank")}
                            >
                              Abrir
                            </Button>
                          )}
                          {isSupervisor && f.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Eliminar archivo"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar este archivo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      try {
                                        await apiDeleteIncidentFile(f.id);
                                        toast.success("Archivo eliminado");
                                        fetchDetail();
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
                          Prioridad:{" "}
                          <span className="font-medium">{String(corrective.priority)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isSupervisor && (
                      <>
                        <input
                          ref={fileInputCorrectiveRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={handleUploadCorrective}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={uploadingCorrective}
                          onClick={() => fileInputCorrectiveRef.current?.click()}
                        >
                          {uploadingCorrective
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Upload className="h-3.5 w-3.5" />}
                          {uploadingCorrective ? "Subiendo..." : "Agregar"}
                        </Button>
                      </>
                    )}
                    {isSupervisor && !isClosed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Editar correctivo"
                        onClick={() => setEditCorrectiveOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <Field label="Fecha tentativa">
                    <p className="font-medium">
                      {corrective.correctiveDueAt ? fmtDate(corrective.correctiveDueAt) : "—"}
                    </p>
                  </Field>
                  <Field label="Registrado">
                    <p className="font-medium">
                      {corrective.correctiveSetAt ? fmtDate(corrective.correctiveSetAt) : "—"}
                    </p>
                  </Field>
                  <Field label="Registrado por">
                    <p className="font-medium">{corrective.correctiveByLabel}</p>
                  </Field>
                  {corrective.responsible.length > 0 && (
                    <div className="sm:col-span-2">
                      <Field label="Responsables">
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {corrective.responsible.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                            >
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {`${r.nombres} ${r.apellidos}`.trim()}
                            </span>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
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
                  <div className="flex items-center gap-1">
                    {isSupervisor && (
                      <>
                        <input
                          ref={fileInputClosureRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={handleUploadClosure}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={uploadingClosure}
                          onClick={() => fileInputClosureRef.current?.click()}
                        >
                          {uploadingClosure
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Upload className="h-3.5 w-3.5" />}
                          {uploadingClosure ? "Subiendo..." : "Agregar"}
                        </Button>
                      </>
                    )}
                    {isSupervisor && isClosed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Editar cierre"
                        onClick={() => setEditClosureOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <Field label="Fecha de cierre">
                    <p className="font-medium">
                      {closure.closedAt ? fmtDate(closure.closedAt) : "—"}
                    </p>
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
              onReload={fetchDetail}
            />

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <CorrectiveModal
        open={correctiveOpen}
        onOpenChange={setCorrectiveOpen}
        incidentId={id}
        onSaved={fetchDetail}
        profile={profile}
        roleKey={roleKey}
      />

      <CloseIncidentModal
        open={closeOpen}
        onOpenChange={setCloseOpen}
        incidentId={id}
        incidentFolio={incidentFolio}
        loading={closing}
        onSubmit={handleCloseSubmit}
        profile={profile}
        roleKey={roleKey}
      />

      <EditIncidentDialog
        open={editIncidentOpen}
        onOpenChange={setEditIncidentOpen}
        detail={detail}
        onSaved={fetchDetail}
      />

      <EditCorrectiveDialog
        open={editCorrectiveOpen}
        onOpenChange={setEditCorrectiveOpen}
        incidentId={detail?.id ?? null}
        corrective={
          detail
            ? {
                priority: (detail as any).corrective?.priority ?? "MEDIA",
                dueDate:
                  (detail as any).correctiveDueAt ??
                  (detail as any).corrective?.dueDate ??
                  null,
                detail:
                  (detail as any).correctiveAction ??
                  (detail as any).corrective?.detail ??
                  "",
                responsible: (detail as any).corrective?.responsible ?? [],
              }
            : null
        }
        onSaved={fetchDetail}
      />

      <EditClosureDialog
        open={editClosureOpen}
        onOpenChange={setEditClosureOpen}
        incidentId={detail?.id ?? null}
        closureDetail={
          (detail as any)?.closureDetail ??
          (detail as any)?.closure?.detail ??
          ""
        }
        onSaved={fetchDetail}
      />
    </div>
  );
}
