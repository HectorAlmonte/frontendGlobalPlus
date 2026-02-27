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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Plus, AlertTriangle,
} from "lucide-react";
import {
  apiGetHourBank,
  apiGetHourBankTx,
  apiAjusteHourBank,
  apiDescansoHourBank,
  apiPermisoHourBank,
} from "../../_lib/api";
import { formatMinutes } from "../../_lib/utils";
import type {
  HourBankBalance,
  HourBankTransaction,
  HourBankTxType,
} from "../../_lib/types";

const TX_LABELS: Record<HourBankTxType, string> = {
  OVERTIME_ACCRUAL: "Acumulación OT",
  COMPENSATORY_REST: "Descanso compensatorio",
  PERMIT: "Permiso",
  MANUAL_ADJUSTMENT: "Ajuste manual",
};

const PAGE_SIZE = 20;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ActionType = "ajuste" | "descanso" | "permiso" | null;

export default function BancoPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;
  const canWrite = isAdmin || isSupervisor;

  const params = useParams<{ employeeId: string }>();
  const router = useRouter();

  const [balance, setBalance] = useState<HourBankBalance | null>(null);
  const [txRows, setTxRows] = useState<HourBankTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);

  // Filters
  const [txType, setTxType] = useState<HourBankTxType | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Action dialog
  const [actionType, setActionType] = useState<ActionType>(null);
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadBalance = useCallback(() => {
    if (!params.employeeId) return;
    apiGetHourBank(params.employeeId)
      .then(setBalance)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.employeeId]);

  const loadTx = useCallback(async (p: number = 1) => {
    if (!params.employeeId) return;
    setTxLoading(true);
    try {
      const res = await apiGetHourBankTx(params.employeeId, {
        txType: txType || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setTxRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      toast.error("Error al cargar transacciones");
    } finally {
      setTxLoading(false);
    }
  }, [params.employeeId, txType, fromDate, toDate]);

  useEffect(() => {
    if (!canAccess) return;
    loadBalance();
    loadTx(1);
  }, [canAccess, loadBalance, loadTx]);

  async function handleAction() {
    if (!actionType || !params.employeeId) return;
    const mins = Number(minutes);
    if (!minutes || isNaN(mins)) { toast.error("Ingresa una cantidad válida de minutos"); return; }
    if (actionType === "permiso" && !reason.trim()) { toast.error("El motivo es obligatorio"); return; }
    if (!notes.trim() && actionType !== "descanso") { toast.error("Las notas son obligatorias"); return; }

    setSubmitting(true);
    try {
      if (actionType === "ajuste") {
        await apiAjusteHourBank(params.employeeId, { minutes: mins, notes: notes.trim() });
      } else if (actionType === "descanso") {
        await apiDescansoHourBank(params.employeeId, { minutes: mins, notes: notes.trim() || undefined });
      } else {
        await apiPermisoHourBank(params.employeeId, { minutes: mins, reason: reason.trim(), notes: notes.trim() || undefined });
      }
      toast.success("Operación registrada");
      setActionType(null);
      setMinutes("");
      setNotes("");
      setReason("");
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
            <h1 className="text-xl font-semibold leading-none">Banco de horas</h1>
            <p className="text-xs text-muted-foreground mt-1">Saldo y movimientos</p>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setActionType("descanso"); setMinutes(""); setNotes(""); setReason(""); }}>
              Descanso comp.
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setActionType("permiso"); setMinutes(""); setNotes(""); setReason(""); }}>
              Permiso
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => { setActionType("ajuste"); setMinutes(""); setNotes(""); setReason(""); }}>
                <Plus className="h-4 w-4 mr-1" />
                Ajuste
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Balance card */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : balance ? (
        <div className={`rounded-xl border shadow-sm p-6 flex items-center gap-4 ${
          balance.isNegative
            ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40"
            : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40"
        }`}>
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
            balance.isNegative ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20"
          }`}>
            {balance.isNegative
              ? <TrendingDown className="h-7 w-7 text-red-600 dark:text-red-400" />
              : <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
            }
          </div>
          <div>
            <p className={`text-3xl font-bold ${balance.isNegative ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}>
              {formatMinutes(balance.totalMinutes)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Saldo {balance.isNegative ? "negativo" : "positivo"} — actualizado {formatDateTime(balance.lastUpdated)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos de banco de horas</p>
      )}

      {/* Transactions */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <Select
            value={txType || "_all"}
            onValueChange={(v) => setTxType(v === "_all" ? "" : v as HourBankTxType)}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {(Object.entries(TX_LABELS) as [HourBankTxType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" className="h-8 w-36 text-xs" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" className="h-8 w-36 text-xs" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => loadTx(1)}>Aplicar</Button>
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
                    <TableHead className="text-right">Minutos</TableHead>
                    <TableHead className="text-right">Saldo después</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txRows.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDateTime(tx.createdAt)}</TableCell>
                      <TableCell className="text-sm">{TX_LABELS[tx.txType] ?? tx.txType}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-medium ${tx.minutes > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.minutes > 0 ? "+" : ""}{formatMinutes(tx.minutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatMinutes(tx.balanceAfter)}</TableCell>
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
              {actionType === "ajuste" ? "Ajuste manual de horas" :
               actionType === "descanso" ? "Registrar descanso compensatorio" :
               "Registrar permiso"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="actMinutes">
                Minutos <span className="text-red-500">*</span>
                {actionType === "ajuste" && <span className="text-xs text-muted-foreground ml-1">(negativo para descontar)</span>}
              </Label>
              <Input
                id="actMinutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder={actionType === "ajuste" ? "-60 o 120" : "60"}
              />
            </div>
            {actionType === "permiso" && (
              <div className="space-y-1.5">
                <Label htmlFor="actReason">Motivo <span className="text-red-500">*</span></Label>
                <Input
                  id="actReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Cita médica, trámite, etc."
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="actNotes">
                Notas {(actionType === "ajuste") && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="actNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
