"use client";

import * as React from "react";
import Image from "next/image";
import {
  ClipboardPen,
  ClipboardList,
  Command,
  Settings2,
  ShieldCheck,
  ChartBar,
  Clock,
  UserPlus,
  Home,
  Coffee,
  CalendarDays,
  BarChart3,
  CircleHelp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { useWord } from "@/context/AppContext";

const iconMap: Record<string, any> = {
  ClipboardPen,
  ShieldCheck,
  Settings2,
  ChartBar,
  Command,
  ClipboardList,
  UserPlus,
  Clock,
  Home,
  Coffee,
  CalendarDays,
  BarChart3,
};

type NavItemDTO = {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  order?: number;
};

type NavSectionDTO = {
  id: string;
  title: string;
  icon?: string | null;
  order?: number;
  items: NavItemDTO[];
};

const data = {
  projects: [{ name: "Menu principal", url: "/dashboard", icon: ChartBar }],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const { user, loadingUser } = useWord();
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  const [nav, setNav] = React.useState<any[]>([]);
  const [loadingNav, setLoadingNav] = React.useState(true);
  const [navError, setNavError] = React.useState<string | null>(null);

  // ✅ para reintentar 1 vez si hay "cold start"
  const retryRef = React.useRef(0);

  const resolveIcon = (iconName?: string | null) => {
    if (!iconName) return undefined;
    return iconMap[iconName] ?? CircleHelp;
  };

  React.useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      setNav([]);
      setNavError("No hay usuario cargado.");
      setLoadingNav(false);
      return;
    }

    if (!API) {
      setNav([]);
      setNavError("Falta NEXT_PUBLIC_API_URL");
      setLoadingNav(false);
      return;
    }

    const controller = new AbortController();

    // ✅ Timeout más alto para evitar que la primera llamada falle
    const timeout = setTimeout(() => controller.abort(), 25000);

    const run = async () => {
      try {
        setLoadingNav(true);
        setNavError(null);

        const url = `${API}/api/navigation/sidebar`;
        const res = await fetch(url, {
          credentials: "include",
          signal: controller.signal,
        });
        const body = await res.json().catch(() => null);

        if (!res.ok) throw new Error(body?.message || `Error nav (${res.status})`);

        const sections = (Array.isArray(body?.data) ? body.data : []) as NavSectionDTO[];

        if (sections.length === 0) {
          setNav([]);
          setNavError("No hay items asignados a tu rol aún.");
          return;
        }

        sections.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

        const mapped = sections.map((s) => ({
          title: s.title,
          url: "#",
          icon: resolveIcon(s.icon),
          items: (s.items || [])
            .slice()
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
            .map((it) => ({
              title: it.title,
              url: it.url,
              icon: resolveIcon(it.icon),
            })),
        }));

        const nonEmpty = mapped.filter((s) => (s.items?.length ?? 0) > 0);

        if (nonEmpty.length === 0) {
          setNav([]);
          setNavError("No hay items visibles para tu rol (revisa NavItemRole).");
          return;
        }

        setNav(nonEmpty);
        retryRef.current = 0; // ✅ resetea retry si cargó bien
      } catch (e: any) {
        // ✅ Si es AbortError, reintenta 1 vez (cold start típico)
        if (e?.name === "AbortError") {
          if (retryRef.current < 1) {
            retryRef.current += 1;
            // no asustamos al usuario con rojo aún, mostramos "reintentando"
            setNavError(null);
            setLoadingNav(true);

            clearTimeout(timeout);
            controller.abort();

            // re-lanza efecto con un reload "suave"
            // (simplemente forzamos recarga con un setTimeout y nueva petición)
            setTimeout(() => {
              // OJO: no podemos reutilizar controller abortado, así que:
              // recargamos la página de forma suave (opcional)
              // mejor: usar window.location.reload() NO.
              // solución: hacemos una segunda fetch SIN abort controller.
              fetch(`${API}/api/navigation/sidebar`, { credentials: "include" })
                .then(async (r) => {
                  const b = await r.json().catch(() => null);
                  if (!r.ok) throw new Error(b?.message || `Error nav (${r.status})`);

                  const sections = (Array.isArray(b?.data) ? b.data : []) as NavSectionDTO[];
                  sections.sort((a, b2) => (a.order ?? 9999) - (b2.order ?? 9999));

                  const mapped = sections.map((s) => ({
                    title: s.title,
                    url: "#",
                    icon: resolveIcon(s.icon),
                    items: (s.items || [])
                      .slice()
                      .sort((a, b2) => (a.order ?? 9999) - (b2.order ?? 9999))
                      .map((it) => ({
                        title: it.title,
                        url: it.url,
                        icon: resolveIcon(it.icon),
                      })),
                  }));

                  const nonEmpty = mapped.filter((s) => (s.items?.length ?? 0) > 0);

                  if (nonEmpty.length === 0) {
                    setNav([]);
                    setNavError("No hay items visibles para tu rol (revisa NavItemRole).");
                    return;
                  }

                  setNav(nonEmpty);
                  retryRef.current = 0;
                })
                .catch((err2) => {
                  setNav([]);
                  setNavError(err2?.message || "Error cargando navegación");
                })
                .finally(() => setLoadingNav(false));
            }, 600);

            return;
          }

          setNav([]);
          setNavError("Demoró demasiado cargando menú. Intenta F5.");
          return;
        }

        setNav([]);
        setNavError(e?.message || "Error cargando navegación");
      } finally {
        clearTimeout(timeout);
        setLoadingNav(false);
      }
    };

    run();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [API, loadingUser, user]);

  if (loadingUser) return null;

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
      {...props}
    >
      <SidebarHeader className="px-2 pt-2">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="h-11 w-11 rounded-xl border bg-card shadow-sm flex items-center justify-center">
              <Image
                src="/logo/logo.png"
                alt="Global Plus"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg border bg-background p-1 shadow-sm flex items-center justify-center">
                <Image
                  src="/logo/logo.png"
                  alt="Global Plus"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold tracking-tight">
                  Global Plus
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  Sistema de gestión
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 border-t border-border" />
      </SidebarHeader>

      <SidebarContent className="px-1">
        <NavProjects projects={data.projects} />

        <div className="my-2 border-t border-border/70" />

        {loadingNav ? (
          isCollapsed ? (
            <div
              className="flex items-center justify-center py-2 text-muted-foreground"
              title="Cargando menú…"
            >
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Cargando menú…
            </div>
          )
        ) : navError ? (
          isCollapsed ? (
            <div
              className="flex items-center justify-center py-2 text-destructive"
              title={navError}
            >
              <AlertTriangle className="size-4" />
            </div>
          ) : (
            <div className="mx-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {navError}
            </div>
          )
        ) : (
          <NavMain items={nav} />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/70">
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
 