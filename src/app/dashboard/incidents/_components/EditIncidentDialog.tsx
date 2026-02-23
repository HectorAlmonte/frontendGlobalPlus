"use client";

import { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import SearchSelect from "./SearchSelect";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { IncidentDetail, IncidentType, ObservedKind } from "../_lib/types";
import { apiPatchIncident, apiSearchAreas, apiSearchObservedUsers } from "../_lib/api";
import { X } from "lucide-react";

type FormState = {
  title: string;
  type: IncidentType;
  detail: string;
  locationLabel: string;
  areaId: string;
  observedKind: ObservedKind;
  observedEmployeeId: string;
  observedOtherDetail: string;
  occurredAt: string;
  causes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  detail: IncidentDetail | null;
  onSaved: () => void;
};

function normalizeCausesToString(causes: any): string {
  if (!causes) return "";
  if (Array.isArray(causes)) return causes.join(", ");
  if (typeof causes === "string") return causes;
  return "";
}

export default function EditIncidentDialog({
  open,
  onOpenChange,
  detail,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>({
    title: "",
    type: "HALLAZGO_ANORMAL",
    detail: "",
    locationLabel: "",
    areaId: "",
    observedKind: "NONE",
    observedEmployeeId: "",
    observedOtherDetail: "",
    occurredAt: "",
    causes: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && detail) {
      const oAt = (detail as any).occurredAt;
      let occurredAtLocal = "";
      if (oAt) {
        const dt = new Date(oAt);
        if (!Number.isNaN(dt.getTime())) {
          occurredAtLocal = dt.toISOString().slice(0, 16);
        }
      }
      setForm({
        title: detail.title ?? "",
        type: detail.type,
        detail: detail.detail ?? "",
        locationLabel: (detail as any).locationLabel ?? "",
        areaId: detail.area?.id ?? "",
        observedKind: detail.observedKind ?? "NONE",
        observedEmployeeId: detail.observedEmployee?.id ?? "",
        observedOtherDetail: (detail as any).observedOtherDetail ?? "",
        occurredAt: occurredAtLocal,
        causes: normalizeCausesToString((detail as any).causes),
      });
      setErr(null);
    }
  }, [open, detail]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const canSubmit = Boolean(form.type) && form.detail.trim().length > 0 && Boolean(form.areaId);

  async function handleSubmit() {
    if (!canSubmit || !detail) return;
    setSaving(true);
    setErr(null);

    try {
      const causesArr =
        form.causes.trim().length > 0
          ? form.causes.split(",").map((s) => s.trim()).filter(Boolean)
          : null;

      const kind = form.observedKind;
      const hasWorker = kind === "USER" && Boolean(form.observedEmployeeId?.trim());

      const body: Record<string, unknown> = {
        title: form.title.trim() || null,
        type: form.type,
        detail: form.detail.trim(),
        locationLabel: form.locationLabel.trim() || null,
        areaId: form.areaId.trim() || null,
        causes: causesArr,
        observedKind: kind === "OTRO" ? "OTRO" : hasWorker ? "USER" : "NONE",
        observedEmployeeId: hasWorker ? form.observedEmployeeId : null,
        observedOtherDetail: kind === "OTRO" ? (form.observedOtherDetail.trim() || null) : null,
        occurredAt: form.occurredAt || null,
      };

      await apiPatchIncident(detail.id, body);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const hasObservedWorker = Boolean(form.observedEmployeeId?.trim());

  function clearObservedWorker() {
    setForm((p) => ({ ...p, observedEmployeeId: "", observedKind: "NONE" }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (saving) return; onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Editar incidencia</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-5">
            {err && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Material en zona de tránsito"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de incidencia</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v as IncidentType }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HALLAZGO_ANORMAL">Hallazgo anormal</SelectItem>
                    <SelectItem value="INCIDENTE">Incidente</SelectItem>
                    <SelectItem value="CONDICION_SUB_ESTANDAR">Condición subestándar</SelectItem>
                    <SelectItem value="ACTO_SUB_ESTANDAR">Acto subestándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Área (obligatorio)</Label>
                <SearchSelect
                  value={form.areaId}
                  onChange={(id) => setForm((p) => ({ ...p, areaId: id }))}
                  placeholder="Selecciona área..."
                  searchPlaceholder="Buscar área..."
                  emptyText="No se encontraron áreas"
                  fetcher={apiSearchAreas}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Zona / Lugar (opcional)</Label>
                <Input
                  value={form.locationLabel}
                  onChange={(e) => setForm((p) => ({ ...p, locationLabel: e.target.value }))}
                  placeholder="Ej: Cancha 3, ingreso principal..."
                  disabled={saving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Fecha de ocurrencia (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Observado</Label>
                <Select
                  value={form.observedKind}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      observedKind: v as ObservedKind,
                      observedEmployeeId: v !== "USER" ? "" : p.observedEmployeeId,
                      observedOtherDetail: v !== "OTRO" ? "" : p.observedOtherDetail,
                    }))
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Ninguno</SelectItem>
                    <SelectItem value="USER">Trabajador</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.observedKind === "USER" && (
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Trabajador</Label>
                    {hasObservedWorker && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearObservedWorker}
                        disabled={saving}
                        className="h-8 px-2 gap-1"
                        title="Quitar trabajador"
                      >
                        <X className="h-4 w-4" />
                        Quitar
                      </Button>
                    )}
                  </div>
                  <SearchSelect
                    value={form.observedEmployeeId}
                    onChange={(id) => setForm((p) => ({ ...p, observedEmployeeId: id }))}
                    placeholder="Selecciona trabajador..."
                    searchPlaceholder="Buscar por DNI o nombre..."
                    emptyText="No se encontraron trabajadores"
                    fetcher={apiSearchObservedUsers}
                  />
                </div>
              )}

              {form.observedKind === "OTRO" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Detalle del observado</Label>
                  <Input
                    value={form.observedOtherDetail}
                    onChange={(e) => setForm((p) => ({ ...p, observedOtherDetail: e.target.value }))}
                    placeholder="Ej: Contratista externo, visitante..."
                    disabled={saving}
                  />
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label>Detalles</Label>
                <Textarea
                  value={form.detail}
                  onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
                  placeholder="Describe lo ocurrido..."
                  className="min-h-[140px]"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Posibles causas (opcional)</Label>
              <Input
                value={form.causes}
                onChange={(e) => setForm((p) => ({ ...p, causes: e.target.value }))}
                placeholder="Ej: Falta de señalización, Orden y limpieza"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Separar por comas.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
