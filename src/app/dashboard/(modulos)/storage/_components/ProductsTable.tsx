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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Pencil,
  QrCode,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  Search,
  RefreshCw,
  Package,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  apiListProducts,
  apiCategoriesForSelect,
  apiDeleteProduct,
  apiProductQr,
} from "../_lib/api";
import type { StorageProduct } from "../_lib/types";
import { KindBadge } from "../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import ProductDialog from "./ProductDialog";

interface Props {
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function ProductsTable({ refreshKey, onRefresh }: Props) {
  const router = useRouter();
  const { user } = useWord();

  const canEdit = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");
  const canDelete = hasRole(user, "ADMIN");

  const [items, setItems] = useState<StorageProduct[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filterKind, setFilterKind] = useState("ALL");
  const [filterCat, setFilterCat] = useState("ALL");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<StorageProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StorageProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(12);

  useEffect(() => {
    apiCategoriesForSelect().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiListProducts({
        q: debouncedQ || undefined,
        kind: filterKind !== "ALL" ? filterKind : undefined,
        categoryId: filterCat !== "ALL" ? filterCat : undefined,
        lowStock: onlyLowStock || undefined,
      });
      setItems(data);
      setPageIndex(0);
    } catch {
      setError(true);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filterKind, filterCat, onlyLowStock]);

  useEffect(() => {
    fetchList();
  }, [fetchList, refreshKey]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedRows = useMemo(
    () => items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [items, pageIndex, pageSize]
  );

  async function handleQr(product: StorageProduct) {
    try {
      const blob = await apiProductQr(product.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${product.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al generar QR");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await apiDeleteProduct(deleteTarget.id);
      toast.success("Producto eliminado");
      setDeleteTarget(null);
      fetchList();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* ── Card header: título + filtros ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Catálogo de productos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} producto{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:shrink-0">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nombre o código..."
              className="pl-8 h-9 w-full"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="CONSUMABLE">Consumibles</SelectItem>
              <SelectItem value="EQUIPMENT">Equipos</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 shrink-0">
            <Switch id="low-stock" checked={onlyLowStock} onCheckedChange={setOnlyLowStock} />
            <Label htmlFor="low-stock" className="text-xs cursor-pointer whitespace-nowrap">Solo stock bajo</Label>
          </div>
          {canEdit && (
            <Button size="sm" className="h-9 gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo producto</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Código</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Stock / Unidades</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Estado</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-7 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Error al cargar los productos</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No se pudo conectar con el servidor</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={fetchList} className="gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reintentar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Sin productos</p>
                    <p className="text-xs text-muted-foreground">No se encontraron productos con los filtros aplicados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((p) => (
                <TableRow key={p.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{p.code}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.kind === "EQUIPMENT" && p.brand && (
                      <p className="text-xs text-muted-foreground">{p.brand} {p.model}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.category.name}</TableCell>
                  <TableCell><KindBadge kind={p.kind} /></TableCell>
                  <TableCell>
                    {p.kind === "CONSUMABLE" ? (
                      <span className={
                        p.currentStock === 0 ? "text-red-600 font-semibold text-sm"
                          : p.minStock && p.currentStock! <= p.minStock ? "text-orange-600 font-semibold text-sm"
                          : "text-sm"
                      }>
                        {p.currentStock ?? 0}{" "}
                        <span className="text-muted-foreground text-xs">{p.unit}</span>
                        {p.minStock != null && p.currentStock! <= p.minStock && (
                          <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-orange-500" />
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Equipos →</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={p.isActive ? "outline" : "secondary"} className={p.isActive ? "text-green-700 border-green-300 text-xs" : "text-xs"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver detalle" onClick={() => router.push(`/dashboard/storage/products/${p.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => setEditProduct(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Descargar QR" onClick={() => handleQr(p)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* ── Paginación (footer) ── */}
      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-muted-foreground">
        <span className="text-xs">{items.length} producto{items.length !== 1 ? "s" : ""}</span>
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
      <ProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          fetchList();
          onRefresh?.();
        }}
      />
      <ProductDialog
        open={!!editProduct}
        onOpenChange={(v) => !v && setEditProduct(null)}
        product={editProduct}
        onSuccess={() => {
          fetchList();
          onRefresh?.();
        }}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingId ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
