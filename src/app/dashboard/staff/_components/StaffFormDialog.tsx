"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Info, ChevronsUpDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { StaffRow } from "../_lib/types";
import { ROLES_WITH_ACCOUNT } from "../_lib/types";
import {
  apiCreateStaff,
  apiUpdateStaff,
  apiListRolesForSelect,
} from "../_lib/api";

type RoleOption = { value: string; label: string; key: string };

type Props = {
  open: boolean;
  editing: StaffRow | null;
  onSuccess: () => void;
  onClose: () => void;
};

export default function StaffFormDialog({
  open,
  editing,
  onSuccess,
  onClose,
}: Props) {
  const isEdit = !!editing;

  const [dni, setDni] = useState(editing?.dni ?? "");
  const [nombres, setNombres] = useState(editing?.nombres ?? "");
  const [apellidos, setApellidos] = useState(editing?.apellidos ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [cargo, setCargo] = useState(editing?.cargo ?? "");
  const [fechaIngreso, setFechaIngreso] = useState(
    editing?.fechaIngreso?.slice(0, 10) ?? ""
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    editing?.roles?.map((r) => r.id) ?? []
  );

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Determinar si algún rol seleccionado genera cuenta ── */
  const selectedRoleKeys = roles
    .filter((r) => selectedRoleIds.includes(r.value))
    .map((r) => r.key);
  const willCreateAccount = selectedRoleKeys.some((key) =>
    ROLES_WITH_ACCOUNT.includes(key)
  );

  /* ── Labels de roles seleccionados ── */
  const selectedRoleLabels = roles.filter((r) =>
    selectedRoleIds.includes(r.value)
  );

  /* ── Cargar roles al abrir ── */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingRoles(true);
    apiListRolesForSelect()
      .then((data) => {
        if (!cancelled) setRoles(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRoles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  /* ── Toggle rol ── */
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const removeRole = (roleId: string) => {
    setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
  };

  const submit = async () => {
    setErrors({});

    const trimmedDni = dni.trim();
    const trimmedNombres = nombres.trim();
    const trimmedApellidos = apellidos.trim();
    const trimmedEmail = email.trim();
    const trimmedCargo = cargo.trim();

    if (!trimmedDni) {
      setErrors({ dni: "El DNI es requerido" });
      return;
    }
    if (!trimmedNombres) {
      setErrors({ nombres: "Los nombres son requeridos" });
      return;
    }
    if (!trimmedApellidos) {
      setErrors({ apellidos: "Los apellidos son requeridos" });
      return;
    }
    if (!trimmedEmail) {
      setErrors({ email: "El correo electrónico es requerido" });
      return;
    }
    if (!trimmedCargo) {
      setErrors({ cargo: "El cargo es requerido" });
      return;
    }
    if (selectedRoleIds.length === 0) {
      setErrors({ role: "Debe seleccionar al menos un rol" });
      return;
    }

    try {
      setSaving(true);

      if (isEdit && editing) {
        await apiUpdateStaff(editing.id, {
          dni: trimmedDni,
          nombres: trimmedNombres,
          apellidos: trimmedApellidos,
          email: trimmedEmail,
          cargo: trimmedCargo,
          fechaIngreso: fechaIngreso || undefined,
          roleIds: selectedRoleIds,
        });
      } else {
        await apiCreateStaff({
          dni: trimmedDni,
          nombres: trimmedNombres,
          apellidos: trimmedApellidos,
          email: trimmedEmail,
          cargo: trimmedCargo,
          fechaIngreso: fechaIngreso || undefined,
          roleIds: selectedRoleIds,
        });
      }

      onSuccess();
    } catch (e: any) {
      setErrors({ form: e?.message || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar trabajador" : "Nuevo trabajador"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del trabajador."
              : "Registra un nuevo trabajador en el sistema."}
          </DialogDescription>
        </DialogHeader>

        {errors.form && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* DNI */}
          <div className="space-y-2">
            <p className="text-sm font-medium">DNI *</p>
            <Input
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 12345678"
            />
            {errors.dni && (
              <p className="text-xs text-destructive">{errors.dni}</p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Cargo *</p>
            <Input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej: Operario"
            />
            {errors.cargo && (
              <p className="text-xs text-destructive">{errors.cargo}</p>
            )}
          </div>

          {/* Nombres */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Nombres *</p>
            <Input
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Ej: Juan Carlos"
            />
            {errors.nombres && (
              <p className="text-xs text-destructive">{errors.nombres}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Apellidos *</p>
            <Input
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Ej: Pérez López"
            />
            {errors.apellidos && (
              <p className="text-xs text-destructive">{errors.apellidos}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Correo electrónico *</p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: juan@empresa.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Fecha de ingreso */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Fecha de ingreso</p>
            <Input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
            />
          </div>

          {/* Roles (multi-select) */}
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Roles *</p>
            {loadingRoles ? (
              <p className="text-xs text-muted-foreground">Cargando roles...</p>
            ) : roles.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No se encontraron roles disponibles.
              </p>
            ) : (
              <div className="space-y-2">
                <Popover open={rolesOpen} onOpenChange={setRolesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {selectedRoleIds.length === 0
                        ? "Seleccionar roles..."
                        : `${selectedRoleIds.length} rol${selectedRoleIds.length > 1 ? "es" : ""} seleccionado${selectedRoleIds.length > 1 ? "s" : ""}`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                    <div className="space-y-1">
                      {roles.map((role) => (
                        <label
                          key={role.value}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedRoleIds.includes(role.value)}
                            onCheckedChange={() => toggleRole(role.value)}
                          />
                          <span>{role.label}</span>
                          {ROLES_WITH_ACCOUNT.includes(role.key) && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                              Cuenta
                            </Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Badges de roles seleccionados */}
                {selectedRoleLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoleLabels.map((role) => (
                      <Badge
                        key={role.value}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {role.label}
                        <button
                          type="button"
                          onClick={() => removeRole(role.value)}
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Info: creación automática de cuenta */}
          {!isEdit && selectedRoleIds.length > 0 && (
            <div className="sm:col-span-2">
              {willCreateAccount ? (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Se creará una cuenta de acceso automáticamente. El usuario
                    será el DNI y la contraseña temporal se enviará al correo
                    del trabajador.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-md border px-3 py-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Los trabajadores con rol Trabajador no requieren cuenta de
                    acceso al sistema.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
