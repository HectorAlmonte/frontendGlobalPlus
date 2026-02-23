"use client";

import { useEffect, useMemo, useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Check } from "lucide-react";

import type { StaffRow } from "../_lib/types";
import {
  apiListStaff,
  apiDeleteStaff,
  apiDeactivateStaff,
  apiResetPassword,
} from "../_lib/api";

type Props = {
  refreshKey: number;
  onCreateClick: () => void;
  onEditClick: (s: StaffRow) => void;
};

export default function StaffTable({
  refreshKey,
  onCreateClick,
  onEditClick,
}: Props) {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");

  /* ── Confirm dialogs ── */
  const [confirmAction, setConfirmAction] = useState<
    null | "delete" | "deactivate" | "reset"
  >(null);
  const [selected, setSelected] = useState<StaffRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{
    email: string;
    username: string;
    tempPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState<"username" | "password" | null>(null);

  /* ── Paginación ── */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  /* ── Filtrado client-side ── */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (s) =>
        s.dni.toLowerCase().includes(term) ||
        s.nombres.toLowerCase().includes(term) ||
        s.apellidos.toLowerCase().includes(term) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.cargo && s.cargo.toLowerCase().includes(term))
    );
  }, [rows, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filtered, pageIndex, pageSize]
  );

  useEffect(() => setPageIndex(0), [filtered, pageSize]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiListStaff();
      setRows(data);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error cargando personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  /* ── Acciones ── */
  const askAction = (action: "delete" | "deactivate" | "reset", s: StaffRow) => {
    setSelected(s);
    setConfirmAction(action);
    setResetResult(null);
  };

  const doAction = async () => {
    if (!selected || !confirmAction) return;
    try {
      setActionLoading(true);
      if (confirmAction === "delete") {
        await apiDeleteStaff(selected.id);
        setConfirmAction(null);
        await load();
      } else if (confirmAction === "deactivate") {
        await apiDeactivateStaff(selected.id);
        setConfirmAction(null);
        await load();
      } else if (confirmAction === "reset") {
        const res = await apiResetPassword(selected.id);
        setResetResult({ email: res.email, username: res.username, tempPassword: res.tempPassword });
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al ejecutar la acción");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: "username" | "password") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const confirmTitle = {
    delete: "Eliminar trabajador",
    deactivate: "Desactivar trabajador",
    reset: "Resetear contraseña",
  };

  const confirmDesc = {
    delete: `¿Estás seguro de eliminar a "${selected?.nombres} ${selected?.apellidos}"? Esta acción no se puede deshacer.`,
    deactivate: `¿Desactivar la cuenta de "${selected?.nombres} ${selected?.apellidos}"?`,
    reset: `¿Resetear la contraseña de "${selected?.nombres} ${selected?.apellidos}"? Se enviará una contraseña temporal por correo.`,
  };

  /* ── Account badge ── */
  const accountBadge = (s: StaffRow) => {
    if (!s.user) return <Badge variant="outline">Sin cuenta</Badge>;
    if (!s.user.isActive)
      return <Badge variant="secondary">Inactiva</Badge>;
    return <Badge variant="default">Activa</Badge>;
  };

  /* ── Status badge ── */
  const statusBadge = (s: StaffRow) => {
    if (s.status === "ACTIVO")
      return <Badge variant="default">Activo</Badge>;
    if (s.status === "INACTIVO")
      return <Badge variant="secondary">Inactivo</Badge>;
    return <Badge variant="outline">{s.status}</Badge>;
  };

  return (
    <div className="space-y-3">
      {/* ── Filtros ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por DNI, nombre, email, cargo..."
            className="w-full sm:w-[360px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={load}
            disabled={loading}
          >
            ↻
          </Button>

          <Button size="sm" onClick={onCreateClick}>
            Nuevo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">DNI</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Cargo</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Cuenta</th>
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
                  {loading ? "Cargando..." : "Sin registros de personal"}
                </td>
              </tr>
            )}

            {paginatedRows.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono font-medium">{s.dni}</td>

                <td className="px-3 py-2">
                  <span className="font-medium">
                    {s.nombres} {s.apellidos}
                  </span>
                </td>

                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {s.email || "\u2014"}
                </td>

                <td className="px-3 py-2">{s.cargo || "\u2014"}</td>

                <td className="px-3 py-2">
                  {s.roles && s.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-xs">
                          {r.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "\u2014"
                  )}
                </td>

                <td className="px-3 py-2">{statusBadge(s)}</td>

                <td className="px-3 py-2">{accountBadge(s)}</td>

                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditClick(s)}>
                        Editar
                      </DropdownMenuItem>
                      {s.user && (
                        <DropdownMenuItem
                          onClick={() => askAction("reset", s)}
                        >
                          Resetear contraseña
                        </DropdownMenuItem>
                      )}
                      {s.user?.isActive && (
                        <DropdownMenuItem
                          onClick={() => askAction("deactivate", s)}
                        >
                          Desactivar cuenta
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => askAction("delete", s)}
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
          <Label htmlFor="staff-page-size" className="text-sm font-medium">
            Filas por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-20 h-8" id="staff-page-size">
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
            onClick={() =>
              setPageIndex((i) => Math.min(pageCount - 1, i + 1))
            }
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
      <Dialog
        open={!!confirmAction}
        onOpenChange={(v) => {
          if (!v) {
            setConfirmAction(null);
            setResetResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction ? confirmTitle[confirmAction] : ""}
            </DialogTitle>
            <DialogDescription>
              {confirmAction ? confirmDesc[confirmAction] : ""}
            </DialogDescription>
          </DialogHeader>

          {resetResult && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Contraseña reseteada correctamente. Comparte estas credenciales con el trabajador.
              </p>

              {/* Usuario */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuario</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <span className="flex-1 font-mono text-sm font-medium">{resetResult.username}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => copyToClipboard(resetResult.username, "username")}
                  >
                    {copied === "username"
                      ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Contraseña temporal */}
              {resetResult.tempPassword && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contraseña temporal</p>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <span className="flex-1 font-mono text-sm font-medium tracking-widest">{resetResult.tempPassword}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => copyToClipboard(resetResult.tempPassword!, "password")}
                    >
                      {copied === "password"
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Correo */}
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Credenciales enviadas al correo <span className="font-medium">{resetResult.email}</span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {resetResult ? (
              <Button
                onClick={() => {
                  setConfirmAction(null);
                  setResetResult(null);
                }}
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant={
                    confirmAction === "delete" ? "destructive" : "default"
                  }
                  onClick={doAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Procesando..." : "Confirmar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
