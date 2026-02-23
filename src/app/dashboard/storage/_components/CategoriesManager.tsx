"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiListCategories, apiCreateCategory, apiUpdateCategory } from "../_lib/api";
import type { StorageCategory } from "../_lib/types";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";

const initial = { name: "", description: "" };

export default function CategoriesManager() {
  const { user } = useWord();
  const canEdit = hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");

  const [items, setItems] = useState<StorageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StorageCategory | null>(null);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListCategories();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openCreate() {
    setEditing(null);
    setForm(initial);
    setOpen(true);
  }

  function openEdit(cat: StorageCategory) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? "" });
    setOpen(true);
  }

  function handleClose(v: boolean) {
    if (!v) {
      setOpen(false);
      setForm(initial);
      setEditing(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateCategory(editing.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Categoría actualizada");
      } else {
        await apiCreateCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Categoría creada");
      }
      setOpen(false);
      fetchList();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cat: StorageCategory) {
    setToggling(cat.id);
    try {
      await apiUpdateCategory(cat.id, { isActive: !cat.isActive });
      setItems((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(cat.isActive ? "Categoría desactivada" : "Categoría activada");
    } catch (err: any) {
      toast.error(err?.message || "Error al cambiar estado");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} categoría{items.length !== 1 ? "s" : ""}
        </p>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva categoría
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              {canEdit && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-10 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-10 text-muted-foreground">
                  Sin categorías. {canEdit && "Crea una para empezar."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {cat._count?.products ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Switch
                        checked={cat.isActive}
                        disabled={toggling === cat.id}
                        onCheckedChange={() => handleToggleActive(cat)}
                      />
                    ) : (
                      <Badge
                        variant={cat.isActive ? "outline" : "secondary"}
                        className={cat.isActive ? "text-green-700 border-green-300" : ""}
                      >
                        {cat.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="cat-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. EPP, Herramientas, Limpieza..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Descripción opcional..."
                rows={2}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
