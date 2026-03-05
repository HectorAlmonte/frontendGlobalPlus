"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { apiFillRecord } from "../_lib/api";
import { canFill } from "../_lib/utils";
import type { ChecklistRecord, FillItemState } from "../_lib/types";
import ChecklistItemRow from "./ChecklistItemRow";

interface Props {
  record: ChecklistRecord;
  onRefresh: () => void;
}

function initItemState(record: ChecklistRecord): FillItemState[] {
  return [...record.template.items]
    .sort((a, b) => a.order - b.order)
    .map((tplItem) => {
      const existing = record.items.find(
        (ri) => ri.templateItemId === tplItem.id
      );
      return {
        templateItemId: tplItem.id,
        result: existing?.result ?? null,
        booleanValue: existing?.booleanValue ?? null,
        numericValue: existing?.numericValue ?? null,
        selectedOption: existing?.selectedOption ?? null,
        textValue: existing?.textValue ?? null,
        observations: existing?.observations ?? "",
      };
    });
}

export default function ChecklistFillForm({ record, onRefresh }: Props) {
  const [itemStates, setItemStates] = useState<FillItemState[]>(() =>
    initItemState(record)
  );
  const [observations, setObservations] = useState(record.observations ?? "");
  const [saving, setSaving] = useState(false);

  // Re-init si cambia el record (post-refresh)
  useEffect(() => {
    setItemStates(initItemState(record));
    setObservations(record.observations ?? "");
  }, [record.id, record.status]);

  const readOnly = !canFill(record.status);

  const updateItem = (templateItemId: string, patch: Partial<FillItemState>) => {
    setItemStates((prev) =>
      prev.map((s) =>
        s.templateItemId === templateItemId ? { ...s, ...patch } : s
      )
    );
  };

  // Validación: ítems requeridos sin result
  const missingRequired = useMemo(() => {
    return itemStates.filter((s) => {
      const tpl = record.template.items.find(
        (t) => t.id === s.templateItemId
      );
      return tpl?.isRequired && !s.result;
    });
  }, [itemStates, record.template.items]);

  const handleSave = async () => {
    if (missingRequired.length > 0) {
      toast.error(
        `${missingRequired.length} ítem(s) requerido(s) sin resultado`
      );
      return;
    }

    setSaving(true);
    try {
      await apiFillRecord(record.id, {
        observations: observations.trim() || undefined,
        items: itemStates
          .filter((s) => s.result !== null)
          .map((s) => ({
            templateItemId: s.templateItemId,
            result: s.result!,
            booleanValue: s.booleanValue,
            numericValue: s.numericValue,
            selectedOption: s.selectedOption,
            textValue: s.textValue,
            observations: s.observations || undefined,
          })),
      });
      toast.success("Checklist guardado correctamente");
      onRefresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg || "Error al guardar el checklist");
    } finally {
      setSaving(false);
    }
  };

  // Mapear items del record por templateItemId para lookup
  const recordItemMap = useMemo(
    () =>
      new Map(record.items.map((ri) => [ri.templateItemId, ri])),
    [record.items]
  );

  const sortedItems = useMemo(
    () => [...record.template.items].sort((a, b) => a.order - b.order),
    [record.template.items]
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          2
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">Ítems del checklist</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sortedItems.length} ítems ·{" "}
            {missingRequired.length > 0
              ? `${missingRequired.length} requerido(s) sin resultado`
              : "Todos completos"}
          </p>
        </div>
        {readOnly && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Solo lectura
          </span>
        )}
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {/* En pantallas grandes, los ítems se distribuyen en 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {sortedItems.map((tplItem) => {
          const recordItem = recordItemMap.get(tplItem.id);
          const state = itemStates.find(
            (s) => s.templateItemId === tplItem.id
          )!;

          // Crear un ChecklistRecordItem sintético si no existe aún en el server
          const itemForRow = recordItem ?? {
            id: `new-${tplItem.id}`,
            recordId: record.id,
            templateItemId: tplItem.id,
            templateItem: tplItem,
            booleanValue: null,
            numericValue: null,
            selectedOption: null,
            textValue: null,
            result: null,
            observations: null,
            photoPath: null,
          };

          return (
            <ChecklistItemRow
              key={tplItem.id}
              recordId={record.id}
              item={itemForRow}
              state={state}
              onChange={(patch) => updateItem(tplItem.id, patch)}
              readOnly={readOnly}
            />
          );
        })}
        </div>

        {/* Observaciones generales */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-sm font-medium">Observaciones generales</Label>
          <textarea
            value={observations}
            disabled={readOnly}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            placeholder="Observaciones generales del checklist…"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        </div>

        {/* Botón guardar */}
        {!readOnly && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="h-11 gap-2 px-6"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar llenado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
