"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
  Calendar,
  User,
  Hash,
  Briefcase,
  AlignLeft,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  apiGetTask,
  apiUpdateTask,
  apiAddSubItem,
  apiToggleSubItem,
  apiDeleteSubItem,
  apiAddAssignees,
  apiRemoveAssignee,
  apiSearchEmployees,
} from "../_lib/api";

/* ── Helpers ── */
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Inline employee search (SIN CAMBIOS EN LÓGICA) ── */
function InlineEmployeeAdd({ existingIds, onAdd }: { existingIds: string[]; onAdd: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runFetch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await apiSearchEmployees(q);
      setItems(Array.isArray(res) ? res : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runFetch(query), 250);
    return () => clearTimeout(t);
  }, [query, runFetch]);

  // Click outside
  useEffect(() => {
    if (!showList) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showList]);

  const filtered = items.filter((it) => !existingIds.includes(it.value));

  return (
    <div ref={containerRef} className="relative mt-2">
      <Command shouldFilter={false} className="border rounded-lg shadow-sm">
        <CommandInput
          placeholder="Buscar empleado..."
          value={query}
          onValueChange={setQuery}
          onFocus={() => setShowList(true)}
          className="h-9"
        />
        {showList && (
          <CommandList className="absolute top-full left-0 w-full z-50 mt-1 bg-popover border rounded-md shadow-md">
            {loading && <div className="p-2 text-xs text-muted-foreground italic">Buscando...</div>}
            {!loading && filtered.length === 0 && <CommandEmpty>Sin resultados</CommandEmpty>}
            <CommandGroup>
              {filtered.map((it) => (
                <CommandItem
                  key={it.value}
                  onSelect={() => {
                    onAdd(it.value);
                    setQuery("");
                    setShowList(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}

/* ── Detail Sheet ── */
type Props = {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onEditClick: (task: TaskRow) => void;
};

export default function TaskDetailSheet({ open, taskId, onClose, onChanged, onEditClick }: Props) {
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const reload = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const data = await apiGetTask(taskId);
      setTask(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) reload();
  }, [open, taskId, reload]);

  /* ── Handlers (LÓGICA ORIGINAL PRESERVADA) ── */
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || task.status === newStatus) return;
    try {
      setChangingStatus(true);
      await apiUpdateTask(task.id, { status: newStatus });
      await reload();
      onChanged();
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleToggleSub = async (subId: string) => {
    if (!task) return;
    await apiToggleSubItem(task.id, subId);
    await reload();
    onChanged();
  };

  const handleDeleteSub = async (subId: string) => {
    if (!task) return;
    await apiDeleteSubItem(task.id, subId);
    await reload();
    onChanged();
  };

  const handleAddSub = async () => {
    if (!task || !newSubTitle.trim()) return;
    try {
      setAddingSub(true);
      await apiAddSubItem(task.id, newSubTitle.trim());
      setNewSubTitle("");
      await reload();
      onChanged();
    } finally {
      setAddingSub(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col bg-background">
        
        {/* Header */}
        <SheetHeader className="p-6 border-b space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Tarea #{taskId?.slice(-6)}</span>
          </div>
          <SheetTitle className="text-2xl font-bold">{task?.title || "Cargando..."}</SheetTitle>
          {task && !task.isDeleted && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEditClick(task)} className="h-8 shadow-sm">
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Editar
              </Button>
              {task.status !== "COMPLETED" && (
                <Button size="sm" onClick={() => handleStatusChange("COMPLETED")} disabled={changingStatus} className="h-8 gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {changingStatus ? "Guardando..." : "Completar"}
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && !task ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Cargando...</div>
          ) : !task ? (
            <p className="text-center py-10 text-muted-foreground">No se encontró la tarea.</p>
          ) : (
            <div className="p-6 space-y-8">
              
              {/* Grid de Información Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Estado</label>
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)} disabled={changingStatus}>
                    <SelectTrigger className="h-9 bg-muted/50">
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Prioridad</label>
                  <div className="h-9 flex items-center">
                    <Badge 
                      variant={task.priority === "ALTA" ? "destructive" : task.priority === "MEDIA" ? "outline" : "secondary"}
                      className="rounded-md"
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Vencimiento</p>
                    <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Creador</p>
                    <p className="text-sm font-medium truncate">
                      {task.createdBy?.employee ? `${task.createdBy.employee.nombres}` : task.createdBy?.username}
                    </p>
                  </div>
                </div>

                {task.incident && (
                  <div className="flex items-center gap-3 col-span-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Incidencia vinculada</p>
                      <p className="text-sm font-medium">
                        #{task.incident.number}: {task.incident.title || task.incident.id}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Progreso</span>
                <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      task.progress === 100
                        ? "bg-green-500"
                        : task.progress > 0
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{task.progress}%</span>
              </div>

              {/* Descripción */}
              {task.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlignLeft className="h-4 w-4" /> Descripción
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border italic">
                    {task.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Subtareas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" /> Subtareas
                  </h4>
                  <Badge variant="secondary" className="text-[10px]">{task.subItems?.length || 0}</Badge>
                </div>

                <div className="space-y-2">
                  {task.subItems?.map((sub) => (
                    <div key={sub.id} className="group flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox checked={sub.isCompleted} onCheckedChange={() => handleToggleSub(sub.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${sub.isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}>
                          {sub.title}
                        </span>
                        {sub.isCompleted && sub.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            Completada el {new Date(sub.completedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleDeleteSub(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <Input
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      placeholder="Nueva subtarea..."
                      className="h-9"
                      onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
                    />
                    <Button size="sm" onClick={handleAddSub} disabled={addingSub} className="h-9">
                      {addingSub ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Asignados */}
              <div className="space-y-4 pb-10">
                <h4 className="text-sm font-bold flex items-center gap-2">Equipo</h4>
                <div className="flex flex-wrap gap-2">
                  {task.assignees?.map((a) => (
                    <Badge key={a.id} variant="outline" className="pl-1 pr-2 py-1 gap-2 bg-background shadow-sm">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                        {a.employee.nombres[0]}
                      </div>
                      <span className="text-xs">{a.employee.nombres}</span>
                      <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => apiRemoveAssignee(task.id, a.employeeId).then(reload)} />
                    </Badge>
                  ))}
                </div>
                <InlineEmployeeAdd 
                  existingIds={task.assignees?.map((a) => a.employeeId) ?? []} 
                  onAdd={(id) => { console.log("Enviando ID:", id);apiAddAssignees(task.id, [id]).then(reload); onChanged(); }} 
                />
              </div>

            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}