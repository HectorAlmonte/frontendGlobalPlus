"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LayoutDashboard,
  ListTodo,
  Users,
  FileText,
  FolderOpen,
  Briefcase,
  Building,
  MapPin,
  Bell,
  Lock,
  Key,
  Eye,
  Wrench,
  Cog,
  Package,
  Truck,
  HardHat,
  Layers,
  BookOpen,
  Clipboard,
  PenLine,
  FilePlus,
  UserCheck,
  UserCog,
  UsersRound,
  CircleDot,
  User,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
  ListTodo,
  Users,
  FileText,
  FolderOpen,
  Briefcase,
  Building,
  MapPin,
  Bell,
  Lock,
  Key,
  Eye,
  Wrench,
  Cog,
  Package,
  Truck,
  HardHat,
  Layers,
  BookOpen,
  Clipboard,
  PenLine,
  FilePlus,
  UserCheck,
  UserCog,
  UsersRound,
  AlertTriangle,
  LayoutDashboard,
  CircleDot,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const { user, loadingUser } = useWord();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const isCollapsed = state === "collapsed";

  const [nav, setNav] = React.useState<any[]>([]);
  const [loadingNav, setLoadingNav] = React.useState(true);
  const [navError, setNavError] = React.useState<string | null>(null);

  const retryRef = React.useRef(0);

  const resolveIcon = (iconName?: string | null) => {
    if (!iconName) return undefined;
    return iconMap[iconName] ?? CircleDot;
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
          setNavError("No hay items asignados a tu rol aun.");
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
        retryRef.current = 0;
      } catch (e: any) {
        if (e?.name === "AbortError") {
          if (retryRef.current < 1) {
            retryRef.current += 1;
            setNavError(null);
            setLoadingNav(true);

            clearTimeout(timeout);
            controller.abort();

            setTimeout(() => {
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
                  setNavError(err2?.message || "Error cargando navegacion");
                })
                .finally(() => setLoadingNav(false));
            }, 600);

            return;
          }

          setNav([]);
          setNavError("Demoro demasiado cargando menu. Intenta F5.");
          return;
        }

        setNav([]);
        setNavError(e?.message || "Error cargando navegacion");
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

  const isDashboardHome = pathname === "/dashboard";
  const roleKey = user?.role?.key;
  const hasFullAccess = ["ADMIN", "SUPERVISOR"].includes(roleKey ?? "");

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
      {...props}
    >
      {/* ── Header: Logo ── */}
      <SidebarHeader className="px-3 py-4">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image
                src="/logo/logo.png"
                alt="Global Plus"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image
                src="/logo/logo.png"
                alt="Global Plus"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-tight">
                Global Plus
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Sistema de gestion
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2">
        {/* Dashboard home link or Mi Perfil for restricted roles */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            General
          </SidebarGroupLabel>
          <SidebarMenu>
            {hasFullAccess ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  data-active={isDashboardHome}
                >
                  <Link href="/dashboard" onClick={() => isMobile && setOpenMobile(false)}>
                    <LayoutDashboard className="size-4" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Mi Perfil"
                  data-active={pathname === "/dashboard/me"}
                >
                  <Link href="/dashboard/me" onClick={() => isMobile && setOpenMobile(false)}>
                    <User className="size-4" />
                    <span className="font-medium">Mi Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Dynamic nav sections */}
        {loadingNav ? (
          <div className="space-y-4 px-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : navError ? (
          isCollapsed ? (
            <div
              className="flex items-center justify-center py-3 text-destructive"
              title={navError}
            >
              <AlertTriangle className="size-4" />
            </div>
          ) : (
            <div className="mx-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive leading-relaxed">
              {navError}
            </div>
          )
        ) : (
          <NavMain items={nav} />
        )}
      </SidebarContent>

      {/* ── Footer: User ── */}
      <SidebarFooter className="border-t border-sidebar-border/50 px-2 py-2">
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
