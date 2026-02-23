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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Historial de movimientos
        </h3>
        {canRegister && (
          <Button size="sm" onClick={() => setMovOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Retirado por</TableHead>
              <TableHead>Registrado por</TableHead>
              <TableHead>Motivo / Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Sin movimientos registrados
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {fmtDateTime(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <MovementTypeBadge type={m.type} />
                  </TableCell>
                  <TableCell className="font-semibold">{m.quantity}</TableCell>
                  <TableCell className="text-sm">
                    {m.requestedBy ? employeeName(m.requestedBy) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {performedByName(m.performedBy)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {[m.reason, m.reference].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {movements.length} movimiento{movements.length !== 1 ? "s" : ""}
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
