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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre o código..."
            className="w-52"
          />
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="CONSUMABLE">Consumibles</SelectItem>
              <SelectItem value="EQUIPMENT">Equipos</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="low-stock"
              checked={onlyLowStock}
              onCheckedChange={setOnlyLowStock}
            />
            <Label htmlFor="low-stock" className="text-sm cursor-pointer">
              Solo stock bajo
            </Label>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Stock / Unidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                  Sin productos
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-mono text-sm">{p.code}</TableCell>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.kind === "EQUIPMENT" && p.brand && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {p.brand} {p.model}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.category.name}
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={p.kind} />
                  </TableCell>
                  <TableCell>
                    {p.kind === "CONSUMABLE" ? (
                      <span
                        className={
                          p.currentStock === 0
                            ? "text-red-600 font-semibold"
                            : p.minStock && p.currentStock! <= p.minStock
                            ? "text-orange-600 font-semibold"
                            : ""
                        }
                      >
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
                  <TableCell>
                    <Badge
                      variant={p.isActive ? "outline" : "secondary"}
                      className={p.isActive ? "text-green-700 border-green-300" : ""}
                    >
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Ver detalle"
                        onClick={() =>
                          router.push(`/dashboard/storage/products/${p.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar"
                          onClick={() => setEditProduct(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Descargar QR"
                        onClick={() => handleQr(p)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                        >
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {items.length} producto{items.length !== 1 ? "s" : ""}
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
