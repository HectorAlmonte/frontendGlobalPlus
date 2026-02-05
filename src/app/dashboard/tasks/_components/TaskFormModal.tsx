"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Check, Loader2, X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { TaskRow, TaskStatus, TaskPriority } from "../_lib/types";
import {
  apiCreateTask,
  apiUpdateTask,
  apiSearchEmployees,
  apiSearchIncidents,
} from "../_lib/api";

/* ── Generic inline search ── */
type SearchOption = { value: string; label: string };

function InlineSearch({
  placeholder,
  fetcher,
  selectedIds,
  onSelect,
}: {
  placeholder: string;
  fetcher: (q: string) => Promise<SearchOption[]>;
  selectedIds?: string[];
  onSelect: (id: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const aliveRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const runFetch = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await fetcher(q);
        if (!aliveRef.current) return;
        setItems(Array.isArray(res) ? res : []);
      } catch {
        if (!aliveRef.current) return;
        setItems([]);
      } finally {
        if (!aliveRef.current) return;
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    runFetch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runFetch(query), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Cerrar lista al hacer clic fuera (soluciona bloqueo de botones)
  useEffect(() => {
    if (!showList) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showList]);

  const filtered = selectedIds
    ? items.filter((it) => !selectedIds.includes(it.value))
    : items;

  return (
    <div ref={containerRef} className="rounded-md border">
      <Command shouldFilter={false} className="rounded-md">
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
          onFocus={() => setShowList(true)}
        />
        {showList && (
          <CommandList className="max-h-[140px]">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <CommandEmpty>Sin resultados</CommandEmpty>
            ) : null}

            <CommandGroup>
              {filtered.map((it) => (
                <CommandItem
                  key={it.value}
                  value={it.label}
                  onSelect={() => {
                    onSelect(it.value, it.label);
                    setQuery("");
                    setShowList(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
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

/* ── Form Modal ── */
type Props = {
  open: boolean;
  editing: TaskRow | null;
  onSuccess: () => void;
  onClose: () => void;
};

export default function TaskFormModal({
  open,
  editing,
  onSuccess,
  onClose,
}: Props) {
  const isEdit = !!editing;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    editing?.status ?? "PENDING"
  );
  const [priority, setPriority] = useState<TaskPriority>(
    editing?.priority ?? "MEDIA"
  );
  const [dueDate, setDueDate] = useState(
    editing?.dueDate ? editing.dueDate.slice(0, 10) : ""
  );

  // Incidencia vinculada
  const [incidentId, setIncidentId] = useState(editing?.incidentId ?? "");
  const [incidentLabel, setIncidentLabel] = useState(
    editing?.incident?.title ?? ""
  );

  // Asignados
  const [assignees, setAssignees] = useState<{ id: string; label: string }[]>(
    () =>
      editing?.assignees?.map((a) => ({
        id: a.employeeId,
        label: `${a.employee.nombres} ${a.employee.apellidos}`,
      })) ?? []
  );

  // Subtareas (solo al crear)
  const [subItems, setSubItems] = useState<string[]>([]);
  const [newSubItem, setNewSubItem] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchEmployees = useCallback((q: string) => apiSearchEmployees(q), []);
  const fetchIncidents = useCallback((q: string) => apiSearchIncidents(q), []);

  const addSubItem = () => {
    const trimmed = newSubItem.trim();
    if (!trimmed) return;
    setSubItems((prev) => [...prev, trimmed]);
    setNewSubItem("");
  };

  const removeSubItem = (idx: number) => {
    setSubItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAssignee = (id: string, label: string) => {
    if (assignees.some((a) => a.id === id)) return;
    setAssignees((prev) => [...prev, { id, label }]);
  };

  const removeAssignee = (id: string) => {
    setAssignees((prev) => prev.filter((a) => a.id !== id));
  };

  const submit = async () => {
    setErrors({});

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrors({ title: "El título es requerido" });
      return;
    }

    try {
      setSaving(true);

      if (isEdit && editing) {
        await apiUpdateTask(editing.id, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || null,
          incidentId: incidentId || null,
        });
      } else {
        // Auto-agregar subtarea pendiente en el input
        const finalSubItems = [...subItems];
        const pendingSub = newSubItem.trim();
        if (pendingSub) {
          finalSubItems.push(pendingSub);
          setNewSubItem("");
        }

        await apiCreateTask({
          title: trimmedTitle,
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || null,
          incidentId: incidentId || null,
          assignees: assignees.map((a) => a.id),
          subItems: finalSubItems.map((s) => ({ title: s })),
        });
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos de la tarea."
              : "Crea una nueva tarea con subtareas y asignados."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {errors.form && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Título */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Reparar cerco perimetral"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de vencimiento */}
            <div className="space-y-2">
              <Label>Fecha de vencimiento (opcional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la tarea..."
                className="min-h-[80px]"
              />
            </div>

            {/* Incidencia vinculada */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Incidencia vinculada (opcional)</Label>

              {incidentId ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate flex-1">
                    {incidentLabel || "Seleccionada"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIncidentId("");
                      setIncidentLabel("");
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <InlineSearch
                  placeholder="Buscar incidencia..."
                  fetcher={fetchIncidents}
                  onSelect={(id, label) => {
                    setIncidentId(id);
                    setIncidentLabel(label);
                  }}
                />
              )}
            </div>

            {/* Asignados */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Asignados</Label>

              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {assignees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      <span>{a.label}</span>
                      <button
                        type="button"
                        onClick={() => removeAssignee(a.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <InlineSearch
                placeholder="Buscar empleado por DNI o nombre..."
                fetcher={fetchEmployees}
                selectedIds={assignees.map((a) => a.id)}
                onSelect={addAssignee}
              />
              <p className="text-xs text-muted-foreground">
                Busca y selecciona empleados para asignar.
              </p>
            </div>

            {/* Subtareas (solo al crear) */}
            {!isEdit && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Subtareas</Label>

                {subItems.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {subItems.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                      >
                        <span className="flex-1">{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSubItem(i)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newSubItem}
                    onChange={(e) => setNewSubItem(e.target.value)}
                    placeholder="Nombre de la subtarea"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addSubItem())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubItem}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4 border-t">
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
