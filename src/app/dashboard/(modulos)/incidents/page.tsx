"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ListChecks, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import IncidentsTable from "./_components/IncidentsTable";
import IncidentDetailSheet from "./_components/IncidentDetailSheet";
import CorrectiveModal from "./_components/CorrectiveModal";
import CloseIncidentModal from "./_components/CloseIncidentModal";
import CreateIncidentDialog from "./_components/CreateIncidentDialog";
import IncidentKpiDashboard from "./_components/IncidentKpiDashboard";
import EditIncidentDialog from "./_components/EditIncidentDialog";
import EditCorrectiveDialog from "./_components/EditCorrectiveDialog";
import EditClosureDialog from "./_components/EditClosureDialog";
import SubtasksReportView from "./_components/SubtasksReportView";

import type {
  CreateIncidentInput,
  IncidentDetail,
  IncidentListItem,
  IncidentStatus,
  IncidentPeriod,
} from "./_lib/types";

import {
  apiCreateIncident,
  apiGetIncidentDetail,
  apiListIncidents,
  apiCloseIncidentForm,
  apiDeleteIncident,
  API_BASE,
} from "./_lib/api";

/** ===== Tipos minimos para perfil ===== */
type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    role?: { key: RoleKey; name?: string | null } | null;
    email?: string | null;
  };
  employee?: any;
  incidents?: any[];
};

const PERIOD_OPTIONS: { value: IncidentPeriod; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "15d", label: "15D" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1A" },
  { value: "all", label: "Todo" },
];

