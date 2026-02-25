"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchSelect from "@/components/shared/SearchSelect";
import { FilterPopover } from "@/components/filter-popover";
import { DateRangePicker } from "@/components/ui/date-range-picker";

import type { TaskRow, TaskStatus, TaskPriority } from "../_lib/types";
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

const formatFolio = (num?: number | null) => {
  if (num == null) return "\u2014";
  return `#${String(num).padStart(3, "0")}`;
};

/* ── Component ── */
type Props = {
  refreshKey: number;
  onViewClick: (t: TaskRow) => void;
  onEditClick: (t: TaskRow) => void;
};

export default function TasksTable({
  refreshKey,
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
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Paginación ── */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Client-side filtering for dates as fallback
  const filteredRows = useMemo(() => {
    let out = rows;
    if (dateFrom) {
      const from = dateFrom.getTime();
      out = out.filter((t) => new Date(t.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = dateTo.getTime() + 86400000;
      out = out.filter((t) => new Date(t.createdAt).getTime() < to);
    }
    return out;
  }, [rows, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(
    () => filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filteredRows, pageIndex, pageSize]
  );

  useEffect(() => setPageIndex(0), [filteredRows, pageSize]);

  const fetchWorkAreas = useCallback((q: string) => apiSearchWorkAreas(q), []);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListTasks({
        q: q || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        includeDeleted: includeDeleted || undefined,
        workAreaId: workAreaFilter || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
        dateTo: dateTo ? dateTo.toISOString() : undefined,
      });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error cargando tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, statusFilter, priorityFilter, workAreaFilter, includeDeleted, dateFrom, dateTo]);

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
      toast.error(e?.message || "No se pudo eliminar");
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
      toast.error(e?.message || "No se pudo restaurar");
    }
  };

  /* ── Filter helpers ── */
  const activeFilterCount =
    (statusFilter !== "ALL" ? 1 : 0) +
    (priorityFilter !== "ALL" ? 1 : 0) +
    (workAreaFilter ? 1 : 0) +
    (includeDeleted ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setWorkAreaFilter("");
    setIncludeDeleted(false);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-3">
      {/* ── Filtros ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full sm:w-[260px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            activeCount={activeFilterCount}
            onClear={clearFilters}
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TaskStatus | "ALL")}
              >
                <SelectTrigger className="w-full h-8">
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prioridad</Label>
              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as TaskPriority | "ALL")}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Area de trabajo</Label>
              <SearchSelect
                value={workAreaFilter}
                onChange={(id) => setWorkAreaFilter(id)}
                placeholder="Seleccionar area"
                searchPlaceholder="Buscar area..."
                emptyText="Sin areas"
                fetcher={fetchWorkAreas}
                allowClear
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Incluir eliminadas</Label>
              <Switch
                checked={includeDeleted}
                onCheckedChange={setIncludeDeleted}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rango de fechas</Label>
              <DateRangePicker
                value={{ from: dateFrom, to: dateTo }}
                onChange={(range) => {
                  setDateFrom(range.from);
                  setDateTo(range.to);
                }}
              />
            </div>
          </FilterPopover>

          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filteredRows.length} resultado{filteredRows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Folio</th>
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
                  colSpan={9}
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
                <td className="px-3 py-2 font-mono font-medium text-primary">
                  {formatFolio(t.number)}
                </td>

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {t.isDeleted ? (
                        <DropdownMenuItem onClick={() => doRestore(t)}>
                          Restaurar
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onViewClick(t)}>
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditClick(t)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => askDelete(t)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            Filas por pagina
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
            Pagina {pageIndex + 1} de {pageCount}
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
