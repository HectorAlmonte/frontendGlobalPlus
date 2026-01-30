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

type IncidentPriority = "BAJA" | "MEDIA" | "ALTA";

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

// ✅ base del backend (4000)
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// ✅ helper para armar urls: http://localhost:4000 + /api/...
function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p; // fallback (si no hay env)
  return `${API_BASE}${p}`;
}

/**
 * ✅ Convierte "YYYY-MM-DD" a ISO en UTC SIN desfase de zona horaria.
 * Ej: "2026-01-29" -> "2026-01-29T00:00:00.000Z"
 */
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

// ✅ Tu backend lee stage desde req.query.stage
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string | null;
  onSaved?: () => void;
  preventCloseWhileSaving?: boolean;
};

export default function CorrectiveModal({
  open,
  onOpenChange,
  incidentId,
  onSaved,
  preventCloseWhileSaving = true,
}: Props) {
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = React.useState<File[]>([]);

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

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!incidentId) return;

    setSaving(true);
    setErr(null);

    try {
      await apiCreateCorrective(incidentId, {
        priority: values.priority as IncidentPriority,
        // ✅ evita desfase por timezone
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
            Registra la acción correctiva y una fecha tentativa. (Solo Supervisor / Admin)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
            disabled={saving || !incidentId}
          >
            {saving ? "Guardando..." : "Guardar correctivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
