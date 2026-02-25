"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { NavSection } from "../_lib/types";
import { apiCreateSection, apiUpdateSection } from "../_lib/api";
import IconPicker from "./IconPicker";

type Props = {
  open: boolean;
  editing: NavSection | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function SectionFormDialog({ open, editing, onClose, onSuccess }: Props) {
  const isEdit = !!editing;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [order, setOrder] = useState(String(editing?.order ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const trimmed = title.trim();
    if (!trimmed) {
      setError("El titulo es requerido");
      return;
    }

    try {
      setSaving(true);
      const input = {
        title: trimmed,
        icon: icon || undefined,
        order: Number(order) || 0,
      };

      if (isEdit && editing) {
        await apiUpdateSection(editing.id, input);
      } else {
        await apiCreateSection(input);
      }

      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar seccion" : "Nueva seccion"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titulo *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gestion" />
          </div>

          <div className="space-y-2">
            <Label>Orden</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="0" className="w-24" />
          </div>

          <div className="space-y-2">
            <Label>Icono (opcional)</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
