"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  PackageOpen,
} from "lucide-react";

import {
  apiSearchEquipmentUnits,
  apiGetTemplatesByProduct,
  apiSearchWorkers,
  apiSearchAreas,
  apiCreateRecord,
} from "../_lib/api";
import type {
  UnitOption,
  ChecklistTemplate,
  StaffOption,
  AreaOption,
} from "../_lib/types";
import { getUnitLabel } from "../_lib/utils";

const STEPS = [
  { label: "Equipo" },
  { label: "Template" },
  { label: "Operador" },
  { label: "Confirmar" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateRecordDialog({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Unidad
  const [unitSearch, setUnitSearch] = useState("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);

  // Step 2 — Template
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Step 3 — Operador
  const [workerSearch, setWorkerSearch] = useState("");
  const [workers, setWorkers] = useState<StaffOption[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<StaffOption | null>(null);

  // Step 4 — Fecha y área
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setStep(0);
      setUnitSearch("");
      setSelectedUnit(null);
      setUnitsError(false);
      setTemplates([]);
      setSelectedTemplateId("");
      setWorkerSearch("");
      setSelectedWorker(null);
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedAreaId("");
    }
  }, [open]);

  // Cargar unidades al buscar
  useEffect(() => {
    if (!open) return;
    setLoadingUnits(true);
    setUnitsError(false);
    apiSearchEquipmentUnits(unitSearch || undefined)
      .then((data) => setUnits(Array.isArray(data) ? data : []))
      .catch((e) => { console.error(e); setUnitsError(true); })
      .finally(() => setLoadingUnits(false));
  }, [open, unitSearch]);

  // Cargar templates al seleccionar unidad (paso 2)
  useEffect(() => {
    if (step !== 1 || !selectedUnit) return;
    setLoadingTemplates(true);
    apiGetTemplatesByProduct(selectedUnit.product.id)
      .then((tpls) => {
        const active = tpls.filter((t) => t.isActive);
        setTemplates(active);
        if (active.length === 1) setSelectedTemplateId(active[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [step, selectedUnit]);

  // Cargar workers al buscar
  useEffect(() => {
    if (step !== 2) return;
    setLoadingWorkers(true);
    apiSearchWorkers(workerSearch || undefined)
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoadingWorkers(false));
  }, [step, workerSearch]);

  // Cargar áreas (paso 4)
  useEffect(() => {
    if (step !== 3) return;
    apiSearchAreas().then(setAreas).catch(console.error);
  }, [step]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!selectedUnit || !selectedTemplateId || !selectedWorker) return;
    setSubmitting(true);
    try {
      const record = await apiCreateRecord({
        unitId: selectedUnit.id,
        templateId: selectedTemplateId,
        operatorId: selectedWorker.id,
        date,
        ...(selectedAreaId ? { areaId: selectedAreaId } : {}),
      });
      toast.success("Checklist creado correctamente");
      onCreated();
      onOpenChange(false);
      router.push(`/dashboard/checklist/${record.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("409")) {
        toast.error("Ya existe un checklist para este equipo en esta fecha.");
      } else {
        toast.error("Error al crear el checklist");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selectedUnit;
    if (step === 1) return !!selectedTemplateId;
    if (step === 2) return !!selectedWorker;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b bg-muted/30">
          <DialogTitle className="text-base">Nuevo checklist</DialogTitle>
          {/* Stepper */}
          <div className="flex items-center gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:inline ${
                    i === step ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step content */}
        <div className="px-5 py-4 min-h-[320px] max-h-[60vh] overflow-y-auto">

          {/* Paso 1 — Equipo */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Selecciona el equipo a revisar</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre, serial…"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              {loadingUnits ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : unitsError ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive opacity-60" />
                  <p className="text-sm font-medium">Error al cargar equipos</p>
                  <p className="text-xs text-muted-foreground">
                    Verifica tu conexión o recarga la página.
                  </p>
                </div>
              ) : units.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <PackageOpen className="h-10 w-10 text-muted-foreground opacity-30" />
                  <div>
                    <p className="text-sm font-medium">
                      {unitSearch ? "Sin resultados para esa búsqueda" : "No hay equipos registrados"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Los equipos disponibles para checklist provienen del módulo de{" "}
                      <strong>Almacén</strong>. Asegúrate de que haya unidades de tipo
                      EQUIPO registradas allí.
                    </p>
                  </div>
                  {!unitSearch && (
                    <Link
                      href="/dashboard/storage/products"
                      onClick={() => onOpenChange(false)}
                      className="text-xs font-medium text-primary underline underline-offset-2"
                    >
                      Ir al catálogo de almacén →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnit(u)}
                      className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                        selectedUnit?.id === u.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50 active:bg-muted"
                      }`}
                    >
                      <p className="text-sm font-medium leading-none">{u.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getUnitLabel(u)} · {u.product.code}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 2 — Template */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Template para{" "}
                <span className="text-primary">{selectedUnit?.product.name}</span>
              </p>
              {loadingTemplates ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="text-sm font-medium">Sin templates activos</p>
                  <p className="text-xs text-muted-foreground">
                    Crea un template para este tipo de equipo en la pestaña Templates
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                  className="space-y-2"
                >
                  {templates.map((tpl) => (
                    <label
                      key={tpl.id}
                      htmlFor={`tpl-${tpl.id}`}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                        selectedTemplateId === tpl.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        id={`tpl-${tpl.id}`}
                        value={tpl.id}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium leading-none">{tpl.name}</p>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tpl.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {tpl.items.length} ítems
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {/* Paso 3 — Operador */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Selecciona el operador asignado</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre o DNI…"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              {loadingWorkers ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {workers.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWorker(w)}
                      className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                        selectedWorker?.id === w.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50 active:bg-muted"
                      }`}
                    >
                      <p className="text-sm font-medium leading-none">{w.label}</p>
                    </button>
                  ))}
                  {workers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Sin resultados
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paso 4 — Confirmar */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Confirma los datos del checklist</p>

              {/* Resumen */}
              <div className="rounded-lg border bg-muted/30 divide-y text-sm">
                <div className="flex gap-2 px-3 py-2.5">
                  <span className="text-muted-foreground w-24 shrink-0">Equipo</span>
                  <span className="font-medium">
                    {selectedUnit?.product.name} — {getUnitLabel(selectedUnit!)}
                  </span>
                </div>
                <div className="flex gap-2 px-3 py-2.5">
                  <span className="text-muted-foreground w-24 shrink-0">Template</span>
                  <span className="font-medium">
                    {templates.find((t) => t.id === selectedTemplateId)?.name}
                  </span>
                </div>
                <div className="flex gap-2 px-3 py-2.5">
                  <span className="text-muted-foreground w-24 shrink-0">Operador</span>
                  <span className="font-medium">{selectedWorker?.label}</span>
                </div>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <Label>Fecha del checklist</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Área (opcional) */}
              {areas.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Área (opcional)</Label>
                  <Select
                    value={selectedAreaId || "__none__"}
                    onValueChange={(v) => setSelectedAreaId(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sin área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin área</SelectItem>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/20">
          <Button
            variant="ghost"
            onClick={step === 0 ? () => onOpenChange(false) : handleBack}
            className="h-10 gap-1.5"
          >
            {step > 0 && <ChevronLeft className="h-4 w-4" />}
            {step === 0 ? "Cancelar" : "Atrás"}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canNext()}
              className="h-10 gap-1.5"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 gap-1.5"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear checklist
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
