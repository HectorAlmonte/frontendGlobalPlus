"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, TrendingDown } from "lucide-react";
import { apiListMovements } from "../_lib/api";
import type { StockMovement } from "../_lib/types";
import {
  MovementTypeBadge,
  fmtDateTime,
  employeeName,
  performedByName,
} from "../_lib/utils";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import MovementDialog from "./MovementDialog";

interface Props {
  productId: string;
  productName?: string;
  refreshKey?: number;
}

export default function MovementsTable({ productId, productName, refreshKey }: Props) {
  const { user } = useWord();
  const canRegister =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListMovements(productId);
      setMovements(data);
      setPageIndex(0);
    } catch {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements, refreshKey]);

  const pageCount = Math.max(1, Math.ceil(movements.length / pageSize));
  const paginatedRows = useMemo(
    () => movements.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [movements, pageIndex, pageSize]
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Historial de movimientos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {movements.length} movimiento{movements.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {canRegister && (
          <Button size="sm" className="h-8 gap-1.5 text-xs shrink-0" onClick={() => setMovOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Registrar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide">Cantidad</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Retirado por</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Registrado por</TableHead>
              <TableHead className="text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Motivo / Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                </TableRow>
              ))
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Sin movimientos registrados
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <MovementTypeBadge type={m.type} />
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{m.quantity}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {m.requestedBy ? employeeName(m.requestedBy) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {performedByName(m.performedBy)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                    {[m.reason, m.reference].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-muted-foreground">
        <span className="text-xs">{movements.length} movimiento{movements.length !== 1 ? "s" : ""}</span>
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

      <MovementDialog
        open={movOpen}
        onOpenChange={setMovOpen}
        productId={productId}
        productName={productName}
        onSuccess={fetchMovements}
      />
    </div>
  );
}

