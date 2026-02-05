"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useWord } from "@/context/AppContext"
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  BarChart3,
  FileText,
  Users,
} from "lucide-react"

type LoginFormProps = React.ComponentPropsWithoutRef<"div">

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const { setUser } = useWord()

  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setError("")

    try {
      setSubmitting(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dni: dni.trim(), password }),
        }
      )

      const data: {
        user?: any
        message?: string
        mustChangePassword?: boolean
      } = await res.json()

      if (!res.ok) {
        setError(data.message ?? "Credenciales incorrectas")
        return
      }

      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user)
      }

      if (data.mustChangePassword) {
        router.replace("/dashboard/settings/change-password?forced=1")
        return
      }

      router.replace("/dashboard")
    } catch {
      setError("Error de conexion con el servidor")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { credentials: "include" }
        )

        if (!res.ok) return

        const data: { user?: any } = await res.json().catch(() => ({}))

        if (data.user) {
          localStorage.setItem("user_data", JSON.stringify(data.user))
          setUser(data.user)
        }

        if (data.user?.mustChangePassword) {
          router.replace("/change-password?forced=1")
          return
        }

        router.replace("/dashboard")
      } catch {}
    }

    checkSession()
  }, [router, setUser])

  const features = [
    {
      icon: ShieldCheck,
      title: "Seguridad y Salud",
      desc: "Gestiona incidencias y cumplimiento normativo SST",
    },
    {
      icon: FileText,
      title: "Control Documental",
      desc: "Versiones, vigencias y trazabilidad completa",
    },
    {
      icon: BarChart3,
      title: "Indicadores en tiempo real",
      desc: "Dashboards con metricas clave de operacion",
    },
    {
      icon: Users,
      title: "Gestion de Personal",
      desc: "Visitas, tareas y ordenes centralizadas",
    },
  ]

  return (
    <div className={cn("flex w-full", className)} {...props}>
      {/* ===== LEFT: Brand Panel ===== */}
      <div className="relative hidden w-[55%] overflow-hidden lg:block">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0f2a4a]" />

        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2a4a] via-[#0f2a4a]/95 to-[#1a3a5c]" />

        {/* Accent glow */}
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#e06060]/10 blur-3xl" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div>
            <Image
              src="/logo/logo.png"
              alt="GlobalPlus"
              width={220}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight">
                Plataforma de
                <br />
                <span className="text-[#e8787a]">Gestion Integral</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                Centraliza la operacion de tu empresa en un solo lugar.
                Seguridad, documentos, personal y reportes en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <f.icon className="h-4.5 w-4.5 text-[#e8787a]" />
                  </div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>GlobalPlus &middot; Logistica Integral</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Login Form ===== */}
      <div className="flex w-full flex-col lg:w-[45%]">
        {/* Mobile header */}
        <div className="flex items-center justify-center gap-3 border-b bg-background p-4 lg:hidden">
          <Image
            src="/logo2.jpg"
            alt="GlobalPlus"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight">GlobalPlus</span>
        </div>

        {/* Form container */}
        <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-6 hidden lg:block">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50">
                  <Image
                    src="/logo2.jpg"
                    alt="GlobalPlus"
                    width={28}
                    height={28}
                    className="rounded-md"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Iniciar sesion
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="dni"
                  className="text-sm font-medium"
                >
                  DNI
                </Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="h-11"
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Contraseñnoa
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-11"
                    disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Si olvidaste tu contrasena, contacta al administrador del sistema.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
          GlobalPlus &middot; Sistema de Gestion Integral &middot;{" "}
          {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
