"use client"

import * as React from "react"
import {
  BadgeCheck,
  LogOut,
  ChevronsUpDown,
  Mail,
  IdCard,
  Briefcase,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"

type NavUserProps = {
  user: any | null
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)

  const first = parts[0]?.[0] ?? "U"
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? ""
  return (first + second).toUpperCase()
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  if (!user) return null

  const fullName = user.employee
    ? `${user.employee.nombres ?? ""} ${user.employee.apellidos ?? ""}`.trim()
    : ""

  const displayName = fullName || user.username || "Usuario"
  const roleLabel = user.role?.name || user.role?.key || "Sin rol"

  // secundarios (más “pro”)
  const dni = user.employee?.dni || user.username || ""
  const email = user.employee?.email || null
  const cargo = user.employee?.cargo || null

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } finally {
      localStorage.removeItem("user_data")
      router.replace("/login")
      setLoggingOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="gap-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-9 w-9 rounded-lg ring-1 ring-black/5">
                <AvatarImage src="/logo2.jpg" alt={displayName} />
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-3 font-normal">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 rounded-lg ring-1 ring-black/5">
                  <AvatarImage src="/logo2.jpg" alt={displayName} />
                  <AvatarFallback className="rounded-lg text-xs font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </div>

                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    {dni ? (
                      <div className="flex items-center gap-2">
                        <IdCard className="size-3.5" />
                        <span className="truncate">DNI: {dni}</span>
                      </div>
                    ) : null}

                    {email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5" />
                        <span className="truncate">{email}</span>
                      </div>
                    ) : null}

                    {cargo ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-3.5" />
                        <span className="truncate">{cargo}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/perfil")}
              className="gap-2"
            >
              <BadgeCheck className="size-4" />
              Mi perfil
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="size-4" />
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
