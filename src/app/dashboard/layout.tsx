"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { RoleGuard } from "@/components/role-guard"
import { NotificationsMenu } from "@/components/notifications-menu"
import { CommandPalette } from "@/components/command-palette"
import { useWord } from "@/context/AppContext"
import { usePathname } from "next/navigation"

type RouteEntry = { pattern: RegExp; section?: string; label: string }

const ROUTE_MAP: RouteEntry[] = [
  { pattern: /^\/dashboard$/, label: "Inicio" },
  // Módulos
  { pattern: /^\/dashboard\/incidents/, section: "Módulos", label: "Incidencias" },
  { pattern: /^\/dashboard\/storage\/products\/[^/]+/, section: "Módulos", label: "Detalle de Producto" },
  { pattern: /^\/dashboard\/storage\/units\/[^/]+/, section: "Módulos", label: "Detalle de Unidad" },
  { pattern: /^\/dashboard\/storage\/products/, section: "Módulos", label: "Catálogo" },
  { pattern: /^\/dashboard\/storage/, section: "Módulos", label: "Almacén" },
  { pattern: /^\/dashboard\/documents/, section: "Módulos", label: "Documentos" },
  { pattern: /^\/dashboard\/epp/, section: "Módulos", label: "EPP" },
  { pattern: /^\/dashboard\/tasks/, section: "Módulos", label: "Tareas" },
  { pattern: /^\/dashboard\/horas/, section: "Módulos", label: "Control de Horas" },
  { pattern: /^\/dashboard\/reportes/, section: "Módulos", label: "Reportes" },
  // Configuración
  { pattern: /^\/dashboard\/areas/, section: "Configuración", label: "Áreas" },
  { pattern: /^\/dashboard\/work-areas/, section: "Configuración", label: "Zonas de Trabajo" },
  { pattern: /^\/dashboard\/staff/, section: "Configuración", label: "Personal" },
  { pattern: /^\/dashboard\/forms\/roles/, section: "Configuración", label: "Roles" },
  // Admin
  { pattern: /^\/dashboard\/admin\/audit/, section: "Admin", label: "Auditoría" },
  { pattern: /^\/dashboard\/admin\/navigation/, section: "Admin", label: "Navegación" },
  // Perfil
  { pattern: /^\/dashboard\/me/, section: "Perfil", label: "Mi Perfil" },
  { pattern: /^\/dashboard\/settings\/change-password/, section: "Perfil", label: "Cambiar Contraseña" },
]

function resolveBreadcrumb(pathname: string, fallback: string) {
  for (const route of ROUTE_MAP) {
    if (route.pattern.test(pathname)) return route
  }
  return { section: undefined, label: fallback || "Dashboard" }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { word } = useWord()
  const pathname = usePathname()
  const crumb = resolveBreadcrumb(pathname, word)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-between flex-1 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Global Plus
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {crumb.section && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem className="hidden md:block">
                        <span className="text-xs text-muted-foreground/70">
                          {crumb.section}
                        </span>
                      </BreadcrumbItem>
                    </>
                  )}

                  <BreadcrumbSeparator className={crumb.section ? "hidden md:block" : ""} />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-semibold">
                      {crumb.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-1">
              <CommandPalette />
              <NotificationsMenu />
              <ModeToggle />
            </div>
          </div>
        </header>
        <RoleGuard>{children}</RoleGuard>
      </SidebarInset>
    </SidebarProvider>
  )
}
