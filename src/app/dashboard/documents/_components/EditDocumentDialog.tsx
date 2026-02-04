"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const MODULE_OPTIONS = [
  { value: "__none", label: "Ninguno" },
  { value: "INCIDENTS", label: "Incidencias" },
  { value: "INSPECTIONS", label: "Inspecciones" },
  { value: "TRAININGS", label: "Capacitaciones" },
  { value: "AUDITS", label: "Auditorías" },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving: boolean;
  onSave: (input: { name?: string; moduleKey?: string }) => Promise<void> | void;
  initialName: string;
  initialModuleKey: string | null;
};

export default function EditDocumentDialog({
  open,
  onOpenChange,
  saving,
  onSave,
  initialName,
  initialModuleKey,
}: Props) {
  const [name, setName] = useState(initialName);
  const [moduleKey, setModuleKey] = useState(initialModuleKey ?? "__none");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setModuleKey(initialModuleKey ?? "__none");
    }
  }, [open, initialName, initialModuleKey]);

  async function handleSubmit() {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      moduleKey: moduleKey === "__none" ? "" : moduleKey,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Módulo vinculado</Label>
            <Select
              value={moduleKey}
              onValueChange={setModuleKey}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona módulo" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
