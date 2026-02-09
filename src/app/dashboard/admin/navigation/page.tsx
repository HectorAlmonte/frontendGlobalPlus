"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useWord } from "@/context/AppContext";
import { useRouter } from "next/navigation";

import type { NavSection, NavItem, NavRole } from "./_lib/types";
import {
  apiListSections,
  apiDeleteSection,
  apiDeleteItem,
  apiListRoles,
} from "./_lib/api";

import { resolveIcon } from "./_components/IconPicker";
import SectionFormDialog from "./_components/SectionFormDialog";
import ItemFormDialog from "./_components/ItemFormDialog";
import ItemRolesDialog from "./_components/ItemRolesDialog";

export default function AdminNavigationPage() {
  const { user, loadingUser } = useWord();
  const router = useRouter();

  const roleKey = (user as any)?.role?.key ?? "";
  const isAdmin = !loadingUser && roleKey === "ADMIN";

  // Redirect non-admin
  useEffect(() => {
    if (!loadingUser && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [loadingUser, isAdmin, router]);

  const [sections, setSections] = useState<NavSection[]>([]);
  const [roles, setRoles] = useState<NavRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Section dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<NavSection | null>(null);

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("");

  // Roles dialog
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [rolesItem, setRolesItem] = useState<NavItem | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "section" | "item"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [secs, rls] = await Promise.all([apiListSections(), apiListRoles()]);
      const sorted = (Array.isArray(secs) ? secs : []).sort((a, b) => a.order - b.order);
      sorted.forEach((s) => s.items.sort((a, b) => a.order - b.order));
      setSections(sorted);
      setRoles(Array.isArray(rls) ? rls : []);
    } catch (e: any) {
      toast.error(e?.message || "Error cargando navegacion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  /* ── Section actions ── */
  const openCreateSection = () => {
    setEditingSection(null);
    setSectionDialogOpen(true);
  };

  const openEditSection = (s: NavSection) => {
    setEditingSection(s);
    setSectionDialogOpen(true);
  };

  const handleSectionSuccess = () => {
    setSectionDialogOpen(false);
    setEditingSection(null);
    toast.success("Seccion guardada");
    reload();
  };

  /* ── Item actions ── */
  const openCreateItem = (sectionId: string) => {
    setEditingItem(null);
    setActiveSectionId(sectionId);
    setItemDialogOpen(true);
  };

  const openEditItem = (item: NavItem, sectionId: string) => {
    setEditingItem(item);
    setActiveSectionId(sectionId);
    setItemDialogOpen(true);
  };

  const handleItemSuccess = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
    toast.success("Item guardado");
    reload();
  };

  /* ── Roles actions ── */
  const openRoles = (item: NavItem) => {
    setRolesItem(item);
    setRolesDialogOpen(true);
  };

  const handleRolesSuccess = () => {
    setRolesDialogOpen(false);
    setRolesItem(null);
    toast.success("Roles actualizados");
    reload();
  };

  /* ── Delete ── */
  const askDelete = (type: "section" | "item", id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "section") {
        await apiDeleteSection(deleteTarget.id);
      } else {
        await apiDeleteItem(deleteTarget.id);
      }
      toast.success(`${deleteTarget.type === "section" ? "Seccion" : "Item"} eliminado`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingUser || !isAdmin) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Navegacion</h1>
          <p className="text-sm text-muted-foreground">
            Administra las secciones e items del sidebar.
          </p>
        </div>
        <Button onClick={openCreateSection}>
          <Plus className="mr-2 h-4 w-4" /> Nueva seccion
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Cargando secciones...
        </div>
      )}

      {/* Sections */}
      {!loading && sections.length === 0 && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          No hay secciones creadas.
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section) => {
          const SectionIcon = resolveIcon(section.icon);
          return (
            <Collapsible key={section.id} defaultOpen>
              <div className="rounded-xl border bg-card shadow-sm">
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                  {SectionIcon && <SectionIcon className="h-4 w-4 text-muted-foreground shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{section.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Orden: {section.order} &middot; {section.items.length} item{section.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditSection(section)} className="h-8 w-8 p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => askDelete("section", section.id, section.title)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  <Separator />

                  {/* Items */}
                  <div className="p-4 space-y-2">
                    {section.items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Sin items en esta seccion.
                      </p>
                    )}

                    {section.items.map((item) => {
                      const ItemIcon = resolveIcon(item.icon);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg border px-4 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          {ItemIcon && <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                          </div>

                          {/* Role badges */}
                          <div className="hidden sm:flex flex-wrap gap-1">
                            {item.roles.length === 0 && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Sin roles
                              </Badge>
                            )}
                            {item.roles.map((r) => (
                              <Badge key={r.roleId} variant="secondary" className="text-[10px]">
                                {r.role.key}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="sm" onClick={() => openRoles(item)} className="h-7 w-7 p-0" title="Gestionar roles">
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditItem(item, section.id)} className="h-7 w-7 p-0">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => askDelete("item", item.id, item.title)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => openCreateItem(section.id)}
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" /> Agregar item
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* ── Dialogs ── */}
      {sectionDialogOpen && (
        <SectionFormDialog
          key={editingSection?.id ?? "__new_section__"}
          open={sectionDialogOpen}
          editing={editingSection}
          onClose={() => { setSectionDialogOpen(false); setEditingSection(null); }}
          onSuccess={handleSectionSuccess}
        />
      )}

      {itemDialogOpen && (
        <ItemFormDialog
          key={editingItem?.id ?? "__new_item__"}
          open={itemDialogOpen}
          editing={editingItem}
          sectionId={activeSectionId}
          onClose={() => { setItemDialogOpen(false); setEditingItem(null); }}
          onSuccess={handleItemSuccess}
        />
      )}

      {rolesDialogOpen && (
        <ItemRolesDialog
          key={rolesItem?.id ?? "__roles__"}
          open={rolesDialogOpen}
          item={rolesItem}
          allRoles={roles}
          onClose={() => { setRolesDialogOpen(false); setRolesItem(null); }}
          onSuccess={handleRolesSuccess}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {deleteTarget?.type === "section" ? "seccion" : "item"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar &quot;{deleteTarget?.name}&quot;?
              {deleteTarget?.type === "section" && " Se eliminaran tambien todos sus items y roles asociados."}
              {" "}Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
