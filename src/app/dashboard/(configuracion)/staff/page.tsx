"use client";

import { useState } from "react";

import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

import StaffTable from "./_components/StaffTable";
import StaffFormDialog from "./_components/StaffFormDialog";

import type { StaffRow } from "./_lib/types";

export default function StaffPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<StaffRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (s: StaffRow) => {
    setEditing(s);
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
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Registro de Personal</h1>
            <p className="text-sm text-muted-foreground">Gestión de trabajadores, roles y cuentas de acceso.</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo trabajador</span>
        </Button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Personal registrado</p>
        </div>

        <div className="p-4">
          <StaffTable
            refreshKey={refreshKey}
            onEditClick={openEdit}
          />
        </div>
      </div>

      {/* ===== MODAL FORMULARIO ===== */}
      {showForm && (
        <StaffFormDialog
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
