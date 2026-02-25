"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { apiReturnUnit } from "../_lib/api";
import type { EquipmentCondition } from "../_lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  unitLabel?: string;
  onSuccess: () => void;
}

const initial = { condition: "GOOD" as EquipmentCondition, notes: "" };

export default function ReturnUnitDialog({
  open,
  onOpenChange,
  unitId,
  unitLabel,
  onSuccess,
}: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(initial);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiReturnUnit(unitId, {
        condition: form.condition,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Devolución registrada");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar devolución");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar devolución
            {unitLabel && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {unitLabel}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>
              Condición al devolver <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.condition}
              onValueChange={(v) => setForm((f) => ({ ...f, condition: v as EquipmentCondition }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOD">Buena</SelectItem>
                <SelectItem value="FAIR">Regular</SelectItem>
                <SelectItem value="POOR">Deficiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.condition === "POOR" && (
            <div className="flex items-start gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Al registrar condición <strong>Deficiente</strong>, el equipo pasará
                automáticamente a estado <strong>En mantenimiento</strong>.
              </span>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="return-notes">Notas</Label>
            <Textarea
              id="return-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones sobre el estado del equipo..."
              rows={2}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar devolución
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
