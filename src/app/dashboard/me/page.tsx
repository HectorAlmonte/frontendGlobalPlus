"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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
} from "lucide-react";

// ✅ REUSA el mismo dialog del módulo incidencias
import CreateIncidentDialog from "../incidents/_components/CreateIncidentDialog";

// ✅ REUSA tipos y API del módulo incidencias
import type { CreateIncidentInput } from "../incidents/_lib/types";
import { apiCreateIncident } from "../incidents/_lib/api";

/* =========================
   TYPES (alineados a tu backend)
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
  } | null;
  incidents: IncidentListItem[];
};

/* =========================
   HELPERS
========================= */

function statusBadge(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
          Pendiente
        </Badge>
      );

    case "IN_PROGRESS":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
          En proceso
        </Badge>
      );

    case "CLOSED":
      return <Badge>Cerrada</Badge>;

    case "CANCELLED":
      return <Badge variant="outline">Anulada</Badge>;

    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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

  // ✅ estados para el dialog de creación (igual que en IncidentsPage)
  const [openCreate, setOpenCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    const profile = await apiGetMyProfile();
    setData(profile);
  }, []);

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
      // ✅ refresca perfil para actualizar stats + tabla
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
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando perfil...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="font-medium">No se pudo cargar el perfil</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            Sin datos.
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = data.user.role?.name || data.user.role?.key || "—";
  const emailLabel = data.user.email || data.employee?.email || null;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            Mi perfil
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <IdCard className="h-4 w-4" />
              Usuario/DNI:{" "}
              <span className="font-medium text-foreground">
                {data.user.username}
              </span>
            </span>

            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              Rol:{" "}
              <span className="font-medium text-foreground">{roleLabel}</span>
            </span>

            {emailLabel ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="font-medium text-foreground">{emailLabel}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="incidencias" className="w-full">
        <TabsList>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
          <TabsTrigger value="datos">Datos personales</TabsTrigger>
        </TabsList>

        {/* INCIDENCIAS */}
        <TabsContent value="incidencias" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Abiertas</div>
                <div className="text-2xl font-semibold">{stats.open}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">En progreso</div>
                <div className="text-2xl font-semibold">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Cerradas</div>
                <div className="text-2xl font-semibold">{stats.closed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base">Mis incidencias</CardTitle>

                {/* ✅ mismo patrón que en IncidentsPage: buscador + botón */}
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <div className="relative w-full md:w-[360px]">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código, título, estado, área..."
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
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {incidentsFiltered.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No hay incidencias para mostrar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Creado</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {incidentsFiltered.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">
                            {it.code || "—"}
                          </TableCell>

                          <TableCell className="max-w-[360px] truncate">
                            {it.title || "—"}
                          </TableCell>

                          <TableCell>{statusBadge(it.status)}</TableCell>

                          <TableCell>{it.area || "—"}</TableCell>

                          <TableCell>{fmtDate(it.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATOS PERSONALES */}
        <TabsContent value="datos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos personales</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm font-medium">Nombre</div>
                <p className="text-sm text-muted-foreground">{fullName}</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Cargo / Estado
                </div>

                <p className="text-sm text-muted-foreground">
                  Cargo:{" "}
                  <span className="font-medium text-foreground">
                    {data.employee?.cargo || "—"}
                  </span>
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Estado:{" "}
                  <span className="font-medium text-foreground">
                    {data.employee?.status === "ACTIVO"
                      ? "Activo"
                      : data.employee?.status === "INACTIVO"
                      ? "Inactivo"
                      : "—"}
                  </span>
                </p>
              </div>

              <div className="rounded-lg border p-4 md:col-span-2">
                <div className="mb-2 text-sm font-medium">Contacto</div>
                <p className="text-sm text-muted-foreground">
                  Email:{" "}
                  <span className="font-medium text-foreground">
                    {emailLabel || "—"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
