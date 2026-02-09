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
import { apiSearchWorkAreasRaw } from "../_lib/api";
import { MODULE_OPTIONS } from "../_lib/utils";

const initialState: CreateDocumentInput = {
  name: "",
  documentTypeId: "",
  workAreaId: "",
  moduleKey: "",
  notes: "",
  file: null,
  validFrom: "",
  validUntil: "",
  code: "",
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

  // Cache de work area codes para preview
  const [waCodeMap, setWaCodeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setForm(initialState);
      setWaCodeMap({});
      setCodeManuallyEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Archivo es OPCIONAL ahora
  const datesValid =
    Boolean(form.validFrom) &&
    Boolean(form.validUntil) &&
    form.validUntil >= form.validFrom;

  const canSubmit =
    form.name.trim().length > 0 &&
    Boolean(form.documentTypeId) &&
    Boolean(form.workAreaId) &&
    datesValid;

  async function handleSubmit() {
    if (!canSubmit) return;
    await onCreate(form);
  }

  // Fetcher que cachea los codes
  const safeSearchWorkAreas = async (
    q: string
  ): Promise<{ value: string; label: string }[]> => {
    if (creating) return [];
    const items = await apiSearchWorkAreasRaw(q);
    // Cachear codes
    const map: Record<string, string> = {};
    items.forEach((it) => {
      map[it.value] = it.code;
    });
    setWaCodeMap((prev) => ({ ...prev, ...map }));
    return items;
  };

  // Auto-rellenar código cuando cambian área de trabajo o tipo de documento
  const selectedDocType = documentTypes.find(
    (dt) => dt.id === form.documentTypeId
  );
  const workAreaCode = waCodeMap[form.workAreaId] ?? "";

  // Bandera para saber si el usuario ya editó el código manualmente
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (codeManuallyEdited) return;
    if (workAreaCode && selectedDocType?.code) {
      setForm((p) => ({
        ...p,
        code: `${workAreaCode}-${selectedDocType.code}-01`,
      }));
    }
  }, [workAreaCode, selectedDocType?.code, codeManuallyEdited]);

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
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Área de trabajo</Label>
                <SearchSelect
                  value={form.workAreaId}
                  onChange={(id) => setForm((p) => ({ ...p, workAreaId: id }))}
                  placeholder="Selecciona área de trabajo..."
                  searchPlaceholder="Buscar área de trabajo..."
                  emptyText="No se encontraron áreas de trabajo"
                  fetcher={safeSearchWorkAreas}
                />
              </div>

              {/* Vigencia */}
              <div className="space-y-2">
                <Label>Vigente desde *</Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, validFrom: e.target.value }))
                  }
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label>Vigente hasta *</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, validUntil: e.target.value }))
                  }
                  disabled={creating}
                />
              </div>

              {/* Código del documento (editable) */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Código del documento (opcional)</Label>
                <Input
                  value={form.code}
                  onChange={(e) => {
                    setCodeManuallyEdited(true);
                    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }));
                  }}
                  placeholder="Ej: SST-REG-01"
                  className="font-mono tracking-wide"
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">
                  Se sugiere automáticamente al seleccionar tipo y área. Puedes editarlo a tu gusto.
                  {!form.code && " Si lo dejas vacío, se generará automáticamente."}
                </p>
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
              <Label>Archivo PDF (opcional)</Label>
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
                  Puedes adjuntar el PDF ahora o subirlo después como nueva versión.
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
                Para crear, completa: <b>Nombre</b>, <b>Tipo</b>,{" "}
                <b>Área de trabajo</b>, <b>Vigente desde</b> y{" "}
                <b>Vigente hasta</b>.
                {form.validFrom && form.validUntil && form.validUntil < form.validFrom && (
                  <span className="text-destructive block mt-1">
                    La fecha &quot;Vigente hasta&quot; debe ser igual o posterior a &quot;Vigente desde&quot;.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
