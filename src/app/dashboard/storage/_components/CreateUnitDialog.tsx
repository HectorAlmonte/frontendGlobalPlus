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
import { Input } from "@/components/ui/input";
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
import { apiCreateUnit } from "../_lib/api";
import type { EquipmentCondition } from "../_lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  productName?: string;
  onSuccess: () => void;
}

const initial = {
  assetCode: "",
  serialNumber: "",
  condition: "GOOD" as EquipmentCondition,
  notes: "",
};

export default function CreateUnitDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(initial);
  }, [open]);

  const set = (key: keyof typeof initial, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiCreateUnit({
        productId,
        assetCode: form.assetCode.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        condition: form.condition,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Unidad registrada");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al crear unidad");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar unidad
            {productName && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {productName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="unit-asset">Asset Code</Label>
            <Input
              id="unit-asset"
              value={form.assetCode}
              onChange={(e) => set("assetCode", e.target.value)}
              placeholder="Ej. EQ-001"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="unit-serial">N° de serie</Label>
            <Input
              id="unit-serial"
              value={form.serialNumber}
              onChange={(e) => set("serialNumber", e.target.value)}
              placeholder="Número de serie del fabricante"
            />
          </div>
          <div className="space-y-1">
            <Label>
              Condición inicial <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.condition}
              onValueChange={(v) => set("condition", v as EquipmentCondition)}
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
          <div className="space-y-1">
            <Label htmlFor="unit-notes">Notas</Label>
            <Textarea
              id="unit-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
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
              Registrar unidad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
