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
import { Loader2 } from "lucide-react";
import { apiStartMaintenance, apiFinishMaintenance } from "../_lib/api";
import type { EquipmentCondition } from "../_lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  unitLabel?: string;
  mode: "start" | "finish";
  onSuccess: () => void;
}

const initial = { condition: "GOOD" as EquipmentCondition, notes: "" };

export default function MaintenanceDialog({
  open,
  onOpenChange,
  unitId,
  unitLabel,
  mode,
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
      if (mode === "start") {
        await apiStartMaintenance(unitId, {
          notes: form.notes.trim() || undefined,
        });
        toast.success("Mantenimiento iniciado");
      } else {
        await apiFinishMaintenance(unitId, {
          condition: form.condition,
          notes: form.notes.trim() || undefined,
        });
        toast.success("Mantenimiento finalizado");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar");
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === "start" ? "Enviar a mantenimiento" : "Finalizar mantenimiento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {title}
            {unitLabel && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {unitLabel}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {mode === "finish" && (
            <div className="space-y-1">
              <Label>
                Condición resultante <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.condition}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, condition: v as EquipmentCondition }))
                }
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
          )}
          <div className="space-y-1">
            <Label htmlFor="maint-notes">
              {mode === "start" ? "Motivo del mantenimiento" : "Notas de lo realizado"}
            </Label>
            <Textarea
              id="maint-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={
                mode === "start"
                  ? "Describir el motivo o falla detectada..."
                  : "Describir las tareas realizadas..."
              }
              rows={3}
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
              {mode === "start" ? "Enviar a mantenimiento" : "Finalizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
