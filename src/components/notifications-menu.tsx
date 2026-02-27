"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Clock,
  PenLine,
  Package,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const API = process.env.NEXT_PUBLIC_API_URL

type NotifStats = {
  openIncidents: number
  criticalStock: number
  lowStock: number
  overdueTasks: number
  unsignedEpp: number
}

async function loadStats(): Promise<NotifStats> {
  try {
    const res = await fetch(`${API}/api/dashboard/stats`, {
      credentials: "include",
      cache: "no-store",
    })
    if (!res.ok) return { openIncidents: 0, criticalStock: 0, lowStock: 0, overdueTasks: 0, unsignedEpp: 0 }
    const data = await res.json()
    return {
      openIncidents: data?.incidents?.open ?? 0,
      criticalStock: data?.storage?.criticalStock ?? 0,
      lowStock:      data?.storage?.lowStock ?? 0,
      overdueTasks:  data?.tasks?.overdue ?? 0,
      unsignedEpp:   data?.epp?.unsigned ?? 0,
    }
  } catch {
    return { openIncidents: 0, criticalStock: 0, lowStock: 0, overdueTasks: 0, unsignedEpp: 0 }
  }
}

const ALERTS = [
  {
    key: "openIncidents" as keyof NotifStats,
    label: (n: number) => (n === 1 ? "incidencia abierta" : "incidencias abiertas"),
    sublabel: "Requiere atención inmediata",
    href: "/dashboard/incidents",
    Icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/8 dark:bg-destructive/15",
    iconBg: "bg-destructive/10 dark:bg-destructive/20",
  },
  {
    key: "criticalStock" as keyof NotifStats,
    label: (n: number) => (n === 1 ? "producto en stock crítico" : "productos en stock crítico"),
    sublabel: "Almacén · Nivel crítico",
    href: "/dashboard/storage/products",
    Icon: Package,
    color: "text-destructive",
    bg: "bg-destructive/8 dark:bg-destructive/15",
    iconBg: "bg-destructive/10 dark:bg-destructive/20",
  },
  {
    key: "lowStock" as keyof NotifStats,
    label: (n: number) => (n === 1 ? "producto con stock bajo" : "productos con stock bajo"),
    sublabel: "Almacén · Reponer pronto",
    href: "/dashboard/storage/products",
    Icon: Package,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    key: "overdueTasks" as keyof NotifStats,
    label: (n: number) => (n === 1 ? "tarea vencida" : "tareas vencidas"),
    sublabel: "Requiere atención",
    href: "/dashboard/tasks",
    Icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    key: "unsignedEpp" as keyof NotifStats,
    label: (n: number) => (n === 1 ? "EPP sin firma" : "EPP sin firmar"),
    sublabel: "Firma digital pendiente",
    href: "/dashboard/epp",
    Icon: PenLine,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
]

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<NotifStats>({
    openIncidents: 0,
    criticalStock: 0,
    lowStock: 0,
    overdueTasks: 0,
    unsignedEpp: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await loadStats()
      setStats(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 60_000)
    return () => clearInterval(interval)
  }, [load])

  const active = ALERTS.filter((a) => stats[a.key] > 0)
  const total = active.reduce((sum, a) => sum + stats[a.key], 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {!loading && total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-72 p-0 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">Notificaciones</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-1.5 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">Todo al día</p>
            <p className="text-xs text-muted-foreground">
              No hay pendientes en este momento
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {active.map(({ key, label, sublabel, href, Icon, color, bg, iconBg }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:brightness-95",
                  bg
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    iconBg
                  )}
                >
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold leading-none", color)}>
                    {stats[key]} {label(stats[key])}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && active.length > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              {total} pendiente{total !== 1 ? "s" : ""} · actualiza cada minuto
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
