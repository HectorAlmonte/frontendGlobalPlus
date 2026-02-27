"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, Star, Clock } from "lucide-react";
import { apiGetAsistencia } from "../_lib/api";
import {
  DAY_TYPE_COLORS,
  DAY_TYPE_LABELS,
  formatMinutes,
} from "../_lib/utils";
import type { AttendanceRecord, DayType } from "../_lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

export default function EmployeeCalendarPage() {
  const { user } = useWord();
  const canAccess = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    if (!canAccess || !params.employeeId) return;
    const { from, to } = getMonthRange(year, month);
    setLoading(true);
    apiGetAsistencia(params.employeeId, { from, to, limit: 31 })
      .then((res) => {
        setRecords(res.data);
        if (res.data.length > 0) {
          const e = res.data[0].employee;
          setEmployeeName(`${e.nombres} ${e.apellidos}`);
        }
      })
      .catch(() => toast.error("Error al cargar asistencia"))
      .finally(() => setLoading(false));
  }, [canAccess, params.employeeId, year, month]);

  // Map date -> record
  const recordMap = useMemo(() => {
    const m: Record<string, AttendanceRecord> = {};
    for (const r of records) m[r.date] = r;
    return m;
  }, [records]);

  // Build calendar grid (Mon–Sun)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    // Day of week where 0=Mon...6=Sun
    let startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function getDateStr(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Legend items
  const legendTypes: DayType[] = ["WORKED", "REST", "HOLIDAY", "VACATION", "ABSENT", "PERMIT", "MEDICAL_LEAVE"];

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
            <h1 className="text-xl font-semibold leading-none">
              {loading && !employeeName ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                employeeName || "Empleado"
              )}
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

      {/* Month nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold capitalize min-w-40 text-center">
          {formatMonthLabel(year, month)}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-px bg-border p-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={i} className="h-20 bg-muted/20" />;
              }
              const dateStr = getDateStr(day);
              const rec = recordMap[dateStr];
              const bg = rec ? DAY_TYPE_COLORS[rec.dayType] : undefined;

              return (
                <Link
                  key={i}
                  href={`/dashboard/horas/${params.employeeId}/${dateStr}`}
                  className="h-20 bg-card hover:opacity-90 transition-opacity relative p-1.5 flex flex-col"
                  style={bg ? { backgroundColor: bg + "22", borderLeft: `3px solid ${bg}` } : {}}
                >
                  <span className="text-xs font-medium">{day}</span>
                  {rec && (
                    <div className="mt-auto space-y-0.5">
                      {rec.lateMinutes > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 text-amber-600" />
                          <span className="text-xs text-amber-700 dark:text-amber-400">{formatMinutes(rec.lateMinutes)}</span>
                        </div>
                      )}
                      {rec.overtimeStatus !== "NONE" && (
                        <div className="flex items-center gap-0.5">
                          <span className={`text-xs ${
                            rec.overtimeStatus === "APPROVED"
                              ? "text-green-700 dark:text-green-400"
                              : rec.overtimeStatus === "PENDING"
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}>
                            OT
                          </span>
                        </div>
                      )}
                      {rec.isHoliday && (
                        <Star className="h-2.5 w-2.5 text-violet-500" />
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {legendTypes.map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: DAY_TYPE_COLORS[t] }}
            />
            {DAY_TYPE_LABELS[t]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-sm bg-muted-foreground/20 border" />
          Sin registro
        </div>
      </div>
    </div>
  );
}
