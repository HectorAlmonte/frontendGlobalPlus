"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

import type { AreaRow } from "../_lib/types";
import {
  apiListAreas,
  apiToggleArea,
  apiSoftDeleteArea,
  apiRestoreArea,
} from "../_lib/api";

type Props = {
  refreshKey: number;
  onCreateClick: () => void;
  onEditClick: (a: AreaRow) => void;
};

export default function AreasTable({
  refreshKey,
  onCreateClick,
  onEditClick,
}: Props) {
  const [rows, setRows] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<AreaRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Paginación ── */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(
    () => rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [rows, pageIndex, pageSize]
  );

  // Reset a página 0 cuando cambian los datos o el tamaño
  useEffect(() => setPageIndex(0), [rows, pageSize]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListAreas({
        q,
        includeDeleted: includeDeleted || undefined,
        active: activeOnly ? true : undefined,
      });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error cargando áreas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const toggle = async (a: AreaRow) => {
    try {
      await apiToggleArea(a.id);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo cambiar estado");
    }
  };

  const askDelete = (a: AreaRow) => {
    setSelected(a);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      await apiSoftDeleteArea(selected.id);
      setConfirmOpen(false);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo eliminar (tiene hijos o incidencias)");
    } finally {
      setDeleting(false);
    }
  };

  const doRestore = async (a: AreaRow) => {
    try {
      await apiRestoreArea(a.id);
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
            placeholder="Buscar por nombre o código..."
            className="w-full sm:w-[320px]"
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            Buscar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveOnly((v) => !v)}
          >
            {activeOnly ? "Solo activas" : "Todas"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIncludeDeleted((v) => !v)}
          >
            {includeDeleted ? "Con eliminadas" : "Sin eliminadas"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={load}
            disabled={loading}
          >
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
      </div>

      <Separator />

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Área padre</th>
              <th className="px-3 py-2">Sub-áreas</th>
              <th className="px-3 py-2">Activo</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {loading ? "Cargando..." : "Sin áreas"}
                </td>
              </tr>
            )}

            {paginatedRows.map((a) => (
              <tr
                key={a.id}
                className={`border-t ${
                  a.isDeleted ? "opacity-50 line-through" : ""
                }`}
              >
                <td className="px-3 py-2 font-mono">{a.code || "—"}</td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    {a.isDeleted && (
                      <Badge variant="destructive">Eliminada</Badge>
                    )}
                  </div>
                  {a.description && (
                    <div className="text-xs text-muted-foreground">
                      {a.description}
                    </div>
                  )}
                </td>

                <td className="px-3 py-2">{a.parent?.name || "—"}</td>

                <td className="px-3 py-2">{a.children?.length ?? 0}</td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.isActive ? "default" : "outline"}>
                      {a.isActive ? "Sí" : "No"}
                    </Badge>
                    <Switch
                      checked={a.isActive}
                      disabled={a.isDeleted}
                      onCheckedChange={() => toggle(a)}
                    />
                  </div>
                </td>

                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    {a.isDeleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doRestore(a)}
                      >
                        Restaurar
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditClick(a)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => askDelete(a)}
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
          <Label htmlFor="areas-page-size" className="text-sm font-medium">
            Filas por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-20 h-8" id="areas-page-size">
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
            <DialogTitle>Eliminar área</DialogTitle>
            <DialogDescription>
              Se marcará como eliminada (baja lógica). Si tiene sub-áreas o
              incidencias asociadas, el servidor lo bloqueará.
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
