import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/pricing", "/contacto"]

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get("token")?.value
  const isPublic = PUBLIC_ROUTES.includes(path)
  const isDashboard = path.startsWith("/dashboard")

  // 🔴 No hay token y quiere dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🟢 Hay token y quiere login -> manda a dashboard
  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
