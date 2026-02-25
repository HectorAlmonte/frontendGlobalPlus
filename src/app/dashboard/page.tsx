"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useWord } from "@/context/AppContext"
import { hasRole } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  AlertTriangle, ArrowRight, BarChart3, ChevronRight,
  ClipboardList, LayoutDashboard, Plus,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || ""

/* ── Types ── */
type IncidentStats = {
  total: number
  byStatus: { OPEN: number; IN_PROGRESS: number; CLOSED: number }
  byType?: Record<string, number>
  byPriority: { BAJA: number; MEDIA: number; ALTA: number }
  overdue: number
  resolutionRate: number
  avgCloseDays: number
}

type RecentIncident = {
  id: string
  number?: number
  title?: string | null
  type: string
  status: string
  createdAt: string
  area?: { name: string } | null
}

/* ── API ── */
async function fetchStats(): Promise<IncidentStats | null> {
  try {
    const r = await fetch(`${API}/api/incidents/stats`, { credentials: "include", cache: "no-store" })
    return r.ok ? r.json() : null
  } catch { return null }
}

async function fetchRecent(): Promise<RecentIncident[]> {
  try {
    const r = await fetch(`${API}/api/incidents`, { credentials: "include", cache: "no-store" })
    if (!r.ok) return []
    const d = await r.json()
    return (Array.isArray(d) ? d : []).slice(0, 6)
  } catch { return [] }
}

/* ── Helpers ── */
const TYPE_LABELS: Record<string, string> = {
  HALLAZGO_ANORMAL:       "Hallazgo anormal",
  INCIDENTE:              "Incidente",
  CONDICION_SUB_ESTANDAR: "Cond. subestándar",
  ACTO_SUB_ESTANDAR:      "Acto subestándar",
}

