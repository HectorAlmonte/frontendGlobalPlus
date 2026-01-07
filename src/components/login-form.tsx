"use client"

import Cookies from "js-cookie"
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

type LoginFormProps = React.ComponentPropsWithoutRef<"div">

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const { setUser } = useWord()

  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dni, password }),
        }
      )

      const data: { user?: unknown; message?: string } = await res.json()

      if (!res.ok) {
        alert(data.message ?? "Error de login")
        return
      }

      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setUser(data.user as any) // si tienes el tipo User en tu proyecto, lo tipamos bien
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Error en login:", error)
      alert("Error de conexión con el servidor")
    }
  }

  useEffect(() => {
    const token = Cookies.get("token")
    if (token) router.push("/dashboard")
  }, [router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Sistema de gestion</h1>
                <p className="text-muted-foreground text-balance">
                  Ingrese sus credenciales de acceso para continuar.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="dni">Dni</FieldLabel>
                <Input
                  id="dni"
                  placeholder="12345678"
                  required
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
                    Olvideste tu contrase?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <Field>
                <Button type="submit">Login</Button>
              </Field>

              <FieldDescription className="text-center">
                No tiene una cuenta?<a href="#"> Contancanos</a>
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
