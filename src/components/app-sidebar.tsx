"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  ClipboardPen,
  Command,
  GalleryVerticalEnd,
  Settings2,
  ShieldCheck,
  ChartBar,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { useWord } from "@/context/AppContext";

/** 1) Diccionario iconName -> IconComponent */
const iconMap: Record<string, any> = {
  ClipboardPen,
  ShieldCheck,
  BookOpen,
  Settings2,
  ChartBar,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
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
  teams: [
    { name: "Acme Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Evil Corp.", logo: Command, plan: "Free" },
  ],
  projects: [
    { name: "Menu principal", url: "/dashboard", icon: ChartBar },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const { user, loadingUser } = useWord();

  const [nav, setNav] = React.useState<any[]>([]);
  const [loadingNav, setLoadingNav] = React.useState(true);

  React.useEffect(() => {
    if (loadingUser) return;
    if (!user) return;

    const run = async () => {
      try {
        setLoadingNav(true);

        const res = await fetch(`${API}/api/nav`, {
          credentials: "include",
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Error nav");

        const sections = (Array.isArray(body) ? body : []) as NavSectionDTO[];

        // 2) Adaptar a la forma que espera NavMain (icon como componente)
        const mapped = sections.map((s) => ({
          title: s.title,
          url: "#",
          icon: s.icon ? iconMap[s.icon] : undefined,
          items: (s.items || []).map((it) => ({
            title: it.title,
            url: it.url,
            icon: it.icon ? iconMap[it.icon] : undefined,
          })),
        }));

        setNav(mapped);
      } catch (e) {
        console.error(e);
        setNav([]); // fallback
      } finally {
        setLoadingNav(false);
      }
    };

    run();
  }, [API, user, loadingUser]);

  if (loadingUser) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavProjects projects={data.projects} />

        {/* Nav dinámico */}
        {loadingNav ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Cargando menú…
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