const STATUS_CFG = {
  OPEN:        { label: "Abierta",     cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" },
  IN_PROGRESS: { label: "En progreso", cls: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
  CLOSED:      { label: "Cerrada",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" },
} as const

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 18) return "Buenas tardes"
  return "Buenas noches"
}

function currentDate() {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function firstName(user: any) {
  const emp = (user as any)?.employee
  if (emp?.nombres) return emp.nombres.split(" ")[0]
  return (user as any)?.username || ""
}

/* ── Page ── */
export default function DashboardPage() {
  const { setWord, user } = useWord()
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [recent, setRecent] = useState<RecentIncident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setWord("Dashboard") }, [setWord])

  useEffect(() => {
    Promise.all([fetchStats(), fetchRecent()])
      .then(([s, r]) => { setStats(s); setRecent(r) })
      .finally(() => setLoading(false))
  }, [])

  const isSupervisor = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR") || hasRole(user, "SEGURIDAD")
  const openCount = stats?.byStatus?.OPEN ?? 0
  // El backend puede devolver resolutionRate como decimal (0.38) o entero (38)
  const resolutionPct = stats
    ? Math.min(100, Math.round(stats.resolutionRate > 1 ? stats.resolutionRate : stats.resolutionRate * 100))
    : 0

  const typeChartData = useMemo(() => {
    if (!stats?.byType) return []
    return Object.entries(stats.byType)
      .map(([k, v]) => ({ name: TYPE_LABELS[k] ?? k, value: v ?? 0 }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [stats])

  const BAR_COLORS = ["#f59e0b", "#ef4444", "#f97316", "#ec4899"]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {greeting()}{firstName(user) ? `, ${firstName(user)}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{currentDate()}</p>
          </div>
        </div>
        {isSupervisor && (
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link href="/dashboard/incidents">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva incidencia</span>
            </Link>
          </Button>
        )}
      </div>

      {/* ── Alerta ── */}
      {!loading && openCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-800/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {openCount === 1 ? "1 incidencia abierta sin atender" : `${openCount} incidencias abiertas sin atender`}
            </span>
          </div>
          <Button asChild variant="ghost" size="sm"
            className="h-7 gap-1 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 shrink-0">
            <Link href="/dashboard/incidents">
              Revisar <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",       value: stats?.total ?? 0,                   color: "text-foreground",  accent: "hover:border-border",                                    href: "/dashboard/incidents" },
          { label: "Abiertas",    value: openCount,                            color: "text-amber-500",   accent: "hover:border-amber-300 dark:hover:border-amber-700",     href: "/dashboard/incidents?status=OPEN" },
          { label: "En progreso", value: stats?.byStatus?.IN_PROGRESS ?? 0,   color: "text-blue-500",    accent: "hover:border-blue-300 dark:hover:border-blue-700",       href: "/dashboard/incidents?status=IN_PROGRESS" },
          { label: "Cerradas",    value: stats?.byStatus?.CLOSED ?? 0,        color: "text-emerald-500", accent: "hover:border-emerald-300 dark:hover:border-emerald-700", href: "/dashboard/incidents?status=CLOSED" },
        ].map(({ label, value, color, accent, href }) => (
          <Link
            key={label}
            href={href}
            className={`group flex flex-col gap-1 rounded-xl border bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md ${accent}`}
          >
            {loading ? (
              <><Skeleton className="h-9 w-14 mb-1" /><Skeleton className="h-3 w-20" /></>
            ) : (
              <>
                <p className={`text-4xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {label}
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0" />
                </p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* ── Análisis ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Análisis</p>
        </div>
        <div className="p-5 grid gap-8 lg:grid-cols-2 lg:items-start">

          {/* Bar chart por tipo */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Por tipo</p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : typeChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
            ) : (
              <ResponsiveContainer width="100%" height={typeChartData.length * 48}>
                <BarChart
                  data={typeChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
                  barSize={22}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 13, fill: "hsl(var(--foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={({ active, payload }) =>
                      active && payload?.length
                        ? <div className="rounded-md border bg-background px-3 py-1.5 text-xs shadow-md">
                            {payload[0].payload.name}: <b>{payload[0].value}</b>
                          </div>
                        : null
                    }
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {typeChartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Métricas verticales */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rendimiento</p>
            {loading ? (
              <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Resolución */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tasa de resolución</span>
                    <span className="font-semibold tabular-nums">{resolutionPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${resolutionPct}%`,
                        backgroundColor: resolutionPct >= 70 ? "#10b981" : resolutionPct >= 40 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>

                {/* Tiempo promedio */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo prom. de cierre</span>
                  <span className="font-semibold tabular-nums">
                    {stats?.avgCloseDays != null ? `${stats.avgCloseDays.toFixed(1)} días` : "—"}
                  </span>
                </div>

                <div className="h-px bg-border/70" />

                {/* Prioridades */}
                {[
                  { label: "Prioridad alta",  value: stats?.byPriority?.ALTA  ?? 0, dot: "#ef4444" },
                  { label: "Prioridad media", value: stats?.byPriority?.MEDIA ?? 0, dot: "#f59e0b" },
                  { label: "Prioridad baja",  value: stats?.byPriority?.BAJA  ?? 0, dot: "#3b82f6" },
                ].map(({ label, value, dot }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                      {label}
                    </div>
                    <span className="font-semibold tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recientes ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold">Incidencias recientes</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-0.5 text-muted-foreground hover:text-foreground px-2">
            <Link href="/dashboard/incidents">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="px-5 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">Sin incidencias registradas.</p>
        ) : (
          <div className="divide-y px-5">
            {recent.map((inc) => {
              const sc = STATUS_CFG[inc.status as keyof typeof STATUS_CFG]
              const folio = inc.number != null ? `#${String(inc.number).padStart(3, "0")}` : "—"
              return (
                <Link
                  key={inc.id}
                  href="/dashboard/incidents"
                  className="flex items-center gap-4 py-3 group hover:opacity-70 transition-opacity"
                >
                  <span className="font-mono text-xs font-semibold text-primary w-10 shrink-0">{folio}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inc.title || TYPE_LABELS[inc.type] || inc.type}
                    </p>
                    {inc.area?.name && (
                      <p className="text-xs text-muted-foreground truncate">{inc.area.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{fmtDate(inc.createdAt)}</span>
                    {sc && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.cls}`}>
                        {sc.label}
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
