"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import type { RoleRow } from "./_lib/types";
import { apiDeleteRole, apiListRoles, apiToggleRole } from "./_lib/api";

type Props = {
  refreshKey: number;
  onEditClick: (r: RoleRow) => void;
};

export default function RolesTable({ refreshKey, onEditClick }: Props) {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListRoles({
        q,
        includeDeleted: false,
        active: activeOnly ? true : undefined,
      });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error cargando roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, activeOnly]);

  const isFirstQ = useRef(true);
  useEffect(() => {
    if (isFirstQ.current) { isFirstQ.current = false; return; }
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggle = async (r: RoleRow, next: boolean) => {
    try {
      await apiToggleRole(r.id, next);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo cambiar estado");
    }
  };

  const askDelete = (r: RoleRow) => {
    setSelected(r);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      await apiDeleteRole(selected.id);
      setConfirmOpen(false);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo eliminar (probablemente está en uso)");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por key o nombre..."
          className="w-full sm:w-[320px]"
        />

        <Button size="sm" variant="outline" onClick={() => setActiveOnly((v) => !v)}>
          {activeOnly ? "Mostrando activos" : "Todos"}
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Usuarios</th>
              <th className="px-3 py-2">Empleados</th>
              <th className="px-3 py-2">Activo</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                  {loading ? "Cargando..." : "Sin roles"}
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono">{r.key}</td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    {r.isSystem && <Badge variant="secondary">Sistema</Badge>}
                  </div>
                  {r.description && (
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                  )}
                </td>

                <td className="px-3 py-2">{r._count?.users ?? 0}</td>
                <td className="px-3 py-2">{r._count?.employees ?? 0}</td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.isActive ? "default" : "outline"}>
                      {r.isActive ? "Sí" : "No"}
                    </Badge>
                    <Switch
                      checked={r.isActive}
                      disabled={r.isSystem}
                      onCheckedChange={(v) => toggle(r, v)}
                    />
                  </div>
                </td>

                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={r.isSystem}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditClick(r)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => askDelete(r)}
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar rol</DialogTitle>
            <DialogDescription>
              Se marcará como eliminado (baja lógica). Si está asignado a usuarios/empleados,
              el servidor lo bloqueará.
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
