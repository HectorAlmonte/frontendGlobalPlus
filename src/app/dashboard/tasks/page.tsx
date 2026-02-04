"use client";

import { useState, useEffect, useCallback } from "react";

import TasksTable from "./_components/TasksTable";
import TaskFormModal from "./_components/TaskFormModal";
import TaskDetailSheet from "./_components/TaskDetailSheet";
import TaskKpiDashboard from "./_components/TaskKpiDashboard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart3 } from "lucide-react";

import type { TaskRow, TaskStats, TaskPeriod } from "./_lib/types";
import { apiGetTaskStats } from "./_lib/api";

const PERIOD_OPTIONS: { value: TaskPeriod; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "15d", label: "15D" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1A" },
  { value: "all", label: "Todo" },
];

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<TaskRow | null>(null);

  // Detail sheet
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Period filter
  const [period, setPeriod] = useState<TaskPeriod>("all");

  // Analytics toggle
  const [showAnalytics, setShowAnalytics] = useState(false);

  // KPI stats
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const loadStats = useCallback(async (p: TaskPeriod) => {
    try {
      setKpiLoading(true);
      const data = await apiGetTaskStats(p);
      setStats(data);
    } catch (e) {
      console.error("Error loading task stats:", e);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(period);
  }, [loadStats, period, refreshKey]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (t: TaskRow) => {
    setEditing(t);
    setShowForm(true);
  };

  const openView = (t: TaskRow) => {
    setViewTaskId(t.id);
    setShowDetail(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setViewTaskId(null);
  };

  const handleSuccess = () => {
    closeForm();
    setRefreshKey((k) => k + 1);
  };

  const handleDetailChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleEditFromSheet = (t: TaskRow) => {
    closeDetail();
    openEdit(t);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de tareas, subtareas y asignaciones.
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

          <Button onClick={openCreate} className="gap-2 sm:min-w-[160px]">
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Button>
        </div>
      </div>

      {/* ===== PERIOD SELECTOR + KPIs ===== */}
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

          {kpiLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <TaskKpiDashboard stats={stats} />
          ) : null}
        </div>
      )}

      {/* ===== TABLA ===== */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold">Listado de tareas</h2>
            <p className="text-xs text-muted-foreground">
              {period === "all"
                ? "Mostrando todas las tareas."
                : `Mostrando tareas de los ultimos ${
                    period === "7d" ? "7 dias" : period === "15d" ? "15 dias" : period === "1m" ? "30 dias" : "12 meses"
                  }.`}
            </p>
          </div>
        </div>

        <Separator />

        <div className="p-4">
          <TasksTable
            refreshKey={refreshKey}
            period={period}
            onCreateClick={openCreate}
            onViewClick={openView}
            onEditClick={openEdit}
          />
        </div>
      </div>

      {/* ===== MODAL FORMULARIO ===== */}
      {showForm && (
        <TaskFormModal
          key={editing?.id ?? "__create__"}
          open={showForm}
          editing={editing}
          onSuccess={handleSuccess}
          onClose={closeForm}
        />
      )}

      {/* ===== PANEL DETALLE ===== */}
      {showDetail && (
        <TaskDetailSheet
          open={showDetail}
          taskId={viewTaskId}
          onClose={closeDetail}
          onChanged={handleDetailChanged}
          onEditClick={handleEditFromSheet}
        />
      )}
    </div>
  );
}
