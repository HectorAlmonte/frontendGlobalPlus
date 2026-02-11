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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { apiPatchClosure } from "../_lib/api";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string | null;
  closureDetail: string;
  onSaved: () => void;
};

export default function EditClosureDialog({
  open,
  onOpenChange,
  incidentId,
  closureDetail: initialDetail,
  onSaved,
}: Props) {
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDetail(initialDetail ?? "");
      setErr(null);
    }
  }, [open, initialDetail]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const canSubmit = detail.trim().length >= 3 && !!incidentId;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setErr(null);

    try {
      await apiPatchClosure(incidentId!, { detail: detail.trim() });
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
          <DialogTitle>Editar cierre</DialogTitle>
          <DialogDescription>
            Modifica el detalle del cierre de la incidencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {err && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Detalle de cierre <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={5}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe qué se hizo, resultado, verificación..."
              className="min-h-[120px]"
              disabled={saving}
            />
            {detail.trim().length > 0 && detail.trim().length < 3 && (
              <p className="text-xs text-destructive">
                Mínimo 3 caracteres.
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
