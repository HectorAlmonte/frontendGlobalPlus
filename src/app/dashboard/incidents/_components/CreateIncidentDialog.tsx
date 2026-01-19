"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import { CreateIncidentInput, ObservedKind, IncidentType } from "../_lib/types";
import { apiSearchObservedUsers, apiSearchAreas } from "../_lib/api";
import { Separator } from "@/components/ui/separator";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  creating: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<void> | void;
};

const initialState: CreateIncidentInput = {
  title: "",
  type: "HALLAZGO_ANORMAL", // ✅ válido según IncidentType
  locationLabel: "",
  detail: "",

  observedKind: "NONE",
  observedUserId: "",
  observedAreaId: "",

  causes: "",
  files: [],
};

export default function CreateIncidentDialog({
  open,
  onOpenChange,
  creating,
  onCreate,
}: Props) {
  const [form, setForm] = useState<CreateIncidentInput>(initialState);

  useEffect(() => {
    if (!open) setForm(initialState);
  }, [open]);

  // ✅ ya no uses trim() en type (ahora es enum)
  const canSubmit = Boolean(form.type) && form.detail.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    await onCreate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Nueva incidencia</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva incidencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-medium">Registro e incidencia</div>
            <Separator />
          </div>

          {/* ===== Campos principales ===== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Material en zona de tránsito"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de incidencia</Label>

              {/* ✅ Select con opciones fijas */}
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as IncidentType }))
                }
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
              <Label>Zona / Lugar</Label>
              <Input
                value={form.locationLabel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, locationLabel: e.target.value }))
                }
                placeholder="Ej: Cancha 3, ingreso principal, patio norte..."
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Detalles</Label>
              <Textarea
                value={form.detail}
                onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
                placeholder="Describe lo ocurrido..."
                className="min-h-[140px]"
              />
            </div>
          </div>

          {/* ===== Evidencias ===== */}
          <div className="space-y-2">
            <Label>Evidencias (archivo o foto)</Label>
            <Input
              type="file"
              multiple
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  files: Array.from(e.target.files ?? []),
                }))
              }
            />
            {form.files.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {form.files.length} archivo(s) seleccionado(s)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Puedes adjuntar fotos o archivos relacionados.
              </p>
            )}
          </div>

          {/* ===== Observado ===== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Observado (opcional)</Label>
              <Select
                value={form.observedKind}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    observedKind: v as ObservedKind,
                    observedUserId: "",
                    observedAreaId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Ninguno</SelectItem>
                  <SelectItem value="USER">Trabajador</SelectItem>
                  <SelectItem value="AREA">Área</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.observedKind === "USER" && (
              <div className="space-y-2">
                <Label>Trabajador observado</Label>
                <SearchSelect
                  value={form.observedUserId}
                  onChange={(id) => setForm((p) => ({ ...p, observedUserId: id }))}
                  placeholder="Selecciona trabajador..."
                  searchPlaceholder="Buscar por DNI o nombre..."
                  emptyText="No se encontraron trabajadores"
                  fetcher={apiSearchObservedUsers}
                />
              </div>
            )}

            {form.observedKind === "AREA" && (
              <div className="space-y-2">
                <Label>Área observada</Label>
                <SearchSelect
                  value={form.observedAreaId}
                  onChange={(id) => setForm((p) => ({ ...p, observedAreaId: id }))}
                  placeholder="Selecciona área..."
                  searchPlaceholder="Buscar área..."
                  emptyText="No se encontraron áreas"
                  fetcher={apiSearchAreas}
                />
              </div>
            )}
          </div>

          {/* ===== Causas ===== */}
          <div className="space-y-2">
            <Label>Posibles causas (opcional)</Label>
            <Input
              value={form.causes}
              onChange={(e) => setForm((p) => ({ ...p, causes: e.target.value }))}
              placeholder="Ej: Falta de señalización, Orden y limpieza, EPP incompleto"
            />
            <p className="text-xs text-muted-foreground">
              Separar por comas. Se guardará como lista.
            </p>
          </div>

          {/* ===== Acciones ===== */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={creating || !canSubmit}>
              {creating ? "Creando..." : "Crear"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
