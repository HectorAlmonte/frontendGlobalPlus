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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  uploading: boolean;
  onUpload: (file: File, notes?: string) => Promise<void> | void;
};

export default function NewVersionDialog({
  open,
  onOpenChange,
  uploading,
  onUpload,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setNotes("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!file) return;
    await onUpload(file, notes.trim() || undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir nueva versión</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Archivo PDF</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cambios realizados en esta versión..."
              className="min-h-[80px]"
              disabled={uploading}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>

            <Button onClick={handleSubmit} disabled={uploading || !file}>
              {uploading ? "Subiendo..." : "Subir versión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
