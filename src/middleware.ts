import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";

  // 🔵 Consultamos al backend si la cookie es válida
  const res = await fetch("http://localhost:4000/api/auth/check", {
    method: "GET",
    headers: { Cookie: cookie },
  });

  const logged = res.ok; // true = cookie válida

  // ⭐ Caso 1: Usuario LOGUEADO intenta entrar al LOGIN → redirigir a dashboard
  if (logged && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ⭐ Caso 2: Usuario NO logueado intentando entrar al DASHBOARD → redirigir a login
  if (!logged && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
