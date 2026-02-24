"use client";

import * as React from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Info,
  History,
  Pencil,
  Loader2,
} from "lucide-react";

import type { DocumentDetail, DocumentType, DocumentVersion } from "../_lib/types";
import { statusBadge, formatDate, formatFileSize, moduleKeyLabel } from "../_lib/utils";
import { apiDownloadVersion } from "../_lib/api";

import NewVersionDialog from "./NewVersionDialog";
import EditDocumentDialog, { type EditDocumentInput } from "./EditDocumentDialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedId: string | null;
  detailLoading: boolean;
  detail: DocumentDetail | null;
  onReload: () => void;
  isAdmin: boolean;
  documentTypes: DocumentType[];
  onNewVersion: (docId: string, file: File, notes?: string) => Promise<void>;
  onEditDocument: (docId: string, input: EditDocumentInput) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
};

function pickFullName(u: any) {
  const emp = u?.employee;
  const full = `${emp?.nombres ?? ""} ${emp?.apellidos ?? ""}`.trim();
  return full || u?.username || u?.id || "—";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export default function DocumentDetailSheet({
  open,
  onOpenChange,
  selectedId,
  detailLoading,
  detail,
  onReload,
  isAdmin,
  documentTypes,
  onNewVersion,
  onEditDocument,
  onDeleteDocument,
}: Props) {
  const [newVersionOpen, setNewVersionOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const isExpired = detail?.currentVersion?.isExpired ?? false;

  const handleNewVersion = React.useCallback(async (file: File, notes?: string) => {
    if (!detail) return;
    setUploading(true);
    try {
      await onNewVersion(detail.id, file, notes);
      setNewVersionOpen(false);
      onReload();
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  }, [detail, onNewVersion, onReload]);

  const handleEdit = React.useCallback(async (input: EditDocumentInput) => {
    if (!detail) return;
    setSaving(true);
    try {
      await onEditDocument(detail.id, input);
      setEditOpen(false);
      onReload();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }, [detail, onEditDocument, onReload]);

  const handleDelete = React.useCallback(async () => {
    if (!detail) return;
    setDeleting(true);
    try {
      await onDeleteDocument(detail.id);
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }, [detail, onDeleteDocument, onOpenChange]);

  const handleDownload = React.useCallback(async (version: DocumentVersion) => {
    if (version.isExpired) { toast.error("Esta versión está expirada. No se puede descargar."); return; }
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
      toast.success("Archivo descargado");
    } catch (e: any) {
      toast.error(e?.message || "Error al descargar el archivo");
    } finally { setDownloading(null); }
  }, []);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl p-0 h-dvh flex flex-col">

          {/* ── Sticky header ── */}
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 sm:px-6 py-3 flex flex-col gap-3">
            {/* Fila 1: volver + código + acciones admin */}
            <div className="flex items-center justify-between gap-3">
              <SheetClose asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-1 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver a documentos</span>
                  <span className="sm:hidden">Volver</span>
                </Button>
              </SheetClose>

              <p className="text-sm font-semibold truncate">
                {detail ? detail.name : "Detalle del documento"}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && detail && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setEditOpen(true)} disabled={detailLoading}>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button size="sm" className="h-8" onClick={() => setNewVersionOpen(true)} disabled={detailLoading}>
                      Nueva versión
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Fila 2: eliminar (solo admin) */}
            {isAdmin && detail && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteOpen(true)}
                  disabled={detailLoading}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar documento
                </Button>
              </div>
            )}
          </div>

          {/* ── Body scrollable ── */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-3xl mx-auto space-y-4">

              {detailLoading && (
                <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando detalle...
                </div>
              )}

              {!detailLoading && !detail && (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  Selecciona un documento para ver el detalle.
                </div>
              )}

              {!detailLoading && detail && (
                <>
                  {/* Alerta expirado */}
                  {isExpired && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-semibold text-red-900 dark:text-red-300 text-sm">Documento expirado</p>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            La versión actual ha superado su fecha de vigencia. Sube una nueva versión para revalidar el documento.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Card: Información general ── */}
                  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Info className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold leading-none">Información General</p>
                      </div>
                      {statusBadge(isExpired, detail.isActive)}
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre</p>
                        <p className="text-base font-semibold mt-0.5">{detail.name}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <Field label="Código">
                          <p className="font-semibold font-mono">{detail.code || "—"}</p>
                        </Field>
                        <Field label="Tipo de documento">
                          <Badge variant="outline">{detail.documentType?.name ?? "—"}</Badge>
                        </Field>
                        <Field label="Área de trabajo">
                          <p className="font-medium">
                            {detail.workArea ? `${detail.workArea.name} (${detail.workArea.code})` : "—"}
                          </p>
                        </Field>
                        <Field label="Módulo vinculado">
                          <p className="font-medium">{moduleKeyLabel(detail.moduleKey)}</p>
                        </Field>
                        <Field label="Versión actual">
                          <p className="font-semibold">
                            {detail.currentVersion ? `v${detail.currentVersion.versionNumber}` : "Sin versión"}
                          </p>
                        </Field>
                        {detail.currentVersion && (
                          <>
                            <Field label="Vigente desde">
                              <p className="font-medium">{formatDate(detail.currentVersion.validFrom)}</p>
                            </Field>
                            <Field label="Vigente hasta">
                              <p className="font-medium">{formatDate(detail.currentVersion.validUntil)}</p>
                            </Field>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Card: Historial de versiones ── */}
                  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <History className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold leading-none">Historial de versiones</p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        {detail.versions.length} versión{detail.versions.length !== 1 ? "es" : ""}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      {detail.versions.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-5 py-8 text-center">Sin versiones registradas.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30">
                            <tr className="text-left border-b">
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Versión</th>
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Archivo</th>
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">Vigencia</th>
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">Estado</th>
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Subido por</th>
                              <th className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.versions.map((v) => (
                              <tr key={v.id} className={`border-t hover:bg-muted/40 transition-colors ${v.isExpired ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                                <td className="px-4 py-3 font-mono font-semibold text-primary">v{v.versionNumber}</td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <p className="text-xs font-medium truncate max-w-[180px]">{v.fileName}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(v.fileSize)}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                                  {formatDate(v.validFrom)} – {formatDate(v.validUntil)}
                                </td>
                                <td className="px-4 py-3">
                                  {v.isExpired
                                    ? <Badge variant="destructive" className="text-xs">Expirado</Badge>
                                    : <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">Vigente</Badge>}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                                  {v.uploadedBy ? pickFullName(v.uploadedBy) : "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => handleDownload(v)}
                                    disabled={v.isExpired || downloading === v.id}
                                    title={v.isExpired ? "Versión expirada" : "Descargar"}
                                  >
                                    {downloading === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Descargar"}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="h-4" />
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <NewVersionDialog open={newVersionOpen} onOpenChange={setNewVersionOpen} uploading={uploading} onUpload={handleNewVersion} />

      {detail && (
        <EditDocumentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          saving={saving}
          onSave={handleEdit}
          documentTypes={documentTypes}
          initialName={detail.name}
          initialCode={detail.code}
          initialDocumentTypeId={detail.documentType?.id ?? ""}
          initialWorkAreaId={detail.workArea?.id ?? ""}
          initialWorkAreaLabel={detail.workArea ? `${detail.workArea.name} (${detail.workArea.code})` : ""}
          initialModuleKey={detail.moduleKey}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el documento{" "}
              <strong>{detail?.name}</strong>? Esta acción no se puede deshacer y se eliminarán todas sus versiones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
