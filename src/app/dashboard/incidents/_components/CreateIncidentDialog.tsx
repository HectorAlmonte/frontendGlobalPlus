"use client";

import { useEffect, useMemo, useState } from "react";

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

import { CreateIncidentInput, IncidentType } from "../_lib/types";
import { apiSearchObservedUsers, apiSearchAreas } from "../_lib/api";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, X } from "lucide-react";

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  creating: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<void> | void;
  roleKey?: RoleKey;
};

const initialState: CreateIncidentInput = {
  title: "",
  type: "HALLAZGO_ANORMAL",
  locationLabel: "",
  detail: "",

  areaId: "",

  // ✅ trabajador (observado) ya NO obligatorio
  observedKind: "NONE",
  observedUserId: "",
  observedAreaId: "",

  causes: "",
  files: [],
};

/** Hora Perú (America/Lima) */
function getLimaHourMinute() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function isWithinWorkerHours() {
  const { hour, minute } = getLimaHourMinute();
  const mins = hour * 60 + minute;
  return mins >= 6 * 60 && mins < 18 * 60; // 06:00–18:00
}

function canCreateIncident(roleKey?: RoleKey) {
  if (!roleKey) return false;
  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR") return true;
  if (roleKey === "TRABAJADOR") return isWithinWorkerHours();
  return false;
}

export default function CreateIncidentDialog({
  open,
  onOpenChange,
  creating,
  onCreate,
  roleKey,
}: Props) {
  const [form, setForm] = useState<CreateIncidentInput>(initialState);

  const allowed = useMemo(() => canCreateIncident(roleKey), [roleKey]);

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) setForm(initialState);
  }, [open]);

  // Si intentan abrir sin permiso, cerramos
  useEffect(() => {
    if (open && !allowed) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allowed]);

  // ✅ Trabajador observado ya NO es obligatorio para enviar
  const canSubmit =
    Boolean(form.type) &&
    form.detail.trim().length > 0 &&
    Boolean(form.areaId);

  async function handleSubmit() {
    if (!canSubmit || !allowed) return;

    const hasWorker = Boolean(form.observedUserId && form.observedUserId.trim());

    const payload: CreateIncidentInput = {
      ...form,
      observedKind: hasWorker ? "USER" : "NONE",
      observedUserId: hasWorker ? form.observedUserId : "",
      observedAreaId: "",
    };

    await onCreate(payload);
  }

  const showBlockedHint = roleKey === "TRABAJADOR" && !isWithinWorkerHours();

  const safeSearchAreas = async (q: string) => {
    if (creating || !allowed) return [];
    return apiSearchAreas(q);
  };

  const safeSearchUsers = async (q: string) => {
    if (creating || !allowed) return [];
    return apiSearchObservedUsers(q);
  };

  function clearObservedWorker() {
    setForm((p) => ({
      ...p,
      observedUserId: "",
      observedKind: "NONE", // ✅ opcional (igual en submit se recalcula)
      observedAreaId: "",
    }));
  }

  const hasObservedWorker = Boolean(form.observedUserId && form.observedUserId.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {allowed ? (
        <DialogTrigger asChild>
          <Button>Nueva incidencia</Button>
        </DialogTrigger>
      ) : (
        <Button variant="secondary" disabled className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Nueva incidencia
        </Button>
      )}

      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Nueva incidencia</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(85vh-64px)] overflow-y-auto pr-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium">Registro de incidencia</div>
              <Separator />
            </div>

            {!allowed ? (
              <div className="rounded-lg border p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium">No puedes registrar incidencias ahora</div>
                    {showBlockedHint ? (
                      <p className="text-muted-foreground">
                        Trabajador: permitido solo de <b>06:00</b> a <b>18:00</b> (hora Perú).
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Tu rol no tiene permiso para registrar incidencias.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Material en zona de tránsito"
                  disabled={creating || !allowed}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de incidencia</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as IncidentType }))
                  }
                  disabled={creating || !allowed}
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
                  fetcher={safeSearchAreas}
                />
                {!form.areaId ? (
                  <p className="text-xs text-muted-foreground">
                    Selecciona el área donde ocurrió la incidencia.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Zona / Lugar (opcional)</Label>
                <Input
                  value={form.locationLabel}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, locationLabel: e.target.value }))
                  }
                  placeholder="Ej: Cancha 3, ingreso principal, patio norte..."
                  disabled={creating || !allowed}
                />
              </div>

              {/* Trabajador */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Trabajador (opcional)</Label>

                  {/* ✅ Botón quitar */}
                  {hasObservedWorker ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearObservedWorker}
                      disabled={creating || !allowed}
                      className="h-8 px-2 gap-1"
                      title="Quitar trabajador"
                    >
                      <X className="h-4 w-4" />
                      Quitar
                    </Button>
                  ) : null}
                </div>

                <SearchSelect
                  value={form.observedUserId}
                  onChange={(id) => setForm((p) => ({ ...p, observedUserId: id }))}
                  placeholder="Selecciona trabajador..."
                  searchPlaceholder="Buscar por DNI o nombre..."
                  emptyText="No se encontraron trabajadores"
                  fetcher={safeSearchUsers}
                />

                {!hasObservedWorker ? (
                  <p className="text-xs text-muted-foreground">
                    Si no seleccionas trabajador, la incidencia quedará como “Sin trabajador”.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Trabajador asignado. Si te equivocaste, usa <b>Quitar</b>.
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Detalles</Label>
                <Textarea
                  value={form.detail}
                  onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
                  placeholder="Describe lo ocurrido..."
                  className="min-h-[140px]"
                  disabled={creating || !allowed}
                />
              </div>
            </div>

            {/* Evidencias */}
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
                disabled={creating || !allowed}
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

            {/* Causas */}
            <div className="space-y-2">
              <Label>Posibles causas (opcional)</Label>
              <Input
                value={form.causes}
                onChange={(e) => setForm((p) => ({ ...p, causes: e.target.value }))}
                placeholder="Ej: Falta de señalización, Orden y limpieza, EPP incompleto"
                disabled={creating || !allowed}
              />
              <p className="text-xs text-muted-foreground">
                Separar por comas. Se guardará como lista.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={creating}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={creating || !canSubmit || !allowed}
              >
                {creating ? "Creando..." : "Crear"}
              </Button>
            </div>

            {allowed && !canSubmit ? (
              <p className="text-xs text-muted-foreground">
                Para crear, completa: <b>Área</b> y <b>Detalles</b>.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
