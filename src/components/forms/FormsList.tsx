"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FormItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  version?: number;
};

export default function FormsList() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/api/forms`, {
          credentials: "include",
        });

        const body = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(body?.message || `Error (${res.status})`);
        }

        setForms(Array.isArray(body) ? body : []);
      } catch (e: any) {
        setError(e.message || "Error cargando formularios");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [API]);

  if (loading) return <div>Cargando formularios…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (forms.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm">
        No tienes formularios asignados para tu rol.
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Formularios</h1>
        <p className="text-sm text-muted-foreground">
          Según tu rol, estos son los formularios disponibles.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {forms.map((f) => (
          <div key={f.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{f.name}</h2>
                {f.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {f.description}
                  </p>
                )}
                {typeof f.version === "number" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Versión: {f.version}
                  </p>
                )}
              </div>

              <Link
                href={`/dashboard/forms/${f.slug}`}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Abrir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
