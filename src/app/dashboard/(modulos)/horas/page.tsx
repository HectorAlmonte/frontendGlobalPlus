"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Upload,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  BarChart3,
  ChevronRight,
  TimerOff,
  Search,
} from "lucide-react";
import { apiGetHorasStats, apiSearchAllStaff } from "./_lib/api";
import { formatMinutes } from "./_lib/utils";
import type { HorasStats } from "./_lib/types";

export default function HorasPage() {
  const { user } = useWord();
  const router = useRouter();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const [stats, setStats] = useState<HorasStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Employee search — carga todos una vez, filtra client-side
  const [empQuery, setEmpQuery] = useState("");
  const [empResults, setEmpResults] = useState<{ id: string; label: string }[]>([]);
  const [allStaff, setAllStaff] = useState<{ id: string; label: string }[]>([]);
  const [empSearching, setEmpSearching] = useState(false);

  useEffect(() => {
    if (!canAccess) return;
    apiSearchAllStaff()
      .then(setAllStaff)
      .catch(() => {});
  }, [canAccess]);

  function handleEmpSearch(q: string) {
    setEmpQuery(q);
    if (q.length < 2) { setEmpResults([]); return; }
    setEmpSearching(true);
    const lower = q.toLowerCase();
    const filtered = allStaff.filter((e) => e.label.toLowerCase().includes(lower));
    setEmpResults(filtered.slice(0, 10));
    setEmpSearching(false);
  }

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    apiGetHorasStats()
      .then(setStats)
      .catch(() => toast.error("Error al cargar estadísticas"))
      .finally(() => setLoading(false));
  }, [canAccess]);

  // Socket.IO for real-time events
  useEffect(() => {
    if (!canAccess) return;
    let socket: ReturnType<typeof import("socket.io-client").io> | null = null;
    import("socket.io-client").then(({ io }) => {
      socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
        withCredentials: true,
        transports: ["websocket"],
      });
      socket.emit("join", { role: isAdmin ? "admin" : "supervisor", userId: (user as unknown as { id?: string })?.id });

      socket.on("attendance:overtime_pending", (data: { count: number }) => {
        toast.warning(`${data.count} hora(s) extra pendiente(s) de aprobación`, {
          action: { label: "Ver", onClick: () => window.location.href = "/dashboard/horas/overtime" },
        });
        apiGetHorasStats().then(setStats).catch(() => {});
      });

      socket.on("attendance:absence_warning", (data: { employeeName: string; count: number }) => {
        toast.warning(`${data.employeeName}: ${data.count} inasistencias acumuladas`);
        apiGetHorasStats().then(setStats).catch(() => {});
      });

      socket.on("attendance:absence_legal_threshold", (data: { employeeName: string }) => {
        toast.error(`⚠️ ${data.employeeName} superó el umbral legal de inasistencias (Art. 25 TUO DL 728)`, {
          duration: 8000,
        });
        apiGetHorasStats().then(setStats).catch(() => {});
      });

      socket.on("attendance:consecutive_incomplete", (data: { employeeName: string; days: number }) => {
        toast.warning(`${data.employeeName}: ${data.days} días consecutivos incompletos`);
        apiGetHorasStats().then(setStats).catch(() => {});
      });
    });

    return () => { socket?.disconnect(); };
  }, [canAccess, isAdmin, user]);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-none">Control de Horas</h1>
            <p className="text-xs text-muted-foreground mt-1">Asistencia, horario y banco de horas</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/horas/importar">
            <Upload className="h-4 w-4 mr-1.5" />
            Importar XLS
          </Link>
        </Button>
      </div>

      {/* Alerts */}
      {stats && (stats.incompleteRecordsCount > 0 || stats.absenceAlertsCount > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-red-800 dark:text-red-300">Atención requerida</p>
            <ul className="mt-1 space-y-0.5 text-red-700 dark:text-red-400">
              {stats.incompleteRecordsCount > 0 && (
                <li>· {stats.incompleteRecordsCount} registro(s) incompleto(s)</li>
              )}
              {stats.absenceAlertsCount > 0 && (
                <li>· {stats.absenceAlertsCount} alerta(s) de inasistencia</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          loading={loading}
          icon={<CheckCircle2 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          label="OT Pendientes"
          value={stats?.pendingOvertimeCount ?? 0}
          href="/dashboard/horas/overtime"
          alert={stats !== null && stats.pendingOvertimeCount > 0}
        />
        <KpiCard
          loading={loading}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
          label="Registros incompletos"
          value={stats?.incompleteRecordsCount ?? 0}
          alert={stats !== null && stats.incompleteRecordsCount > 0}
        />
        <KpiCard
          loading={loading}
          icon={<Users className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50 dark:bg-orange-900/20"
          label="Deudores de horas"
          value={stats?.debtorCount ?? 0}
          alert={stats !== null && stats.debtorCount > 0}
        />
        <KpiCard
          loading={loading}
          icon={<TimerOff className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
          label="Alertas ausencias"
          value={stats?.absenceAlertsCount ?? 0}
          alert={stats !== null && stats.absenceAlertsCount > 0}
        />
        <KpiCard
          loading={loading}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-900/20"
          label="Banco positivo total"
          value={stats ? formatMinutes(stats.totalPositiveMinutes) : "—"}
        />
        <KpiCard
          loading={loading}
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
          label="Banco negativo total"
          value={stats ? formatMinutes(stats.totalNegativeMinutes) : "—"}
        />
      </div>

      {/* Employee search */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30 rounded-t-xl overflow-hidden">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Ver asistencia por empleado</p>
        </div>
        <div className="p-4">
          <div className="relative max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar empleado por nombre o DNI..."
                value={empQuery}
                onChange={(e) => handleEmpSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {empResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border bg-popover shadow-lg max-h-52 overflow-y-auto">
                {empResults.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-3 group"
                    onClick={() => {
                      setEmpQuery("");
                      setEmpResults([]);
                      const name = e.label.includes(" - ") ? e.label.split(" - ")[0] : e.label;
                      router.push(`/dashboard/horas/${e.id}?name=${encodeURIComponent(name)}`);
                    }}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {e.label.charAt(0)}
                    </div>
                    <span className="flex-1 truncate">{e.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
            {empSearching && (
              <p className="text-xs text-muted-foreground mt-1.5 px-1">Buscando...</p>
            )}
            {!empSearching && empQuery.length >= 2 && empResults.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1.5 px-1">Sin resultados</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Accesos rápidos</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          <QuickLink href="/dashboard/horas/horario" icon={<Clock className="h-4 w-4" />} label="Horario laboral" desc="Ver y crear horarios vigentes" />
          <QuickLink href="/dashboard/horas/feriados" icon={<Calendar className="h-4 w-4" />} label="Feriados" desc="Gestión de feriados por año" />
          <QuickLink href="/dashboard/horas/mapeo" icon={<MapPin className="h-4 w-4" />} label="Mapeo biométrico" desc="Vincular IDs biométricos a empleados" />
          <QuickLink href="/dashboard/horas/overtime" icon={<CheckCircle2 className="h-4 w-4" />} label="Horas extra pendientes" desc="Aprobar o rechazar horas extra" badge={stats?.pendingOvertimeCount} />
          <QuickLink href="/dashboard/horas/importar" icon={<Upload className="h-4 w-4" />} label="Importar XLS" desc="Cargar registros biométricos" />
          <QuickLink href="/dashboard/horas/reportes/detalle" icon={<FileText className="h-4 w-4" />} label="Reportes" desc="Detalle, mensual, tardanzas, ausencias" />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  loading,
  icon,
  iconBg,
  label,
  value,
  href,
  alert = false,
}: {
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <div
      className={`rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3 ${
        alert ? "border-red-200 dark:border-red-900/50" : ""
      } ${href ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <>
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className={`text-xl font-bold leading-none ${alert ? "text-red-600 dark:text-red-400" : ""}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
          </>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function QuickLink({
  href,
  icon,
  label,
  desc,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/50 transition-colors group"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium leading-none">{label}</p>
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 text-xs font-bold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
