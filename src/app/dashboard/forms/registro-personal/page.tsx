"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import StaffTable from "../StaffTable";
import DynamicFormRHF from "@/components/forms/DynamicFormRHF";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function RegistroPersonalPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ NUEVO: control del modo edición
  const [editingId, setEditingId] = useState<string | null>(null);

  // Abrir en modo crear
  const openCreate = () => {
    setEditingId(null);
    setShowForm(true);
  };

  // Abrir en modo editar
  const openEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const closePanel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleNew = () => {
    // si el panel está abierto, lo cierro
    // si está cerrado, abro en modo crear
    if (showForm) return closePanel();
    return openCreate();
  };

  const handleSuccess = () => {
    closePanel();
    setRefreshKey((k) => k + 1);
  };

  const isEdit = !!editingId;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-7">
      {/* ===== HEADER (ENTERPRISE) ===== */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Registro de personal
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de trabajadores y cuentas de acceso.
          </p>
        </div>

        <Button size="sm" onClick={handleNew} className="sm:min-w-[160px]">
          {showForm ? "Cerrar panel" : "Nuevo trabajador"}
        </Button>
      </div>

      <div className="space-y-5">
        {/* ===== TABLA (CARD ENTERPRISE) ===== */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-medium">Personal</h2>
              <p className="text-xs text-muted-foreground">
                Listado general de trabajadores registrados.
              </p>
            </div>

            {/* Estado sutil */}
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {showForm
                ? isEdit
                  ? "Editando trabajador"
                  : "Panel de alta abierto"
                : "Panel de alta cerrado"}
            </span>
          </div>

          <Separator />

          <div className="p-4">
            <StaffTable
              onCreateClick={openCreate}
              onEditClick={openEdit}
              refreshKey={refreshKey}
            />
          </div>
        </div>

        {/* ===== FORMULARIO (PANEL CONTEXTUAL ENTERPRISE) ===== */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border bg-card shadow-sm">
                {/* Accent bar delgado (enterprise) */}
                <div className="h-0.5 w-full bg-primary/70" />

                <div className="relative px-5 py-4 sm:px-6 sm:py-5">
                  {/* Fondo MUY sutil */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary))_0%,transparent_45%)] opacity-[0.07]" />

                  <div className="relative">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-medium">
                          {isEdit ? "Editar trabajador" : "Nuevo trabajador"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isEdit
                            ? "Actualiza los datos del trabajador."
                            : "Completa los datos para registrar personal y su acceso (si aplica)."}
                        </p>
                      </div>

                      <Button size="sm" variant="ghost" onClick={closePanel}>
                        Cerrar
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <DynamicFormRHF
                      slug="registro-personal"
                      onSuccess={handleSuccess}
                      // 👇 estos props los agregaremos en DynamicFormRHF
                      mode={isEdit ? "edit" : "create"}
                      recordId={editingId ?? undefined}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
