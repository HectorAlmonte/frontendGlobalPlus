"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import IncidentsHeader from "./_components/IncidentsHeader";
import IncidentsFiltersBar from "./_components/IncidentsFiltersBar";
import IncidentsTable from "./_components/IncidentsTable";
import IncidentDetailSheet from "./_components/IncidentDetailSheet";
import CorrectiveModal from "./_components/CorrectiveModal";
import CloseIncidentModal from "./_components/CloseIncidentModal";
import IncidentsDashboardPanel from "./_components/IncidentsDashboardSheet";
import CreateIncidentDialog from "./_components/CreateIncidentDialog";

import {
  CreateIncidentInput,
  IncidentDetail,
  IncidentListItem,
  IncidentStatus,
} from "./_lib/types";

import {
  apiCreateIncident,
  apiGetIncidentDetail,
  apiListIncidents,
  apiCloseIncidentForm,
} from "./_lib/api";

/** ===== Tipos mínimos para perfil ===== */
type RoleKey = "ADMIN" | "SUPERVISOR" | "OPERADOR" | "SEGURIDAD" | string;

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

export default function IncidentsPage() {
  const [items, setItems] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<"registro" | "dashboard">("registro");

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

  // ✅ BASE URL del backend (usa el mismo criterio que ya estabas usando)
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
      if (!res.ok) return; // si falla, simplemente no setea
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
  // FILTROS
  // =========================
  const filtered = useMemo(() => {
    let out = items;

    if (status !== "ALL") out = out.filter((x) => x.status === status);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((x) =>
        (x.title ?? "").toLowerCase().includes(needle) ||
        x.type.toLowerCase().includes(needle) ||
        x.detail.toLowerCase().includes(needle) ||
        (x.area?.name ?? "").toLowerCase().includes(needle) ||
        (x.reportedBy?.username ?? "").toLowerCase().includes(needle) ||
        String((x as any).number ?? "").toLowerCase().includes(needle) // number puede ser number
      );
    }

    return out;
  }, [items, q, status]);

  // =========================
  // DATA LOADERS
  // =========================
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListIncidents();
      setItems(data);
    } catch (e) {
      console.error("Error al listar:", e);
    } finally {
      setLoading(false);
    }
  }, []);

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
        await apiCloseIncidentForm(closeIncidentId, { detail: closeDetail, files });
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
    <div className="mx-auto w-full max-w-7xl px-6 py-6 space-y-6">
      <Card className="border-muted/60 shadow-sm">
        <IncidentsHeader />

        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registro" className="font-bold">
                Registro de Incidentes
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="font-bold">
                Dashboard & Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registro" className="mt-4 space-y-4 focus-visible:outline-none">
              <IncidentsFiltersBar
                q={q}
                setQ={setQ}
                status={status}
                setStatus={setStatus}
                loading={loading}
                countLabel={`${filtered.length} incidencias`}
                onRefresh={fetchList}
                rightSlot={
                  <CreateIncidentDialog
                    open={openCreate}
                    onOpenChange={setOpenCreate}
                    creating={creating}
                    onCreate={handleCreate}
                    roleKey={roleKey} // ✅ ya no usa "user"
                  />
                }
              />

              <IncidentsTable
                loading={loading}
                items={filtered}
                onOpen={(id) => {
                  setSelectedId(id);
                  setOpenSheet(true);
                }}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-4 focus-visible:outline-none">
              <IncidentsDashboardPanel
                open={tab === "dashboard"}
                fetchMetrics={async ({ range }) => {
                  const res = await fetch(`${API_BASE}/api/incidents/metrics?range=${range}`, {
                    credentials: "include",
                  });
                  if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`No se pudieron cargar las métricas (${res.status}): ${txt}`);
                  }
                  return res.json();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
      />

      <CloseIncidentModal
        open={closeOpen}
        onOpenChange={setCloseOpen}
        incidentId={closeIncidentId}
        loading={closing}
        onSubmit={handleCloseSubmit}
      />
    </div>
  );
}
