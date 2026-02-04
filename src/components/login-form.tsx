"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useWord } from "@/context/AppContext"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"

type LoginFormProps = React.ComponentPropsWithoutRef<"div">

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const { setUser } = useWord()

  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

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
        alert(data.message ?? "Error de login")
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
    } catch (error) {
      console.error("Error en login:", error)
      alert("Error de conexion con el servidor")
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left: Form */}
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
            <form onSubmit={handleLogin}>
              <FieldGroup>
                {/* Branding */}
                <div className="flex flex-col items-center gap-4 text-center mb-2">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Image
                      src="/logo/logo.png"
                      alt="Global Plus"
                      width={32}
                      height={32}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Global Plus
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ingrese sus credenciales para acceder al sistema
                    </p>
                  </div>
                </div>

                {/* DNI */}
                <Field>
                  <FieldLabel htmlFor="dni" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    DNI
                  </FieldLabel>
                  <Input
                    id="dni"
                    placeholder="12345678"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="h-11"
                    disabled={submitting}
                  />
                </Field>

                {/* Password */}
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contrasena
                    </FieldLabel>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Submit */}
                <Field>
                  <Button type="submit" className="h-11 w-full font-semibold" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      "Ingresar"
                    )}
                  </Button>
                </Field>

                <FieldDescription className="text-center text-xs text-muted-foreground">
                  Si olvidaste tu contrasena, contacta a soporte para restablecerla.
                </FieldDescription>
              </FieldGroup>
            </form>
          </div>

          {/* Right: Visual panel */}
          <div className="relative hidden md:block bg-gradient-to-br from-primary/90 to-primary overflow-hidden">
            <div className="absolute inset-0 bg-[url('/logo2.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            <div className="relative flex h-full flex-col items-center justify-center p-10 text-white">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-center">
                Sistema de Gestion
              </h2>
              <p className="mt-3 text-center text-sm text-white/80 max-w-[280px] leading-relaxed">
                Plataforma integral para la gestion de incidencias, tareas, inventarios y personal.
              </p>

              {/* Decorative dots */}
              <div className="absolute bottom-8 flex gap-1.5">
                <div className="h-1.5 w-8 rounded-full bg-white/40" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/25" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/25" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Global Plus &middot; Sistema de gestion &middot; {new Date().getFullYear()}
      </p>
    </div>
  )
}
