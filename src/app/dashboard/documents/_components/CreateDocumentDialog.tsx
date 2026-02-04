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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SearchSelect from "@/app/dashboard/incidents/_components/SearchSelect";

import type { DocumentType, CreateDocumentInput } from "../_lib/types";
import { apiSearchAreas } from "../_lib/api";

const MODULE_OPTIONS = [
  { value: "", label: "Ninguno" },
  { value: "INCIDENTS", label: "Incidencias" },
  { value: "INSPECTIONS", label: "Inspecciones" },
  { value: "TRAININGS", label: "Capacitaciones" },
  { value: "AUDITS", label: "Auditorías" },
];

const initialState: CreateDocumentInput = {
  name: "",
  documentTypeId: "",
  areaId: "",
  moduleKey: "",
  notes: "",
  file: null,
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  creating: boolean;
  onCreate: (input: CreateDocumentInput) => Promise<void> | void;
  documentTypes: DocumentType[];
};

export default function CreateDocumentDialog({
  open,
  onOpenChange,
  creating,
  onCreate,
  documentTypes,
}: Props) {
  const [form, setForm] = useState<CreateDocumentInput>(initialState);

  useEffect(() => {
    if (!open) setForm(initialState);
  }, [open]);

  const canSubmit =
    form.name.trim().length > 0 &&
    Boolean(form.documentTypeId) &&
    Boolean(form.areaId) &&
    form.file !== null;

  async function handleSubmit() {
    if (!canSubmit) return;
    await onCreate(form);
  }

  const safeSearchAreas = async (q: string) => {
    if (creating) return [];
    return apiSearchAreas(q);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Nuevo documento</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(85vh-64px)] overflow-y-auto pr-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium">Registro de documento</div>
              <Separator />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre del documento</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ej: Reporte de Incidentes SST"
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={form.documentTypeId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, documentTypeId: v }))
                  }
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id}>
                        {dt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Módulo (opcional)</Label>
                <Select
                  value={form.moduleKey}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, moduleKey: v }))
                  }
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "__none"} value={opt.value || "__none"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Área</Label>
                <SearchSelect
                  value={form.areaId}
                  onChange={(id) => setForm((p) => ({ ...p, areaId: id }))}
                  placeholder="Selecciona área..."
                  searchPlaceholder="Buscar área..."
                  emptyText="No se encontraron áreas"
                  fetcher={safeSearchAreas}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Observaciones sobre este documento..."
                  className="min-h-[80px]"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Archivo PDF</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setForm((p) => ({ ...p, file }));
                }}
                disabled={creating}
              />
              {form.file ? (
                <p className="text-xs text-muted-foreground">
                  {form.file.name} ({(form.file.size / 1024).toFixed(1)} KB)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Selecciona el archivo PDF de la primera versión.
                </p>
              )}
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
                disabled={creating || !canSubmit}
              >
                {creating ? "Creando..." : "Crear"}
              </Button>
            </div>

            {!canSubmit && (
              <p className="text-xs text-muted-foreground">
                Para crear, completa: <b>Nombre</b>, <b>Tipo</b>, <b>Área</b> y{" "}
                <b>Archivo PDF</b>.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
