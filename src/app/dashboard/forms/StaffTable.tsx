"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, RefreshCcw, UserPlus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type RoleDTO = { id: string; key: string; name: string };

type StaffRow = {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  cargo: string;
  status: string;
  fechaIngreso: string | null;
  isDeleted: boolean;

  role: RoleDTO;
  user: null | {
    id: string;
    username: string;
    isActive: boolean;
    isDeleted: boolean;
    lastLoginAt: string | null;
    role: RoleDTO;
  };
};

type StaffResponse = {
  ok: boolean;
  data: StaffRow[];
  meta?: { page: number; pageSize: number; total: number };
};

type StaffTableProps = {
  onCreateClick?: () => void;
  onEditClick?: (id: string) => void; // ✅ NUEVO
  refreshKey?: number;
};

export default function StaffTable({
  onCreateClick,
  onEditClick,
  refreshKey = 0,
}: StaffTableProps) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    if (!API) {
      setError("Falta NEXT_PUBLIC_API_URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${API}/api/staff`);
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { credentials: "include" });
      const body = (await res.json().catch(() => null)) as StaffResponse | null;

      if (!res.ok)
        throw new Error((body as any)?.message || `Error (${res.status})`);

      setRows(Array.isArray(body?.data) ? body!.data : []);
    } catch (e: any) {
      setError(e?.message || "Error cargando personal");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, refreshKey]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      const email = r.email ?? "";
      const full = `${r.dni} ${r.nombres} ${r.apellidos} ${email} ${r.cargo}`.toLowerCase();
      return full.includes(s);
    });
  }, [rows, q]);

  const deactivate = async (id: string) => {
    if (!API) return;

    const t = toast.loading("Desactivando...");
    try {
      const res = await fetch(`${API}/api/staff/${id}/deactivate`, {
        method: "PATCH",
        credentials: "include",
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Error desactivando");

      toast.success("Personal desactivado", { id: t });
      fetchStaff();
    } catch (e: any) {
      toast.error(e?.message || "Error desactivando", { id: t });
    }
  };

  const softDelete = async (id: string) => {
    if (!API) return;

    const t = toast.loading("Eliminando...");
    try {
      const res = await fetch(`${API}/api/staff/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Error eliminando");

      toast.success("Personal eliminado (soft delete)", { id: t });
      fetchStaff();
    } catch (e: any) {
      toast.error(e?.message || "Error eliminando", { id: t });
    }
  };

  const resetPassword = async (id: string) => {
    if (!API) return;

    const t = toast.loading("Generando contraseña temporal...");
    try {
      const res = await fetch(`${API}/api/staff/${id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Error reseteando");

      toast.success("Contraseña temporal generada", { id: t });

      toast.message("Credenciales (se muestran una sola vez)", {
        description: `Usuario: ${body?.username}\nPassword: ${body?.tempPassword}`,
      });
    } catch (e: any) {
      toast.error(e?.message || "Error reseteando", { id: t });
    }
  };

  const StatusBadge = ({ r }: { r: StaffRow }) => {
    const userState = r.user
      ? r.user.isDeleted
        ? { label: "Eliminado", variant: "destructive" as const }
        : r.user.isActive
        ? { label: "Activo", variant: "default" as const }
        : { label: "Inactivo", variant: "secondary" as const }
      : { label: "Sin cuenta", variant: "outline" as const };

    return <Badge variant={userState.variant}>{userState.label}</Badge>;
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">Personal / Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Lista de trabajadores y su cuenta de acceso (si aplica).
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por DNI, nombre, correo, cargo…"
            className="h-9 w-full sm:w-[320px]"
          />

          <div className="flex gap-2">
            <Button variant="outline" className="h-9" onClick={fetchStaff}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>

            <Button className="h-9" onClick={() => onCreateClick?.()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 pb-4 text-sm text-muted-foreground">Cargando…</div>
      ) : error ? (
        <div className="px-4 pb-4 text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 pb-4 text-sm text-muted-foreground">
          No hay resultados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-t text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Cuenta</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const fullName = `${r.nombres} ${r.apellidos}`.trim();
                const roleLabel = r.role?.name || r.role?.key || "-";
                const emailLabel =
                  !r.email || r.email === "undefined" ? "-" : r.email;

                const canEdit = !!onEditClick && !r.isDeleted;

                return (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono">{r.dni}</td>
                    <td className="px-4 py-3">{fullName}</td>
                    <td className="px-4 py-3">{emailLabel}</td>
                    <td className="px-4 py-3">{r.cargo}</td>
                    <td className="px-4 py-3">{roleLabel}</td>
                    <td className="px-4 py-3">
                      <StatusBadge r={r} />
                    </td>
                    <td className="px-4 py-3">{r.status}</td>

                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                          {/* ✅ EDITAR */}
                          <DropdownMenuItem
                            disabled={!canEdit}
                            onClick={() => {
                              if (!canEdit) return;
                              onEditClick?.(r.id);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Reset password con confirm */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Resetear contraseña
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Resetear contraseña?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se generará una contraseña temporal y se mostrará una sola vez.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => resetPassword(r.id)}>
                                  Sí, resetear
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Desactivar con confirm */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Desactivar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Desactivar este personal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  El usuario no podrá iniciar sesión hasta que lo actives nuevamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deactivate(r.id)}>
                                  Sí, desactivar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <DropdownMenuSeparator />

                          {/* Eliminar con confirm */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará de forma lógica (soft delete) y se ocultará del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => softDelete(r.id)}>
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
