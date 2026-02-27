"use client";

import { useEffect, useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  apiGetOvertimePending,
  apiApproveOvertime,
  apiRejectOvertime,
} from "../_lib/api";
import { formatMinutes, dayTypeBadge } from "../_lib/utils";
import type { OvertimePendingItem } from "../_lib/types";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OvertimePage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const [rows, setRows] = useState<OvertimePendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [approveItem, setApproveItem] = useState<OvertimePendingItem | null>(null);
  const [rejectItem, setRejectItem] = useState<OvertimePendingItem | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    apiGetOvertimePending()
      .then(setRows)
      .catch(() => toast.error("Error al cargar horas extra pendientes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    loadData();
  }, [canAccess, loadData]);

  // Socket.IO real-time update
  useEffect(() => {
    if (!canAccess) return;
    let socket: ReturnType<typeof import("socket.io-client").io> | null = null;
    import("socket.io-client").then(({ io }) => {
      socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
        withCredentials: true,
        transports: ["websocket"],
      });
      socket.on("attendance:overtime_pending", () => loadData());
    });
    return () => { socket?.disconnect(); };
  }, [canAccess, loadData]);

  async function handleApprove() {
    if (!approveItem) return;
    setSubmitting(true);
    try {
      await apiApproveOvertime(approveItem.employee.id, approveItem.date, { notes: notes || undefined });
      toast.success("Horas extra aprobadas");
      setApproveItem(null);
      setNotes("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectItem || !notes.trim()) return;
    setSubmitting(true);
    try {
      await apiRejectOvertime(rejectItem.employee.id, rejectItem.date, { notes: notes.trim() });
      toast.success("Horas extra rechazadas");
      setRejectItem(null);
      setNotes("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al rechazar");
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
    <div className="space-y-6 px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold leading-none">Horas extra pendientes</h1>
              {!loading && rows.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-xs font-bold">
                  {rows.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aprueba o rechaza las horas extra registradas</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Sin horas extra pendientes</p>
            <p className="text-xs">Todo está al día.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Empleado</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo de día</TableHead>
                  <TableHead className="text-right">OT bruta</TableHead>
                  <TableHead className="text-right">Mult.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.employee.id}-${row.date}`}>
                    <TableCell className="font-medium">
                      {row.employee.nombres} {row.employee.apellidos}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {row.employee.dni}
                    </TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{dayTypeBadge(row.dayType)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatMinutes(row.overtimeRawMinutes)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ×{row.overtimeMultiplier}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-xs font-medium">
                        Pendiente
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/40 dark:hover:bg-green-900/20"
                          onClick={() => { setApproveItem(row); setNotes(""); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
                          onClick={() => { setRejectItem(row); setNotes(""); }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={!!approveItem} onOpenChange={(o) => { if (!o) { setApproveItem(null); setNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar horas extra</DialogTitle>
          </DialogHeader>
          {approveItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Empleado: </span><strong>{approveItem.employee.nombres} {approveItem.employee.apellidos}</strong></p>
                <p><span className="text-muted-foreground">Fecha: </span>{formatDate(approveItem.date)}</p>
                <p><span className="text-muted-foreground">OT bruta: </span><strong>{formatMinutes(approveItem.overtimeRawMinutes)}</strong> × {approveItem.overtimeMultiplier}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approveNotes">Notas (opcional)</Label>
                <Textarea
                  id="approveNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveItem(null)}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectItem} onOpenChange={(o) => { if (!o) { setRejectItem(null); setNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar horas extra</DialogTitle>
          </DialogHeader>
          {rejectItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Empleado: </span><strong>{rejectItem.employee.nombres} {rejectItem.employee.apellidos}</strong></p>
                <p><span className="text-muted-foreground">Fecha: </span>{formatDate(rejectItem.date)}</p>
                <p><span className="text-muted-foreground">OT bruta: </span><strong>{formatMinutes(rejectItem.overtimeRawMinutes)}</strong></p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rejectNotes">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo obligatorio..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectItem(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !notes.trim()}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
