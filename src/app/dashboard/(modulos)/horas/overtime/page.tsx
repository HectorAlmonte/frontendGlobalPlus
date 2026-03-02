"use client";

import { useEffect, useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  ChevronRight,
  Calendar,
  Timer,
} from "lucide-react";
import {
  apiGetOvertimePending,
  apiGetAsistenciaDayDetail,
  apiApproveOvertime,
  apiRejectOvertime,
} from "../_lib/api";
import { formatMinutes, dayTypeBadge } from "../_lib/utils";
import type { OvertimePendingItem, AttendanceDayDetail } from "../_lib/types";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

function formatDateLong(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

function toHoraLima(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtMin(mins: number | null | undefined): string {
  if (!mins) return "—";
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  const val = m > 0 ? `${h}h ${m}m` : `${h}h`;
  return mins < 0 ? `-${val}` : val;
}

function punchLabel(index: number, total: number): string {
  if (total === 1) return "Única marca";
  if (index === 0) return "Entrada";
  if (index === total - 1) return "Salida";
  return "Intermedio";
}

export default function OvertimePage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const [rows, setRows] = useState<OvertimePendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Sheet
  const [detailItem, setDetailItem] = useState<OvertimePendingItem | null>(null);
  const [dayDetail, setDayDetail] = useState<AttendanceDayDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action inside Sheet: "approve" | "reject" | null
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
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

  function openDetail(row: OvertimePendingItem) {
    setDetailItem(row);
    setDayDetail(null);
    setPendingAction(null);
    setActionNotes("");
    setDetailLoading(true);
    // Date from row might be ISO — normalize to YYYY-MM-DD
    const date = row.date.includes("T") ? row.date.split("T")[0] : row.date;
    apiGetAsistenciaDayDetail(row.employee.id, date)
      .then(setDayDetail)
      .catch(() => toast.error("Error al cargar detalle del día"))
      .finally(() => setDetailLoading(false));
  }

  function closeSheet() {
    setDetailItem(null);
    setDayDetail(null);
    setPendingAction(null);
    setActionNotes("");
  }

  async function handleAction() {
    if (!detailItem || !pendingAction) return;
    if (pendingAction === "reject" && !actionNotes.trim()) {
      toast.error("El motivo del rechazo es obligatorio");
      return;
    }
    setSubmitting(true);
    const date = detailItem.date.includes("T") ? detailItem.date.split("T")[0] : detailItem.date;
    try {
      if (pendingAction === "approve") {
        await apiApproveOvertime(detailItem.employee.id, date, { notes: actionNotes || undefined });
        toast.success("Horas extra aprobadas");
      } else {
        await apiRejectOvertime(detailItem.employee.id, date, { notes: actionNotes.trim() });
        toast.success("Horas extra rechazadas");
      }
      closeSheet();
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar");
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
            <p className="text-xs text-muted-foreground mt-1">Haz clic en una fila para ver el detalle y aprobar o rechazar</p>
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
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={`${row.employee.id}-${row.date}`}
                    className="cursor-pointer"
                    onClick={() => openDetail(row)}
                  >
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
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailItem} onOpenChange={(o) => { if (!o) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 h-dvh flex flex-col">
          {/* Header */}
          <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-5 py-4">
            <SheetTitle className="text-base leading-tight">
              {detailItem ? `${detailItem.employee.nombres} ${detailItem.employee.apellidos}` : ""}
            </SheetTitle>
            {detailItem && (
              <p className="text-xs text-muted-foreground capitalize">
                {formatDateLong(detailItem.date)}
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {detailLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : dayDetail?.record ? (
              <div className="space-y-0">
                {/* Registro del día */}
                <div className="border-b">
                  <div className="flex items-center gap-2 px-5 py-3 bg-muted/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-semibold">Registro del día</p>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-3">
                    <StatItem label="Horario" value={dayDetail.record.schedule?.name ?? "—"} className="col-span-2" />
                    <StatItem label="Horas programadas" value={fmtMin(dayDetail.record.scheduledMinutes)} />
                    <StatItem label="Horas efectivas" value={fmtMin(dayDetail.record.effectiveMinutes)} />
                    <StatItem
                      label="Tardanza"
                      value={dayDetail.record.lateMinutes > 0 ? fmtMin(dayDetail.record.lateMinutes) : "—"}
                      valueClass={dayDetail.record.lateMinutes > 0 ? "text-red-600 dark:text-red-400" : ""}
                    />
                    <StatItem label="OT bruta" value={fmtMin(dayDetail.record.overtimeRawMinutes)} valueClass="text-amber-700 dark:text-amber-400 font-semibold" />
                    <StatItem label="OT efectiva" value={fmtMin(dayDetail.record.overtimeEffectiveMinutes)} valueClass="text-amber-700 dark:text-amber-400 font-semibold" />
                    <StatItem label="Multiplicador" value={`×${detailItem?.overtimeMultiplier ?? 1}`} />
                  </div>
                </div>

                {/* Fichajes */}
                {dayDetail.punches.length > 0 && (
                  <div className="border-b">
                    <div className="flex items-center gap-2 px-5 py-3 bg-muted/30">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold">Fichajes del día</p>
                      <span className="ml-auto text-xs text-muted-foreground">{dayDetail.punches.length} marca(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fuente</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayDetail.punches.map((p, i) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-mono text-sm font-medium">{toHoraLima(p.punchedAt)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {punchLabel(i, dayDetail.punches.length)}
                              </TableCell>
                              <TableCell>
                                {p.source === "MANUAL" ? (
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40">
                                    Manual
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Dispositivo</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="p-5 space-y-4">
                  {pendingAction === null ? (
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => { setPendingAction("approve"); setActionNotes(""); }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Aprobar horas extra
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
                        onClick={() => { setPendingAction("reject"); setActionNotes(""); }}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <p className="text-sm font-semibold">
                        {pendingAction === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="actionNotes">
                          {pendingAction === "approve" ? "Notas (opcional)" : "Motivo del rechazo"}
                          {pendingAction === "reject" && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id="actionNotes"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder={pendingAction === "approve" ? "Observaciones opcionales..." : "Motivo obligatorio..."}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPendingAction(null)}
                          disabled={submitting}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className={`flex-1 ${pendingAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                          onClick={handleAction}
                          disabled={submitting || (pendingAction === "reject" && !actionNotes.trim())}
                        >
                          {pendingAction === "approve" ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprobar</>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5 mr-1" />Rechazar</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  className,
  valueClass,
}: {
  label: string;
  value: string;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-lg border bg-muted/20 p-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}
