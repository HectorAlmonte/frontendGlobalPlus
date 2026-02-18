import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/pricing", "/contacto", "/change-password"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_ROUTES.includes(path);
  const isDashboard = path.startsWith("/dashboard");

  // No hay token y quiere dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Hay token y quiere login -> manda a dashboard
  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si no hay token y NO es pública -> login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/change-password"],
};
