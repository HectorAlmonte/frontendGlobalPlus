"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Umbrella, Plus, AlertTriangle } from "lucide-react";
import {
  apiGetVacaciones,
  apiGetVacacionesTx,
  apiAcreditarVacaciones,
  apiAjusteVacaciones,
} from "../../_lib/api";
import type {
  VacationBalance,
  VacationTransaction,
  VacationTxType,
  AcreditarVacacionesInput,
  AjusteVacacionesInput,
} from "../../_lib/types";

const TX_LABELS: Record<VacationTxType, string> = {
  ACCRUAL: "Acreditación",
  USAGE: "Uso",
  MANUAL_ADJUSTMENT: "Ajuste manual",
};

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ActionType = "acreditar" | "ajuste" | null;

export default function VacacionesPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const params = useParams<{ employeeId: string }>();
  const router = useRouter();

  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [txRows, setTxRows] = useState<VacationTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);

  // Action dialog
  const [actionType, setActionType] = useState<ActionType>(null);
  const [formDays, setFormDays] = useState("");
  const [formPeriodStart, setFormPeriodStart] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadBalance = useCallback(() => {
    if (!params.employeeId) return;
    apiGetVacaciones(params.employeeId)
      .then(setBalance)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.employeeId]);

  const loadTx = useCallback(async (p: number = 1) => {
    if (!params.employeeId) return;
    setTxLoading(true);
    try {
      const res = await apiGetVacacionesTx(params.employeeId, { page: p, limit: PAGE_SIZE });
      setTxRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      toast.error("Error al cargar transacciones");
    } finally {
      setTxLoading(false);
    }
  }, [params.employeeId]);

  useEffect(() => {
    if (!canAccess) return;
    loadBalance();
    loadTx(1);
  }, [canAccess, loadBalance, loadTx]);

  async function handleAction() {
    if (!actionType || !params.employeeId) return;
    const days = Number(formDays);
    if (!formDays || isNaN(days)) { toast.error("Ingresa una cantidad válida de días"); return; }
    if (actionType === "acreditar" && !formPeriodStart) { toast.error("La fecha de inicio del período es obligatoria"); return; }
    if (actionType === "ajuste" && !formNotes.trim()) { toast.error("Las notas son obligatorias para ajustes"); return; }

    setSubmitting(true);
    try {
      if (actionType === "acreditar") {
        const body: AcreditarVacacionesInput = {
          days,
          periodStart: formPeriodStart,
          notes: formNotes.trim() || undefined,
        };
        await apiAcreditarVacaciones(params.employeeId, body);
      } else {
        const body: AjusteVacacionesInput = { days, notes: formNotes.trim() };
        await apiAjusteVacaciones(params.employeeId, body);
      }
      toast.success("Operación registrada");
      setActionType(null);
      setFormDays("");
      setFormPeriodStart("");
      setFormNotes("");
      loadBalance();
      loadTx(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold leading-none">Vacaciones</h1>
            <p className="text-xs text-muted-foreground mt-1">Saldo y movimientos de vacaciones</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setActionType("ajuste"); setFormDays(""); setFormPeriodStart(""); setFormNotes(""); }}
            >
              Ajuste
            </Button>
            <Button
              size="sm"
              onClick={() => { setActionType("acreditar"); setFormDays(""); setFormPeriodStart(""); setFormNotes(""); }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Acreditar
            </Button>
          </div>
        )}
      </div>

      {/* Balance */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : balance ? (
        <div className="rounded-xl border bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-900/40 shadow-sm p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/20">
              <Umbrella className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">{balance.availableDays}d</p>
                <p className="text-sm text-muted-foreground mt-0.5">Días disponibles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{balance.usedDays}d</p>
                <p className="text-sm text-muted-foreground mt-0.5">Días usados</p>
              </div>
            </div>
          </div>
          {balance.periodStart && (
            <p className="text-xs text-muted-foreground mt-3">
              Período actual desde: {formatDate(balance.periodStart)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos de vacaciones</p>
      )}

      {/* Transactions */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30">
          <p className="text-sm font-semibold">Historial de movimientos</p>
        </div>
        {txLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : txRows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Sin movimientos</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">Saldo después</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txRows.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="text-sm">{TX_LABELS[tx.txType] ?? tx.txType}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-medium ${tx.days > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.days > 0 ? "+" : ""}{tx.days}d
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{tx.balanceAfter}d</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.periodFrom && tx.periodTo
                          ? `${formatDate(tx.periodFrom)} – ${formatDate(tx.periodTo)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{tx.notes ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.createdBy?.username ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadTx(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs text-muted-foreground">Página {page} de {pageCount}</span>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => loadTx(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(o) => { if (!o) setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "acreditar" ? "Acreditar vacaciones" : "Ajuste de vacaciones"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vacDays">
                Días <span className="text-red-500">*</span>
                {actionType === "ajuste" && <span className="text-xs text-muted-foreground ml-1">(negativo para descontar)</span>}
              </Label>
              <Input
                id="vacDays"
                type="number"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                placeholder={actionType === "ajuste" ? "-5 o 15" : "15"}
              />
            </div>
            {actionType === "acreditar" && (
              <div className="space-y-1.5">
                <Label htmlFor="vacPeriod">Inicio del período <span className="text-red-500">*</span></Label>
                <Input
                  id="vacPeriod"
                  type="date"
                  value={formPeriodStart}
                  onChange={(e) => setFormPeriodStart(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="vacNotes">
                Notas {actionType === "ajuste" && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="vacNotes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                placeholder="Observaciones..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancelar</Button>
            <Button onClick={handleAction} disabled={submitting}>
              {submitting ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
