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
import { apiCreateMovement, apiSearchAllEmployees } from "../_lib/api";
import type { StockMovementType } from "../_lib/types";
import SearchSelect from "../../incidents/_components/SearchSelect";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  productName?: string;
  defaultType?: StockMovementType;
  onSuccess: () => void;
}

const initial = {
  type: "ENTRY" as StockMovementType,
  quantity: "",
  requestedById: "",
  requestedByLabel: "",
  reason: "",
  notes: "",
  reference: "",
};

const MOVEMENT_OPTIONS: { value: StockMovementType; label: string }[] = [
  { value: "ENTRY", label: "Ingreso" },
  { value: "EXIT", label: "Salida" },
  { value: "ADJUSTMENT", label: "Ajuste de inventario" },
  { value: "RETURN", label: "Devolución" },
];

const NEEDS_REQUESTED_BY: StockMovementType[] = ["EXIT", "RETURN"];

export default function MovementDialog({
  open,
  onOpenChange,
  productId,
  productName,
  defaultType = "ENTRY",
  onSuccess,
}: Props) {
  const [form, setForm] = useState({ ...initial, type: defaultType });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm({ ...initial, type: defaultType });
  }, [open, defaultType]);

  const set = <K extends keyof typeof initial>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const needsRequestedBy = NEEDS_REQUESTED_BY.includes(form.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (needsRequestedBy && !form.requestedById) {
      toast.error("Debes indicar quién retira el material");
      return;
    }
    setSaving(true);
    try {
      await apiCreateMovement(productId, {
        type: form.type,
        quantity: Number(form.quantity),
        requestedById: needsRequestedBy ? form.requestedById : undefined,
        reason: form.reason.trim() || undefined,
        notes: form.notes.trim() || undefined,
        reference: form.reference.trim() || undefined,
      });
      toast.success("Movimiento registrado");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar movimiento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar movimiento
            {productName && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {productName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tipo */}
          <div className="space-y-1">
            <Label>
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as StockMovementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-1">
            <Label htmlFor="mv-qty">
              Cantidad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mv-qty"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="1"
            />
          </div>

          {/* Retirado por (EXIT / RETURN) */}
          {needsRequestedBy && (
            <div className="space-y-1">
              <Label>
                Retirado por <span className="text-destructive">*</span>
              </Label>
              <SearchSelect
                value={form.requestedById}
                onChange={(v) => set("requestedById", v)}
                placeholder="Buscar empleado..."
                fetcher={apiSearchAllEmployees}
                allowClear
              />
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1">
            <Label htmlFor="mv-reason">Motivo</Label>
            <Input
              id="mv-reason"
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Motivo del movimiento..."
            />
          </div>

          {/* Referencia */}
          <div className="space-y-1">
            <Label htmlFor="mv-ref">Referencia (incidencia / tarea)</Label>
            <Input
              id="mv-ref"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="Ej. INC-0023 o ID de tarea"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor="mv-notes">Notas</Label>
            <Textarea
              id="mv-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Observaciones adicionales..."
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
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
