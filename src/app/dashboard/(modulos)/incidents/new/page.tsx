"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { ArrowLeft, ShieldAlert, AlertTriangle, X } from "lucide-react";

import type { CreateIncidentInput, IncidentType } from "../_lib/types";
import {
  apiCreateIncident,
  apiSearchObservedUsers,
  apiSearchAreas,
  API_BASE,
} from "../_lib/api";

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    shift?: { startTime: string; endTime: string } | null;
  } | null;
};

function getCurrentLocalTime() {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function canCreateIncident(
  roleKey?: RoleKey,
  profile?: MeProfile | null
): { allowed: boolean; reason?: string } {
  if (!roleKey) return { allowed: false, reason: "No se pudo determinar tu rol" };
  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR" || roleKey === "SEGURIDAD")
    return { allowed: true };
  if (roleKey === "TRABAJADOR") {
    const shift = profile?.employee?.shift;
    if (!shift?.startTime || !shift?.endTime)
      return { allowed: false, reason: "No tienes un turno asignado. Contacta a tu supervisor." };
    const { hour, minute } = getCurrentLocalTime();
    const current = hour * 60 + minute;
    if (current < timeToMinutes(shift.startTime) || current > timeToMinutes(shift.endTime))
      return {
        allowed: false,
        reason: `Solo puedes registrar incidencias dentro de tu turno (${shift.startTime} - ${shift.endTime})`,
      };
    return { allowed: true };
  }
  return { allowed: false, reason: "Tu rol no tiene permiso para registrar incidencias" };
}

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

export default function NewIncidentPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateIncidentInput>(initialState);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/users/me/profile`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setProfile(d); })
      .catch(() => {});
  }, []);

  const roleKey: RoleKey | undefined = profile?.user?.role?.key;
  const validation = useMemo(() => canCreateIncident(roleKey, profile), [roleKey, profile]);
  const { allowed, reason: blockReason } = validation;

  const canSubmit = Boolean(form.type) && form.detail.trim().length > 0 && Boolean(form.areaId);

  const currentTime = useMemo(() => {
    const { hour, minute } = getCurrentLocalTime();
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }, []);

  async function handleSubmit() {
    if (!canSubmit || !allowed) return;
    setCreating(true);
    setErr(null);
    try {
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
      await apiCreateIncident(payload);
      toast.success("Incidencia registrada correctamente");
      router.push("/dashboard/incidents");
    } catch (e: any) {
      setErr(e?.message || "Error al crear la incidencia");
    } finally {
      setCreating(false);
    }
  }

  function clearObservedWorker() {
    setForm((p) => ({ ...p, observedEmployeeId: "", observedKind: "NONE", observedAreaId: "" }));
  }

  const hasObservedWorker = Boolean(form.observedEmployeeId?.trim());

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-10 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-1"
          onClick={() => router.push("/dashboard/incidents")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShieldAlert className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Nueva incidencia</h1>
          <p className="text-sm text-muted-foreground">
            Completa el formulario para registrar una incidencia
          </p>
        </div>
      </div>

      {/* Bloqueo de permisos */}
      {!allowed && blockReason && (
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
      )}

      {/* Error */}
      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {/* Sección 1: Información básica */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Información básica</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tipo, área y ubicación del evento</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de incidencia</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v as IncidentType }))}
                disabled={creating || !allowed}
              >
                <SelectTrigger className="h-10">
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

            <div className="space-y-1.5">
              <Label>
                Título{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                className="h-10"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Material en zona de tránsito"
                disabled={creating || !allowed}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Área <span className="text-destructive">*</span>
              </Label>
              <SearchSelect
                value={form.areaId}
                onChange={(id) => setForm((p) => ({ ...p, areaId: id }))}
                placeholder="Selecciona área..."
                searchPlaceholder="Buscar área..."
                emptyText="No se encontraron áreas"
                fetcher={(q) =>
                  creating || !allowed ? Promise.resolve([]) : apiSearchAreas(q)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Zona / Lugar{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                className="h-10"
                value={form.locationLabel}
                onChange={(e) => setForm((p) => ({ ...p, locationLabel: e.target.value }))}
                placeholder="Ej: Cancha 3, patio norte..."
                disabled={creating || !allowed}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Fecha de ocurrencia{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                type="datetime-local"
                className="h-10"
                value={form.occurredAt ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                disabled={creating || !allowed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Observado */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            2
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Persona observada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trabajador, visitante u otro involucrado
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de observado</Label>
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
              <SelectTrigger className="h-10">
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
            <div className="space-y-1.5">
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
                  >
                    <X className="h-3.5 w-3.5" />
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
                fetcher={(q) =>
                  creating || !allowed ? Promise.resolve([]) : apiSearchObservedUsers(q)
                }
              />
            </div>
          )}

          {form.observedKind === "OTRO" && (
            <div className="space-y-1.5">
              <Label>Detalle del observado</Label>
              <Input
                className="h-10"
                value={form.observedOtherDetail ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observedOtherDetail: e.target.value }))
                }
                placeholder="Ej: Contratista externo, visitante..."
                disabled={creating || !allowed}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sección 3: Descripción y causas */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            3
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Descripción y causas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detalla qué ocurrió y posibles causas
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.detail}
              onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
              placeholder="Describe lo ocurrido con el mayor detalle posible..."
              className="min-h-[140px]"
              disabled={creating || !allowed}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Posibles causas{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              className="h-10"
              value={form.causes}
              onChange={(e) => setForm((p) => ({ ...p, causes: e.target.value }))}
              placeholder="Ej: Falta de señalización, EPP incompleto"
              disabled={creating || !allowed}
            />
            <p className="text-xs text-muted-foreground">
              Separar por comas. Se guardará como lista.
            </p>
          </div>
        </div>
      </div>

      {/* Sección 4: Evidencias */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            4
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Evidencias</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fotos o archivos relacionados (opcional)
            </p>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <Input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) =>
              setForm((p) => ({ ...p, files: Array.from(e.target.files ?? []) }))
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {allowed && !canSubmit ? (
          <p className="text-xs text-muted-foreground">
            Para crear, completa: <b>Área</b> y <b>Descripción</b>
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/incidents")}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || !canSubmit || !allowed}
          >
            {creating ? "Creando..." : "Crear incidencia"}
          </Button>
        </div>
      </div>
    </div>
  );
}
