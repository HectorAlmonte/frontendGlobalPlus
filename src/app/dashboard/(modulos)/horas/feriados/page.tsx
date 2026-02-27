"use client";

import { useEffect, useState, useCallback } from "react";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from "lucide-react";
import { apiListFeriados, apiCreateFeriado, apiDeleteFeriado } from "../_lib/api";
import type { Holiday, CreateFeriadoInput } from "../_lib/types";

function formatDateDisplay(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

export default function FeriadosPage() {
  const { user } = useWord();
  const isAdmin = hasRole(user, "ADMIN");
  const isSupervisor = hasRole(user, "SUPERVISOR");
  const canAccess = isAdmin || isSupervisor;

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formName, setFormName] = useState("");
  const [formNational, setFormNational] = useState(false);
  const [formRecurring, setFormRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    apiListFeriados(year)
      .then(setRows)
      .catch(() => toast.error("Error al cargar feriados"))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    if (!canAccess) return;
    loadData();
  }, [canAccess, loadData]);

  async function handleCreate() {
    if (!formDate || !formName.trim()) {
      toast.error("Completa la fecha y el nombre");
      return;
    }
    const body: CreateFeriadoInput = {
      date: formDate,
      name: formName.trim(),
      isNational: formNational,
      isRecurring: formRecurring,
    };
    setSubmitting(true);
    try {
      await apiCreateFeriado(body);
      toast.success("Feriado agregado");
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear feriado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteFeriado(deleteTarget.id);
      toast.success("Feriado eliminado");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" />
        <p className="text-sm">No tienes permiso para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20">
            <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-none">Feriados</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestión de feriados nacionales y de empresa</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setFormDate(`${year}-01-01`);
              setFormName("");
              setFormNational(false);
              setFormRecurring(false);
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar feriado
          </Button>
        )}
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold w-16 text-center">{year}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {year !== currentYear && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setYear(currentYear)}>
            Año actual
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} feriado(s)</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Calendar className="h-10 w-10" />
            <p className="text-sm">Sin feriados registrados para {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>¿Recurrente?</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-sm">{formatDateDisplay(h.date)}</TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      {h.isNational ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                          Nacional
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 text-xs font-medium">
                          Empresa
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {h.isRecurring ? (
                        <span className="text-xs text-green-700 dark:text-green-400">Sí</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {!h.isNational && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={() => setDeleteTarget(h)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
            <DialogTitle>Agregar feriado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="fDate">Fecha <span className="text-red-500">*</span></Label>
              <Input
                id="fDate"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fName">Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="fName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Día de la Independencia"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="fRecurring" checked={formRecurring} onCheckedChange={setFormRecurring} />
              <Label htmlFor="fRecurring" className="cursor-pointer">Se repite cada año</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar feriado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Eliminar el feriado <strong>{deleteTarget?.name}</strong> ({deleteTarget?.date})?
            Esta acción no se puede deshacer.
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
