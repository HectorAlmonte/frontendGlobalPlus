"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWord } from "@/context/AppContext";

const ALLOWED_ROUTES = ["/dashboard/me", "/dashboard/settings/change-password"];
const RESTRICTED_ROLES = ["TRABAJADOR"];

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loadingUser } = useWord();
  const pathname = usePathname();
  const router = useRouter();

  const roleKey = user?.role?.key;
  const isRestricted = RESTRICTED_ROLES.includes(roleKey ?? "");
  const isAllowed =
    !isRestricted || ALLOWED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

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
