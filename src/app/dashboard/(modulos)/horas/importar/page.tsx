"use client";

import { useRef, useState } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { apiImportXls } from "../_lib/api";
import type { ImportResult } from "../_lib/types";

export default function ImportarPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [forceReimport, setForceReimport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xls") || f.name.endsWith(".xlsx"))) {
      setFile(f);
      setResult(null);
    } else {
      toast.error("Solo se aceptan archivos .xls o .xlsx");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    try {
      const res = await apiImportXls(file, forceReimport);
      setResult(res);
      toast.success(`Importación completada: ${res.imported} importados, ${res.updated} actualizados`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-none">Importar registros biométricos</h1>
          <p className="text-xs text-muted-foreground mt-1">Carga el archivo XLS exportado del lector biométrico</p>
        </div>
      </div>

      {/* Upload card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
          <div>
            <p className="text-sm font-semibold leading-none">Seleccionar archivo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Formato .xls o .xlsx del biométrico</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <FileSpreadsheet className="h-10 w-10 text-green-600 dark:text-green-400 mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Arrastra el archivo aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-2">.xls, .xlsx</p>
              </>
            )}
          </div>

          {/* Force reimport option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="forceReimport"
              checked={forceReimport}
              onCheckedChange={(v) => setForceReimport(!!v)}
            />
            <Label htmlFor="forceReimport" className="text-sm cursor-pointer">
              Forzar reimportación (sobrescribir registros existentes)
            </Label>
          </div>

          <Button
            className="w-full"
            disabled={!file || loading}
            onClick={handleImport}
          >
            {loading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <p className="text-sm font-semibold leading-none">Resultado de la importación</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Importados" value={result.imported} color="text-green-700 dark:text-green-400" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />} label="Actualizados" value={result.updated} color="text-blue-700 dark:text-blue-400" />
              <StatCard icon={<SkipForward className="h-4 w-4 text-slate-500" />} label="Omitidos" value={result.skipped} color="text-slate-600 dark:text-slate-400" />
              <StatCard icon={<AlertCircle className="h-4 w-4 text-amber-600" />} label="Incompletos" value={result.incomplete} color="text-amber-700 dark:text-amber-400" />
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  {result.errors.length} error(es) — IDs biométricos no mapeados
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/40 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-red-200 dark:border-red-900/40">
                        <th className="text-left px-3 py-2 text-red-700 dark:text-red-400 font-medium">ID Biométrico</th>
                        <th className="text-left px-3 py-2 text-red-700 dark:text-red-400 font-medium">Fecha</th>
                        <th className="text-left px-3 py-2 text-red-700 dark:text-red-400 font-medium">Razón</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 20).map((e, i) => (
                        <tr key={i} className="border-b border-red-100 dark:border-red-900/20 last:border-0">
                          <td className="px-3 py-1.5 font-mono text-red-800 dark:text-red-300">{e.biometricId}</td>
                          <td className="px-3 py-1.5 text-red-700 dark:text-red-400">{e.date}</td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-500">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link
                  href="/dashboard/horas/mapeo"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Ir a mapeo biométrico para corregir
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-2">
      {icon}
      <div>
        <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
