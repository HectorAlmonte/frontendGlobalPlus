import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasRole(user: any, key: string): boolean {
  if (user?.roles?.some((r: any) => r.key === key)) return true;
  return user?.role?.key === key;
}
