"use client";

import { useEffect } from "react";
import { Trash2, Loader2 } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EppProductCombobox } from "./EppProductCombobox";
import { apiGetAvailableUnits } from "../_lib/api";
import type { FormItem, ProductOption } from "../_lib/types";

interface Props {
  item: FormItem;
  index: number;
  onUpdate: (key: string, patch: Partial<FormItem>) => void;
  onRemove: (key: string) => void;
}

export function EppItemRow({ item, index, onUpdate, onRemove }: Props) {
  // Load available units when equipProductId changes
  useEffect(() => {
    if (item.kind !== "EQUIPMENT" || !item.equipProductId) return;
    onUpdate(item._key, { loadingUnits: true, availableUnits: [], unitId: "", unitLabel: "" });
    apiGetAvailableUnits(item.equipProductId)
      .then((units) => {
        const mapped = units.map((u) => ({
          id: u.id,
          label: u.serialNumber ?? u.assetCode ?? `Unidad ${u.id.slice(-4)}`,
        }));
        onUpdate(item._key, { availableUnits: mapped, loadingUnits: false });
      })
      .catch(() => onUpdate(item._key, { loadingUnits: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.equipProductId, item.kind]);

  const handleConsumableSelect = (product: ProductOption) => {
    onUpdate(item._key, {
      productId: product.id,
      productLabel: product.label,
      productUnit: product.unit,
      maxStock: product.currentStock,
      quantity: Math.min(item.quantity || 1, product.currentStock),
    });
  };

  const handleEquipmentSelect = (product: ProductOption) => {
    onUpdate(item._key, {
      equipProductId: product.id,
      equipProductLabel: product.label,
      unitId: "",
      unitLabel: "",
      availableUnits: [],
    });
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Row header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b bg-muted/30">
        <span className="text-sm font-semibold leading-none">
          Ítem {index + 1}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={item.kind}
            onValueChange={(val) => {
              if (!val) return;
              onUpdate(item._key, {
                kind: val as "CONSUMABLE" | "EQUIPMENT",
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
              });
            }}
            className="h-8"
          >
            <ToggleGroupItem value="CONSUMABLE" className="text-xs h-8 px-3">
              Consumible
            </ToggleGroupItem>
            <ToggleGroupItem value="EQUIPMENT" className="text-xs h-8 px-3">
              Equipo
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(item._key)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row body */}
      <div className="p-4 space-y-3">
        {/* CONSUMABLE fields */}
        {item.kind === "CONSUMABLE" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Producto *</Label>
              <EppProductCombobox
                kind="CONSUMABLE"
                value={item.productId}
                label={item.productLabel}
                onSelect={handleConsumableSelect}
                onClear={() =>
                  onUpdate(item._key, {
                    productId: "",
                    productLabel: "",
                    productUnit: "",
                    maxStock: 0,
                    quantity: 1,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Cantidad *{" "}
                {item.maxStock > 0 && (
                  <span className="text-muted-foreground">
                    (máx. {item.maxStock})
                  </span>
                )}
              </Label>
              <Input
                type="number"
                min={1}
                max={item.maxStock || undefined}
                value={item.quantity}
                onChange={(e) =>
                  onUpdate(item._key, { quantity: Number(e.target.value) })
                }
                className="h-10 sm:h-9"
              />
            </div>
          </div>
        )}

        {/* EQUIPMENT fields */}
        {item.kind === "EQUIPMENT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de equipo *</Label>
              <EppProductCombobox
                kind="EQUIPMENT"
                value={item.equipProductId}
                label={item.equipProductLabel}
                onSelect={handleEquipmentSelect}
                onClear={() =>
                  onUpdate(item._key, {
                    equipProductId: "",
                    equipProductLabel: "",
                    unitId: "",
                    unitLabel: "",
                    availableUnits: [],
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unidad disponible *</Label>
              {item.loadingUnits ? (
                <div className="flex items-center gap-2 h-9 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </div>
              ) : (
                <Select
                  value={item.unitId}
                  onValueChange={(val) => {
                    const found = item.availableUnits.find((u) => u.id === val);
                    onUpdate(item._key, {
                      unitId: val,
                      unitLabel: found?.label ?? "",
                    });
                  }}
                  disabled={!item.equipProductId || item.availableUnits.length === 0}
                >
                  <SelectTrigger className="h-10 sm:h-9">
                    <SelectValue
                      placeholder={
                        !item.equipProductId
                          ? "Selecciona equipo primero"
                          : item.availableUnits.length === 0
                          ? "Sin unidades disponibles"
                          : "Seleccionar unidad"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {item.availableUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Description (shared) */}
        <div className="space-y-1">
          <Label className="text-xs">Observación (opcional)</Label>
          <Input
            value={item.description}
            onChange={(e) =>
              onUpdate(item._key, { description: e.target.value })
            }
            placeholder="Ej: Talla M, color amarillo..."
            className="h-10 sm:h-9"
          />
        </div>
      </div>
    </div>
  );
}
