"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Loader2, Paperclip, X, AlertTriangle } from "lucide-react";

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    shift?: {
      startTime: string;
      endTime: string;
    } | null;
  } | null;
};

type CloseIncidentPayload = {
  detail: string;
  files: File[];
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId?: string | null;
  loading?: boolean;
  onSubmit: (payload: CloseIncidentPayload) => Promise<void> | void;
  preventCloseWhileSaving?: boolean;
  profile: MeProfile | null; // ✅ NUEVO
  roleKey?: RoleKey; // ✅ NUEVO
};

// ✅ Funciones de validación de horarios
function getCurrentLocalTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return { hour, minute };
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function canPerformAction(
  roleKey?: RoleKey,
  profile?: MeProfile | null
): {
  allowed: boolean;
  reason?: string;
} {
  if (!roleKey) {
    return { allowed: false, reason: "No se pudo determinar tu rol" };
  }

  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR") {
    return { allowed: true };
  }

  if (roleKey === "SEGURIDAD") {
    return { allowed: true };
  }

  if (roleKey === "TRABAJADOR") {
    const shift = profile?.employee?.shift;

    if (!shift?.startTime || !shift?.endTime) {
      return {
        allowed: false,
        reason: "No tienes un turno asignado. Contacta a tu supervisor.",
      };
    }

    const { hour, minute } = getCurrentLocalTime();
    const currentMinutes = hour * 60 + minute;
    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return {
        allowed: false,
        reason: `Solo puedes realizar esta acción dentro de tu turno (${shift.startTime} - ${shift.endTime})`,
      };
    }

    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Tu rol no tiene permiso para realizar esta acción",
  };
}

function formatFileSize(bytes: number) {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function CloseIncidentModal({
  open,
  onOpenChange,
  incidentId,
  loading = false,
  onSubmit,
  preventCloseWhileSaving = true,
  profile, // ✅ NUEVO
  roleKey, // ✅ NUEVO
}: Props) {
  const [detail, setDetail] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [touched, setTouched] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // ✅ Validación de permisos
  const validation = React.useMemo(
    () => canPerformAction(roleKey, profile),
    [roleKey, profile]
  );

  const allowed = validation.allowed;
  const blockReason = validation.reason;

  const currentTime = React.useMemo(() => {
    const { hour, minute } = getCurrentLocalTime();
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }, []);

  const canSubmit = !!incidentId && detail.trim().length >= 3 && !loading && allowed;

  React.useEffect(() => {
    if (!open) {
      setDetail("");
      setFiles([]);
      setTouched(false);
      setErr(null);
    }
  }, [open]);

  // ✅ Si intenta abrir sin permiso, cerramos automáticamente
  React.useEffect(() => {
    if (open && !allowed) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allowed]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setFiles((prev) => [...prev, ...picked]);
    e.currentTarget.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setTouched(true);
    setErr(null);
    if (!canSubmit) return;

    try {
      await onSubmit({
        detail: detail.trim(),
        files,
      });
    } catch (e: any) {
      setErr(e?.message || "Error al cerrar la incidencia");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && preventCloseWhileSaving && loading) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cerrar incidencia</DialogTitle>
          <DialogDescription>
            Completa el detalle del cierre. Puedes adjuntar evidencia (opcional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ✅ Mensaje de bloqueo */}
          {!allowed && blockReason ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                <div className="space-y-1.5">
                  <div className="font-medium text-amber-900">
                    No puedes cerrar incidencias en este momento
                  </div>
                  <p className="text-amber-700">{blockReason}</p>
                  {roleKey === "TRABAJADOR" && (
                    <p className="text-xs text-amber-600">
                      Hora actual: <b>{currentTime}</b>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {err && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="rounded-xl border border-muted p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Incidencia</span>
              <Badge variant="secondary" className="font-mono">
                {incidentId || "—"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-detail">
              Detalle de cierre <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="close-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Describe qué se hizo, resultado, verificación, responsables, etc."
              className="min-h-[120px]"
              disabled={loading || !allowed}
            />
            {touched && detail.trim().length < 3 && (
              <p className="text-xs text-destructive">
                El detalle es obligatorio (mínimo 3 caracteres).
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Evidencias (opcional)</Label>

              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-muted px-3 py-2 text-sm hover:bg-muted/50 ${
                  loading || !allowed ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Paperclip className="h-4 w-4" />
                <span>Adjuntar</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={onPickFiles}
                  disabled={loading || !allowed}
                />
              </label>
            </div>

            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se adjuntaron archivos.
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-muted p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(f.size)} • {f.type || "archivo"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeFile(idx)}
                      disabled={loading || !allowed}
                      title="Quitar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-w-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cerrando...
              </span>
            ) : (
              "Cerrar incidencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}