"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, ChevronLeft, ChevronRight, Plus, Wrench, UserCheck, RotateCcw, Cpu, Search } from "lucide-react";
import { apiListUnits } from "../_lib/api";
import type { StorageUnit, EquipmentStatus } from "../_lib/types";
import { EquipmentStatusBadge, ConditionBadge, fmtDate, employeeName } from "../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import AssignUnitDialog from "./AssignUnitDialog";
import ReturnUnitDialog from "./ReturnUnitDialog";
import MaintenanceDialog from "./MaintenanceDialog";
import CreateUnitDialog from "./CreateUnitDialog";

interface Props {
  productId: string;
  productName?: string;
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function UnitsTable({ productId, productName, refreshKey, onRefresh }: Props) {
  const router = useRouter();
  const { user } = useWord();

  const canManage =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | "ALL">("ALL");
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [assignUnit, setAssignUnit] = useState<StorageUnit | null>(null);
  const [returnUnit, setReturnUnit] = useState<StorageUnit | null>(null);
  const [maintUnit, setMaintUnit] = useState<{ unit: StorageUnit; mode: "start" | "finish" } | null>(null);

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListUnits({
        productId,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
        q: q.trim() || undefined,
      });
      setUnits(data);
      setPageIndex(0);
    } catch {
      toast.error("Error al cargar unidades");
    } finally {
      setLoading(false);
    }
  }, [productId, filterStatus, q]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits, refreshKey]);

  const pageCount = Math.max(1, Math.ceil(units.length / pageSize));
  const paginatedRows = useMemo(
    () => units.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [units, pageIndex, pageSize]
  );

  function unitLabel(u: StorageUnit) {
    return u.assetCode || u.serialNumber || u.id.slice(0, 8);
  }

  function refresh() {
    fetchUnits();
    onRefresh?.();
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Cpu className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Unidades de equipo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {units.length} unidad{units.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center sm:shrink-0">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Asset code / serie..."
              className="pl-8 h-9 w-full"
            />
          </div>
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as EquipmentStatus | "ALL")}
          >
            <SelectTrigger className="w-full sm:w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="AVAILABLE">Disponible</SelectItem>
              <SelectItem value="ASSIGNED">Asignado</SelectItem>
              <SelectItem value="IN_MAINTENANCE">En mantenimiento</SelectItem>
              <SelectItem value="RETIRED">Retirado</SelectItem>
            </SelectContent>
          </Select>
          {canManage && (
            <Button size="sm" className="h-9 gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar unidad</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Asset Code</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">N° Serie</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Estado</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Condición</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Asignado a</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Fecha asignación</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Sin unidades registradas
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm font-semibold text-primary">
                    {u.assetCode || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {u.serialNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <EquipmentStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ConditionBadge condition={u.condition} />
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {u.assignedTo ? employeeName(u.assignedTo) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {u.assignedAt ? fmtDate(u.assignedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Ver detalle"
                        onClick={() => router.push(`/dashboard/storage/units/${u.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && u.status === "AVAILABLE" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Asignar"
                          onClick={() => setAssignUnit(u)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && u.status === "AVAILABLE" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Enviar a mantenimiento"
                          onClick={() => setMaintUnit({ unit: u, mode: "start" })}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && u.status === "ASSIGNED" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Registrar devolución"
                          onClick={() => setReturnUnit(u)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && u.status === "IN_MAINTENANCE" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Finalizar mantenimiento"
                          onClick={() => setMaintUnit({ unit: u, mode: "finish" })}
                        >
                          <Wrench className="h-4 w-4 text-orange-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-muted-foreground">
        <span className="text-xs">{units.length} unidad{units.length !== 1 ? "es" : ""}</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 rounded border text-xs font-medium min-w-[70px] text-center">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button size="icon" variant="outline" className="h-8 w-8" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <CreateUnitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        productId={productId}
        productName={productName}
        onSuccess={refresh}
      />
      {assignUnit && (
        <AssignUnitDialog
          open={!!assignUnit}
          onOpenChange={(v) => !v && setAssignUnit(null)}
          unitId={assignUnit.id}
          unitLabel={unitLabel(assignUnit)}
          onSuccess={refresh}
        />
      )}
      {returnUnit && (
        <ReturnUnitDialog
          open={!!returnUnit}
          onOpenChange={(v) => !v && setReturnUnit(null)}
          unitId={returnUnit.id}
          unitLabel={unitLabel(returnUnit)}
          onSuccess={refresh}
        />
      )}
      {maintUnit && (
        <MaintenanceDialog
          open={!!maintUnit}
          onOpenChange={(v) => !v && setMaintUnit(null)}
          unitId={maintUnit.unit.id}
          unitLabel={unitLabel(maintUnit.unit)}
          mode={maintUnit.mode}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
