"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import type { SubtaskWithIncident, IncidentStatus } from "../_lib/types";
import { apiListAllSubtasks } from "../_lib/api";
import { statusBadge, priorityBadge } from "../_lib/utils";

/* -- helpers -- */
const formatFolio = (num?: number) => {
  if (num == null) return "\u2014";
  return `#${String(num).padStart(3, "0")}`;
};

function pickName(u: any) {
  const emp = u?.employee;
  const full = `${emp?.nombres ?? ""} ${emp?.apellidos ?? ""}`.trim();
  return full || u?.username || "\u2014";
}

function fmtDateShort(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type StatusFilter = "all" | "pending" | "completed";

type GroupedIncident = {
  incidentId: string;
  number: number;
  title: string | null;
  status: IncidentStatus;
  areaName: string | null;
  priority: "BAJA" | "MEDIA" | "ALTA" | null;
  subtasks: SubtaskWithIncident[];
  total: number;
  completed: number;
};

type Props = {
  onOpenIncident: (id: string) => void;
};

export default function SubtasksReportView({ onOpenIncident }: Props) {
  const [allSubtasks, setAllSubtasks] = useState<SubtaskWithIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListAllSubtasks();
      setAllSubtasks(data);
    } catch (e) {
      console.error("Error cargando objetivos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -- Filtering -- */
  const filtered = useMemo(() => {
    let out = allSubtasks;

    if (statusFilter === "pending") {
      out = out.filter((s) => !s.isCompleted);
    } else if (statusFilter === "completed") {
      out = out.filter((s) => s.isCompleted);
    }

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      out = out.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          (s.incident?.title ?? "").toLowerCase().includes(needle) ||
          String(s.incident?.number ?? "").includes(needle)
      );
    }

    return out;
  }, [allSubtasks, statusFilter, search]);

  /* -- Group by incident -- */
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedIncident>();

    for (const st of filtered) {
      const inc = st.incident;
      if (!inc) continue;

      let group = map.get(inc.id);
      if (!group) {
        group = {
          incidentId: inc.id,
          number: inc.number,
          title: inc.title,
          status: inc.status,
          areaName: inc.area?.name ?? null,
          priority: inc.corrective?.priority ?? null,
          subtasks: [],
          total: 0,
          completed: 0,
        };
        map.set(inc.id, group);
      }

      group.subtasks.push(st);
      group.total += 1;
      if (st.isCompleted) group.completed += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.number - a.number);
  }, [filtered]);

  /* -- Stats -- */
  const totalSubtasks = filtered.length;
  const completedSubtasks = filtered.filter((s) => s.isCompleted).length;
  const pendingSubtasks = totalSubtasks - completedSubtasks;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar objetivo o incidencia..."
            className="w-full sm:w-[280px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            ↻
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{totalSubtasks} objetivo{totalSubtasks !== 1 ? "s" : ""}</span>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          {pendingSubtasks} pendiente{pendingSubtasks !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          {completedSubtasks} completado{completedSubtasks !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Separator />

      {/* Content */}
      {loading && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Cargando objetivos...
        </p>
      )}

      {!loading && grouped.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay objetivos para mostrar.
        </p>
      )}

      <div className="space-y-4">
        {grouped.map((group) => {
          const pct = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;
          const allDone = group.total > 0 && group.completed === group.total;

          return (
            <Card key={group.incidentId} className="border-muted/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="font-mono text-sm font-semibold text-primary hover:underline"
                        onClick={() => onOpenIncident(group.incidentId)}
                      >
                        {formatFolio(group.number)}
                      </button>
                      {statusBadge(group.status)}
                      {priorityBadge(group.priority)}
                    </div>
                    <CardTitle className="text-sm">
                      <button
                        className="text-left hover:underline"
                        onClick={() => onOpenIncident(group.incidentId)}
                      >
                        {group.title || "\u2014"}
                      </button>
                    </CardTitle>
                    {group.areaName && (
                      <p className="text-xs text-muted-foreground">
                        {group.areaName}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <Badge
                      variant="secondary"
                      className={
                        allDone
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    >
                      {group.completed}/{group.total}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      allDone ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 pt-0">
                {group.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-start gap-3 rounded-lg border p-2.5"
                  >
                    <Checkbox
                      checked={st.isCompleted}
                      disabled
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p
                        className={`text-sm ${
                          st.isCompleted ? "line-through opacity-50" : "font-medium"
                        }`}
                      >
                        {st.title}
                      </p>
                      {st.detail && (
                        <p
                          className={`text-xs text-muted-foreground ${
                            st.isCompleted ? "opacity-50" : ""
                          }`}
                        >
                          {st.detail}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {st.assignedTo && (
                          <Badge variant="outline" className="text-[11px]">
                            {pickName(st.assignedTo)}
                          </Badge>
                        )}
                        {st.isCompleted && st.completedAt && (
                          <span className="text-[11px] text-green-600 dark:text-green-400">
                            Completado {fmtDateShort(st.completedAt)}
                          </span>
                        )}
                        {!st.isCompleted && (
                          <span className="text-[11px] text-muted-foreground">
                            Creado {fmtDateShort(st.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
