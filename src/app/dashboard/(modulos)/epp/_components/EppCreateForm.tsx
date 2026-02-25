"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchSelect from "@/components/shared/SearchSelect";
import { SignaturePadCanvas, SignaturePadRef } from "./SignaturePadCanvas";
import { EppItemRow } from "./EppItemRow";
import { apiCreateDelivery, apiSearchStaffAll } from "../_lib/api";
import type { EppReason, FormItem, StaffOption } from "../_lib/types";

const EMPTY_ITEM = (key: string): FormItem => ({
  _key: key,
  kind: "CONSUMABLE",
  productId: "",
  productLabel: "",
  productUnit: "",
  quantity: 1,
  maxStock: 0,
  equipProductId: "",
  equipProductLabel: "",
  unitId: "",
  unitLabel: "",
  availableUnits: [],
  loadingUnits: false,
  description: "",
});

function toDatetimeLocal(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  onCreated: () => void;
}

export function EppCreateForm({ onCreated }: Props) {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeLabel, setEmployeeLabel] = useState("");
  const [deliveredAt, setDeliveredAt] = useState(toDatetimeLocal());
  const [reason, setReason] = useState<EppReason | "">("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([EMPTY_ITEM("1")]);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignaturePadRef>(null);
  const staffCacheRef = useRef<StaffOption[] | null>(null);

  const resetForm = () => {
    setEmployeeId("");
    setEmployeeLabel("");
    setDeliveredAt(toDatetimeLocal());
    setReason("");
    setNotes("");
    setItems([EMPTY_ITEM(String(Date.now()))]);
    setSigned(false);
    sigRef.current?.clear();
    staffCacheRef.current = null;
  };

  // Refresh datetime default when component mounts / remounts
  useEffect(() => {
    setDeliveredAt(toDatetimeLocal());
  }, []);

  const staffFetcher = useCallback(async (q: string) => {
    if (!staffCacheRef.current) {
      staffCacheRef.current = await apiSearchStaffAll();
    }
    const lower = q.toLowerCase();
    return staffCacheRef.current
      .filter((s) => q === "" || s.label.toLowerCase().includes(lower))
      .map((s) => ({ value: s.id, label: s.label }));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, EMPTY_ITEM(String(Date.now()))]);
  };

  const updateItem = (key: string, patch: Partial<FormItem>) => {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const validate = () => {
    if (!employeeId) { toast.error("Selecciona un trabajador"); return false; }
    if (!reason) { toast.error("Selecciona el motivo"); return false; }
    if (items.length === 0) { toast.error("Agrega al menos un ítem"); return false; }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "CONSUMABLE") {
        if (!it.productId) { toast.error(`Ítem ${i + 1}: selecciona un producto`); return false; }
        if (!it.quantity || it.quantity < 1) { toast.error(`Ítem ${i + 1}: cantidad inválida`); return false; }
        if (it.maxStock > 0 && it.quantity > it.maxStock) {
          toast.error(`Ítem ${i + 1}: cantidad supera el stock disponible (${it.maxStock})`);
          return false;
        }
      } else {
        if (!it.unitId) { toast.error(`Ítem ${i + 1}: selecciona una unidad`); return false; }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const signatureData = sigRef.current?.getDataURL() ?? undefined;
      await apiCreateDelivery({
        employeeId,
        deliveredAt: new Date(deliveredAt).toISOString(),
        reason: reason as EppReason,
        notes: notes || undefined,
        signatureData,
        items: items.map((it) => {
          if (it.kind === "CONSUMABLE") {
            return {
              productId: it.productId,
              quantity: it.quantity,
              description: it.description || undefined,
            };
          }
          return {
            unitId: it.unitId,
            description: it.description || undefined,
          };
        }),
      });
      toast.success("Entrega registrada correctamente");
      resetForm();
      onCreated();
    } catch (err) {
      toast.error("Error al registrar la entrega", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">

      {/* ── Paso 1: Datos de entrega ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Datos de entrega</p>
            <p className="text-xs text-muted-foreground mt-0.5">Trabajador, fecha y motivo</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Trabajador *</Label>
            <SearchSelect
              value={employeeId}
              onChange={(val) => {
                setEmployeeId(val);
                const found = staffCacheRef.current?.find((s) => s.id === val);
                setEmployeeLabel(found?.label ?? "");
              }}
              fetcher={staffFetcher}
              placeholder="Buscar por nombre o DNI..."
              searchPlaceholder="Nombre o DNI..."
              emptyText="Sin resultados"
              selectedLabel={employeeLabel}
              allowClear
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="epp-deliveredAt">Fecha y hora *</Label>
              <Input
                id="epp-deliveredAt"
                type="datetime-local"
                value={deliveredAt}
                onChange={(e) => setDeliveredAt(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as EppReason)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMERA_ENTREGA">Primera Entrega</SelectItem>
                  <SelectItem value="RENOVACION">Renovación</SelectItem>
                  <SelectItem value="PERDIDA">Pérdida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="epp-notes">Observaciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              id="epp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Renovación por vencimiento, entrega de reemplazo..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Paso 2: Ítems EPP ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">Equipos a entregar</p>
              <p className="text-xs text-muted-foreground mt-0.5">Consumibles o equipos individuales</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
            {items.length} ítem{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="p-5 space-y-3">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg text-center gap-1">
              <p className="text-sm font-medium text-muted-foreground">Sin ítems</p>
              <p className="text-xs text-muted-foreground">Usa el botón de abajo para agregar</p>
            </div>
          )}

          {items.map((item, idx) => (
            <EppItemRow
              key={item._key}
              item={item}
              index={idx}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full gap-2 h-10 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Agregar ítem
          </Button>
        </div>
      </div>

      {/* ── Paso 3: Firma digital ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">Firma Digital</p>
              <p className="text-xs text-muted-foreground mt-0.5">Confirma la recepción (opcional al crear)</p>
            </div>
          </div>
          {signed ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Firmado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <XCircle className="h-3.5 w-3.5" />
              Sin firma
            </span>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="rounded-lg overflow-hidden border bg-white">
            <SignaturePadCanvas
              ref={sigRef}
              height={180}
              onBegin={() => setSigned(true)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { sigRef.current?.clear(); setSigned(false); }}
              className="gap-1.5 text-muted-foreground"
            >
              <Eraser className="h-4 w-4" />
              Limpiar firma
            </Button>

            <Button
              size="default"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 min-w-40"
            >
              {submitting ? "Registrando..." : "Registrar Entrega"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
