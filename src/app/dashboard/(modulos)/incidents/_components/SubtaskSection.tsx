"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { IncidentSubtask } from "../_lib/types";
import {
  apiListSubtasks,
  apiCreateSubtask,
  apiUpdateSubtask,
  apiDeleteSubtask,
  apiSearchObservedUsers,
} from "../_lib/api";
import SearchSelect from "@/components/shared/SearchSelect";

function pickName(u: any) {
  const emp = u?.employee;
  const nombres = emp?.nombres ?? "";
  const apellidos = emp?.apellidos ?? "";
  const full = `${nombres} ${apellidos}`.trim();
  return full || u?.username || "—";
}

function fmtDateShort(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  incidentId: string;
  initialSubtasks?: IncidentSubtask[];
  isSupervisor: boolean;
  isClosed: boolean;
  onReload: () => void;
};

type FormState = {
  title: string;
  detail: string;
  assignedToId: string;
  assignedToLabel: string;
};

const emptyForm: FormState = {
  title: "",
  detail: "",
  assignedToId: "",
  assignedToLabel: "",
};

export default function SubtaskSection({
  incidentId,
  initialSubtasks,
  isSupervisor,
  isClosed,
  onReload,
}: Props) {
  const [subtasks, setSubtasks] = React.useState<IncidentSubtask[]>(
    initialSubtasks ?? []
  );
  const [loading, setLoading] = React.useState(!initialSubtasks);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSubtask, setEditingSubtask] =
    React.useState<IncidentSubtask | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  // Fetch subtasks
  const fetchSubtasks = React.useCallback(async () => {
    try {
      const data = await apiListSubtasks(incidentId);
      setSubtasks(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  React.useEffect(() => {
    if (initialSubtasks) {
      setSubtasks(initialSubtasks);
      setLoading(false);
    } else {
      fetchSubtasks();
    }
  }, [initialSubtasks, fetchSubtasks]);

  // Reset form on dialog close
  React.useEffect(() => {
    if (!dialogOpen) {
      setForm(emptyForm);
      setEditingSubtask(null);
    }
  }, [dialogOpen]);

  // Progress
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.isCompleted).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  // Toggle completion (optimistic)
  async function handleToggle(st: IncidentSubtask) {
    if (isClosed) return;

    const newVal = !st.isCompleted;
    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === st.id
          ? { ...s, isCompleted: newVal, completedAt: newVal ? new Date().toISOString() : null }
          : s
      )
    );

    try {
      await apiUpdateSubtask(incidentId, st.id, { isCompleted: newVal });
      onReload();
    } catch (e: any) {
      // Rollback
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === st.id
            ? { ...s, isCompleted: st.isCompleted, completedAt: st.completedAt }
            : s
        )
      );
      toast.error(e?.message || "Error al actualizar objetivo");
    }
  }

  // Open create dialog
  function handleCreate() {
    setEditingSubtask(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(st: IncidentSubtask) {
    setEditingSubtask(st);
    setForm({
      title: st.title,
      detail: st.detail ?? "",
      assignedToId: st.assignedTo?.id ?? "",
      assignedToLabel: st.assignedTo ? pickName(st.assignedTo) : "",
    });
    setDialogOpen(true);
  }

  // Save (create or edit)
  async function handleSave() {
    const title = form.title.trim();
    if (!title) {
      toast.error("El titulo es requerido");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title,
        detail: form.detail.trim() || null,
        assignedToId: form.assignedToId || null,
      };

      if (editingSubtask) {
        await apiUpdateSubtask(incidentId, editingSubtask.id, body);
        toast.success("Objetivo actualizado");
      } else {
        await apiCreateSubtask(incidentId, body as any);
        toast.success("Objetivo creado");
      }

      setDialogOpen(false);
      await fetchSubtasks();
      onReload();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar objetivo");
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete(st: IncidentSubtask) {
    try {
      await apiDeleteSubtask(incidentId, st.id);
      toast.success("Objetivo eliminado");
      setSubtasks((prev) => prev.filter((s) => s.id !== st.id));
      onReload();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar objetivo");
    }
  }

  const canAct = isSupervisor && !isClosed;

  return (
    <>
      <Card className="border-muted/60 mt-5">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Objetivos</CardTitle>
            {canAct && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completed} de {total} completado{total !== 1 ? "s" : ""}
                </span>
                {allDone && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Todos los objetivos cumplidos
                  </Badge>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando objetivos...</p>
          )}

          {!loading && total === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay objetivos registrados.
            </p>
          )}

          {subtasks.map((st) => (
            <div
              key={st.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <Checkbox
                checked={st.isCompleted}
                onCheckedChange={() => handleToggle(st)}
                disabled={isClosed}
                className="mt-0.5"
              />

              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className={`text-sm font-medium ${
                    st.isCompleted
                      ? "line-through opacity-50"
                      : ""
                  }`}
                >
                  {st.title}
                </p>

                {st.detail && (
                  <p
                    className={`text-xs text-muted-foreground whitespace-pre-wrap ${
                      st.isCompleted ? "opacity-50" : ""
                    }`}
                  >
                    {st.detail}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {st.assignedTo && (
                    <Badge variant="outline" className="text-xs">
                      {pickName(st.assignedTo)}
                    </Badge>
                  )}

                  <span className="text-[11px] text-muted-foreground">
                    {fmtDateShort(st.createdAt)}
                    {st.createdBy && ` — ${pickName(st.createdBy)}`}
                  </span>
                </div>
              </div>

              {canAct && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Editar objetivo"
                    onClick={() => handleEdit(st)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Eliminar objetivo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Eliminar este objetivo?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(st)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubtask ? "Editar objetivo" : "Nuevo objetivo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="subtask-title">Titulo *</Label>
              <Input
                id="subtask-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Titulo del objetivo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subtask-detail">Detalle</Label>
              <Textarea
                id="subtask-detail"
                value={form.detail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, detail: e.target.value }))
                }
                placeholder="Descripcion (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Asignado a</Label>
              <SearchSelect
                value={form.assignedToId}
                onChange={(v) =>
                  setForm((f) => ({ ...f, assignedToId: v }))
                }
                fetcher={apiSearchObservedUsers}
                placeholder="Seleccionar trabajador..."
                searchPlaceholder="Buscar trabajador..."
                emptyText="Sin resultados"
                selectedLabel={form.assignedToLabel}
                allowClear
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Guardando..."
                : editingSubtask
                ? "Guardar cambios"
                : "Crear objetivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
