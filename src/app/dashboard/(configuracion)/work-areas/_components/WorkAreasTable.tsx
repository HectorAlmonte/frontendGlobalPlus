"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, AlertCircle, Layers } from "lucide-react";
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

import type { WorkAreaRow } from "../_lib/types";
import {
  apiListWorkAreas,
  apiToggleWorkArea,
  apiDeleteWorkArea,
} from "../_lib/api";

type Props = {
  refreshKey: number;
  onEditClick: (a: WorkAreaRow) => void;
};

export default function WorkAreasTable({
  refreshKey,
  onEditClick,
}: Props) {
  const [rows, setRows] = useState<WorkAreaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<WorkAreaRow | null>(null);
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

  const load = async () => {
    setError(false);
    try {
      setLoading(true);
      const data = await apiListWorkAreas({ q: q.trim() || undefined });
      setRows(data);
    } catch (e: any) {
      setError(true);
      toast.error(e?.message || "Error cargando áreas de trabajo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const isFirstQ = useRef(true);
  useEffect(() => {
    if (isFirstQ.current) { isFirstQ.current = false; return; }
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = async (a: WorkAreaRow) => {
    try {
      await apiToggleWorkArea(a.id);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo cambiar estado");
    }
  };

  const askDelete = (a: WorkAreaRow) => {
    setSelected(a);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      await apiDeleteWorkArea(selected.id);
      setConfirmOpen(false);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Filtros ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full sm:w-[320px]"
        />

        <Button
          size="sm"
          variant="outline"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {rows.length} resultado{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Activo</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-40" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-48" /></td>
                <td className="px-3 py-2"><Skeleton className="h-5 w-10 rounded-full" /></td>
                <td className="px-3 py-2"><Skeleton className="h-7 w-14 rounded ml-auto" /></td>
              </tr>
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Error al cargar las áreas de trabajo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No se pudo conectar con el servidor</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reintentar
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Layers className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Sin áreas de trabajo</p>
                    <p className="text-xs text-muted-foreground">No se encontraron áreas con los filtros aplicados</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && paginatedRows.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono font-medium">{a.code}</td>

                <td className="px-3 py-2">
                  <span className="font-medium">{a.name}</span>
                </td>

                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[240px] truncate">
                  {a.description || "\u2014"}
                </td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.isActive ? "default" : "outline"}>
                      {a.isActive ? "Sí" : "No"}
                    </Badge>
                    <Switch
                      checked={a.isActive}
                      onCheckedChange={() => toggle(a)}
                    />
                  </div>
                </td>

                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditClick(a)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => askDelete(a)}
                      >
                        Eliminar
                      </DropdownMenuItem>
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
          <Label htmlFor="wa-page-size" className="text-sm font-medium">
            Filas por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-20 h-8" id="wa-page-size">
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
            <DialogTitle>Eliminar área de trabajo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el área de trabajo &quot;{selected?.name}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={doDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