export default function IncidentsPage() {
  const [items, setItems] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [openSheet, setOpenSheet] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [correctiveOpen, setCorrectiveOpen] = useState(false);
  const [correctiveIncidentId, setCorrectiveIncidentId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeIncidentId, setCloseIncidentId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  // Edit dialogs
  const [editIncidentOpen, setEditIncidentOpen] = useState(false);
  const [editCorrectiveOpen, setEditCorrectiveOpen] = useState(false);
  const [editClosureOpen, setEditClosureOpen] = useState(false);

  // Analytics period (independent from table)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<IncidentPeriod>("all");

  // Table filters
  const [tableFilters, setTableFilters] = useState<{
    q: string;
    status: IncidentStatus | "ALL";
    dateFrom?: Date;
    dateTo?: Date;
  }>({ q: "", status: "ALL" });

  // Leer filtro de status desde URL (?status=OPEN|IN_PROGRESS|CLOSED) al montar
  const didReadUrlFilter = useRef(false);
  useEffect(() => {
    if (didReadUrlFilter.current) return;
    didReadUrlFilter.current = true;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s === "OPEN" || s === "IN_PROGRESS" || s === "CLOSED") {
      setTableFilters((prev) => ({ ...prev, status: s }));
    }
  }, []);

  // Analytics toggle
  const [showAnalytics, setShowAnalytics] = useState(false);

  // =========================
  // PERFIL (para saber roleKey)
  // =========================
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const roleKey: RoleKey | undefined = profile?.user?.role?.key;

  const fetchMyProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as MeProfile;
      setProfile(data);
    } catch {
      // silencioso
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  // =========================
  // METRICS FETCHER (for KPI dashboard)
  // =========================
  const fetchMetrics = useCallback(
    async ({ range }: { range: string }) => {
      const res = await fetch(
        `${API_BASE}/api/incidents/metrics?range=${range}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `No se pudieron cargar las metricas (${res.status}): ${txt}`
        );
      }
      return res.json();
    },
    [API_BASE]
  );

  // =========================
  // DATA LOADERS
  // =========================
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiListIncidents({
        dateFrom: tableFilters.dateFrom
          ? tableFilters.dateFrom.toISOString()
          : undefined,
        dateTo: tableFilters.dateTo
          ? tableFilters.dateTo.toISOString()
          : undefined,
      });
      setItems(data);
    } catch (e: any) {
      setError(true);
      toast.error(e?.message || "Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  }, [tableFilters.dateFrom, tableFilters.dateTo]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await apiGetIncidentDetail(id);
      setDetail(data);
    } catch (e) {
      console.error("Error al ver detalle:", e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const reloadDetail = useCallback(async () => {
    if (!selectedId) return;
    await fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // =========================
  // FILTROS (client-side)
  // =========================
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

    // Client-side date fallback
    if (tableFilters.dateFrom) {
      const from = tableFilters.dateFrom.getTime();
      out = out.filter((x) => new Date(x.reportedAt).getTime() >= from);
    }
    if (tableFilters.dateTo) {
      const to = tableFilters.dateTo.getTime() + 86400000; // end of day
      out = out.filter((x) => new Date(x.reportedAt).getTime() < to);
    }

    return out;
  }, [items, tableFilters]);

  // =========================
  // HANDLERS
  // =========================
  async function handleCreate(input: CreateIncidentInput) {
    setCreating(true);
    try {
      await apiCreateIncident(input);
      setOpenCreate(false);
      await fetchList();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  const handleCloseSubmit = useCallback(
    async ({ detail: closeDetail, files }: { detail: string; files: File[] }) => {
      if (!closeIncidentId) return;
      setClosing(true);
      try {
        await apiCloseIncidentForm(closeIncidentId, {
          detail: closeDetail,
          files,
        });
        setCloseOpen(false);
        await fetchList();
        if (selectedId === closeIncidentId) await fetchDetail(closeIncidentId);
      } catch (e) {
        console.error(e);
      } finally {
        setClosing(false);
      }
    },
    [closeIncidentId, selectedId, fetchDetail, fetchList]
  );

  const handleEditIncident = useCallback(() => {
    if (detail) setEditIncidentOpen(true);
  }, [detail]);

  const handleEditCorrective = useCallback(() => {
    if (detail) setEditCorrectiveOpen(true);
  }, [detail]);

  const handleEditClosure = useCallback(() => {
    if (detail) setEditClosureOpen(true);
  }, [detail]);

  const handleDeleteIncident = useCallback(
    async (id: string) => {
      try {
        await apiDeleteIncident(id);
        setOpenSheet(false);
        setSelectedId(null);
        setDetail(null);
        await fetchList();
      } catch (e) {
        console.error("Error al eliminar incidencia:", e);
      }
    },
    [fetchList]
  );

  const handleEditSaved = useCallback(async () => {
    await reloadDetail();
    await fetchList();
  }, [reloadDetail, fetchList]);

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
            <span className="hidden sm:inline">{showAnalytics ? "Ocultar analytics" : "Analytics"}</span>
          </Button>

          <CreateIncidentDialog
            open={openCreate}
            onOpenChange={setOpenCreate}
            creating={creating}
            onCreate={handleCreate}
            roleKey={roleKey}
            profile={profile}
          />
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

          <IncidentKpiDashboard
            period={analyticsPeriod}
            fetchMetrics={fetchMetrics}
          />
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
            onOpen={(id) => {
              setSelectedId(id);
              setOpenSheet(true);
            }}
            onRefresh={fetchList}
          />
        </TabsContent>

        <TabsContent value="objetivos">
          <SubtasksReportView
            onOpenIncident={(id) => {
              setSelectedId(id);
              setOpenSheet(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ===== PANEL DETALLE ===== */}
      <IncidentDetailSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        selectedId={selectedId}
        detailLoading={detailLoading}
        detail={detail}
        onReload={reloadDetail}
        onOpenCorrective={(id) => {
          setCorrectiveIncidentId(id);
          setCorrectiveOpen(true);
        }}
        onCloseIncident={(id) => {
          setCloseIncidentId(id);
          setCloseOpen(true);
        }}
        closing={closing}
        onEditIncident={handleEditIncident}
        onEditCorrective={handleEditCorrective}
        onEditClosure={handleEditClosure}
        onDeleteIncident={handleDeleteIncident}
      />

      <CorrectiveModal
        open={correctiveOpen}
        onOpenChange={setCorrectiveOpen}
        incidentId={correctiveIncidentId}
        onSaved={async () => {
          await reloadDetail();
          await fetchList();
        }}
        profile={profile}
        roleKey={roleKey}
      />

      <CloseIncidentModal
        open={closeOpen}
        onOpenChange={setCloseOpen}
        incidentId={closeIncidentId}
        incidentFolio={
          detail?.number != null
            ? `#${String(detail.number).padStart(3, "0")}`
            : null
        }
        loading={closing}
        onSubmit={handleCloseSubmit}
        profile={profile}
        roleKey={roleKey}
      />

      <EditIncidentDialog
        open={editIncidentOpen}
        onOpenChange={setEditIncidentOpen}
        detail={detail}
        onSaved={handleEditSaved}
      />

      <EditCorrectiveDialog
        open={editCorrectiveOpen}
        onOpenChange={setEditCorrectiveOpen}
        incidentId={detail?.id ?? null}
        corrective={
          detail
            ? {
                priority: (detail as any).corrective?.priority ?? "MEDIA",
                dueDate:
                  (detail as any).correctiveDueAt ??
                  (detail as any).corrective?.dueDate ??
                  null,
                detail:
                  (detail as any).correctiveAction ??
                  (detail as any).corrective?.detail ??
                  "",
              }
            : null
        }
        onSaved={handleEditSaved}
      />

      <EditClosureDialog
        open={editClosureOpen}
        onOpenChange={setEditClosureOpen}
        incidentId={detail?.id ?? null}
        closureDetail={
          (detail as any)?.closureDetail ??
          (detail as any)?.closure?.detail ??
          ""
        }
        onSaved={handleEditSaved}
      />
    </div>
  );
}
