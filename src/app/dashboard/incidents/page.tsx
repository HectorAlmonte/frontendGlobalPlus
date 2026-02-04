"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3 } from "lucide-react";

import IncidentsTable from "./_components/IncidentsTable";
import IncidentDetailSheet from "./_components/IncidentDetailSheet";
import CorrectiveModal from "./_components/CorrectiveModal";
import CloseIncidentModal from "./_components/CloseIncidentModal";
import CreateIncidentDialog from "./_components/CreateIncidentDialog";
import IncidentKpiDashboard from "./_components/IncidentKpiDashboard";

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

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL");

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

  // Period filter
  const [period, setPeriod] = useState<IncidentPeriod>("all");

  // Analytics toggle
  const [showAnalytics, setShowAnalytics] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
    try {
      const data = await apiListIncidents({ period });
      setItems(data);
    } catch (e) {
      console.error("Error al listar:", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

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
  // FILTROS
  // =========================
  const filtered = useMemo(() => {
    let out = items;

    if (status !== "ALL") out = out.filter((x) => x.status === status);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
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

    return out;
  }, [items, q, status]);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-sm text-muted-foreground">
            Historial, seguimiento, correctivos y levantamientos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics((v) => !v)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showAnalytics ? "Ocultar analytics" : "Analytics"}
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
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    period === opt.value
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
            period={period}
            fetchMetrics={fetchMetrics}
          />
        </div>
      )}

      {/* ===== TABLA ===== */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold">Listado de incidencias</h2>
            <p className="text-xs text-muted-foreground">
              {period === "all"
                ? "Mostrando todas las incidencias."
                : `Mostrando incidencias de los ultimos ${
                    period === "7d"
                      ? "7 dias"
                      : period === "15d"
                      ? "15 dias"
                      : period === "1m"
                      ? "30 dias"
                      : "12 meses"
                  }.`}
            </p>
          </div>
        </div>

        <Separator />

        <div className="p-4">
          <IncidentsTable
            loading={loading}
            items={filtered}
            onOpen={(id) => {
              setSelectedId(id);
              setOpenSheet(true);
            }}
            onRefresh={fetchList}
          />
        </div>
      </div>

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
        loading={closing}
        onSubmit={handleCloseSubmit}
        profile={profile}
      />
    </div>
  );
}
