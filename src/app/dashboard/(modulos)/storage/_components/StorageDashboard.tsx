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
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </div>
              <p className="text-sm font-semibold leading-none">Alertas de stock</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => router.push("/dashboard/storage/products?lowStock=1")}>
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Código</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Stock actual</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Mínimo</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Unidad</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Nivel</TableHead>
                  {canRegister && <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-right">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.stockAlerts ?? []).map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-sm">{a.name}</TableCell>
                    <TableCell className="font-mono text-xs hidden sm:table-cell">{a.code}</TableCell>
                    <TableCell className={a.currentStock === 0 ? "text-red-600 font-bold" : "text-orange-600 font-semibold"}>
                      {a.currentStock}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{a.minStock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{a.unit ?? "—"}</TableCell>
                    <TableCell><StockAlertBadge level={a.level} /></TableCell>
                    {canRegister && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setMovDialog({ productId: a.id, productName: a.name })}>
                          <Plus className="h-3.5 w-3.5" />Ingreso
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold leading-none">Últimos movimientos</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Últimos 7 días</span>
        </div>
        {(stats.recentMovements ?? []).length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Sin movimientos recientes</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Cant.</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Retirado por</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.recentMovements ?? []).map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(m.createdAt)}</TableCell>
                    <TableCell>
                      <button className="text-sm font-medium hover:underline text-left" onClick={() => router.push(`/dashboard/storage/products/${m.product.id}`)}>
                        {m.product.name}
                      </button>
                    </TableCell>
                    <TableCell><MovementTypeBadge type={m.type} /></TableCell>
                    <TableCell className="font-semibold text-sm">{m.quantity}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{m.requestedBy ? employeeName(m.requestedBy) : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{performedByName(m.performedBy)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
