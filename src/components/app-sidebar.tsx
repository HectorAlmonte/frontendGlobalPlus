"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  ClipboardPen,
  ShieldCheck,
  ChartBar,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { title } from "process"
import { ModeToggle } from "./mode-toggle"
import { useWord } from "@/context/AppContext"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Operaciones",
      url: "#",
      icon: ClipboardPen,
      roles: ["admin", "seguridad"],
      items: [
        {
          title: "Ordenes",
          url: "/dashboard/ordenes",
          roles: ["admin", "seguridad"],
        },
        {
          title: "Visitas",
          url: "/dashboard/visitas",
          roles: ["admin"],
        }
      ],
    },
    {
      title: "Informacion",
      url: "#",
      icon: BookOpen,
      roles: ["admin"],
      items: [
        { title: "Camiones", url: "#", roles: ["admin"] },
        { title: "Conductores", url: "#", roles: ["admin"] },
        { title: "Patios", url: "#", roles: ["admin"] },
      ],
    },
    {
      title: "Configuracion",
      url: "#",
      icon: Settings2,
      roles: ["admin"],
      items: [
        { title: "Usuarios", url: "#", roles: ["admin"] },
      ],
    },
    {
      title: "Seguridad y monitoreo",
      url: "#",
      icon: ShieldCheck,
      roles: ["admin", "seguridad"],
      items: [
        { title: "Camaras", url: "#", roles: ["admin", "seguridad"] },
        { title: "Alarmas", url: "#", roles: ["admin", "seguridad"] },
        { title: "Fromulario Base", url: "/dashboard/seguridad", roles: ["admin","seguridad"] },
      ],
    }
  ],
  projects: [
    {
      name: "Menu principal",
      url: "/dashboard",
      icon: ChartBar,
    },

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user, loadingUser } = useWord();

  if (loadingUser) return null; // evita errores

  const role = user?.role ?? ""; // 👈 asegura string

  const filteredNav = data.navMain
    .filter(section => section.roles?.includes(role))
    .map(section => ({
      ...section,
      items: section.items?.filter(item => item.roles?.includes(role))
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
        <NavMain items={filteredNav} />  
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
