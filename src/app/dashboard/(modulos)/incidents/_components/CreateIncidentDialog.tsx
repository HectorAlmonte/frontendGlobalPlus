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
import SearchSelect from "@/components/shared/SearchSelect";

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

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    shift?: {
      startTime: string; // "08:00"
      endTime: string;   // "17:00"
    } | null;
  } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  creating: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<void> | void;
  roleKey?: RoleKey;
  profile: MeProfile | null; // ✅ NUEVO
};

const initialState: CreateIncidentInput = {
  title: "",
  type: "HALLAZGO_ANORMAL",
  locationLabel: "",
  detail: "",
  areaId: "",
  observedKind: "NONE",
  observedEmployeeId: "",
  observedAreaId: "",
  observedOtherDetail: "",
  occurredAt: "",
  causes: "",
  files: [],
};

/**
 * ✅ Obtiene hora local del navegador (asumimos zona horaria Perú)
 * Como todos usan el sistema en Perú, esto es seguro y confiable
 */
function getCurrentLocalTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return { hour, minute };
}

/**
 * ✅ Convierte "HH:MM" a minutos desde medianoche
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * ✅ Validación de permisos para crear incidencias
 */
function canCreateIncident(
  roleKey?: RoleKey,
  profile?: MeProfile | null
): {
  allowed: boolean;
  reason?: string;
} {
  // Si no hay roleKey, bloqueamos
  if (!roleKey) {
    return { allowed: false, reason: "No se pudo determinar tu rol" };
  }

  // ✅ ADMIN y SUPERVISOR: SIEMPRE pueden (24/7)
  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR") {
    return { allowed: true };
  }

  // ✅ SEGURIDAD: puede siempre (si aplica en tu caso)
  if (roleKey === "SEGURIDAD") {
    return { allowed: true };
  }

  // ✅ TRABAJADOR: validar según su turno asignado
  if (roleKey === "TRABAJADOR") {
    const shift = profile?.employee?.shift;

    // Si no tiene turno asignado
    if (!shift?.startTime || !shift?.endTime) {
      return {
        allowed: false,
        reason: "No tienes un turno asignado. Contacta a tu supervisor.",
      };
    }

    // Obtener hora actual local
    const { hour, minute } = getCurrentLocalTime();
    const currentMinutes = hour * 60 + minute;

    // Convertir turno a minutos
    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);

    // Validar si está dentro del horario
    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return {
        allowed: false,
        reason: `Solo puedes registrar incidencias dentro de tu turno (${shift.startTime} - ${shift.endTime})`,
      };
    }

    return { allowed: true };
  }

  // ✅ Otros roles: bloqueados por defecto
  return {
    allowed: false,
    reason: "Tu rol no tiene permiso para registrar incidencias",
  };
}

export default function CreateIncidentDialog({
  open,
  onOpenChange,
  creating,
  onCreate,
  roleKey,
  profile, // ✅ NUEVO
}: Props) {
  const [form, setForm] = useState<CreateIncidentInput>(initialState);

  // ✅ Validación reactiva (se actualiza cuando cambia roleKey o profile)
  const validation = useMemo(
    () => canCreateIncident(roleKey, profile),
    [roleKey, profile]
  );

  const allowed = validation.allowed;
  const blockReason = validation.reason;

  // ✅ Mostrar hora actual en el mensaje (para debugging/transparencia)
  const currentTime = useMemo(() => {
    const { hour, minute } = getCurrentLocalTime();
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }, []); // Solo calcular una vez al montar

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) setForm(initialState);
  }, [open]);

  // Si intentan abrir sin permiso, cerramos
  useEffect(() => {
    if (open && !allowed) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allowed]);

  const canSubmit =
    Boolean(form.type) && form.detail.trim().length > 0 && Boolean(form.areaId);

  async function handleSubmit() {
    if (!canSubmit || !allowed) return;

    const kind = form.observedKind;
    const hasWorker = kind === "USER" && Boolean(form.observedEmployeeId?.trim());

    const payload: CreateIncidentInput = {
      ...form,
      observedKind: kind === "OTRO" ? "OTRO" : hasWorker ? "USER" : "NONE",
      observedEmployeeId: hasWorker ? form.observedEmployeeId : "",
      observedAreaId: "",
      observedOtherDetail: kind === "OTRO" ? form.observedOtherDetail : "",
      occurredAt: form.occurredAt || undefined,
    };

    await onCreate(payload);
  }

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
      observedEmployeeId: "",
      observedKind: "NONE",
      observedAreaId: "",
    }));
  }

  const hasObservedWorker = Boolean(
    form.observedEmployeeId && form.observedEmployeeId.trim()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {allowed ? (
        <DialogTrigger asChild>
          <Button>Nueva incidencia</Button>
        </DialogTrigger>
      ) : (
        <Button
          variant="secondary"
          disabled
          className="gap-2"
          title={blockReason}
        >
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

            {/* ✅ Mensaje de bloqueo mejorado */}
            {!allowed && blockReason ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="font-medium text-amber-900">
                      No puedes registrar incidencias en este momento
                    </div>
                    <p className="text-amber-700">{blockReason}</p>
                    {roleKey === "TRABAJADOR" && (
                      <p className="text-xs text-amber-600">
                        Hora actual: <b>{currentTime}</b>
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
                    <SelectItem value="CONDICION_SUB_ESTANDAR">
                      Condición subestándar
                    </SelectItem>
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

              <div className="space-y-2 sm:col-span-2">
                <Label>Fecha de ocurrencia (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.occurredAt ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                  disabled={creating || !allowed}
                />
                <p className="text-xs text-muted-foreground">
                  Si difiere de la fecha de reporte, indica cuándo ocurrió realmente.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Observado</Label>
                <Select
                  value={form.observedKind}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      observedKind: v as "NONE" | "USER" | "OTRO",
                      observedEmployeeId: v !== "USER" ? "" : p.observedEmployeeId,
                      observedOtherDetail: v !== "OTRO" ? "" : p.observedOtherDetail,
                    }))
                  }
                  disabled={creating || !allowed}
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
                        disabled={creating || !allowed}
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
                    fetcher={safeSearchUsers}
                  />
                </div>
              )}

              {form.observedKind === "OTRO" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Detalle del observado</Label>
                  <Input
                    value={form.observedOtherDetail ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, observedOtherDetail: e.target.value }))}
                    placeholder="Ej: Contratista externo, visitante..."
                    disabled={creating || !allowed}
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
                  disabled={creating || !allowed}
                />
              </div>
            </div>

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

              <Button onClick={handleSubmit} disabled={creating || !canSubmit || !allowed}>
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