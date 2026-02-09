"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import SearchSelect from "@/app/dashboard/incidents/_components/SearchSelect";

import type { TaskRow, TaskStatus, TaskPriority, TaskPeriod } from "../_lib/types";
import { apiListTasks, apiDeleteTask, apiRestoreTask, apiSearchWorkAreas } from "../_lib/api";

/* ── Helpers de presentación ── */
const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<TaskStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

const PRIORITY_VARIANT: Record<TaskPriority, "default" | "secondary" | "outline" | "destructive"> = {
  BAJA: "secondary",
  MEDIA: "outline",
  ALTA: "destructive",
};

function formatDate(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Component ── */
type Props = {
  refreshKey: number;
  period: TaskPeriod;
  onCreateClick: () => void;
  onViewClick: (t: TaskRow) => void;
  onEditClick: (t: TaskRow) => void;
};

export default function TasksTable({
  refreshKey,
  period,
  onCreateClick,
  onViewClick,
  onEditClick,
}: Props) {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [workAreaFilter, setWorkAreaFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Paginación ── */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(
    () => rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [rows, pageIndex, pageSize]
  );

  useEffect(() => setPageIndex(0), [rows, pageSize]);

  const fetchWorkAreas = useCallback((q: string) => apiSearchWorkAreas(q), []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListTasks({
        q: q || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        includeDeleted: includeDeleted || undefined,
        period,
        workAreaId: workAreaFilter || undefined,
      });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error cargando tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, period]);

  const askDelete = (t: TaskRow) => {
    setSelected(t);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      await apiDeleteTask(selected.id);
      setConfirmOpen(false);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const doRestore = async (t: TaskRow) => {
    try {
      await apiRestoreTask(t.id);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo restaurar");
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Filtros ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full sm:w-[260px]"
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            Buscar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | "ALL")}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
              <SelectItem value="COMPLETED">Completada</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as TaskPriority | "ALL")}
          >
            <SelectTrigger className="w-full sm:w-[120px] h-8">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
              <SelectItem value="MEDIA">Media</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full sm:w-[180px]">
            <SearchSelect
              value={workAreaFilter}
              onChange={(id) => setWorkAreaFilter(id)}
              placeholder="Área de trabajo"
              searchPlaceholder="Buscar área..."
              emptyText="Sin áreas"
              fetcher={fetchWorkAreas}
              allowClear
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIncludeDeleted((v) => !v)}
          >
            {includeDeleted ? "Con eliminadas" : "Sin eliminadas"}
          </Button>

          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            ↻
          </Button>

          <Button size="sm" onClick={onCreateClick}>
            Nueva
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {rows.length} resultado{rows.length !== 1 ? "s" : ""}
        </span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={load}>
          Aplicar filtros
        </Button>
      </div>

      <Separator />

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Prioridad</th>
              <th className="px-3 py-2">Progreso</th>
              <th className="px-3 py-2">Asignados</th>
              <th className="px-3 py-2">Vencimiento</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {loading ? "Cargando..." : "Sin tareas"}
                </td>
              </tr>
            )}

            {paginatedRows.map((t) => (
              <tr
                key={t.id}
                className={`border-t ${
                  t.isDeleted ? "opacity-50 line-through" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <button
                    className="font-medium text-left hover:underline"
                    onClick={() => onViewClick(t)}
                  >
                    {t.title}
                  </button>
                  {t.incident && (
                    <div className="text-xs text-muted-foreground">
                      Incidencia #{t.incident.number}: {t.incident.title || t.incident.id}
                    </div>
                  )}
                  {t.isDeleted && (
                    <Badge variant="destructive" className="ml-2">
                      Eliminada
                    </Badge>
                  )}
                </td>

                <td className="px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {t.workArea?.name ?? "\u2014"}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <Badge variant={STATUS_VARIANT[t.status]}>
                    {STATUS_LABELS[t.status]}
                  </Badge>
                </td>

                <td className="px-3 py-2">
                  <Badge variant={PRIORITY_VARIANT[t.priority]}>
                    {PRIORITY_LABELS[t.priority]}
                  </Badge>
                </td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.progress}%
                    </span>
                  </div>
                </td>

                <td className="px-3 py-2">
                  <span className="text-xs">
                    {t.assignees?.length ?? 0} persona{(t.assignees?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </td>

                <td className="px-3 py-2 text-xs">{formatDate(t.dueDate)}</td>

                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    {t.isDeleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doRestore(t)}
                      >
                        Restaurar
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditClick(t)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => askDelete(t)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="tasks-page-size" className="text-sm font-medium">
            Filas por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-16 sm:w-20 h-8" id="tasks-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Página {pageIndex + 1} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            »
          </Button>
        </div>
      </div>

      {/* ── Diálogo de confirmación ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tarea</DialogTitle>
            <DialogDescription>
              Se marcará como eliminada (baja lógica). Podrás restaurarla después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
