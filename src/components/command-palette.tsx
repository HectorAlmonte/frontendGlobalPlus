"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Search, User } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useWord } from "@/context/AppContext"
import { hasRole } from "@/lib/utils"

const API = process.env.NEXT_PUBLIC_API_URL

type NavItem    = { title: string; url: string }
type NavSection = { title: string; items: NavItem[] }

async function fetchNav(): Promise<NavSection[]> {
  try {
    const res = await fetch(`${API}/api/navigation/sidebar`, { credentials: "include" })
    if (!res.ok) return []
    const body = await res.json()
    const sections = Array.isArray(body?.data) ? body.data : []
    return sections
      .sort((a: any, b: any) => (a.order ?? 9999) - (b.order ?? 9999))
      .map((s: any) => ({
        title: s.title,
        items: (s.items || [])
          .sort((a: any, b: any) => (a.order ?? 9999) - (b.order ?? 9999))
          .map((it: any) => ({ title: it.title, url: it.url })),
      }))
      .filter((s: NavSection) => s.items.length > 0)
  } catch {
    return []
  }
}

export function CommandPalette() {
  const [open, setOpen]       = useState(false)
  const [sections, setSections] = useState<NavSection[]>([])
  const [loading, setLoading] = useState(false)
  const loaded                = useRef(false)
  const router                = useRouter()
  const { user }              = useWord()

  // Atajo de teclado Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Carga la nav solo la primera vez que se abre
  useEffect(() => {
    if (!open || loaded.current) return
    setLoading(true)
    fetchNav().then((data) => {
      setSections(data)
      setLoading(false)
      loaded.current = true
    })
  }, [open])

  const navigate = useCallback((url: string) => {
    setOpen(false)
    router.push(url)
  }, [router])

  const hasFullAccess = !hasRole(user, "TRABAJADOR")

  return (
    <>
      {/* Botón trigger — desktop */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 px-3 text-muted-foreground text-xs hidden sm:flex border-dashed"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-80">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Botón trigger — móvil (solo icono) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 flex sm:hidden"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Búsqueda global"
        description="Navega rápido entre módulos y páginas"
        showCloseButton={false}
        className="sm:max-w-lg"
      >
        <CommandInput placeholder="Buscar módulo o página..." />
        <CommandList className="max-h-[380px]">
          <CommandEmpty>
            {loading ? "Cargando navegación..." : "No se encontraron resultados."}
          </CommandEmpty>

          {/* General */}
          <CommandGroup heading="General">
            {hasFullAccess && (
              <CommandItem value="dashboard inicio" onSelect={() => navigate("/dashboard")}>
                <LayoutDashboard />
                Dashboard
              </CommandItem>
            )}
            <CommandItem value="mi perfil usuario" onSelect={() => navigate("/dashboard/me")}>
              <User />
              Mi Perfil
            </CommandItem>
          </CommandGroup>

          {/* Secciones dinámicas del sidebar */}
          {sections.map((section, i) => (
            <div key={section.title}>
              {i >= 0 && <CommandSeparator />}
              <CommandGroup heading={section.title}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={`${section.title} ${item.title}`}
                    onSelect={() => navigate(item.url)}
                  >
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>

        {/* Footer con hint */}
        <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="rounded border px-1 font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="rounded border px-1 font-mono">↵</kbd> abrir</span>
          <span><kbd className="rounded border px-1 font-mono">Esc</kbd> cerrar</span>
        </div>
      </CommandDialog>
    </>
  )
}
