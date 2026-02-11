"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiPatchCorrective } from "../_lib/api";

type Priority = "BAJA" | "MEDIA" | "ALTA";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string | null;
  corrective: {
    priority: Priority;
    dueDate?: string | null;
    detail: string;
  } | null;
  onSaved: () => void;
};

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

export default function EditCorrectiveDialog({
  open,
  onOpenChange,
  incidentId,
  corrective,
  onSaved,
}: Props) {
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const [dueDate, setDueDate] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && corrective) {
      setPriority(corrective.priority);
      setDueDate(toDateInput(corrective.dueDate));
      setDetail(corrective.detail ?? "");
      setErr(null);
    }
  }, [open, corrective]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const canSubmit = detail.trim().length >= 10 && !!incidentId;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setErr(null);

    try {
      await apiPatchCorrective(incidentId!, {
        priority,
        dueDate: dateInputToIsoUtc(dueDate) ?? null,
        detail: detail.trim(),
      });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (saving) return; onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar correctivo</DialogTitle>
          <DialogDescription>
            Modifica la acción correctiva, prioridad o fecha tentativa.
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
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
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
          </div>

          <div className="space-y-2">
            <Label>Fecha tentativa (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Detalle del correctivo</Label>
            <Textarea
              rows={5}
              placeholder="Describe qué se hará, responsables, materiales, etc."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={saving}
            />
            {detail.trim().length > 0 && detail.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Mínimo 10 caracteres.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
