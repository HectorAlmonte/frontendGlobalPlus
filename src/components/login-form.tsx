"use client"

import React, { useEffect, useState } from "react"
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
import { Eye, EyeOff } from "lucide-react"

type LoginFormProps = React.ComponentPropsWithoutRef<"div">

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const { setUser } = useWord()

  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
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

      // ✅ si la contraseña es temporal / forzada -> obligar cambio
      if (data.mustChangePassword) {
        router.replace("/dashboard/settings/change-password?forced=1")
        return
      }

      router.replace("/dashboard")
    } catch (error) {
      console.error("Error en login:", error)
      alert("Error de conexión con el servidor")
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
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Sistema de gestión</h1>
                <p className="text-muted-foreground text-balance">
                  Ingrese sus credenciales de acceso para continuar.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="dni">DNI</FieldLabel>
                <Input
                  id="dni"
                  placeholder="12345678"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {/* ✅ Password con ojo */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Field>
                <Button type="submit">Login</Button>
              </Field>

              <FieldDescription className="text-center">
                ¿No tiene una cuenta? <a href="#">Contáctanos</a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/logo2.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Sistema de gestión de inventarios - creado por Hector Almonte 2025
      </FieldDescription>
    </div>
  )
}
