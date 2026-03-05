"use client";

import { useState, useRef } from "react";
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { apiUploadItemPhoto, apiDeleteItemPhoto } from "../_lib/api";
import type { ChecklistRecordItem, FillItemState, ItemResult } from "../_lib/types";

interface Props {
  recordId: string;
  item: ChecklistRecordItem;
  state: FillItemState;
  onChange: (patch: Partial<FillItemState>) => void;
  readOnly?: boolean;
}

const RESULTS: { value: ItemResult; label: string; color: string; bg: string; activeBg: string }[] = [
  {
    value: "OK",
    label: "OK",
    color: "text-green-700 dark:text-green-300",
    bg: "border-green-200 hover:border-green-400 hover:bg-green-50",
    activeBg: "border-green-500 bg-green-100 dark:bg-green-900/40 dark:border-green-500",
  },
  {
    value: "NOK",
    label: "NOK",
    color: "text-red-700 dark:text-red-300",
    bg: "border-red-200 hover:border-red-400 hover:bg-red-50",
    activeBg: "border-red-500 bg-red-100 dark:bg-red-900/40 dark:border-red-500",
  },
  {
    value: "NA",
    label: "N/A",
    color: "text-gray-600 dark:text-gray-400",
    bg: "border-gray-200 hover:border-gray-400 hover:bg-gray-50",
    activeBg: "border-gray-400 bg-gray-100 dark:bg-gray-800 dark:border-gray-500",
  },
];

export default function ChecklistItemRow({
  recordId,
  item,
  state,
  onChange,
  readOnly = false,
}: Props) {
  const [showObs, setShowObs] = useState(!!state.observations);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(
    item.photoUrl ?? null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const tpl = item.templateItem;
  const isNok = state.result === "NOK";
  const isCriticalNok = tpl.isCritical && isNok;

  const parseOptions = (): string[] => {
    if (!tpl.options) return [];
    try {
      return JSON.parse(tpl.options) as string[];
    } catch {
      return [];
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const updated = await apiUploadItemPhoto(recordId, item.id, file);
      const updatedItem = updated.items?.find((i) => i.id === item.id);
      setLocalPhotoUrl(updatedItem?.photoUrl ?? URL.createObjectURL(file));
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    setDeletingPhoto(true);
    try {
      await apiDeleteItemPhoto(recordId, item.id);
      setLocalPhotoUrl(null);
      toast.success("Foto eliminada");
    } catch {
      toast.error("Error al eliminar la foto");
    } finally {
      setDeletingPhoto(false);
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isCriticalNok
          ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
          : "border bg-card"
      }`}
    >
      {/* Header del ítem */}
      <div
        className={`flex items-start gap-2 px-4 py-3 border-b ${
          isCriticalNok ? "border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/20" : "bg-muted/30"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold leading-none">{tpl.label}</p>
            {tpl.isCritical && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Crítico
              </span>
            )}
            {tpl.isRequired && (
              <span className="text-xs text-muted-foreground">Requerido</span>
            )}
          </div>
          {tpl.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        {/* Botones OK / NOK / NA — táctiles grandes */}
        <div className="flex gap-2">
          {RESULTS.map((r) => (
            <button
              key={r.value}
              disabled={readOnly}
              onClick={() => !readOnly && onChange({ result: r.value })}
              className={`flex-1 rounded-lg border-2 py-3 text-sm font-bold transition-all ${
                state.result === r.value
                  ? `${r.activeBg} ${r.color}`
                  : `${r.bg} text-muted-foreground`
              } ${readOnly ? "opacity-60 cursor-default" : "active:scale-95"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Input según kind */}
        {tpl.kind === "BOOLEAN" && (
          <div className="flex items-center gap-3">
            <Switch
              checked={state.booleanValue ?? false}
              disabled={readOnly}
              onCheckedChange={(v) => onChange({ booleanValue: v })}
            />
            <span className="text-sm text-muted-foreground">
              {state.booleanValue ? "Sí / Conforme" : "No / No conforme"}
            </span>
          </div>
        )}

        {tpl.kind === "NUMERIC" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor numérico</Label>
            <Input
              type="number"
              value={state.numericValue ?? ""}
              disabled={readOnly}
              onChange={(e) =>
                onChange({
                  numericValue: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="h-10 max-w-[200px]"
              placeholder="0"
            />
          </div>
        )}

        {tpl.kind === "SELECT" && (
          <RadioGroup
            value={state.selectedOption ?? ""}
            disabled={readOnly}
            onValueChange={(v) => onChange({ selectedOption: v })}
            className="flex flex-wrap gap-2"
          >
            {parseOptions().map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                  state.selectedOption === opt
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:bg-muted/50"
                } ${readOnly ? "cursor-default" : ""}`}
              >
                <RadioGroupItem value={opt} />
                {opt}
              </label>
            ))}
          </RadioGroup>
        )}

        {tpl.kind === "TEXT" && (
          <textarea
            value={state.textValue ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ textValue: e.target.value })}
            rows={2}
            placeholder="Escribe tu observación…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        )}

        {/* Observación por ítem */}
        <div>
          <button
            onClick={() => setShowObs((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showObs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showObs ? "Ocultar observación" : "Agregar observación"}
          </button>
          {showObs && (
            <textarea
              value={state.observations}
              disabled={readOnly}
              onChange={(e) => onChange({ observations: e.target.value })}
              rows={2}
              placeholder="Observación del ítem…"
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          )}
        </div>

        {/* Foto — se muestra destacada si NOK */}
        {!readOnly && (
          <div>
            {localPhotoUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPhotoUrl}
                  alt="Foto del ítem"
                  className="h-24 w-auto rounded-lg border object-cover"
                />
                <button
                  onClick={handleDeletePhoto}
                  disabled={deletingPhoto}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                >
                  {deletingPhoto ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-xs transition-colors ${
                  isNok
                    ? "border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium"
                    : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                }`}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {uploadingPhoto ? "Subiendo…" : isNok ? "Adjuntar foto (recomendado)" : "Agregar foto"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        )}

        {/* Foto en modo lectura */}
        {readOnly && localPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={localPhotoUrl}
            alt="Foto del ítem"
            className="h-24 w-auto rounded-lg border object-cover"
          />
        )}
      </div>
    </div>
  );
}
