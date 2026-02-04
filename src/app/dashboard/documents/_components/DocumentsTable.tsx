"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          (x.area?.name ?? "").toLowerCase().includes(needle) ||
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

  // Reset page when filters change
  useMemo(() => { setPageIndex(0); }, [filtered.length, pageSize]);

  return (
    <div className="space-y-3">
      {/* -- Filtros -- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, código, área..."
            className="w-full sm:w-[260px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-8">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {documentTypes.map((dt) => (
                <SelectItem key={dt.id} value={dt.id}>
                  {dt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "ALL" | "VIGENTE" | "EXPIRADO")
            }
          >
            <SelectTrigger className="w-full sm:w-[140px] h-8">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="VIGENTE">Vigente</SelectItem>
              <SelectItem value="EXPIRADO">Expirado</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            ↻
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      {/* -- Tabla -- */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Versión</th>
              <th className="px-3 py-2">Vigencia</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {loading ? "Cargando..." : "No hay documentos para mostrar."}
                </td>
              </tr>
            )}

            {paginatedRows.map((doc) => {
              const isExpired = doc.currentVersion?.isExpired ?? false;
              return (
                <tr
                  key={doc.id}
                  className={`border-t hover:bg-muted/30 ${
                    isExpired ? "bg-red-50/60" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono font-medium text-primary">
                    {doc.code}
                  </td>

                  <td className="px-3 py-2">
                    <button
                      className="font-medium text-left hover:underline"
                      onClick={() => onOpen(doc.id)}
                    >
                      {doc.name}
                    </button>
                    {doc.moduleKey && (
                      <div className="text-xs text-muted-foreground">
                        {moduleKeyLabel(doc.moduleKey)}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <Badge variant="outline">
                      {doc.documentType?.name ?? "\u2014"}
                    </Badge>
                  </td>

                  <td className="px-3 py-2 text-xs">
                    {doc.area?.name ?? "\u2014"}
                  </td>

                  <td className="px-3 py-2 text-xs font-medium">
                    v{doc.currentVersion?.versionNumber ?? 0}
                  </td>

                  <td className="px-3 py-2 text-xs">
                    {doc.currentVersion
                      ? `${formatDate(doc.currentVersion.validFrom)} - ${formatDate(doc.currentVersion.validUntil)}`
                      : "\u2014"}
                  </td>

                  <td className="px-3 py-2">
                    {statusBadge(isExpired, doc.isActive)}
                  </td>

                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpen(doc.id)}
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -- Paginacion -- */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="docs-page-size" className="text-sm font-medium">
            Filas por pagina
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-16 sm:w-20 h-8" id="docs-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pagina {pageIndex + 1} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
}
