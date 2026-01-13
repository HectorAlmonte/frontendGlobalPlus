"use client";

import * as React from "react";
import Image from "next/image";
import {
  AudioWaveform,
  BookOpen,
  ClipboardPen,
  ClipboardList,
  Command,
  GalleryVerticalEnd,
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
} from "@/components/ui/sidebar";

import { useWord } from "@/context/AppContext";

/** iconName -> IconComponent */
const iconMap: Record<string, any> = {
  ClipboardPen,
  ShieldCheck,
  BookOpen,
  Settings2,
  ChartBar,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,

  // los de tu seed
  ClipboardList,
  UserPlus,
  Clock,

  // por si agregas luego
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

  const [nav, setNav] = React.useState<any[]>([]);
  const [loadingNav, setLoadingNav] = React.useState(true);
  const [navError, setNavError] = React.useState<string | null>(null); // ✅ nuevo

  const resolveIcon = (iconName?: string | null) => {
    if (!iconName) return undefined;
    return iconMap[iconName] ?? CircleHelp;
  };

  React.useEffect(() => {
    if (loadingUser) return;

    // ✅ si NO hay user, no te quedes pegado en "Cargando..."
    if (!user) {
      setNav([]);
      setNavError("No hay usuario cargado (user=null).");
      setLoadingNav(false);
      return;
    }

    // ✅ si falta API evitamos quedar colgados
    if (!API) {
      console.error("NEXT_PUBLIC_API_URL no está definido");
      setNav([]);
      setNavError("Falta NEXT_PUBLIC_API_URL");
      setLoadingNav(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // ✅ 10s

    const run = async () => {
      try {
        setLoadingNav(true);
        setNavError(null);

        console.log("NAV -> fetching:", `${API}/api/nav`);

        const res = await fetch(`${API}/api/nav`, {
          credentials: "include",
          signal: controller.signal,
        });

        const body = await res.json().catch(() => null);

        console.log("NAV status:", res.status, "body:", body);

        if (!res.ok) throw new Error(body?.message || `Error nav (${res.status})`);

        const sections = (Array.isArray(body) ? body : []) as NavSectionDTO[];

        // ✅ opcional: orden por "order" si viene
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

        setNav(mapped);
      } catch (e: any) {
        if (e?.name === "AbortError") {
          setNavError("Timeout cargando /api/nav (revisar backend/CORS/cookies).");
          return;
        }
        console.error("NAV error:", e);
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
    <Sidebar collapsible="icon" className="bg-white border-r" {...props}>
      <SidebarHeader className="px-2 pt-2">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white p-1 ring-1 ring-black/5 shadow-sm flex items-center justify-center">
              <Image
                src="/logo/logo.png"
                alt="Global Plus"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                Global Plus
              </div>
              <div className="text-xs text-muted-foreground">
                Sistema de gestión
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 h-px bg-slate-200" />
      </SidebarHeader>

      <SidebarContent className="px-1">
        <NavProjects projects={data.projects} />

        <div className="my-2 h-px bg-slate-200/70" />

        {loadingNav ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Cargando menú…
          </div>
        ) : navError ? (
          <div className="px-3 py-2 text-sm text-red-500">
            {navError}
          </div>
        ) : (
          <NavMain items={nav} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
