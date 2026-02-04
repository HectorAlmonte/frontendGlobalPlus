"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWord } from "@/context/AppContext";

const ALLOWED_ROUTES = ["/dashboard/me", "/dashboard/settings/change-password"];
const FULL_ACCESS_ROLES = ["ADMIN", "SUPERVISOR"];

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loadingUser } = useWord();
  const pathname = usePathname();
  const router = useRouter();

  const roleKey = user?.role?.key;
  const hasFullAccess = FULL_ACCESS_ROLES.includes(roleKey ?? "");
  const isAllowed =
    hasFullAccess || ALLOWED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  useEffect(() => {
    if (loadingUser || !user) return;
    if (!isAllowed) {
      router.replace("/dashboard/me");
    }
  }, [loadingUser, user, isAllowed, router]);

  if (loadingUser) return null;
  if (!isAllowed) return null;

  return <>{children}</>;
}
