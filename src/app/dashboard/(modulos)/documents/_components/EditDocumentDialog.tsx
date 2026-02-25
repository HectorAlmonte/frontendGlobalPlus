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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SearchSelect from "@/components/shared/SearchSelect";

import type { DocumentType } from "../_lib/types";
import { apiSearchWorkAreasRaw } from "../_lib/api";
import { MODULE_OPTIONS } from "../_lib/utils";

export type EditDocumentInput = {
  name?: string;
  moduleKey?: string;
  code?: string;
  documentTypeId?: string;
  workAreaId?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving: boolean;
  onSave: (input: EditDocumentInput) => Promise<void> | void;
  documentTypes: DocumentType[];
  initialName: string;
  initialCode: string;
  initialDocumentTypeId: string;
  initialWorkAreaId: string;
  initialWorkAreaLabel: string;
  initialModuleKey: string | null;
};

export default function EditDocumentDialog({
  open,
  onOpenChange,
  saving,
  onSave,
  documentTypes,
  initialName,
  initialCode,
  initialDocumentTypeId,
  initialWorkAreaId,
  initialWorkAreaLabel,
  initialModuleKey,
}: Props) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [documentTypeId, setDocumentTypeId] = useState(initialDocumentTypeId);
  const [workAreaId, setWorkAreaId] = useState(initialWorkAreaId);
  const [moduleKey, setModuleKey] = useState(initialModuleKey ?? "__none");

  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [waCodeMap, setWaCodeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(initialName);
      setCode(initialCode);
      setDocumentTypeId(initialDocumentTypeId);
      setWorkAreaId(initialWorkAreaId);
      setModuleKey(initialModuleKey ?? "__none");
      setCodeManuallyEdited(false);
      setWaCodeMap({});
    }
  }, [open, initialName, initialCode, initialDocumentTypeId, initialWorkAreaId, initialModuleKey]);

  const canSubmit = name.trim().length > 0 && Boolean(documentTypeId) && Boolean(workAreaId);

  async function handleSubmit() {
    if (!canSubmit) return;
    await onSave({
      name: name.trim(),
      code: code.trim() || undefined,
      documentTypeId,
      workAreaId,
      moduleKey: moduleKey === "__none" ? "" : moduleKey,
    });
  }

  // Fetcher que cachea los codes
  const safeSearchWorkAreas = async (
    q: string
  ): Promise<{ value: string; label: string }[]> => {
    if (saving) return [];
    const items = await apiSearchWorkAreasRaw(q);
    const map: Record<string, string> = {};
    items.forEach((it) => {
      map[it.value] = it.code;
    });
    setWaCodeMap((prev) => ({ ...prev, ...map }));
    return items;
  };

  // Auto-rellenar código cuando cambian área de trabajo o tipo de documento
  const selectedDocType = documentTypes.find((dt) => dt.id === documentTypeId);
  const workAreaCode = waCodeMap[workAreaId] ?? "";

  useEffect(() => {
    if (codeManuallyEdited) return;
    if (workAreaCode && selectedDocType?.code) {
      setCode(`${workAreaCode}-${selectedDocType.code}-01`);
    }
  }, [workAreaCode, selectedDocType?.code, codeManuallyEdited]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Editar documento</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(85vh-64px)] overflow-y-auto pr-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium">Datos del documento</div>
              <Separator />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nombre del documento</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Reporte de Incidentes SST"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={documentTypeId}
                  onValueChange={(v) => setDocumentTypeId(v)}
                  disabled={saving}
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

              <div className="space-y-2 sm:col-span-2">
                <Label>Área de trabajo</Label>
                <SearchSelect
                  value={workAreaId}
                  onChange={(id) => setWorkAreaId(id)}
                  placeholder="Selecciona área de trabajo..."
                  searchPlaceholder="Buscar área de trabajo..."
                  emptyText="No se encontraron áreas de trabajo"
                  fetcher={safeSearchWorkAreas}
                  selectedLabel={initialWorkAreaLabel}
                />
              </div>

              {/* Código del documento (editable) */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Código del documento</Label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCodeManuallyEdited(true);
                    setCode(e.target.value.toUpperCase());
                  }}
                  placeholder="Ej: SST-REG-01"
                  className="font-mono tracking-wide"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Se sugiere automáticamente al cambiar tipo y área. Puedes editarlo a tu gusto.
                </p>
              </div>
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
                disabled={saving || !canSubmit}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
