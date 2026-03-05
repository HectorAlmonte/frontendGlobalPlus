"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ListChecks, ShieldAlert, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

import IncidentsTable from "./_components/IncidentsTable";
import IncidentKpiDashboard from "./_components/IncidentKpiDashboard";
import SubtasksReportView from "./_components/SubtasksReportView";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";

import type {
  IncidentListItem,
  IncidentStatus,
  IncidentPeriod,
} from "./_lib/types";

import { apiListIncidents, API_BASE } from "./_lib/api";

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    shift?: { startTime: string; endTime: string } | null;
  } | null;
};

function getCurrentLocalTime() {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function canCreateIncident(
  roleKey?: RoleKey,
  profile?: MeProfile | null
): boolean {
  if (!roleKey) return false;
  if (roleKey === "ADMIN" || roleKey === "SUPERVISOR" || roleKey === "SEGURIDAD") return true;
  if (roleKey === "TRABAJADOR") {
    const shift = profile?.employee?.shift;
    if (!shift?.startTime || !shift?.endTime) return false;
    const { hour, minute } = getCurrentLocalTime();
    const current = hour * 60 + minute;
    return current >= timeToMinutes(shift.startTime) && current <= timeToMinutes(shift.endTime);
  }
  return false;
}

const PERIOD_OPTIONS: { value: IncidentPeriod; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "15d", label: "15D" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1A" },
  { value: "all", label: "Todo" },
];

export default function IncidentsPage() {
  const router = useRouter();

  const [items, setItems] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [profile, setProfile] = useState<MeProfile | null>(null);
  const roleKey: RoleKey | undefined = profile?.user?.role?.key;

  useModuleShortcuts({ onNew: () => router.push("/dashboard/incidents/new") });

  const [analyticsPeriod, setAnalyticsPeriod] = useState<IncidentPeriod>("all");
  const [showAnalytics, setShowAnalytics] = useState(false);

  type TableFilters = {
    q: string;
    status: IncidentStatus | "ALL";
    dateFrom?: Date;
    dateTo?: Date;
  };

  const [filterQ, setFilterQ] = usePersistedState("incidents:q", "");
  const [filterStatus, setFilterStatus] = usePersistedState<IncidentStatus | "ALL">("incidents:status", "ALL");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();

  const tableFilters: TableFilters = useMemo(
    () => ({ q: filterQ, status: filterStatus, dateFrom: filterDateFrom, dateTo: filterDateTo }),
    [filterQ, filterStatus, filterDateFrom, filterDateTo]
  );

  const setTableFilters = useCallback(
    (f: TableFilters) => {
      setFilterQ(f.q);
      setFilterStatus(f.status);
      setFilterDateFrom(f.dateFrom);
      setFilterDateTo(f.dateTo);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Leer filtro de status desde URL al montar
  const didReadUrlFilter = useRef(false);
  useEffect(() => {
    if (didReadUrlFilter.current) return;
    didReadUrlFilter.current = true;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s === "OPEN" || s === "IN_PROGRESS" || s === "CLOSED") {
      setFilterStatus(s as IncidentStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile`, { credentials: "include" });
      if (!res.ok) return;
      setProfile(await res.json());
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => { fetchMyProfile(); }, [fetchMyProfile]);

  const fetchMetrics = useCallback(
    async ({ range }: { range: string }) => {
      const res = await fetch(`${API_BASE}/api/incidents/metrics?range=${range}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`No se pudieron cargar las métricas (${res.status})`);
      return res.json();
    },
    []
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiListIncidents({
        dateFrom: filterDateFrom ? filterDateFrom.toISOString() : undefined,
        dateTo: filterDateTo ? filterDateTo.toISOString() : undefined,
      });
      setItems(data);
    } catch (e: any) {
      setError(true);
      toast.error(e?.message || "Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  }, [filterDateFrom, filterDateTo]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const filtered = useMemo(() => {
    let out = items;

    if (tableFilters.status !== "ALL")
      out = out.filter((x) => x.status === tableFilters.status);

    if (tableFilters.q.trim()) {
      const needle = tableFilters.q.trim().toLowerCase();
      out = out.filter(
        (x) =>
          (x.title ?? "").toLowerCase().includes(needle) ||
          x.type.toLowerCase().includes(needle) ||
          x.detail.toLowerCase().includes(needle) ||
          (x.area?.name ?? "").toLowerCase().includes(needle) ||
          (x.reportedBy?.username ?? "").toLowerCase().includes(needle) ||
          String((x as any).number ?? "").toLowerCase().includes(needle)
      );
    }

    if (tableFilters.dateFrom) {
      const from = tableFilters.dateFrom.getTime();
      out = out.filter((x) => new Date(x.reportedAt).getTime() >= from);
    }
    if (tableFilters.dateTo) {
      const to = tableFilters.dateTo.getTime() + 86400000;
      out = out.filter((x) => new Date(x.reportedAt).getTime() < to);
    }

    return out;
  }, [items, tableFilters]);

  const allowed = canCreateIncident(roleKey, profile);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Incidencias</h1>
            <p className="text-sm text-muted-foreground">
              Historial, seguimiento, correctivos y levantamientos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics((v) => !v)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showAnalytics ? "Ocultar analytics" : "Analytics"}
            </span>
          </Button>

          {allowed ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => router.push("/dashboard/incidents/new")}
            >
              <Plus className="h-4 w-4" />
              Nueva incidencia
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="gap-2"
              title="Sin permiso para registrar incidencias ahora"
            >
              <AlertTriangle className="h-4 w-4" />
              Nueva incidencia
            </Button>
          )}
        </div>
      </div>

      {/* ===== ANALYTICS (toggleable) ===== */}
      {showAnalytics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Indicadores
            </h2>
            <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnalyticsPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    analyticsPeriod === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <IncidentKpiDashboard period={analyticsPeriod} fetchMetrics={fetchMetrics} />
        </div>
      )}

      {/* ===== TABS: LISTADO / OBJETIVOS ===== */}
      <Tabs defaultValue="listado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listado">Listado</TabsTrigger>
          <TabsTrigger value="objetivos" className="gap-1.5">
            <ListChecks className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado">
          <IncidentsTable
            loading={loading}
            error={error}
            items={filtered}
            filters={tableFilters}
            onFiltersChange={setTableFilters}
            onOpen={(id) => router.push(`/dashboard/incidents/${id}`)}
            onRefresh={fetchList}
          />
        </TabsContent>

        <TabsContent value="objetivos">
          <SubtasksReportView
            onOpenIncident={(id) => router.push(`/dashboard/incidents/${id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
