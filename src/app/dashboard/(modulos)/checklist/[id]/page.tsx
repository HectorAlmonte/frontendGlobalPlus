"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { apiGetRecord } from "../_lib/api";
import type { ChecklistRecord } from "../_lib/types";

import ChecklistDetailHeader from "../_components/ChecklistDetailHeader";
import ChecklistFillForm from "../_components/ChecklistFillForm";
import SignatureSection from "../_components/SignatureSection";

export default function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<ChecklistRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGetRecord(id);
      setRecord(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Loading ──
  if (loading && !record) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-6 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // ── Error ──
  if (error || !record) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium">No se pudo cargar el checklist</p>
        <p className="text-xs text-muted-foreground">
          Verifica que el registro exista y tengas acceso.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/checklist")}>
          Volver a checklists
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-7xl mx-auto pb-10">
      {/* Encabezado siempre full-width */}
      <ChecklistDetailHeader
        record={record}
        onBack={() => router.push("/dashboard/checklist")}
      />

      {/* En PC: 2 columnas (ítems + firmas). En tablet/mobile: stack vertical */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 xl:items-start">
        {/* Columna izquierda — formulario de ítems */}
        <ChecklistFillForm record={record} onRefresh={refresh} />

        {/* Columna derecha — firmas (fija en PC, debajo en mobile) */}
        <SignatureSection record={record} onRefresh={refresh} />
      </div>
    </div>
  );
}
