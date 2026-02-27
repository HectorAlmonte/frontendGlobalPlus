"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";

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
  const [error, setError] = useState(false);

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
    setError(false);
    try {
      const data = await apiListDocuments();
      setItems(data);
    } catch (e: any) {
      setError(true);
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
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Control Documental</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de documentos, versiones y vigencias
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => setOpenCreate(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo documento</span>
          </Button>
        )}
      </div>

      {/* ===== TABLA ===== */}
      <DocumentsTable
        loading={loading}
        error={error}
        items={items}
        documentTypes={documentTypes}
        onOpen={(id) => {
          setSelectedId(id);
          setOpenSheet(true);
        }}
        onRefresh={fetchList}
      />

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
