"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  FileText,
  ArrowRight,
  AlertTriangle,
  Inbox,
  Layers,
} from "lucide-react";

type FormItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  version?: number;
};

function FormsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FormsList() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => `${API}/api/forms`, [API]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(endpoint, { credentials: "include" });
        const body = await res.json().catch(() => null);

        if (!res.ok) throw new Error(body?.message || `Error (${res.status})`);

        setForms(Array.isArray(body) ? body : []);
      } catch (e: any) {
        setError(e?.message || "Error cargando formularios");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [endpoint]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <FormsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">Sin formularios asignados</p>
              <p className="text-sm text-muted-foreground">
                No tienes formularios disponibles para tu rol por el momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Formularios</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Según tu rol, estos son los formularios disponibles.
          </p>
        </div>

        <Badge variant="secondary" className="w-fit">
          {forms.length} disponible{forms.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <Separator />

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {forms.map((f) => (
          <Card
            key={f.id}
            className="group overflow-hidden transition hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="truncate">{f.name}</span>
                  </CardTitle>

                  {f.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin descripción.
                    </p>
                  )}
                </div>

                <Button asChild className="shrink-0">
                  <Link href={`/dashboard/forms/${f.slug}`}>
                    Abrir <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {typeof f.version === "number" ? (
                  <span>Versión: {f.version}</span>
                ) : (
                  <span>Versión: —</span>
                )}

                {/* microdetalle “enterprise”: estado */}
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                  Disponible
                </span>
              </div>
            </CardContent>

            {/* barra sutil al hover */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 transition group-hover:opacity-100" />
          </Card>
        ))}
      </div>
    </div>
  );
}
