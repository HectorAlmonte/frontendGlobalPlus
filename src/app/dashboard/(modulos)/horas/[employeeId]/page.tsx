"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Star,
  Clock,
  ArrowRight,
  TrendingDown,
  CalendarDays,
} from "lucide-react";
import { apiGetAsistencia } from "../_lib/api";
import {
  DAY_TYPE_COLORS,
  DAY_TYPE_LABELS,
  formatMinutes,
  dayTypeBadge,
  statusBadge,
  overtimeStatusBadge,
} from "../_lib/utils";
import type { AttendanceRecord, DayType } from "../_lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const LEGEND_TYPES: DayType[] = ["WORKED", "REST", "HOLIDAY", "VACATION", "ABSENT", "PERMIT", "MEDICAL_LEAVE"];

function getMonthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EmployeeCalendarPage() {
  const { user } = useWord();
  const canAccess = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState(() => searchParams.get("name") ?? "");

  // Day detail sheet
  const [sheetDay, setSheetDay] = useState<{ date: string; rec: AttendanceRecord | null } | null>(null);

  useEffect(() => {
    if (!canAccess || !params.employeeId) return;
    const { from, to } = getMonthRange(year, month);
    setLoading(true);
    apiGetAsistencia(params.employeeId, { from, to, limit: 31 })
      .then((res) => {
        setRecords(res.data ?? []);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Error al cargar asistencia"))
      .finally(() => setLoading(false));
  }, [canAccess, params.employeeId, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const recordMap = useMemo(() => {
    const m: Record<string, AttendanceRecord> = {};
    for (const r of records) {
      const key = r.date.includes("T") ? r.date.split("T")[0] : r.date;
      m[key] = r;
    }
    return m;
  }, [records]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const monthStats = useMemo(() => {
    const worked = records.filter((r) => r.dayType === "WORKED");
    return {
      workedDays: worked.length,
      totalEffective: worked.reduce((s, r) => s + (r.effectiveMinutes ?? 0), 0),
      totalScheduled: worked.reduce((s, r) => s + (r.scheduledMinutes ?? 0), 0),
      totalLate: records.reduce((s, r) => s + (r.lateMinutes ?? 0), 0),
      absences: records.filter((r) => r.dayType === "ABSENT").length,
    };
  }, [records]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function getDateStr(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
    <div className="space-y-5 px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold leading-none">
              {loading && !employeeName
                ? <Skeleton className="h-5 w-48 inline-block" />
                : employeeName || "Empleado"
              }
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Calendario de asistencia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/horas/${params.employeeId}/banco`}>
            <Button variant="outline" size="sm" className="text-xs">Banco de horas</Button>
          </Link>
          <Link href={`/dashboard/horas/${params.employeeId}/vacaciones`}>
            <Button variant="outline" size="sm" className="text-xs">Vacaciones</Button>
          </Link>
        </div>
      </div>

      {/* Month nav + mini stats */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold capitalize min-w-44 text-center">
            {formatMonthLabel(year, month)}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!loading && records.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              <strong className="text-foreground">{monthStats.workedDays}</strong> días trab.
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <strong className="text-foreground">{formatMinutes(monthStats.totalEffective)}</strong> efect.
            </span>
            {monthStats.totalLate > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <TrendingDown className="h-3 w-3" />
                <strong>{formatMinutes(monthStats.totalLate)}</strong> tard.
              </span>
            )}
            {monthStats.absences > 0 && (
              <span className="text-red-600 dark:text-red-400">
                <strong>{monthStats.absences}</strong> ausencia{monthStats.absences !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-px bg-border p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-none" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="h-20 bg-muted/10" />;
              }

              const dateStr = getDateStr(day);
              const rec = recordMap[dateStr];
              const color = rec ? DAY_TYPE_COLORS[rec.dayType] : undefined;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSheetDay({ date: dateStr, rec: rec ?? null })}
                  className="h-20 bg-card hover:brightness-95 dark:hover:brightness-110 transition-all relative p-1.5 flex flex-col text-left group"
                  style={
                    color
                      ? { backgroundColor: color + "18", borderLeft: `3px solid ${color}` }
                      : { borderLeft: "3px solid transparent" }
                  }
                >
                  {/* Day number */}
                  <span className={`text-xs font-semibold leading-none ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "text-foreground/70"
                  }`}>
                    {day}
                  </span>

                  {rec ? (
                    <div className="mt-auto space-y-0.5 w-full">
                      <span className="text-[9px] font-medium leading-none truncate block" style={{ color }}>
                        {DAY_TYPE_LABELS[rec.dayType]}
                      </span>
                      {rec.dayType === "WORKED" && rec.effectiveMinutes > 0 && (
                        <span className="text-[10px] text-muted-foreground leading-none block font-mono">
                          {formatMinutes(rec.effectiveMinutes)}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {rec.lateMinutes > 0 && (
                          <Clock className="h-2.5 w-2.5 text-amber-500" />
                        )}
                        {rec.overtimeStatus === "PENDING" && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-none">OT</span>
                        )}
                        {rec.overtimeStatus === "APPROVED" && (
                          <span className="text-[9px] text-green-600 dark:text-green-400 font-bold leading-none">OT✓</span>
                        )}
                        {rec.isHoliday && <Star className="h-2.5 w-2.5 text-violet-500" />}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <span className="text-[9px] text-muted-foreground/40 leading-none">Sin reg.</span>
                    </div>
                  )}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 ring-1 ring-inset ring-primary/20 pointer-events-none transition-opacity" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DAY_TYPE_COLORS[t] }} />
            {DAY_TYPE_LABELS[t]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/20 border" />
          Sin registro
        </div>
      </div>

      {/* Day detail sheet */}
      <Sheet open={!!sheetDay} onOpenChange={(o) => { if (!o) setSheetDay(null); }}>
        <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b bg-muted/30 shrink-0">
            <SheetTitle className="text-sm font-semibold leading-none capitalize">
              {sheetDay ? formatDayLabel(sheetDay.date) : ""}
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{employeeName}</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {sheetDay?.rec ? (
              <>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {dayTypeBadge(sheetDay.rec.dayType)}
                  {statusBadge(sheetDay.rec.status)}
                  {sheetDay.rec.isHoliday && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 text-xs font-medium">
                      <Star className="h-3 w-3" />
                      Feriado
                    </span>
                  )}
                </div>

                {/* Hours */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Programado</p>
                      <p className="font-mono font-semibold">{formatMinutes(sheetDay.rec.scheduledMinutes)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Efectivo</p>
                      <p className="font-mono font-semibold">{formatMinutes(sheetDay.rec.effectiveMinutes)}</p>
                    </div>
                    {sheetDay.rec.lateMinutes > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Tardanza</p>
                        <p className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {formatMinutes(sheetDay.rec.lateMinutes)}
                        </p>
                      </div>
                    )}
                    {sheetDay.rec.overtimeEffectiveMinutes > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Horas extra</p>
                        <p className="font-mono font-semibold text-green-600 dark:text-green-400">
                          {formatMinutes(sheetDay.rec.overtimeEffectiveMinutes)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Completion bar */}
                  {sheetDay.rec.dayType === "WORKED" && sheetDay.rec.scheduledMinutes > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Cumplimiento</span>
                        <span className={
                          sheetDay.rec.effectiveMinutes >= sheetDay.rec.scheduledMinutes
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }>
                          {Math.round((sheetDay.rec.effectiveMinutes / sheetDay.rec.scheduledMinutes) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sheetDay.rec.effectiveMinutes >= sheetDay.rec.scheduledMinutes
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((sheetDay.rec.effectiveMinutes / sheetDay.rec.scheduledMinutes) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* OT detail */}
                {sheetDay.rec.overtimeStatus !== "NONE" && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Horas extra</p>
                    <div className="flex items-center justify-between">
                      {overtimeStatusBadge(sheetDay.rec.overtimeStatus)}
                      <span className="font-mono text-sm text-muted-foreground">
                        ×{sheetDay.rec.overtimeMultiplier} · {formatMinutes(sheetDay.rec.overtimeRawMinutes)} bruto
                      </span>
                    </div>
                  </div>
                )}

                {/* Doc ref */}
                {sheetDay.rec.documentRef && (
                  <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Ref. documento</p>
                    <p className="text-sm font-medium">{sheetDay.rec.documentRef}</p>
                  </div>
                )}

                {/* Override notes */}
                {sheetDay.rec.overrideNotes && (
                  <div className="rounded-lg border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Notas de ajuste</p>
                    <p className="text-sm">{sheetDay.rec.overrideNotes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <CalendarDays className="h-8 w-8 opacity-30" />
                <p className="text-sm">Sin registro para este día</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-4 shrink-0">
            <Link href={`/dashboard/horas/${params.employeeId}/${sheetDay?.date}${employeeName ? `?name=${encodeURIComponent(employeeName)}` : ""}`}>
              <Button className="w-full gap-2" onClick={() => setSheetDay(null)}>
                Ver detalle completo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
