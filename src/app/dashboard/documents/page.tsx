"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import DocumentsTable from "./_components/DocumentsTable";
import DocumentDetailSheet from "./_components/DocumentDetailSheet";
import CreateDocumentDialog from "./_components/CreateDocumentDialog";

import type {
  DocumentRow,
  DocumentDetail,
  DocumentType,
  CreateDocumentInput,
} from "./_lib/types";

import {
  apiListDocuments,
  apiGetDocument,
  apiCreateDocument,
  apiUpdateDocument,
  apiDeleteDocument,
  apiCreateNewVersion,
  apiListDocumentTypes,
} from "./_lib/api";

import { useWord } from "@/context/AppContext";

export default function DocumentsPage() {
  const { user, loadingUser } = useWord();

  const roleKey = (user as any)?.role?.key ?? "";
  const isAdmin = !loadingUser && roleKey === "ADMIN";

  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const [openSheet, setOpenSheet] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  /* ── Loaders ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListDocuments();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.message || "Error al listar documentos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const data = await apiListDocumentTypes();
      setDocumentTypes(data);
    } catch (e: any) {
      toast.error(e?.message || "Error al cargar tipos de documento");
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await apiGetDocument(id);
      setDetail(data);
    } catch (e: any) {
      toast.error(e?.message || "Error al cargar detalle del documento");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const reloadDetail = useCallback(async () => {
    if (!selectedId) return;
    await fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  useEffect(() => {
    fetchList();
    fetchDocumentTypes();
  }, [fetchList, fetchDocumentTypes]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  /* ── Handlers ── */
  async function handleCreate(input: CreateDocumentInput) {
    setCreating(true);
    try {
      await apiCreateDocument({
        name: input.name,
        documentTypeId: input.documentTypeId,
        workAreaId: input.workAreaId,
        moduleKey: input.moduleKey === "__none" ? "" : input.moduleKey,
        notes: input.notes,
        file: input.file ?? undefined,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        code: input.code || undefined,
      });
      setOpenCreate(false);
      toast.success("Documento creado correctamente");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Error al crear documento");
    } finally {
      setCreating(false);
    }
  }

  async function handleNewVersion(docId: string, file: File, notes?: string) {
    try {
      await apiCreateNewVersion(docId, file, notes);
      toast.success("Nueva versión subida correctamente");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Error al subir nueva versión");
      throw e;
    }
  }

  async function handleEditDocument(
    docId: string,
    input: {
      name?: string;
      moduleKey?: string;
      code?: string;
      documentTypeId?: string;
      workAreaId?: string;
    }
  ) {
    try {
      await apiUpdateDocument(docId, input);
      toast.success("Documento actualizado correctamente");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Error al actualizar documento");
      throw e;
    }
  }

  async function handleDeleteDocument(docId: string) {
    try {
      await apiDeleteDocument(docId);
      setSelectedId(null);
      setDetail(null);
      toast.success("Documento eliminado correctamente");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar documento");
      throw e;
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Control Documental
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de documentos, versiones y vigencias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={() => setOpenCreate(true)}>
              Nuevo Documento
            </Button>
          )}
        </div>
      </div>

      {/* ===== TABLA ===== */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold">Listado de documentos</h2>
            <p className="text-xs text-muted-foreground">
              Mostrando todos los documentos registrados.
            </p>
          </div>
        </div>

        <Separator />

        <div className="p-4">
          <DocumentsTable
            loading={loading}
            items={items}
            documentTypes={documentTypes}
            onOpen={(id) => {
              setSelectedId(id);
              setOpenSheet(true);
            }}
            onRefresh={fetchList}
          />
        </div>
      </div>

      {/* ===== PANEL DETALLE ===== */}
      <DocumentDetailSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        selectedId={selectedId}
        detailLoading={detailLoading}
        detail={detail}
        onReload={reloadDetail}
        isAdmin={isAdmin}
        documentTypes={documentTypes}
        onNewVersion={handleNewVersion}
        onEditDocument={handleEditDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* ===== CREAR DOCUMENTO ===== */}
      <CreateDocumentDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        creating={creating}
        onCreate={handleCreate}
        documentTypes={documentTypes}
      />
    </div>
  );
}
