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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { apiAssignUnit, apiSearchAllEmployees } from "../_lib/api";
import SearchSelect from "@/components/shared/SearchSelect";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  unitLabel?: string;
  onSuccess: () => void;
}

const initial = { employeeId: "", notes: "" };

export default function AssignUnitDialog({
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
    if (!form.employeeId) {
      toast.error("Selecciona un empleado");
      return;
    }
    setSaving(true);
    try {
      await apiAssignUnit(unitId, {
        employeeId: form.employeeId,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Equipo asignado");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Asignar equipo
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
              Empleado <span className="text-destructive">*</span>
            </Label>
            <SearchSelect
              value={form.employeeId}
              onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
              placeholder="Buscar empleado..."
              fetcher={apiSearchAllEmployees}
              allowClear
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="assign-notes">Notas</Label>
            <Textarea
              id="assign-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones..."
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
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
