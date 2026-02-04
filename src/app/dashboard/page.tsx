"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useWord } from "@/context/AppContext"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  User as UserIcon,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || ""

type DashboardStats = {
  incidents: { total: number; open: number; inProgress: number; closed: number }
  tasks: { total: number; pending: number; inProgress: number; completed: number; overdue: number }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [incRes, taskRes] = await Promise.allSettled([
    fetch(`${API}/api/incidents/stats`, { credentials: "include", cache: "no-store" })
      .then((r) => r.ok ? r.json() : null),
    fetch(`${API}/api/tasks/stats`, { credentials: "include", cache: "no-store" })
      .then((r) => r.ok ? r.json() : null),
  ])

  const inc = incRes.status === "fulfilled" && incRes.value ? incRes.value : null
  const tsk = taskRes.status === "fulfilled" && taskRes.value ? taskRes.value : null

  return {
    incidents: {
      total: inc?.total ?? 0,
      open: inc?.byStatus?.OPEN ?? 0,
      inProgress: inc?.byStatus?.IN_PROGRESS ?? 0,
      closed: inc?.byStatus?.CLOSED ?? 0,
    },
    tasks: {
      total: tsk?.total ?? 0,
      pending: tsk?.byStatus?.PENDING ?? 0,
      inProgress: tsk?.byStatus?.IN_PROGRESS ?? 0,
      completed: tsk?.byStatus?.COMPLETED ?? 0,
      overdue: tsk?.overdue ?? 0,
    },
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string
  value: number
  icon: any
  color: string
  subtitle?: string
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", icon: "text-primary" },
    amber: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", icon: "text-amber-600 dark:text-amber-400" },
    blue: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400", icon: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-600 dark:text-emerald-400" },
    red: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-600 dark:text-red-400", icon: "text-red-600 dark:text-red-400" },
  }

  const c = colorClasses[color] || colorClasses.primary

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`rounded-lg ${c.bg} p-2.5`}>
            <Icon className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: any
  label: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="group border shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Page() {
  const { setWord, user } = useWord()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setWord("Dashboard")
  }, [setWord])

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos dias"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }, [])

  const displayName = useMemo(() => {
    if (!user) return ""
    const u = user as any
    const emp = u.employee
    if (emp?.nombres) return emp.nombres.split(" ")[0]
    return u.username || u.name || ""
  }, [user])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 pt-2">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del sistema. Aqui puedes ver el estado actual de tus modulos.
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Incidencias */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Incidencias</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Total" value={stats.incidents.total} icon={TrendingUp} color="primary" />
              <StatCard label="Abiertas" value={stats.incidents.open} icon={AlertTriangle} color="amber" />
              <StatCard label="En progreso" value={stats.incidents.inProgress} icon={Clock} color="blue" />
              <StatCard label="Cerradas" value={stats.incidents.closed} icon={CheckCircle2} color="emerald" />
            </div>
          </div>

          {/* Tareas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tareas</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total" value={stats.tasks.total} icon={TrendingUp} color="primary" />
              <StatCard label="Pendientes" value={stats.tasks.pending} icon={Clock} color="amber" />
              <StatCard label="En progreso" value={stats.tasks.inProgress} icon={Activity} color="blue" />
              <StatCard label="Completadas" value={stats.tasks.completed} icon={CheckCircle2} color="emerald" />
              <StatCard label="Vencidas" value={stats.tasks.overdue} icon={AlertTriangle} color="red" subtitle="Sin completar" />
            </div>
          </div>
        </>
      ) : null}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acceso rapido</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/dashboard/tasks"
            icon={ListTodo}
            label="Tareas"
            description="Gestionar tareas y subtareas"
          />
          <QuickLink
            href="/dashboard/incidents"
            icon={AlertTriangle}
            label="Incidencias"
            description="Reportar y dar seguimiento"
          />
          <QuickLink
            href="/dashboard/me"
            icon={UserIcon}
            label="Mi perfil"
            description="Ver perfil e historial"
          />
        </div>
      </div>
    </div>
  )
}
