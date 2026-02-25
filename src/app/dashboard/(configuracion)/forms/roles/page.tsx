"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Plus, ShieldCheck } from "lucide-react";

import RolesTable from "./rolesTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { RoleRow } from "./_lib/types";
import { apiCreateRole, apiUpdateRole } from "./_lib/api";

const createSchema = z.object({
  key: z
    .string()
    .min(2, "Key es requerido")
    .max(50, "Máximo 50 caracteres")
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, "_")),
  name: z.string().min(2, "Nombre es requerido").max(80).transform((v) => v.trim()),
  description: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
});

const editSchema = z.object({
  name: z.string().min(2, "Nombre es requerido").max(80).transform((v) => v.trim()),
  description: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
});

export default function RolesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing] = useState<RoleRow | null>(null);
  const isEdit = !!editing;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const openCreate = () => {
    setEditing(null);
    setKey("");
    setName("");
    setDescription("");
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (r: RoleRow) => {
    setEditing(r);
    setKey(r.key);
    setName(r.name);
    setDescription(r.description ?? "");
    setErrors({});
    setShowForm(true);
  };

  const closePanel = () => {
    setShowForm(false);
    setEditing(null);
    setErrors({});
  };

  const handleSuccess = () => {
    closePanel();
    setRefreshKey((k) => k + 1);
  };

  const canEdit = !editing?.isSystem; // roles del sistema no se editan

  const submit = async () => {
    setErrors({});
    try {
      setSaving(true);

      if (isEdit) {
        if (!editing) return;

        if (!canEdit) {
          setErrors({ form: "Este rol es del sistema y no se puede editar." });
          return;
        }

        const parsed = editSchema.safeParse({ name, description });
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const e of parsed.error.issues) next[String(e.path[0])] = e.message;
          setErrors(next);
          return;
        }

        await apiUpdateRole(editing.id, {
          name: parsed.data.name,
          description: parsed.data.description ? parsed.data.description : null,
        });

        handleSuccess();
        return;
      }

      const parsed = createSchema.safeParse({ key, name, description });
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const e of parsed.error.issues) next[String(e.path[0])] = e.message;
        setErrors(next);
        return;
      }

      await apiCreateRole({
        key: parsed.data.key,
        name: parsed.data.name,
        description: parsed.data.description ? parsed.data.description : null,
      });

      handleSuccess();
    } catch (e: any) {
      setErrors({ form: e?.message || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Roles</h1>
            <p className="text-sm text-muted-foreground">Gestión de roles y permisos de acceso.</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => (showForm ? closePanel() : openCreate())}
          className="gap-2 shrink-0"
        >
          {!showForm && <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">{showForm ? "Cerrar panel" : "Nuevo rol"}</span>
          <span className="sm:hidden">{showForm ? "Cerrar" : "Nuevo"}</span>
        </Button>
      </div>

      <div className="space-y-5">
        {/* ===== TABLA ===== */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Roles registrados</p>
            </div>
            {showForm && (
              <span className="text-xs text-muted-foreground">
                {isEdit ? "Editando rol" : "Creando rol"}
              </span>
            )}
          </div>

          <div className="p-4">
            <RolesTable
              refreshKey={refreshKey}
              onEditClick={openEdit}
            />
          </div>
        </div>

        {/* ===== FORM (PANEL) ===== */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border bg-card shadow-sm">
                <div className="h-0.5 w-full bg-primary/70" />

                <div className="relative px-5 py-4 sm:px-6 sm:py-5">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary))_0%,transparent_45%)] opacity-[0.07]" />

                  <div className="relative">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-medium">
                          {isEdit ? "Editar rol" : "Nuevo rol"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isEdit
                            ? "Actualiza nombre y descripción."
                            : "Crea un rol con key estable (no lo cambies luego)."}
                        </p>
                      </div>

                      <Button size="sm" variant="ghost" onClick={closePanel}>
                        Cerrar
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {errors.form && (
                      <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {errors.form}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Key</p>
                        <Input
                          value={key}
                          onChange={(e) => setKey(e.target.value)}
                          placeholder="EJ: SUPERVISOR"
                          disabled={isEdit} // key no se edita
                        />
                        {errors.key && <p className="text-xs text-destructive">{errors.key}</p>}
                        <p className="text-xs text-muted-foreground">
                          Mayúsculas + guiones bajos (ej: JEFE_ALMACEN).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Nombre</p>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: Supervisor"
                          disabled={isEdit && !canEdit}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <p className="text-sm font-medium">Descripción (opcional)</p>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe el rol..."
                          disabled={isEdit && !canEdit}
                        />
                        {errors.description && (
                          <p className="text-xs text-destructive">{errors.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={closePanel}>
                        Cancelar
                      </Button>
                      <Button onClick={submit} disabled={saving || (isEdit && !canEdit)}>
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
