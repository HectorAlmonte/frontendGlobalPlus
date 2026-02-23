"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  UserCheck,
  RotateCcw,
  Wrench,
  XCircle,
  CalendarDays,
  User,
  Hash,
  Cpu,
} from "lucide-react";
import { apiGetUnit, apiRetireUnit, apiUnitQr } from "../../_lib/api";
import type { StorageUnit } from "../../_lib/types";
import {
  EquipmentStatusBadge,
  ConditionBadge,
  fmtDate,
  employeeName,
} from "../../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import AssignUnitDialog from "../../_components/AssignUnitDialog";
import ReturnUnitDialog from "../../_components/ReturnUnitDialog";
import MaintenanceDialog from "../../_components/MaintenanceDialog";
import QrDownloadButton from "../../_components/QrDownloadButton";
import UnitTimeline from "../../_components/UnitTimeline";

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useWord();

  const canManage =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");
  const canRetire = hasRole(user, "ADMIN");

  const [unit, setUnit] = useState<StorageUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState<"start" | "finish" | null>(null);
  const [retireOpen, setRetireOpen] = useState(false);
  const [retiring, setRetiring] = useState(false);

  const fetchUnit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiGetUnit(id);
      setUnit(data);
    } catch {
      toast.error("Error al cargar la unidad");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUnit();
  }, [fetchUnit]);

  function refresh() {
    setRefreshKey((k) => k + 1);
    fetchUnit();
  }

  async function handleRetire() {
    if (!unit) return;
    setRetiring(true);
    try {
      await apiRetireUnit(unit.id);
      toast.success("Unidad retirada");
      refresh();
      setRetireOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al retirar");
    } finally {
      setRetiring(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-5 text-center">
        <p className="text-muted-foreground">Unidad no encontrada</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-3">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>
    );
  }

  const unitLabel = unit.assetCode || unit.serialNumber || unit.id.slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {unit.assetCode || "Unidad de equipo"}
              </h1>
              <EquipmentStatusBadge status={unit.status} />
              <ConditionBadge condition={unit.condition} />
            </div>
            <button
              className="text-sm text-muted-foreground hover:underline mt-0.5 font-mono"
              onClick={() =>
                router.push(`/dashboard/storage/products/${unit.productId}`)
              }
            >
              {unit.product.name} · {unit.product.code}
            </button>
          </div>
        </div>
        <QrDownloadButton
          fetcher={() => apiUnitQr(unit.id)}
          filename={`qr-unit-${unitLabel}.png`}
          variant="outline"
          size="sm"
        />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Asset Code</p>
              <p className="font-mono text-sm font-medium">
                {unit.assetCode || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">N° de serie</p>
              <p className="font-mono text-sm font-medium">
                {unit.serialNumber || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Último servicio</p>
              <p className="text-sm font-medium">
                {unit.lastServiceAt ? fmtDate(unit.lastServiceAt) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment card */}
      {unit.assignedTo && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {employeeName(unit.assignedTo)}
              </p>
              <p className="text-sm text-muted-foreground">
                DNI: {unit.assignedTo.dni}
                {unit.assignedTo.cargo && ` · ${unit.assignedTo.cargo}`}
              </p>
              {unit.assignedAt && (
                <p className="text-xs text-muted-foreground">
                  Asignado el {fmtDate(unit.assignedAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {canManage && unit.status !== "RETIRED" && (
        <div className="flex flex-wrap gap-2">
          {unit.status === "AVAILABLE" && (
            <>
              <Button onClick={() => setAssignOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Asignar
              </Button>
              <Button variant="outline" onClick={() => setMaintOpen("start")}>
                <Wrench className="h-4 w-4 mr-2" />
                Enviar a mantenimiento
              </Button>
            </>
          )}
          {unit.status === "ASSIGNED" && (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Registrar devolución
            </Button>
          )}
          {unit.status === "IN_MAINTENANCE" && (
            <Button onClick={() => setMaintOpen("finish")}>
              <Wrench className="h-4 w-4 mr-2" />
              Finalizar mantenimiento
            </Button>
          )}
          {canRetire && unit.status === "AVAILABLE" && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setRetireOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Retirar unidad
            </Button>
          )}
        </div>
      )}

      {unit.notes && (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
          {unit.notes}
        </p>
      )}

      <Separator />

      {/* Timeline */}
      <div>
        <h2 className="font-semibold mb-4">Historial de la unidad</h2>
        <UnitTimeline unitId={unit.id} refreshKey={refreshKey} />
      </div>

      {/* Dialogs */}
      <AssignUnitDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        unitId={unit.id}
        unitLabel={unitLabel}
        onSuccess={refresh}
      />
      <ReturnUnitDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        unitId={unit.id}
        unitLabel={unitLabel}
        onSuccess={refresh}
      />
      {maintOpen && (
        <MaintenanceDialog
          open={!!maintOpen}
          onOpenChange={(v) => !v && setMaintOpen(null)}
          unitId={unit.id}
          unitLabel={unitLabel}
          mode={maintOpen}
          onSuccess={refresh}
        />
      )}
      <AlertDialog open={retireOpen} onOpenChange={setRetireOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar unidad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirmas el retiro de la unidad <strong>{unitLabel}</strong>? Esta
              acción marcará el equipo como retirado de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={retiring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetire}
              disabled={retiring}
              className="bg-destructive hover:bg-destructive/90"
            >
              {retiring ? "Retirando..." : "Retirar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
