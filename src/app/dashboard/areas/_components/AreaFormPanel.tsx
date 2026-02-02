"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { AreaRow } from "../_lib/types";
import { apiCreateArea, apiUpdateArea, apiSearchAreas } from "../_lib/api";

/* ── Selector inline de área padre ── */
type AreaOption = { value: string; label: string };

function InlineAreaSearch({
  value,
  selectedLabel,
  onChange,
}: {
  value: string;
  selectedLabel: string;
  onChange: (id: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AreaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const runFetch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await apiSearchAreas(q);
      if (!aliveRef.current) return;
      setItems(Array.isArray(res) ? res : []);
    } catch {
      if (!aliveRef.current) return;
      setItems([]);
    } finally {
      if (!aliveRef.current) return;
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    runFetch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce al escribir
  useEffect(() => {
    const t = setTimeout(() => runFetch(query), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Si ya tiene valor seleccionado, mostrar chip
  if (value && !showList) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <Check className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate flex-1">{selectedLabel || "Seleccionado"}</span>
        <button
          type="button"
          onClick={() => {
            onChange("", "");
            setShowList(true);
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Command shouldFilter={false} className="rounded-md">
        <CommandInput
          placeholder="Buscar área padre..."
          value={query}
          onValueChange={setQuery}
          onFocus={() => setShowList(true)}
        />

        {showList && (
          <CommandList className="max-h-[160px]">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <CommandEmpty>Sin resultados</CommandEmpty>
            ) : null}

            <CommandGroup>
              {items.map((it) => (
                <CommandItem
                  key={it.value}
                  value={it.label}
                  onSelect={() => {
                    onChange(it.value, it.label);
                    setShowList(false);
                    setQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === it.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{it.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}

/* ── Form Panel (Dialog) ── */
type Props = {
  open: boolean;
  editing: AreaRow | null;
  onSuccess: () => void;
  onClose: () => void;
};

export default function AreaFormPanel({ open, editing, onSuccess, onClose }: Props) {
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? "");
  const [code, setCode] = useState(editing?.code ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [parentId, setParentId] = useState(editing?.parentId ?? "");
  const [parentLabel, setParentLabel] = useState(editing?.parent?.name ?? "");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    setErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ name: "El nombre es requerido" });
      return;
    }

    const input = {
      name: trimmedName,
      code: code.trim().toUpperCase() || undefined,
      description: description.trim() || undefined,
      parentId: parentId || null,
    };

    try {
      setSaving(true);

      if (isEdit && editing) {
        await apiUpdateArea(editing.id, input);
      } else {
        await apiCreateArea(input);
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
          <DialogTitle>{isEdit ? "Editar área" : "Nueva área"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del área."
              : "Crea una nueva área para clasificar incidencias."}
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
              placeholder="Ej: Mantenimiento"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Código (opcional)</p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: MNT"
            />
            <p className="text-xs text-muted-foreground">
              Se guardará en mayúsculas.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Descripción (opcional)</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el área..."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Área padre (opcional)</p>
            <InlineAreaSearch
              value={parentId}
              selectedLabel={parentLabel}
              onChange={(id, label) => {
                setParentId(id);
                setParentLabel(label);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Escribe para buscar. Déjalo vacío si no tiene área padre.
            </p>
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
