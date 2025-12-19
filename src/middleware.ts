import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/pricing", "/contacto"]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const cookie = request.headers.get("cookie") || ""
  const hasToken = cookie.includes("token=")
  const isPublic = PUBLIC_ROUTES.includes(path)
  const isDashboard = path.startsWith("/dashboard")

  // 🔴 No hay token y quiere entrar al dashboard
  if (!hasToken && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🟡 Hay token → validamos con backend
  if (hasToken) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check`,
      {
        headers: { Cookie: cookie },
      }
    )

    const logged = res.ok

    // Token inválido
    if (!logged && isDashboard) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Ya logueado → no volver al login
    if (logged && path === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
}
