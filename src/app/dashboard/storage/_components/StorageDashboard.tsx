"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Cpu,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Plus,
} from "lucide-react";
import { apiGetStorageStats } from "../_lib/api";
import type { StorageStats } from "../_lib/types";
import {
  StockAlertBadge,
  MovementTypeBadge,
  fmtDateTime,
  employeeName,
  performedByName,
} from "../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import MovementDialog from "./MovementDialog";

interface Props {
  refreshKey?: number;
}

export default function StorageDashboard({ refreshKey }: Props) {
  const router = useRouter();
  const { user } = useWord();

  const canRegister =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [movDialog, setMovDialog] = useState<{ productId: string; productName: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetStorageStats();
      setStats(data);
    } catch {
      toast.error("Error al cargar el resumen de almacén");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total active products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos activos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalActiveProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">En catálogo</p>
          </CardContent>
        </Card>

        {/* Equipment summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Equipos
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap mt-1">
              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                {stats.equipmentSummary?.available ?? 0} disponibles
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                {stats.equipmentSummary?.assigned ?? 0} asignados
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                {stats.equipmentSummary?.inMaintenance ?? 0} en mant.
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Critical stock */}
        <Card className={stats.criticalStockCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock crítico
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${stats.criticalStockCount > 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${stats.criticalStockCount > 0 ? "text-red-600" : ""}`}
            >
              {stats.criticalStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consumibles agotados
            </p>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card
          className={
            stats.lowStockCount > 0 ? "border-orange-200 bg-orange-50/30" : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock bajo
            </CardTitle>
            <TrendingDown
              className={`h-4 w-4 ${stats.lowStockCount > 0 ? "text-orange-500" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${stats.lowStockCount > 0 ? "text-orange-600" : ""}`}
            >
              {stats.lowStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Por debajo del mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts table */}
      {(stats.stockAlerts ?? []).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alertas de stock</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/storage/products?lowStock=1")}
            >
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Stock actual</TableHead>
                  <TableHead>Stock mínimo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Nivel</TableHead>
                  {canRegister && <TableHead className="text-right">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.stockAlerts ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="font-mono text-sm">{a.code}</TableCell>
                    <TableCell
                      className={
                        a.currentStock === 0
                          ? "text-red-600 font-bold"
                          : "text-orange-600 font-semibold"
                      }
                    >
                      {a.currentStock}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.minStock}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.unit ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StockAlertBadge level={a.level} />
                    </TableCell>
                    {canRegister && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setMovDialog({ productId: a.id, productName: a.name })
                          }
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Ingreso
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent movements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimos movimientos</CardTitle>
          <span className="text-xs text-muted-foreground">Últimos 7 días</span>
        </CardHeader>
        <CardContent className="p-0">
          {(stats.recentMovements ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Sin movimientos recientes
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Retirado por</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.recentMovements ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {fmtDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-sm font-medium hover:underline text-left"
                        onClick={() =>
                          router.push(`/dashboard/storage/products/${m.product.id}`)
                        }
                      >
                        {m.product.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <MovementTypeBadge type={m.type} />
                    </TableCell>
                    <TableCell className="font-semibold">{m.quantity}</TableCell>
                    <TableCell className="text-sm">
                      {m.requestedBy ? employeeName(m.requestedBy) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {performedByName(m.performedBy)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Movement dialog triggered from alerts table */}
      {movDialog && (
        <MovementDialog
          open={!!movDialog}
          onOpenChange={(v) => !v && setMovDialog(null)}
          productId={movDialog.productId}
          productName={movDialog.productName}
          defaultType="ENTRY"
          onSuccess={() => {
            fetchStats();
            setMovDialog(null);
          }}
        />
      )}
    </div>
  );
}
