"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

type IncidentPriority = "BAJA" | "MEDIA" | "ALTA";
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

const schema = z.object({
  priority: z.enum(["BAJA", "MEDIA", "ALTA"]),
  dueDate: z
    .union([z.literal(""), z.string()])
    .optional()
    .refine((v) => !v || v === "" || !Number.isNaN(new Date(v).getTime()), {
      message: "Fecha inválida",
    }),
  detail: z.string().min(10, "Describe el correctivo (mín. 10 caracteres)"),
});

type FormValues = z.input<typeof schema>;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

function dateInputToIsoUtc(dateStr?: string | null) {
  const s = String(dateStr || "").trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

async function apiCreateCorrective(incidentId: string, payload: any) {
  const res = await fetch(apiUrl(`/api/incidents/${incidentId}/corrective`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = "Error registrando correctivo";
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

async function apiUploadIncidentFiles(
  incidentId: string,
  files: File[],
  stage: "CORRECTIVE" | "REPORT" | "CLOSURE" = "CORRECTIVE"
) {
  if (!files.length) return;

  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const res = await fetch(apiUrl(`/api/incidents/${incidentId}/files?stage=${stage}`), {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  if (!res.ok) {
    let msg = "Error subiendo evidencias";
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

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

  // ADMIN y SUPERVISOR siempre pueden
  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR") {
    return { allowed: true };
  }

  // SEGURIDAD siempre puede
  if (roleKey === "SEGURIDAD") {
    return { allowed: true };
  }

  // TRABAJADOR: validar turno
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string | null;
  onSaved?: () => void;
  preventCloseWhileSaving?: boolean;
  profile: MeProfile | null; // ✅ NUEVO
  roleKey?: RoleKey; // ✅ NUEVO
};

export default function CorrectiveModal({
  open,
  onOpenChange,
  incidentId,
  onSaved,
  preventCloseWhileSaving = true,
  profile, // ✅ NUEVO
  roleKey, // ✅ NUEVO
}: Props) {
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = React.useState<File[]>([]);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: "MEDIA",
      dueDate: "",
      detail: "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (!open) {
      setErr(null);
      setSaving(false);
      setEvidenceFiles([]);
      form.reset({ priority: "MEDIA", dueDate: "", detail: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ Si intenta abrir sin permiso, cerramos automáticamente
  React.useEffect(() => {
    if (open && !allowed) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allowed]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!incidentId || !allowed) return;

    setSaving(true);
    setErr(null);

    try {
      await apiCreateCorrective(incidentId, {
        priority: values.priority as IncidentPriority,
        dueDate: dateInputToIsoUtc(values.dueDate || "") ?? null,
        detail: values.detail,
      });

      if (evidenceFiles.length) {
        await apiUploadIncidentFiles(incidentId, evidenceFiles, "CORRECTIVE");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && preventCloseWhileSaving && saving) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar correctivo</DialogTitle>
          <DialogDescription>
            Registra la acción correctiva y una fecha tentativa.
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
                    No puedes registrar correctivos en este momento
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

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(v) =>
                form.setValue("priority", v as any, { shouldValidate: true })
              }
              disabled={saving || !allowed}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAJA">Baja</SelectItem>
                <SelectItem value="MEDIA">Media</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
              </SelectContent>
            </Select>

            {form.formState.errors.priority?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.priority.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha tentativa (opcional)</Label>
            <Input
              type="date"
              value={(form.watch("dueDate") as any) || ""}
              onChange={(e) =>
                form.setValue("dueDate", e.target.value as any, {
                  shouldValidate: true,
                })
              }
              disabled={saving || !allowed}
            />
            {form.formState.errors.dueDate?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.dueDate.message as any}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Detalle del correctivo</Label>
            <Textarea
              rows={5}
              placeholder="Describe qué se hará, responsables, materiales, etc."
              value={form.watch("detail")}
              onChange={(e) =>
                form.setValue("detail", e.target.value, { shouldValidate: true })
              }
              disabled={saving || !allowed}
            />
            {form.formState.errors.detail?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.detail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Evidencias (opcional)</Label>
            <Input
              type="file"
              multiple
              accept="image/*,application/pdf"
              disabled={saving || !allowed}
              onChange={(e) => {
                const list = Array.from(e.target.files || []);
                setEvidenceFiles(list);
              }}
            />
            {evidenceFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {evidenceFiles.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !incidentId || !allowed}
          >
            {saving ? "Guardando..." : "Guardar correctivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}