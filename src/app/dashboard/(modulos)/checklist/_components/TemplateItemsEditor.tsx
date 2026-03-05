"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { apiUpdateTemplateItems } from "../_lib/api";
import type { ChecklistTemplate, ItemKind, TemplateItemInput } from "../_lib/types";
import { KIND_LABELS } from "../_lib/utils";

interface LocalItem {
  _key: string;
  label: string;
  description: string;
  kind: ItemKind;
  optionsRaw: string; // textarea con una opción por línea
  isCritical: boolean;
  isRequired: boolean;
}

const newItem = (order: number): LocalItem => ({
  _key: crypto.randomUUID(),
  label: "",
  description: "",
  kind: "BOOLEAN",
  optionsRaw: "",
  isCritical: false,
  isRequired: true,
});

function itemsToInput(items: LocalItem[]): TemplateItemInput[] {
  return items.map((item, i) => ({
    label: item.label.trim(),
    description: item.description.trim() || undefined,
    kind: item.kind,
    options:
      item.kind === "SELECT"
        ? item.optionsRaw
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined,
    isCritical: item.isCritical,
    isRequired: item.isRequired,
    order: i + 1,
  }));
}

interface Props {
  template: ChecklistTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TemplateItemsEditor({ template, onClose, onSaved }: Props) {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Inicializar desde el template
  useEffect(() => {
    if (!template) return;
    if (template.items.length > 0) {
      setItems(
        [...template.items]
          .sort((a, b) => a.order - b.order)
          .map((it) => ({
            _key: it.id,
            label: it.label,
            description: it.description ?? "",
            kind: it.kind,
            optionsRaw: it.options
              ? (JSON.parse(it.options) as string[]).join("\n")
              : "",
            isCritical: it.isCritical,
            isRequired: it.isRequired,
          }))
      );
    } else {
      setItems([newItem(1)]);
    }
  }, [template]);

  const update = (key: string, patch: Partial<LocalItem>) =>
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, ...patch } : it))
    );

  const addItem = () => setItems((prev) => [...prev, newItem(prev.length + 1)]);

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((it) => it._key !== key));

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const validate = (): string | null => {
    if (items.length === 0) return "Agrega al menos un ítem";
    for (const it of items) {
      if (!it.label.trim()) return "Todos los ítems deben tener un nombre";
      if (it.kind === "SELECT") {
        const opts = it.optionsRaw.split("\n").filter((o) => o.trim());
        if (opts.length < 2) return "Los ítems de selección necesitan al menos 2 opciones";
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!template) return;
    setSaving(true);
    try {
      await apiUpdateTemplateItems(template.id, itemsToInput(items));
      toast.success("Ítems guardados correctamente");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar los ítems");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={!!template} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 h-dvh flex flex-col">
        {/* Header sticky */}
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-5 py-4">
          <SheetTitle className="text-base">
            Ítems del template:{" "}
            <span className="text-primary font-normal">{template?.name}</span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Los ítems marcados como{" "}
            <span className="font-semibold text-red-600">Crítico</span> generan
            una alerta de mantenimiento automáticamente si su resultado es NOK.
          </p>
        </SheetHeader>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={item._key}
              className="rounded-xl border bg-card shadow-sm overflow-hidden"
            >
              {/* Item header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                  >
                    ▼
                  </button>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm font-medium flex-1 truncate">
                  {item.label || <span className="text-muted-foreground italic">Sin nombre</span>}
                </p>
                {item.isCritical && (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeItem(item._key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Item body */}
              <div className="p-3 space-y-3">
                {/* Label */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={item.label}
                    onChange={(e) => update(item._key, { label: e.target.value })}
                    placeholder="Ej: Estado de llantas"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Kind + Description en grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de respuesta</Label>
                    <Select
                      value={item.kind}
                      onValueChange={(v) => update(item._key, { kind: v as ItemKind })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(KIND_LABELS) as ItemKind[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {KIND_LABELS[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Descripción (opcional)</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => update(item._key, { description: e.target.value })}
                      placeholder="Instrucción breve"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Opciones SELECT */}
                {item.kind === "SELECT" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Opciones <span className="text-muted-foreground">(una por línea, mín. 2)</span>
                    </Label>
                    <textarea
                      value={item.optionsRaw}
                      onChange={(e) => update(item._key, { optionsRaw: e.target.value })}
                      placeholder={"Bueno\nRegular\nMalo"}
                      rows={3}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                {/* Switches */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={item.isCritical}
                      onCheckedChange={(v) => update(item._key, { isCritical: v })}
                    />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Crítico
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={item.isRequired}
                      onCheckedChange={(v) => update(item._key, { isRequired: v })}
                    />
                    <span className="text-sm">Requerido</span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Add item */}
          <button
            onClick={addItem}
            className="w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 transition-colors py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Agregar ítem
          </button>
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 border-t bg-background px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {items.length} ítem{items.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="h-10">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-10 gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar ítems
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
