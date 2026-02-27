"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  RotateCcw,
  Edit2,
} from "lucide-react";
import {
  apiGetAsistenciaDay,
  apiAddPunch,
  apiApproveOvertime,
  apiRejectOvertime,
  apiOverrideDay,
  apiDeleteOverride,
  apiPatchAsistencia,
} from "../../_lib/api";
import {
  formatMinutes,
  dayTypeBadge,
  statusBadge,
  overtimeStatusBadge,
  DAY_TYPE_LABELS,
  needsDocRef,
} from "../../_lib/utils";
import type {
  AttendanceRecord,
  DayType,
  OverrideDayInput,
  PatchAsistenciaInput,
} from "../../_lib/types";

const OVERRIDE_DAY_TYPES: DayType[] = [
  "REST", "HOLIDAY", "VACATION", "ABSENT", "PERMIT", "MEDICAL_LEAVE",
  "TRAINING", "SUSPENSION", "COMPENSATORY_REST",
];

function formatDateDisplay(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPunchTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DayDetailPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;
  const canWrite = isAdmin || isSupervisor;

  const params = useParams<{ employeeId: string; date: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPunchDialog, setShowPunchDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showOtDialog, setShowOtDialog] = useState(false);
  const [showPatchDialog, setShowPatchDialog] = useState(false);
  const [otAction, setOtAction] = useState<"approve" | "reject">("approve");

  // Punch form
  const [punchDatetime, setPunchDatetime] = useState("");
  const [punchNotes, setPunchNotes] = useState("");

  // Override form
  const [overrideDayType, setOverrideDayType] = useState<DayType>("REST");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [overrideDocRef, setOverrideDocRef] = useState("");

  // OT form
  const [otNotes, setOtNotes] = useState("");

  // Patch form
  const [patchEffective, setPatchEffective] = useState("");
  const [patchOtEffective, setPatchOtEffective] = useState("");
  const [patchNotes, setPatchNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!params.employeeId || !params.date) return;
    setLoading(true);
    try {
      const rec = await apiGetAsistenciaDay(params.employeeId, params.date);
      setRecord(rec);
    } catch {
      toast.error("No se pudo cargar el registro del día");
    } finally {
      setLoading(false);
    }
  }, [params.employeeId, params.date]);

  useEffect(() => {
    if (!canAccess) return;
    loadRecord();
  }, [canAccess, loadRecord]);

  async function handleAddPunch() {
    if (!punchDatetime || !params.employeeId) return;
    setSubmitting(true);
    try {
      await apiAddPunch({
        employeeId: params.employeeId,
        punchedAt: new Date(punchDatetime).toISOString(),
        notes: punchNotes.trim() || undefined,
      });
      toast.success("Fichaje agregado");
      setShowPunchDialog(false);
      setPunchDatetime("");
      setPunchNotes("");
      loadRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar fichaje");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOverride() {
    if (!overrideNotes.trim()) { toast.error("Las notas son obligatorias"); return; }
    if (needsDocRef(overrideDayType) && !overrideDocRef.trim()) {
      toast.error("La referencia documental es obligatoria para este tipo");
      return;
    }
    setSubmitting(true);
    try {
      const body: OverrideDayInput = {
        dayType: overrideDayType,
        notes: overrideNotes.trim(),
        documentRef: overrideDocRef.trim() || undefined,
      };
      await apiOverrideDay(params.employeeId!, params.date!, body);
      toast.success("Override aplicado");
      setShowOverrideDialog(false);
      loadRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar override");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteOverride() {
    setSubmitting(true);
    try {
      await apiDeleteOverride(params.employeeId!, params.date!);
      toast.success("Override revertido");
      loadRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al revertir");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtAction() {
    if (!params.employeeId || !params.date) return;
    if (otAction === "reject" && !otNotes.trim()) { toast.error("El motivo del rechazo es obligatorio"); return; }
    setSubmitting(true);
    try {
      if (otAction === "approve") {
        await apiApproveOvertime(params.employeeId, params.date, { notes: otNotes.trim() || undefined });
        toast.success("Horas extra aprobadas");
      } else {
        await apiRejectOvertime(params.employeeId, params.date, { notes: otNotes.trim() });
        toast.success("Horas extra rechazadas");
      }
      setShowOtDialog(false);
      setOtNotes("");
      loadRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar OT");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePatch() {
    if (!patchNotes.trim()) { toast.error("Las notas son obligatorias"); return; }
    setSubmitting(true);
    try {
      const body: PatchAsistenciaInput = {
        notes: patchNotes.trim(),
        ...(patchEffective !== "" ? { effectiveMinutes: Number(patchEffective) } : {}),
        ...(patchOtEffective !== "" ? { overtimeEffectiveMinutes: Number(patchOtEffective) } : {}),
      };
      await apiPatchAsistencia(params.employeeId!, params.date!, body);
      toast.success("Corrección aplicada");
      setShowPatchDialog(false);
      setPatchEffective("");
      setPatchOtEffective("");
      setPatchNotes("");
      loadRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar corrección");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold leading-none capitalize">
            {params.date ? formatDateDisplay(params.date) : "Detalle del día"}
          </h1>
          {record && (
            <p className="text-xs text-muted-foreground mt-1">
              {record.employee.nombres} {record.employee.apellidos} · DNI {record.employee.dni}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !record ? (
        <div className="rounded-xl border bg-muted/30 flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <Clock className="h-10 w-10" />
          <p className="text-sm">Sin registro para este día</p>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold leading-none">Resumen del día</p>
              {record.isHoliday && (
                <span className="ml-1 flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                  <Star className="h-3 w-3" />Feriado
                </span>
              )}
              {record.isNightShift && (
                <span className="ml-1 text-xs text-indigo-600 dark:text-indigo-400">Nocturno</span>
              )}
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoItem label="Tipo de día">{dayTypeBadge(record.dayType)}</InfoItem>
              <InfoItem label="Estado">{statusBadge(record.status)}</InfoItem>
              <InfoItem label="Horas programadas">{formatMinutes(record.scheduledMinutes)}</InfoItem>
              <InfoItem label="Horas efectivas">{formatMinutes(record.effectiveMinutes)}</InfoItem>
              <InfoItem label="Tardanza" className={record.lateMinutes > 0 ? "text-red-600 dark:text-red-400" : ""}>
                {record.lateMinutes > 0 ? formatMinutes(record.lateMinutes) : "—"}
              </InfoItem>
              <InfoItem label="OT bruta">{record.overtimeRawMinutes > 0 ? formatMinutes(record.overtimeRawMinutes) : "—"}</InfoItem>
              <InfoItem label="OT efectiva">{record.overtimeEffectiveMinutes > 0 ? formatMinutes(record.overtimeEffectiveMinutes) : "—"}</InfoItem>
              <InfoItem label="Multiplicador">×{record.overtimeMultiplier}</InfoItem>
              <InfoItem label="Estado OT">{overtimeStatusBadge(record.overtimeStatus)}</InfoItem>
              {record.documentRef && (
                <InfoItem label="Ref. documental" className="col-span-2">{record.documentRef}</InfoItem>
              )}
              {record.overrideNotes && (
                <InfoItem label="Notas override" className="col-span-2 sm:col-span-3">{record.overrideNotes}</InfoItem>
              )}
            </div>
            {canWrite && (
              <div className="flex flex-wrap gap-2 px-5 py-3 border-t bg-muted/20">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                  setOverrideDayType("REST");
                  setOverrideNotes("");
                  setOverrideDocRef("");
                  setShowOverrideDialog(true);
                }}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Override tipo día
                </Button>
                {record.overrideNotes && isAdmin && (
                  <Button size="sm" variant="outline" className="text-xs text-muted-foreground" onClick={handleDeleteOverride} disabled={submitting}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Revertir override
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Punches */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold leading-none">Fichajes</p>
                <span className="text-xs text-muted-foreground">{record.punches?.length ?? 0}</span>
              </div>
              {canWrite && (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                  setPunchDatetime(`${params.date}T08:00`);
                  setPunchNotes("");
                  setShowPunchDialog(true);
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar fichaje
                </Button>
              )}
            </div>
            {!record.punches || record.punches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin fichajes</p>
            ) : (
              <div className="divide-y">
                {record.punches.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium font-mono">{formatPunchTime(p.punchedAt)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.source} {p.createdBy ? `· ${p.createdBy.username}` : ""}
                        {p.notes ? ` · ${p.notes}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overtime action */}
          {record.overtimeStatus === "PENDING" && canWrite && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 shadow-sm p-5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">
                Horas extra pendientes de aprobación — {formatMinutes(record.overtimeRawMinutes)} ×{record.overtimeMultiplier}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => { setOtAction("approve"); setOtNotes(""); setShowOtDialog(true); }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Aprobar OT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400"
                  onClick={() => { setOtAction("reject"); setOtNotes(""); setShowOtDialog(true); }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Rechazar OT
                </Button>
              </div>
            </div>
          )}

          {/* Manual correction (admin only) */}
          {isAdmin && (
            <details className="rounded-xl border bg-card shadow-sm overflow-hidden group">
              <summary className="flex items-center justify-between px-5 py-4 bg-muted/30 cursor-pointer text-sm font-semibold list-none">
                <span>Corrección manual</span>
                <span className="text-xs text-muted-foreground font-normal">Solo ADMIN</span>
              </summary>
              <div className="p-5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPatchEffective(String(record.effectiveMinutes));
                    setPatchOtEffective(String(record.overtimeEffectiveMinutes));
                    setPatchNotes("");
                    setShowPatchDialog(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1.5" />
                  Editar minutos
                </Button>
              </div>
            </details>
          )}
        </>
      )}

      {/* Punch Dialog */}
      <Dialog open={showPunchDialog} onOpenChange={(o) => { if (!o) setShowPunchDialog(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar fichaje</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pDt">Fecha y hora <span className="text-red-500">*</span></Label>
              <Input id="pDt" type="datetime-local" value={punchDatetime} onChange={(e) => setPunchDatetime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pNotes">Notas <span className="text-red-500">*</span></Label>
              <Textarea id="pNotes" value={punchNotes} onChange={(e) => setPunchNotes(e.target.value)} rows={2} placeholder="Motivo del fichaje manual..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPunchDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddPunch} disabled={submitting || !punchDatetime || !punchNotes.trim()}>
              {submitting ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={(o) => { if (!o) setShowOverrideDialog(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override tipo de día</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de día <span className="text-red-500">*</span></Label>
              <Select value={overrideDayType} onValueChange={(v) => setOverrideDayType(v as DayType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_DAY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DAY_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsDocRef(overrideDayType) && (
              <div className="space-y-1.5">
                <Label htmlFor="oDocRef">Referencia documental <span className="text-red-500">*</span></Label>
                <Input id="oDocRef" value={overrideDocRef} onChange={(e) => setOverrideDocRef(e.target.value)} placeholder="N° resolución, constancia, etc." />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="oNotes">Notas <span className="text-red-500">*</span></Label>
              <Textarea id="oNotes" value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} rows={3} placeholder="Justificación del cambio..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>Cancelar</Button>
            <Button onClick={handleOverride} disabled={submitting}>
              {submitting ? "Guardando..." : "Aplicar override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OT Dialog */}
      <Dialog open={showOtDialog} onOpenChange={(o) => { if (!o) setShowOtDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{otAction === "approve" ? "Aprobar horas extra" : "Rechazar horas extra"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {record && (
              <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm">
                OT bruta: <strong>{formatMinutes(record.overtimeRawMinutes)}</strong> × {record.overtimeMultiplier}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="otNotes">
                {otAction === "reject" ? <>Motivo <span className="text-red-500">*</span></> : "Notas (opcional)"}
              </Label>
              <Textarea id="otNotes" value={otNotes} onChange={(e) => setOtNotes(e.target.value)} rows={3} placeholder={otAction === "reject" ? "Motivo del rechazo..." : "Observaciones..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleOtAction}
              disabled={submitting || (otAction === "reject" && !otNotes.trim())}
              className={otAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              variant={otAction === "reject" ? "destructive" : "default"}
            >
              {submitting ? "Procesando..." : otAction === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patch Dialog */}
      <Dialog open={showPatchDialog} onOpenChange={(o) => { if (!o) setShowPatchDialog(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Corrección manual de minutos</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pEff">Minutos efectivos</Label>
                <Input id="pEff" type="number" value={patchEffective} onChange={(e) => setPatchEffective(e.target.value)} min={0} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pOtEff">Minutos OT efectivos</Label>
                <Input id="pOtEff" type="number" value={patchOtEffective} onChange={(e) => setPatchOtEffective(e.target.value)} min={0} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patchNotes">Notas <span className="text-red-500">*</span></Label>
              <Textarea id="patchNotes" value={patchNotes} onChange={(e) => setPatchNotes(e.target.value)} rows={3} placeholder="Justificación de la corrección..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatchDialog(false)}>Cancelar</Button>
            <Button onClick={handlePatch} disabled={submitting || !patchNotes.trim()}>
              {submitting ? "Guardando..." : "Guardar corrección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className={`text-sm font-medium ${className}`}>{children}</div>
    </div>
  );
}
