"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { FilterPopover } from "@/components/filter-popover";
import { MoreHorizontal, Copy, Check, RefreshCw, Download, AlertCircle, Users, X } from "lucide-react";
import { downloadXlsx, todayStr } from "@/lib/exportExcel";
import { toast } from "sonner";

import type { StaffRow } from "../_lib/types";
import {
  apiListStaff,
  apiDeleteStaff,
  apiDeactivateStaff,
  apiResetPassword,
  apiListRolesForSelect,
} from "../_lib/api";
import { usePersistedState } from "@/hooks/usePersistedState";

type Props = {
  refreshKey: number;
  onEditClick: (s: StaffRow) => void;
};

type StatusFilter = "ALL" | "ACTIVO" | "INACTIVO";
type AccountFilter = "ALL" | "con_cuenta" | "sin_cuenta" | "activa" | "inactiva";

export default function StaffTable({ refreshKey, onEditClick }: Props) {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  /* ── Filtros ── */
  const [q, setQ] = usePersistedState("staff:q", "");
  const [roleFilter, setRoleFilter] = usePersistedState("staff:role", "");
  const [statusFilter, setStatusFilter] = usePersistedState<StatusFilter>("staff:status", "ALL");
  const [accountFilter, setAccountFilter] = usePersistedState<AccountFilter>("staff:account", "ALL");
  const [rolesOptions, setRolesOptions] = useState<{ value: string; label: string }[]>([]);

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
  const [pageSize, setPageSize] = usePersistedState("staff:pageSize", 10);

  /* ── Filtrado client-side ── */
  const filtered = useMemo(() => {
    let out = rows;

    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter(
        (s) =>
          s.dni.toLowerCase().includes(term) ||
          s.nombres.toLowerCase().includes(term) ||
          s.apellidos.toLowerCase().includes(term) ||
          (s.email && s.email.toLowerCase().includes(term)) ||
          (s.cargo && s.cargo.toLowerCase().includes(term))
      );
    }

    if (roleFilter) {
      out = out.filter((s) => s.roles?.some((r) => r.id === roleFilter));
    }

    if (statusFilter !== "ALL") {
      out = out.filter((s) => s.status === statusFilter);
    }

    if (accountFilter === "sin_cuenta") {
      out = out.filter((s) => !s.user);
    } else if (accountFilter === "con_cuenta") {
      out = out.filter((s) => !!s.user);
    } else if (accountFilter === "activa") {
      out = out.filter((s) => s.user?.isActive === true);
    } else if (accountFilter === "inactiva") {
      out = out.filter((s) => s.user && !s.user.isActive);
    }

    return out;
  }, [rows, q, roleFilter, statusFilter, accountFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filtered, pageIndex, pageSize]
  );

  useEffect(() => setPageIndex(0), [filtered, pageSize]);

  function handleExport() {
    const rows = filtered.map((s) => ({
      DNI: s.dni,
      Nombres: s.nombres,
      Apellidos: s.apellidos,
      Correo: s.email || "",
      Cargo: s.cargo || "",
      Roles: s.roles.map((r) => r.name).join(", "),
      Estado: s.status,
      "Fecha ingreso": s.fechaIngreso
        ? new Date(s.fechaIngreso).toLocaleDateString("es-PE")
        : "",
      "Tiene cuenta": s.user ? "Sí" : "No",
      "Cuenta activa": s.user ? (s.user.isActive ? "Sí" : "No") : "",
    }));
    downloadXlsx(rows, `personal_${todayStr()}`);
  }

  /* ── Carga ── */
  const load = async () => {
    setError(false);
    try {
      setLoading(true);
      const data = await apiListStaff();
      setRows(data);
    } catch (e: any) {
      setError(true);
      toast.error(e?.message || "Error cargando personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  /* ── Cargar roles para el filtro ── */
  useEffect(() => {
    apiListRolesForSelect()
      .then((r) => setRolesOptions(r.map((x) => ({ value: x.value, label: x.label }))))
      .catch(() => {});
  }, []);

  /* ── Filtros activos ── */
  const activeFilterCount =
    (roleFilter ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (accountFilter !== "ALL" ? 1 : 0);

  const clearFilters = () => {
    setRoleFilter("");
    setStatusFilter("ALL");
    setAccountFilter("ALL");
    setPageIndex(0);
  };

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
      toast.error(e?.message || "Error al ejecutar la acción");
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

  /* ── Badges ── */
  const accountBadge = (s: StaffRow) => {
    if (!s.user) return <Badge variant="outline">Sin cuenta</Badge>;
    if (!s.user.isActive) return <Badge variant="secondary">Inactiva</Badge>;
    return <Badge variant="default">Activa</Badge>;
  };

  const statusBadge = (s: StaffRow) => {
    if (s.status === "ACTIVO") return <Badge variant="default">Activo</Badge>;
    if (s.status === "INACTIVO") return <Badge variant="secondary">Inactivo</Badge>;
    return <Badge variant="outline">{s.status}</Badge>;
  };

  return (
    <div className="space-y-3">
      {/* ── Filtros ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por DNI, nombre, email, cargo..."
            className="w-full sm:w-[360px]"
            data-search-input
          />
          {(q !== "" || activeFilterCount > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setQ(""); clearFilters(); }}
              className="gap-1 text-muted-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
            {/* Rol */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rol</Label>
              <Select
                value={roleFilter || "ALL"}
                onValueChange={(v) => setRoleFilter(v === "ALL" ? "" : v)}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {rolesOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado del empleado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cuenta de acceso */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cuenta de acceso</Label>
              <Select
                value={accountFilter}
                onValueChange={(v) => setAccountFilter(v as AccountFilter)}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="con_cuenta">Con cuenta</SelectItem>
                  <SelectItem value="sin_cuenta">Sin cuenta</SelectItem>
                  <SelectItem value="activa">Cuenta activa</SelectItem>
                  <SelectItem value="inactiva">Cuenta inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterPopover>

          <Button size="sm" variant="outline" onClick={handleExport} disabled={loading || filtered.length === 0} title="Exportar a Excel">
            <Download className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Contador ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          {activeFilterCount > 0 && (
            <span className="ml-1 text-primary">
              ({activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""} activo{activeFilterCount !== 1 ? "s" : ""})
            </span>
          )}
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">DNI</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2 hidden sm:table-cell">Correo</th>
              <th className="px-3 py-2 hidden md:table-cell">Cargo</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 hidden sm:table-cell">Cuenta</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2"><Skeleton className="h-4 w-20 font-mono" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-36" /></td>
                <td className="px-3 py-2 hidden sm:table-cell"><Skeleton className="h-4 w-40" /></td>
                <td className="px-3 py-2 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                <td className="px-3 py-2"><Skeleton className="h-5 w-20 rounded-full" /></td>
                <td className="px-3 py-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-3 py-2 hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-3 py-2"><Skeleton className="h-7 w-7 rounded" /></td>
              </tr>
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Error al cargar el personal</p>
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
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Sin personal registrado</p>
                    <p className="text-xs text-muted-foreground">No se encontraron registros con los filtros aplicados</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && paginatedRows.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono font-medium">{s.dni}</td>

                <td className="px-3 py-2">
                  <span className="font-medium">
                    {s.nombres} {s.apellidos}
                  </span>
                </td>

                <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                  {s.email || "\u2014"}
                </td>

                <td className="px-3 py-2 hidden md:table-cell">{s.cargo || "\u2014"}</td>

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

                <td className="px-3 py-2 hidden sm:table-cell">{accountBadge(s)}</td>

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
                        <DropdownMenuItem onClick={() => askAction("reset", s)}>
                          Resetear contraseña
                        </DropdownMenuItem>
                      )}
                      {s.user?.isActive && (
                        <DropdownMenuItem onClick={() => askAction("deactivate", s)}>
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

      {/* ── Diálogo de confirmación / resultado ── */}
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
                <Button variant="outline" onClick={() => setConfirmAction(null)}>
                  Cancelar
                </Button>
                <Button
                  variant={confirmAction === "delete" ? "destructive" : "default"}
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
