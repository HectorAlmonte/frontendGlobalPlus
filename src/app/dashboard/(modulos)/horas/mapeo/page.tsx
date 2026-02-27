"use client";

import { useEffect, useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2, AlertTriangle, Search } from "lucide-react";
import {
  apiListMappings,
  apiSearchStaff,
  apiCreateMapping,
  apiUpdateMapping,
  apiDeleteMapping,
} from "../_lib/api";
import type { BiometricMapping, CreateMappingInput } from "../_lib/types";

interface EmpOption {
  id: string;
  label: string;
}

export default function MapeoPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const [rows, setRows] = useState<BiometricMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [formBioId, setFormBioId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState<EmpOption[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmpOption | null>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<BiometricMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    apiListMappings()
      .then(setRows)
      .catch(() => toast.error("Error al cargar mapeos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    loadData();
  }, [canAccess, loadData]);

  // Search employees using the general staff search endpoint
  useEffect(() => {
    if (!showCreate || empSearch.length < 2) {
      setEmpResults([]);
      return;
    }
    const t = setTimeout(() => {
      setEmpLoading(true);
      apiSearchStaff(empSearch)
        .then(setEmpResults)
        .catch(() => {})
        .finally(() => setEmpLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch, showCreate]);

  async function handleCreate() {
    if (!formBioId.trim() || !selectedEmp) {
      toast.error("Completa el ID biométrico y selecciona un empleado");
      return;
    }
    const body: CreateMappingInput = {
      biometricId: formBioId.trim(),
      employeeId: selectedEmp.id,
      notes: formNotes.trim() || undefined,
    };
    setSubmitting(true);
    try {
      await apiCreateMapping(body);
      toast.success("Mapeo creado");
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear mapeo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(mapping: BiometricMapping) {
    try {
      await apiUpdateMapping(mapping.id, { isActive: !mapping.isActive });
      toast.success(mapping.isActive ? "Mapeo desactivado" : "Mapeo activado");
      loadData();
    } catch {
      toast.error("Error al actualizar mapeo");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteMapping(deleteTarget.id);
      toast.success("Mapeo eliminado");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.biometricId.toLowerCase().includes(q) ||
      r.employee.nombres.toLowerCase().includes(q) ||
      r.employee.apellidos.toLowerCase().includes(q) ||
      r.employee.dni.includes(q)
    );
  });

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-none">Mapeo biométrico</h1>
            <p className="text-xs text-muted-foreground mt-1">Vincula IDs del biométrico con empleados</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setFormBioId("");
              setFormNotes("");
              setEmpSearch("");
              setEmpResults([]);
              setSelectedEmp(null);
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo mapeo
          </Button>
        )}
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Buscar por ID, nombre o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <MapPin className="h-10 w-10" />
            <p className="text-sm">{rows.length === 0 ? "Sin mapeos registrados" : "Sin resultados"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>ID Biométrico</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm font-medium">{m.biometricId}</TableCell>
                    <TableCell>
                      {m.employee.nombres} {m.employee.apellidos}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{m.employee.dni}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Switch
                            checked={m.isActive}
                            onCheckedChange={() => handleToggleActive(m)}
                          />
                        )}
                        <span className={`text-xs ${m.isActive ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                          {m.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {m.notes ?? "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo mapeo biométrico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="bioId">ID biométrico <span className="text-red-500">*</span></Label>
              <Input
                id="bioId"
                value={formBioId}
                onChange={(e) => setFormBioId(e.target.value)}
                placeholder="001234"
                className="font-mono"
              />
            </div>

            {/* Employee search */}
            <div className="space-y-1.5">
              <Label>Empleado <span className="text-red-500">*</span></Label>
              {selectedEmp ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="text-sm">{selectedEmp.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => { setSelectedEmp(null); setEmpSearch(""); }}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="Buscar por nombre o DNI..."
                    />
                  </div>
                  {empLoading && <p className="text-xs text-muted-foreground px-1">Buscando...</p>}
                  {empResults.length > 0 && (
                    <div className="rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto">
                      {empResults.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          onClick={() => { setSelectedEmp(e); setEmpSearch(""); setEmpResults([]); }}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mapNotes">Notas (opcional)</Label>
              <Textarea
                id="mapNotes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Guardando..." : "Crear mapeo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar mapeo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Eliminar el mapeo del ID <strong className="font-mono">{deleteTarget?.biometricId}</strong> vinculado a{" "}
            <strong>{deleteTarget?.employee.nombres} {deleteTarget?.employee.apellidos}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
