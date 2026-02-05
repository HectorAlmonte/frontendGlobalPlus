"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import WorkAreasTable from "./_components/WorkAreasTable";
import WorkAreaFormDialog from "./_components/WorkAreaFormDialog";

import type { WorkAreaRow } from "./_lib/types";

export default function WorkAreasPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<WorkAreaRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (a: WorkAreaRow) => {
    setEditing(a);
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSuccess = () => {
    closeModal();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-7">
      {/* ===== HEADER ===== */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Áreas de Trabajo
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de áreas de trabajo para clasificar documentos.
          </p>
        </div>

        <Button size="sm" onClick={openCreate} className="sm:min-w-[160px]">
          Nueva área de trabajo
        </Button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium">Listado</h2>
            <p className="text-xs text-muted-foreground">
              Áreas de trabajo disponibles para vincular documentos.
            </p>
          </div>
        </div>

        <Separator />

        <div className="p-4">
          <WorkAreasTable
            refreshKey={refreshKey}
            onCreateClick={openCreate}
            onEditClick={openEdit}
          />
        </div>
      </div>

      {/* ===== MODAL FORMULARIO ===== */}
      {showForm && (
        <WorkAreaFormDialog
          key={editing?.id ?? "__create__"}
          open={showForm}
          editing={editing}
          onSuccess={handleSuccess}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
