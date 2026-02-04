"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

import type { DocumentDetail, DocumentVersion } from "../_lib/types";
import {
  statusBadge,
  formatDate,
  formatFileSize,
  moduleKeyLabel,
} from "../_lib/utils";
import { apiDownloadVersion } from "../_lib/api";

import NewVersionDialog from "./NewVersionDialog";
import EditDocumentDialog from "./EditDocumentDialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  selectedId: string | null;

  detailLoading: boolean;
  detail: DocumentDetail | null;

  onReload: () => void;

  isAdmin: boolean;

  onNewVersion: (docId: string, file: File, notes?: string) => Promise<void>;
  onEditDocument: (
    docId: string,
    input: { name?: string; moduleKey?: string }
  ) => Promise<void>;
};

function pickFullName(u: any) {
  const emp = u?.employee;
  const nombres = emp?.nombres ?? "";
  const apellidos = emp?.apellidos ?? "";
  const full = `${nombres} ${apellidos}`.trim();
  return full || u?.username || u?.id || "\u2014";
}

export default function DocumentDetailSheet({
  open,
  onOpenChange,
  selectedId,
  detailLoading,
  detail,
  onReload,
  isAdmin,
  onNewVersion,
  onEditDocument,
}: Props) {
  const [newVersionOpen, setNewVersionOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [downloading, setDownloading] = React.useState<string | null>(null);

  const isExpired = detail?.currentVersion?.isExpired ?? false;

  const handleNewVersion = React.useCallback(
    async (file: File, notes?: string) => {
      if (!detail) return;
      setUploading(true);
      try {
        await onNewVersion(detail.id, file, notes);
        setNewVersionOpen(false);
        onReload();
      } catch (e) {
        console.error(e);
      } finally {
        setUploading(false);
      }
    },
    [detail, onNewVersion, onReload]
  );

  const handleEdit = React.useCallback(
    async (input: { name?: string; moduleKey?: string }) => {
      if (!detail) return;
      setSaving(true);
      try {
        await onEditDocument(detail.id, input);
        setEditOpen(false);
        onReload();
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [detail, onEditDocument, onReload]
  );

  const handleDownload = React.useCallback(
    async (version: DocumentVersion) => {
      if (version.isExpired) {
        alert("Esta versión está expirada. No se puede descargar.");
        return;
      }
      setDownloading(version.id);
      try {
        const blob = await apiDownloadVersion(version.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = version.fileName || "documento.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        alert(e?.message || "Error al descargar");
      } finally {
        setDownloading(null);
      }
    },
    []
  );

  const btnInteractive =
    "transition-all duration-150 hover:shadow-sm active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl p-0 h-dvh flex flex-col">
          {/* ===== HEADER STICKY ===== */}
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
            <div className="p-6">
              <SheetHeader>
                <SheetTitle>Detalle del documento</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2">
                  <span className="text-xs">
                    Código: {detail?.code ?? "\u2014"}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={onReload}
                  disabled={!selectedId || detailLoading}
                  className={btnInteractive}
                >
                  Recargar
                </Button>

                {isAdmin && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setEditOpen(true)}
                      disabled={!detail || detailLoading}
                      className={btnInteractive}
                    >
                      Editar
                    </Button>

                    <Button
                      onClick={() => setNewVersionOpen(true)}
                      disabled={!detail || detailLoading}
                      className={btnInteractive}
                    >
                      Nueva versión
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ===== BODY SCROLL ===== */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {detailLoading && (
                <div className="text-sm text-muted-foreground">
                  Cargando detalle...
                </div>
              )}

              {!detailLoading && !detail && (
                <div className="text-sm text-muted-foreground">
                  Selecciona un documento para ver el detalle.
                </div>
              )}

              {!detailLoading && detail && (
                <>
                  {/* Alerta expirado */}
                  {isExpired && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600 shrink-0" />
                        <div className="space-y-1">
                          <div className="font-medium text-red-900">
                            Documento expirado
                          </div>
                          <p className="text-red-700">
                            La versión actual ha superado su fecha de vigencia.
                            Sube una nueva versión para revalidar el documento.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info general */}
                  <Card className="border-muted/60">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Estado
                          </p>
                          {statusBadge(isExpired, detail.isActive)}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Tipo</p>
                          <p className="font-semibold tracking-wide">
                            {detail.documentType?.name ?? "\u2014"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Nombre</p>
                        <p className="text-base font-semibold">{detail.name}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Código
                          </p>
                          <p className="font-medium">{detail.code}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Área</p>
                          <p className="font-medium">
                            {detail.area?.name ?? "\u2014"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Módulo vinculado
                          </p>
                          <p className="font-medium">
                            {moduleKeyLabel(detail.moduleKey)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Versión actual
                          </p>
                          <p className="font-medium">
                            v{detail.currentVersion?.versionNumber ?? 0}
                          </p>
                        </div>
                      </div>

                      {detail.currentVersion && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Vigente desde
                              </p>
                              <p className="font-medium">
                                {formatDate(detail.currentVersion.validFrom)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Vigente hasta
                              </p>
                              <p className="font-medium">
                                {formatDate(detail.currentVersion.validUntil)}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardHeader>
                  </Card>

                  {/* Historial de versiones */}
                  <Card className="border-muted/60">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Historial de versiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detail.versions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sin versiones registradas.
                        </p>
                      ) : (
                        <div className="overflow-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                              <tr className="text-left">
                                <th className="px-3 py-2">Versión</th>
                                <th className="px-3 py-2">Archivo</th>
                                <th className="px-3 py-2">Vigencia</th>
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2">Subido por</th>
                                <th className="px-3 py-2">Notas</th>
                                <th className="px-3 py-2 text-right">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.versions.map((v) => (
                                <tr
                                  key={v.id}
                                  className={`border-t hover:bg-muted/30 ${
                                    v.isExpired ? "bg-red-50/60" : ""
                                  }`}
                                >
                                  <td className="px-3 py-2 font-mono font-medium">
                                    v{v.versionNumber}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="text-xs">
                                      {v.fileName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatFileSize(v.fileSize)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    {formatDate(v.validFrom)} -{" "}
                                    {formatDate(v.validUntil)}
                                  </td>
                                  <td className="px-3 py-2">
                                    {v.isExpired ? (
                                      <Badge variant="destructive">
                                        Expirado
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                        Vigente
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    {v.uploadedBy
                                      ? pickFullName(v.uploadedBy)
                                      : "\u2014"}
                                  </td>
                                  <td className="px-3 py-2 text-xs max-w-[160px] truncate">
                                    {v.notes ?? "\u2014"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownload(v)}
                                      disabled={
                                        v.isExpired ||
                                        downloading === v.id
                                      }
                                      title={
                                        v.isExpired
                                          ? "Versión expirada"
                                          : "Descargar"
                                      }
                                    >
                                      {downloading === v.id
                                        ? "..."
                                        : "Descargar"}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <NewVersionDialog
        open={newVersionOpen}
        onOpenChange={setNewVersionOpen}
        uploading={uploading}
        onUpload={handleNewVersion}
      />

      {detail && (
        <EditDocumentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          saving={saving}
          onSave={handleEdit}
          initialName={detail.name}
          initialModuleKey={detail.moduleKey}
        />
      )}
    </>
  );
}
