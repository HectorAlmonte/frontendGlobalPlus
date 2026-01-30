"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Loader2, Paperclip, X } from "lucide-react";

type CloseIncidentPayload = {
  detail: string;
  files: File[];
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  incidentId?: string | null;

  // loading externo opcional (si ya lo manejas arriba)
  loading?: boolean;

  // ejecuta el cierre (en tu page: llama al endpoint closeIncident)
  onSubmit: (payload: CloseIncidentPayload) => Promise<void> | void;

  // ✅ opcional: evita cerrar mientras carga (igual que tu CorrectiveModal)
  preventCloseWhileSaving?: boolean;
};

function formatFileSize(bytes: number) {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function CloseIncidentModal({
  open,
  onOpenChange,
  incidentId,
  loading = false,
  onSubmit,
  preventCloseWhileSaving = true,
}: Props) {
  const [detail, setDetail] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [touched, setTouched] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const canSubmit = !!incidentId && detail.trim().length >= 3 && !loading;

  React.useEffect(() => {
    // reset al cerrar
    if (!open) {
      setDetail("");
      setFiles([]);
      setTouched(false);
      setErr(null);
    }
  }, [open]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setFiles((prev) => [...prev, ...picked]);
    // limpia input para poder volver a seleccionar el mismo archivo si quieres
    e.currentTarget.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setTouched(true);
    setErr(null);
    if (!canSubmit) return;

    try {
      await onSubmit({
        detail: detail.trim(),
        files,
      });
    } catch (e: any) {
      setErr(e?.message || "Error al cerrar la incidencia");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && preventCloseWhileSaving && loading) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cerrar incidencia</DialogTitle>
          <DialogDescription>
            Completa el detalle del cierre. Puedes adjuntar evidencia (opcional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {err && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="rounded-xl border border-muted p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Incidencia</span>
              <Badge variant="secondary" className="font-mono">
                {incidentId || "—"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-detail">
              Detalle de cierre <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="close-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Describe qué se hizo, resultado, verificación, responsables, etc."
              className="min-h-[120px]"
              disabled={loading}
            />
            {touched && detail.trim().length < 3 && (
              <p className="text-xs text-destructive">
                El detalle es obligatorio (mínimo 3 caracteres).
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Evidencias (opcional)</Label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-muted px-3 py-2 text-sm hover:bg-muted/50">
                <Paperclip className="h-4 w-4" />
                <span>Adjuntar</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={onPickFiles}
                  disabled={loading}
                />
              </label>
            </div>

            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se adjuntaron archivos.
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-muted p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(f.size)} • {f.type || "archivo"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeFile(idx)}
                      disabled={loading}
                      title="Quitar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-w-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cerrando...
              </span>
            ) : (
              "Cerrar incidencia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
