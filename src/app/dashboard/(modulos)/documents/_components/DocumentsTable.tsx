"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, RefreshCw, Download } from "lucide-react";
import { downloadXlsx, todayStr } from "@/lib/exportExcel";

import type { DocumentRow, DocumentType } from "../_lib/types";
import { statusBadge, formatDate, moduleKeyLabel } from "../_lib/utils";

type Props = {
  items: DocumentRow[];
  loading?: boolean;
  onOpen: (id: string) => void;
  onRefresh?: () => void;
  documentTypes: DocumentType[];
};

export default function DocumentsTable({
  items,
  loading,
  onOpen,
  onRefresh,
  documentTypes,
}: Props) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VIGENTE" | "EXPIRADO">("ALL");

  /* -- Pagination -- */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let out = items;

    if (typeFilter !== "ALL") {
      out = out.filter((x) => x.documentType?.id === typeFilter);
    }

    if (statusFilter !== "ALL") {
      out = out.filter((x) => {
        const isExpired = x.currentVersion?.isExpired ?? false;
        if (statusFilter === "VIGENTE") return !isExpired;
        if (statusFilter === "EXPIRADO") return isExpired;
        return true;
      });
    }

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter(
        (x) =>
          x.name.toLowerCase().includes(needle) ||
          x.code.toLowerCase().includes(needle) ||
          (x.documentType?.name ?? "").toLowerCase().includes(needle) ||
          (x.workArea?.name ?? "").toLowerCase().includes(needle) ||
          (x.moduleKey ?? "").toLowerCase().includes(needle)
      );
    }

    return out;
  }, [items, q, typeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [filtered, pageIndex, pageSize]
  );

  useEffect(() => { setPageIndex(0); }, [filtered.length, pageSize]);

  function handleExport() {
    const rows = filtered.map((doc) => ({
      Código: doc.code || "",
      Nombre: doc.name,
      Tipo: doc.documentType?.name ?? "",
      Área: doc.workArea?.name ?? "",
      Módulo: doc.moduleKey ?? "",
      Versión: doc.currentVersion?.versionNumber ?? "",
      "Vigente desde": doc.currentVersion?.validFrom
        ? formatDate(doc.currentVersion.validFrom)
        : "",
      "Vigente hasta": doc.currentVersion?.validUntil
        ? formatDate(doc.currentVersion.validUntil)
        : "",
      Estado: doc.currentVersion?.isExpired ? "Expirado" : "Vigente",
      Activo: doc.isActive ? "Sí" : "No",
    }));
    downloadXlsx(rows, `documentos_${todayStr()}`);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* ── Card header: título + filtros ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Listado de documentos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:shrink-0">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nombre, código, área..."
              className="pl-8 h-9 w-full"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {documentTypes.map((dt) => (
                <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | "VIGENTE" | "EXPIRADO")}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="VIGENTE">Vigente</SelectItem>
              <SelectItem value="EXPIRADO">Expirado</SelectItem>
            </SelectContent>
          </Select>

          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={handleExport} disabled={loading || filtered.length === 0} title="Exportar a Excel">
            <Download className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={onRefresh} disabled={loading} title="Recargar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left border-b">
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Código</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Tipo</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Área</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Versión</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Vigencia</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-24 rounded-full" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                <td className="px-4 py-3 text-right"><Skeleton className="h-7 w-7 rounded ml-auto" /></td>
              </tr>
            ))}

            {!loading && paginatedRows.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-muted-foreground" colSpan={8}>
                  No hay documentos para mostrar.
                </td>
              </tr>
            )}

            {!loading && paginatedRows.map((doc) => {
              const isExpired = doc.currentVersion?.isExpired ?? false;
              return (
                <tr
                  key={doc.id}
                  className={`border-t hover:bg-muted/40 active:bg-muted cursor-pointer transition-colors ${isExpired ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}
                  onClick={() => onOpen(doc.id)}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-primary text-xs whitespace-nowrap">
                    {doc.code || <span className="text-muted-foreground italic font-sans font-normal">Sin código</span>}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium leading-tight line-clamp-1">{doc.name}</p>
                    {doc.moduleKey && (
                      <p className="text-xs text-muted-foreground mt-0.5">{moduleKeyLabel(doc.moduleKey)}</p>
                    )}
                    {/* Tipo visible en móvil */}
                    <div className="mt-0.5 sm:hidden">
                      <Badge variant="outline" className="text-xs">{doc.documentType?.name ?? "—"}</Badge>
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">{doc.documentType?.name ?? "—"}</Badge>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {doc.workArea ? `${doc.workArea.name} (${doc.workArea.code})` : "—"}
                  </td>

                  <td className="px-4 py-3 text-xs font-medium hidden sm:table-cell">
                    {doc.currentVersion
                      ? `v${doc.currentVersion.versionNumber}`
                      : <span className="text-muted-foreground italic">Sin versión</span>}
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {doc.currentVersion
                      ? `${formatDate(doc.currentVersion.validFrom)} – ${formatDate(doc.currentVersion.validUntil)}`
                      : <span className="italic">Pendiente</span>}
                  </td>

                  <td className="px-4 py-3">
                    {doc.currentVersion
                      ? statusBadge(isExpired, doc.isActive)
                      : <Badge variant="outline" className="text-xs">Sin archivo</Badge>}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); onOpen(doc.id); }}>
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Paginación (footer) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Label htmlFor="docs-page-size" className="text-xs">Filas por página</Label>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-16 h-8 text-xs" id="docs-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>«</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={pageIndex === 0}>‹</Button>
          <span className="px-3 py-1 rounded border text-xs font-medium min-w-[70px] text-center">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))} disabled={pageIndex >= pageCount - 1}>›</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>»</Button>
        </div>
      </div>
    </div>
  );
}
