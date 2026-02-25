"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import type { WorkAreaRow } from "../_lib/types";
import { apiCreateWorkArea, apiUpdateWorkArea } from "../_lib/api";

type Props = {
  open: boolean;
  editing: WorkAreaRow | null;
  onSuccess: () => void;
  onClose: () => void;
};

export default function WorkAreaFormDialog({
  open,
  editing,
  onSuccess,
  onClose,
}: Props) {
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? "");
  const [code, setCode] = useState(editing?.code ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    setErrors({});

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      setErrors({ name: "El nombre es requerido" });
      return;
    }
    if (!trimmedCode) {
      setErrors({ code: "El código es requerido" });
      return;
    }

    const input = {
      name: trimmedName,
      code: trimmedCode,
      description: description.trim() || undefined,
    };

    try {
      setSaving(true);

      if (isEdit && editing) {
        await apiUpdateWorkArea(editing.id, input);
      } else {
        await apiCreateWorkArea(input);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar área de trabajo" : "Nueva área de trabajo"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del área de trabajo."
              : "Crea una nueva área de trabajo para clasificar documentos."}
          </DialogDescription>
        </DialogHeader>

        {errors.form && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Nombre *</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Salud y Seguridad en el Trabajo"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Código *</p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: SST"
            />
            <p className="text-xs text-muted-foreground">
              Se guardará en mayúsculas. Debe ser único.
            </p>
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Descripción (opcional)</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el área de trabajo..."
            />
          </div>
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
