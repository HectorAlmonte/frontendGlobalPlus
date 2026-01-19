"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

import IncidentsHeader from "./_components/IncidentsHeader";
import IncidentsFiltersBar from "./_components/IncidentsFiltersBar";
import IncidentsTable from "./_components/IncidentsTable";
import IncidentDetailSheet from "./_components/IncidentDetailSheet";

import {
  CreateIncidentInput,
  IncidentDetail,
  IncidentListItem,
  IncidentStatus,
} from "./_lib/types";

import { apiCreateIncident, apiGetIncidentDetail, apiListIncidents } from "./_lib/api";

export default function IncidentsPage() {
  const [items, setItems] = useState<IncidentListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL");

  // drawer
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let out = items;
    if (status !== "ALL") out = out.filter((x) => x.status === status);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((x) => {
        return (
          (x.title ?? "").toLowerCase().includes(needle) ||
          x.type.toLowerCase().includes(needle) ||
          x.detail.toLowerCase().includes(needle) ||
          (x.area?.name ?? "").toLowerCase().includes(needle) ||
          (x.reportedBy?.username ?? "").toLowerCase().includes(needle)
        );
      });
    }
    return out;
  }, [items, q, status]);

  async function fetchList() {
    setLoading(true);
    try {
      const data = await apiListIncidents();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await apiGetIncidentDetail(id);
      setDetail(data);
    } catch (e) {
      console.error(e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchDetail(selectedId);
  }, [selectedId]);

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

  function openIncident(id: string) {
    setSelectedId(id);
    setOpenSheet(true);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 space-y-6">
      <Card className="border-muted/60">
        <IncidentsHeader
          openCreate={openCreate}
          setOpenCreate={setOpenCreate}
          creating={creating}
          onCreate={handleCreate}
        />

        <CardContent className="space-y-4">
          <IncidentsFiltersBar
            q={q}
            setQ={setQ}
            status={status}
            setStatus={setStatus}
            loading={loading}
            countLabel={`${filtered.length} incidencias`}
            onRefresh={fetchList}
          />

          <IncidentsTable loading={loading} items={filtered} onOpen={openIncident} />
        </CardContent>
      </Card>

      <IncidentDetailSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        selectedId={selectedId}
        detailLoading={detailLoading}
        detail={detail}
        onReload={() => selectedId && fetchDetail(selectedId)}
      />
    </div>
  );
}
