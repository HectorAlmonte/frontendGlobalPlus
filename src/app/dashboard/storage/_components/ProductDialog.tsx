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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import {
  apiCategoriesForSelect,
  apiCreateProduct,
  apiUpdateProduct,
} from "../_lib/api";
import type { StorageItemKind, StorageProduct, ProductUpdateInput } from "../_lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: StorageProduct | null; // null = create mode
  onSuccess: () => void;
}

const UNITS = ["unid", "kg", "litros", "caja", "pares", "metros", "rollos", "bolsas"];

const initial = {
  name: "",
  code: "",
  categoryId: "",
  kind: "CONSUMABLE" as StorageItemKind,
  description: "",
  unit: "unid",
  minStock: "",
  initialStock: "",
  brand: "",
  model: "",
};

export default function ProductDialog({ open, onOpenChange, product, onSuccess }: Props) {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!product;

  useEffect(() => {
    apiCategoriesForSelect().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) {
      setForm(initial);
      return;
    }
    if (product) {
      setForm({
        name: product.name,
        code: product.code,
        categoryId: product.category.id,
        kind: product.kind,
        description: product.description ?? "",
        unit: product.unit ?? "unid",
        minStock: product.minStock != null ? String(product.minStock) : "",
        initialStock: "",
        brand: product.brand ?? "",
        model: product.model ?? "",
      });
    }
  }, [open, product]);

  const set = (key: keyof typeof initial, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.categoryId) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const update: ProductUpdateInput = {
          name: form.name.trim(),
          categoryId: form.categoryId,
          description: form.description.trim() || undefined,
          unit: form.kind === "CONSUMABLE" ? form.unit : undefined,
          minStock:
            form.kind === "CONSUMABLE" && form.minStock
              ? Number(form.minStock)
              : undefined,
          brand: form.kind === "EQUIPMENT" ? form.brand.trim() || undefined : undefined,
          model: form.kind === "EQUIPMENT" ? form.model.trim() || undefined : undefined,
        };
        await apiUpdateProduct(product!.id, update);
        toast.success("Producto actualizado");
      } else {
        await apiCreateProduct({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase().replace(/\s+/g, "_"),
          categoryId: form.categoryId,
          kind: form.kind,
          description: form.description.trim() || undefined,
          unit: form.kind === "CONSUMABLE" ? form.unit : undefined,
          minStock:
            form.kind === "CONSUMABLE" && form.minStock
              ? Number(form.minStock)
              : undefined,
          initialStock:
            form.kind === "CONSUMABLE" && form.initialStock
              ? Number(form.initialStock)
              : undefined,
          brand: form.kind === "EQUIPMENT" ? form.brand.trim() || undefined : undefined,
          model: form.kind === "EQUIPMENT" ? form.model.trim() || undefined : undefined,
        });
        toast.success("Producto creado");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Nombre */}
          <div className="space-y-1">
            <Label htmlFor="p-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Guantes de nitrilo"
            />
          </div>

          {/* Código */}
          <div className="space-y-1">
            <Label htmlFor="p-code">
              Código <span className="text-destructive">*</span>
            </Label>
            <Input
              id="p-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="Ej. GUANTE_NITRILO"
              disabled={isEdit}
              className={isEdit ? "opacity-60" : ""}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Se normalizará a MAYÚSCULAS_CON_GUIÓN
              </p>
            )}
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label>
              Categoría <span className="text-destructive">*</span>
            </Label>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo (solo en creación) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Tipo <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={form.kind}
                onValueChange={(v) => set("kind", v as StorageItemKind)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CONSUMABLE" id="kind-consumable" />
                  <Label htmlFor="kind-consumable" className="cursor-pointer font-normal">
                    Consumible
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="EQUIPMENT" id="kind-equipment" />
                  <Label htmlFor="kind-equipment" className="cursor-pointer font-normal">
                    Equipo
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-1">
            <Label htmlFor="p-desc">Descripción</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descripción opcional..."
              rows={2}
            />
          </div>

          {/* Consumable-specific fields */}
          {form.kind === "CONSUMABLE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unidad de medida</Label>
                <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-min">Stock mínimo de alerta</Label>
                <Input
                  id="p-min"
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => set("minStock", e.target.value)}
                  placeholder="0"
                />
              </div>
              {!isEdit && (
                <div className="space-y-1">
                  <Label htmlFor="p-initial">Stock inicial</Label>
                  <Input
                    id="p-initial"
                    type="number"
                    min={0}
                    value={form.initialStock}
                    onChange={(e) => set("initialStock", e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Equipment-specific fields */}
          {form.kind === "EQUIPMENT" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-brand">Marca</Label>
                <Input
                  id="p-brand"
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Ej. Makita"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-model">Modelo</Label>
                <Input
                  id="p-model"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="Ej. GA4530"
                />
              </div>
            </div>
          )}

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
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
