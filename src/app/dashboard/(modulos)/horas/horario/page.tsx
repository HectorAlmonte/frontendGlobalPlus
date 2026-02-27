"use client";

import { useEffect, useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Plus, AlertTriangle, History } from "lucide-react";
import { apiGetHorarioActual, apiGetHorarioHistorial, apiCreateHorario } from "../_lib/api";
import { DAY_NAMES_FULL } from "../_lib/utils";
import type { WorkSchedule, CreateHorarioInput } from "../_lib/types";

// Form-local type uses the POST field names (graceEntry/graceExit)
// which differ from the GET response fields (entryGraceMins/exitGraceMins)
interface FormDay {
  dayOfWeek: number;
  isWorkDay: boolean;
  startTime: string | null;
  endTime: string | null;
  graceEntry: number;
  graceExit: number;
}

function formatTime(t: string | null) {
  if (!t) return "—";
  return t;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DEFAULT_DAYS: FormDay[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isWorkDay: i >= 1 && i <= 5,
  startTime: i >= 1 && i <= 5 ? "08:00" : null,
  endTime: i >= 1 && i <= 5 ? "17:00" : null,
  graceEntry: 5,
  graceExit: 5,
}));

export default function HorarioPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const [current, setCurrent] = useState<WorkSchedule | null>(null);
  const [historial, setHistorial] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDays, setFormDays] = useState<FormDay[]>(DEFAULT_DAYS);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Try /api/horario/current first; if it fails, fall back to the list
      let cur: WorkSchedule | null = null;
      let hist: WorkSchedule[] = [];

      try {
        cur = await apiGetHorarioActual();
      } catch {
        // /api/horario/current may not exist — load from list instead
      }

      try {
        const raw = await apiGetHorarioHistorial();
        // Handle both plain array and { data: [...] } responses
        hist = Array.isArray(raw) ? raw : ((raw as { data?: WorkSchedule[] }).data ?? []);
      } catch (err) {
        toast.error("Error al cargar historial de horarios: " + (err instanceof Error ? err.message : String(err)));
      }

      // If /current failed but we have the list, use the most recent as current
      if (!cur && hist.length > 0) {
        // Sort by effectiveFrom descending and take first
        const sorted = [...hist].sort(
          (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        );
        cur = sorted[0];
        hist = sorted;
      }

      setCurrent(cur);
      setHistorial(hist);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    loadData();
  }, [canAccess, loadData]);

  function openCreate() {
    setFormName("");
    setFormDate("");
    setFormNotes("");
    setFormDays(DEFAULT_DAYS);
    setShowCreate(true);
  }

  function updateDay(idx: number, patch: Partial<FormDay>) {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === idx ? { ...d, ...patch } : d
      )
    );
  }

  async function handleSubmit() {
    if (!formName.trim() || !formDate) {
      toast.error("Completa el nombre y la fecha efectiva");
      return;
    }
    const body: CreateHorarioInput = {
      name: formName.trim(),
      effectiveFrom: formDate,
      notes: formNotes.trim() || undefined,
      days: formDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isWorkDay: d.isWorkDay,
        startTime: d.isWorkDay ? (d.startTime ?? undefined) : undefined,
        endTime: d.isWorkDay ? (d.endTime ?? undefined) : undefined,
        graceEntry: d.isWorkDay ? d.graceEntry : undefined,
        graceExit: d.isWorkDay ? d.graceExit : undefined,
      })),
    };
    setSubmitting(true);
    try {
      await apiCreateHorario(body);
      toast.success("Horario creado correctamente");
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear horario");
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
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-none">Horario laboral</h1>
            <p className="text-xs text-muted-foreground mt-1">Configura los horarios vigentes de la empresa</p>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo horario
          </Button>
        )}
      </div>

      {/* Current schedule */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold leading-none">Horario vigente</p>
          {current && (
            <span className="ml-auto text-xs text-muted-foreground">
              Desde {formatDateTime(current.effectiveFrom)}
            </span>
          )}
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !current ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin horario configurado</p>
          ) : (
            <>
              <p className="text-sm font-medium mb-3">{current.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {(current.days ?? []).map((d) => (
                  <div
                    key={d.dayOfWeek}
                    className={`rounded-lg border px-3 py-2.5 text-sm ${
                      d.isWorkDay
                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40"
                        : "bg-muted/30 border-border opacity-60"
                    }`}
                  >
                    <p className="font-medium text-xs">{DAY_NAMES_FULL[d.dayOfWeek]}</p>
                    {d.isWorkDay ? (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {formatTime(d.startTime)} – {formatTime(d.endTime)}
                        {d.entryGraceMins ? ` (±${d.entryGraceMins}m)` : ""}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-0.5">Descanso</p>
                    )}
                  </div>
                ))}
              </div>
              {current.notes && (
                <p className="text-xs text-muted-foreground mt-3">{current.notes}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <History className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold leading-none">Historial de horarios</p>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : historial.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin historial</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Vigente desde</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead>Fecha creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{formatDateTime(h.effectiveFrom)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {h.createdBy?.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(h.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo horario laboral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="horName">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="horName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Horario estándar 2025"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="horDate">Fecha efectiva <span className="text-red-500">*</span></Label>
                <Input
                  id="horDate"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horNotes">Notas (opcional)</Label>
              <Textarea
                id="horNotes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones..."
              />
            </div>

            {/* Days grid */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Días laborables</p>
              <div className="space-y-2">
                {formDays.map((d, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 space-y-2 transition-opacity ${
                      !d.isWorkDay ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={d.isWorkDay}
                        onCheckedChange={(v) => updateDay(i, { isWorkDay: v })}
                      />
                      <span className="text-sm font-medium w-24">{DAY_NAMES_FULL[d.dayOfWeek]}</span>
                    </div>
                    {d.isWorkDay && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Entrada</Label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={d.startTime ?? ""}
                            onChange={(e) => updateDay(i, { startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Salida</Label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={d.endTime ?? ""}
                            onChange={(e) => updateDay(i, { endTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gracia ent. (min)</Label>
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            min={0}
                            value={d.graceEntry ?? 5}
                            onChange={(e) => updateDay(i, { graceEntry: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gracia sal. (min)</Label>
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            min={0}
                            value={d.graceExit ?? 5}
                            onChange={(e) => updateDay(i, { graceExit: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Guardando..." : "Crear horario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
