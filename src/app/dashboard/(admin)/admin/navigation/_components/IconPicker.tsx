"use client";

import { useState, useMemo } from "react";
import {
  ClipboardPen,
  ClipboardList,
  Settings2,
  ShieldCheck,
  ChartBar,
  Clock,
  UserPlus,
  Home,
  Coffee,
  CalendarDays,
  BarChart3,
  ListTodo,
  Users,
  FileText,
  FolderOpen,
  Briefcase,
  Building,
  MapPin,
  Bell,
  Lock,
  Key,
  Eye,
  Wrench,
  Cog,
  Package,
  Truck,
  HardHat,
  Layers,
  BookOpen,
  Clipboard,
  PenLine,
  FilePlus,
  UserCheck,
  UserCog,
  UsersRound,
  AlertTriangle,
  LayoutDashboard,
  CircleDot,
  User,
  type LucideIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";

const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardPen,
  ClipboardList,
  Settings2,
  ShieldCheck,
  ChartBar,
  Clock,
  UserPlus,
  Home,
  Coffee,
  CalendarDays,
  BarChart3,
  ListTodo,
  Users,
  FileText,
  FolderOpen,
  Briefcase,
  Building,
  MapPin,
  Bell,
  Lock,
  Key,
  Eye,
  Wrench,
  Cog,
  Package,
  Truck,
  HardHat,
  Layers,
  BookOpen,
  Clipboard,
  PenLine,
  FilePlus,
  UserCheck,
  UserCog,
  UsersRound,
  AlertTriangle,
  LayoutDashboard,
  CircleDot,
  User,
};

const ICON_NAMES = Object.keys(ICON_MAP);

export function resolveIcon(name: string | null): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function IconPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_NAMES;
    const q = search.toLowerCase();
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar icono..."
        className="h-8 text-xs"
      />
      <div className="grid grid-cols-6 gap-1 max-h-[160px] overflow-y-auto rounded-md border p-2">
        {filtered.map((name) => {
          const Icon = ICON_MAP[name];
          const isSelected = value === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className={`flex flex-col items-center gap-0.5 rounded-md p-1.5 text-[9px] transition-colors hover:bg-muted ${
                isSelected ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""
              }`}
              title={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-6 text-center text-xs text-muted-foreground py-2">
            Sin resultados
          </p>
        )}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          Seleccionado: <span className="font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}
