"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  User as UserIcon,
  Mail,
  IdCard,
  BriefcaseBusiness,
  ShieldCheck,
  Search,
  Loader2,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

import CreateIncidentDialog from "../incidents/_components/CreateIncidentDialog";
import IncidentDetailSheet from "../incidents/_components/IncidentDetailSheet";
import type { CreateIncidentInput, IncidentDetail } from "../incidents/_lib/types";
import { apiCreateIncident, apiGetIncidentDetail } from "../incidents/_lib/api";

/* =========================
   TYPES
========================= */

type IncidentStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";

type IncidentListItem = {
  id: string;
  code?: string | null;
  title?: string | null;
  status: IncidentStatus;
  type?: string | null;
  createdAt: string;
  area?: string | null;
};

type RoleKey = "ADMIN" | "SUPERVISOR" | "TRABAJADOR" | "SEGURIDAD" | "OPERADOR" | string;

type MeProfile = {
  user: {
    id: string;
    username: string;
    email?: string | null;
    fullName?: string | null;
    role?: { key: RoleKey; name?: string | null } | null;
  };
  employee?: {
    id?: string;
    dni?: string;
    nombres?: string;
    apellidos?: string;
    email?: string;
    cargo?: string;
    status?: "ACTIVO" | "INACTIVO";
        // ✅ AGREGA ESTO PARA QUE SEA COMPATIBLE CON EL DIALOG
    shift?: {
      startTime: string;
      endTime: string;
    } | null;
  } | null;
  incidents: IncidentListItem[];
};

/* =========================
   HELPERS
========================= */

