"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Pencil,
  Package,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiGetProduct, apiProductQr } from "../../_lib/api";
import type { StorageProductDetail } from "../../_lib/types";
import { KindBadge } from "../../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import MovementsTable from "../../_components/MovementsTable";
import UnitsTable from "../../_components/UnitsTable";
import MovementDialog from "../../_components/MovementDialog";
import ProductDialog from "../../_components/ProductDialog";
import QrDownloadButton from "../../_components/QrDownloadButton";
import type { StockMovementType } from "../../_lib/types";

function stockLevel(current: number, min: number) {
  if (current === 0) return { label: "CRÍTICO", color: "text-red-600", barColor: "bg-red-500" };
  if (current <= min) return { label: "BAJO", color: "text-orange-600", barColor: "bg-orange-500" };
  if (current <= min * 2) return { label: "PRECAUCIÓN", color: "text-yellow-600", barColor: "bg-yellow-500" };
  return { label: "NORMAL", color: "text-green-600", barColor: "bg-green-500" };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useWord();

  const canEdit = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");
  const canRegister =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const [product, setProduct] = useState<StorageProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [movDialog, setMovDialog] = useState<StockMovementType | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiGetProduct(id);
      setProduct(data);
    } catch {
      toast.error("Error al cargar el producto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  function refresh() {
    setRefreshKey((k) => k + 1);
    fetchProduct();
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-5 text-center">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-3">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>
    );
  }

  const isConsumable = product.kind === "CONSUMABLE";
  const stock = product.currentStock ?? 0;
  const min = product.minStock ?? 0;
  const level = isConsumable && min > 0 ? stockLevel(stock, min) : null;
  const stockPct = min > 0 ? Math.min(100, Math.round((stock / (min * 3)) * 100)) : 100;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 space-y-6">
      {/* Back + Header */}
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
              <h1 className="text-xl font-semibold">{product.name}</h1>
              <KindBadge kind={product.kind} />
              {!product.isActive && (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {product.code}
              {product.brand && ` · ${product.brand} ${product.model ?? ""}`}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Categoría: {product.category.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <QrDownloadButton
            fetcher={() => apiProductQr(product.id)}
            filename={`qr-${product.code}.png`}
            variant="outline"
            size="sm"
          />
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* CONSUMABLE detail */}
      {isConsumable && (
        <>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Stock actual</p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-bold ${level?.color ?? "text-foreground"}`}
                    >
                      {stock}
                    </span>
                    <span className="text-muted-foreground">{product.unit}</span>
                    {level && (
                      <Badge
                        className={
                          level.label === "CRÍTICO"
                            ? "bg-red-600 text-white"
                            : level.label === "BAJO"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : level.label === "PRECAUCIÓN"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-green-100 text-green-700 border-green-200"
                        }
                      >
                        {level.label === "CRÍTICO" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {level.label === "NORMAL" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {level.label === "BAJO" && <TrendingDown className="h-3 w-3 mr-1" />}
                        {level.label}
                      </Badge>
                    )}
                  </div>
                  {min > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo: {min} {product.unit}
                    </p>
                  )}
                </div>
                {canRegister && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setMovDialog("ENTRY")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-1" />
                      Ingreso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMovDialog("EXIT")}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <ArrowUpFromLine className="h-4 w-4 mr-1" />
                      Salida
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMovDialog("ADJUSTMENT")}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      Ajuste
                    </Button>
                  </div>
                )}
              </div>
              {min > 0 && (
                <div className="space-y-1">
                  <Progress
                    value={stockPct}
                    className="h-2"
                    style={
                      {
                        "--progress-foreground": level?.barColor
                          ? level.barColor.replace("bg-", "")
                          : undefined,
                      } as React.CSSProperties
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {stockPct}% del nivel objetivo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <MovementsTable
            productId={product.id}
            productName={product.name}
            refreshKey={refreshKey}
          />
        </>
      )}

      {/* EQUIPMENT detail */}
      {!isConsumable && (
        <>
          {/* Equipment summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Disponibles", value: product.unitsAvailable ?? 0, color: "text-green-600" },
              { label: "Asignados", value: product.unitsAssigned ?? 0, color: "text-blue-600" },
              { label: "En mantenimiento", value: product.unitsInMaintenance ?? 0, color: "text-orange-600" },
              { label: "Total", value: product.unitsTotal ?? 0, color: "text-foreground" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <UnitsTable
            productId={product.id}
            productName={product.name}
            refreshKey={refreshKey}
            onRefresh={refresh}
          />
        </>
      )}

      {/* Dialogs */}
      {movDialog && (
        <MovementDialog
          open={!!movDialog}
          onOpenChange={(v) => !v && setMovDialog(null)}
          productId={product.id}
          productName={product.name}
          defaultType={movDialog}
          onSuccess={() => {
            refresh();
            setMovDialog(null);
          }}
        />
      )}
      <ProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
        onSuccess={refresh}
      />
    </div>
  );
}
