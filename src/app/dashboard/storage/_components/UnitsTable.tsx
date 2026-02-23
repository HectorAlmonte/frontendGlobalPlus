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
import { Eye, ChevronLeft, ChevronRight, Plus, Wrench, UserCheck, RotateCcw } from "lucide-react";
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar asset code / serie..."
            className="w-52"
          />
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as EquipmentStatus | "ALL")}
          >
            <SelectTrigger className="w-44">
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
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar unidad
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Code</TableHead>
              <TableHead>N° Serie</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Fecha asignación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Sin unidades registradas
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm">
                    {u.assetCode || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {u.serialNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <EquipmentStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    <ConditionBadge condition={u.condition} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.assignedTo ? employeeName(u.assignedTo) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.assignedAt ? fmtDate(u.assignedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Ver detalle"
                        onClick={() => router.push(`/dashboard/storage/units/${u.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && u.status === "AVAILABLE" && (
                        <Button
                          size="icon"
                          variant="ghost"
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {units.length} unidad{units.length !== 1 ? "es" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Pág. {pageIndex + 1} / {pageCount}
          </span>
          <Button
            size="icon"
            variant="outline"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((p) => p + 1)}
          >
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