function statusBadge(status: IncidentStatus) {
  const variants = {
    OPEN: {
      icon: AlertCircle,
      label: "Pendiente",
      className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    },
    IN_PROGRESS: {
      icon: Clock,
      label: "En proceso",
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    },
    CLOSED: {
      icon: CheckCircle2,
      label: "Cerrada",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    },
    CANCELLED: {
      icon: AlertCircle,
      label: "Anulada",
      className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    },
  };

  const config = variants[status] || variants.OPEN;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* =========================
   API
========================= */

const API = process.env.NEXT_PUBLIC_API_URL || "";

async function apiGetMyProfile(): Promise<MeProfile> {
  const res = await fetch(`${API}/api/users/me/profile`, {
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

/* =========================
   COMPONENT
========================= */

export default function MyProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<MeProfile | null>(null);
  const [q, setQ] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // Detail sheet (read-only)
  const [openSheet, setOpenSheet] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    const profile = await apiGetMyProfile();
    setData(profile);
  }, []);

  const fetchDetail = React.useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await apiGetIncidentDetail(id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleOpenDetail = React.useCallback(
    (id: string) => {
      setSelectedId(id);
      setOpenSheet(true);
      fetchDetail(id);
    },
    [fetchDetail]
  );

  const reloadDetail = React.useCallback(async () => {
    if (selectedId) await fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await apiGetMyProfile();
        if (!alive) return;
        setData(profile);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Error inesperado");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const roleKey: RoleKey | undefined = data?.user?.role?.key;

  async function handleCreate(input: CreateIncidentInput) {
    setCreating(true);
    try {
      await apiCreateIncident(input);
      setOpenCreate(false);
      await fetchProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  const fullName = React.useMemo(() => {
    if (!data) return "—";
    const emp = data.employee;
    const name =
      `${emp?.nombres ?? ""} ${emp?.apellidos ?? ""}`.trim() ||
      data.user.fullName ||
      data.user.username ||
      "—";
    return name;
  }, [data]);

  const incidentsFiltered = React.useMemo(() => {
    const items = data?.incidents ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((it) => {
      const haystack = [
        it.code,
        it.title,
        it.status,
        it.type,
        it.area,
        fmtDate(it.createdAt),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(s);
    });
  }, [data, q]);

  const stats = React.useMemo(() => {
    const items = data?.incidents ?? [];
    return {
      total: items.length,
      open: items.filter((i) => i.status === "OPEN").length,
      inProgress: items.filter((i) => i.status === "IN_PROGRESS").length,
      closed: items.filter((i) => i.status === "CLOSED").length,
    };
  }, [data]);

  /* =========================
     RENDER STATES
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center gap-3 p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Cargando perfil...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <p className="font-medium">No se pudo cargar el perfil</p>
                <p className="mt-1 text-sm">{error}</p>
              </AlertDescription>
            </Alert>
            <Button className="mt-4 w-full" onClick={() => location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center text-muted-foreground">
            Sin datos disponibles
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = data.user.role?.name || data.user.role?.key || "—";
  const emailLabel = data.user.email || data.employee?.email || null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* HEADER CON AVATAR */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {/* Avatar */}
              <Avatar className="h-20 w-20 border-2 border-primary/10">
                <AvatarImage src="" alt={fullName} />
                <AvatarFallback className="bg-primary/5 text-lg font-semibold text-primary">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>

              {/* Info principal */}
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                    {fullName}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    Perfil de usuario
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {data.user.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{roleLabel}</span>
                  </div>

                  {data.employee?.status && (
                    <Badge
                      variant={
                        data.employee.status === "ACTIVO" ? "default" : "secondary"
                      }
                      className="gap-1"
                    >
                      <Activity className="h-3 w-3" />
                      {data.employee.status === "ACTIVO" ? "Activo" : "Inactivo"}
                    </Badge>
                  )}
                </div>

                {emailLabel && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${emailLabel}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {emailLabel}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="incidencias" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="incidencias" className="gap-2">
            <Activity className="h-4 w-4" />
            Incidencias
          </TabsTrigger>
          <TabsTrigger value="datos" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Datos personales
          </TabsTrigger>
        </TabsList>

        {/* TAB: INCIDENCIAS */}
        <TabsContent value="incidencias" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total
                    </p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Abiertas
                    </p>
                    <p className="text-3xl font-bold text-amber-600">
                      {stats.open}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-950">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      En progreso
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.inProgress}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Cerradas
                    </p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {stats.closed}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de incidencias */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Mis incidencias</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Historial completo de reportes
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[320px]">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar incidencias..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <CreateIncidentDialog
                    open={openCreate}
                    onOpenChange={setOpenCreate}
                    creating={creating}
                    onCreate={handleCreate}
                    roleKey={roleKey}
                    profile={data}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {incidentsFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
                  <Activity className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    No hay incidencias para mostrar
                  </p>
                  {q && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setQ("")}
                      className="mt-2"
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">Título</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Área</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {incidentsFiltered.map((it) => (
                        <TableRow
                          key={it.id}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => handleOpenDetail(it.id)}
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            {it.code || "—"}
                          </TableCell>

                          <TableCell className="max-w-[200px] sm:max-w-[400px]">
                            <div className="truncate font-medium">
                              {it.title || "—"}
                            </div>
                          </TableCell>

                          <TableCell>{statusBadge(it.status)}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {it.area || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(it.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: DATOS PERSONALES */}
        <TabsContent value="datos" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <p className="text-sm text-muted-foreground">
                Datos del empleado y contacto
              </p>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Información básica */}
                <div className="space-y-4 rounded-lg border bg-muted/20 p-6">
                  <div className="flex items-center gap-3 text-primary">
                    <UserIcon className="h-5 w-5" />
                    <h3 className="font-semibold">Identificación</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Nombre completo
                      </p>
                      <p className="mt-1 text-sm font-medium">{fullName}</p>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        DNI
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium">
                        {data.employee?.dni || data.user.username || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información laboral */}
                <div className="space-y-4 rounded-lg border bg-muted/20 p-6">
                  <div className="flex items-center gap-3 text-primary">
                    <BriefcaseBusiness className="h-5 w-5" />
                    <h3 className="font-semibold">Información laboral</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Cargo
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {data.employee?.cargo || "—"}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Rol del sistema
                      </p>
                      <Badge variant="outline" className="mt-1 gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {roleLabel}
                      </Badge>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Estado
                      </p>
                      {data.employee?.status && (
                        <Badge
                          variant={
                            data.employee.status === "ACTIVO"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1 gap-1"
                        >
                          <Activity className="h-3 w-3" />
                          {data.employee.status === "ACTIVO" ? "Activo" : "Inactivo"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="space-y-4 rounded-lg border bg-muted/20 p-6 md:col-span-2">
                  <div className="flex items-center gap-3 text-primary">
                    <Mail className="h-5 w-5" />
                    <h3 className="font-semibold">Contacto</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Correo electrónico
                      </p>
                      {emailLabel ? (
                        <a
                          href={`mailto:${emailLabel}`}
                          className="mt-1 block text-sm font-medium text-primary hover:underline"
                        >
                          {emailLabel}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          No registrado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalle de incidencia (solo lectura) */}
      <IncidentDetailSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        selectedId={selectedId}
        detailLoading={detailLoading}
        detail={detail}
        onReload={reloadDetail}
      />
    </div>
  );
}