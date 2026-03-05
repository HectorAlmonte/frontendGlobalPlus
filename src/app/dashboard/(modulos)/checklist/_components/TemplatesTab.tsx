"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings2,
  Trash2,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DestructiveDialog from "@/components/shared/DestructiveDialog";
import { apiListTemplates, apiUpdateTemplate, apiDeleteTemplate } from "../_lib/api";
import type { ChecklistTemplate } from "../_lib/types";

interface Props {
  refreshKey?: number;
  onConfigureItems: (template: ChecklistTemplate) => void;
  onRefresh: () => void;
}

export default function TemplatesTab({
  refreshKey = 0,
  onConfigureItems,
  onRefresh,
}: Props) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ChecklistTemplate | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiListTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (tpl: ChecklistTemplate) => {
    setTogglingId(tpl.id);
    try {
      await apiUpdateTemplate(tpl.id, { isActive: !tpl.isActive });
      toast.success(
        `Template ${!tpl.isActive ? "activado" : "desactivado"}`
      );
      onRefresh();
    } catch {
      toast.error("Error al actualizar el template");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeletingId(toDelete.id);
    try {
      await apiDeleteTemplate(toDelete.id);
      toast.success("Template eliminado");
      setToDelete(null);
      onRefresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("409") || msg.toLowerCase().includes("registros")) {
        toast.error("No se puede eliminar: el template tiene registros asociados");
      } else {
        toast.error("Error al eliminar el template");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <ClipboardList className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Sin templates</p>
        <p className="text-xs">Crea el primer template para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Equipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ítems</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Registros</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activo</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((tpl) => {
                const hasRecords = (tpl._count?.records ?? 0) > 0;
                return (
                  <tr key={tpl.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{tpl.name}</p>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {tpl.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {tpl.product.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">
                        {tpl._count?.items ?? tpl.items.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {tpl._count?.records ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={tpl.isActive}
                        disabled={togglingId === tpl.id}
                        onCheckedChange={() => handleToggle(tpl)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <DropdownMenuItem
                                    disabled={hasRecords}
                                    onSelect={() =>
                                      !hasRecords && onConfigureItems(tpl)
                                    }
                                    className="gap-2"
                                  >
                                    <Settings2 className="h-4 w-4" />
                                    Configurar ítems
                                  </DropdownMenuItem>
                                </span>
                              </TooltipTrigger>
                              {hasRecords && (
                                <TooltipContent side="left" className="max-w-[220px] text-xs">
                                  Este template ya tiene registros activos. Para
                                  modificar los criterios, crea un nuevo template.
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setToDelete(tpl)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile — card list */}
        <div className="sm:hidden divide-y">
          {templates.map((tpl) => {
            const hasRecords = (tpl._count?.records ?? 0) > 0;
            return (
              <div key={tpl.id} className="px-4 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {tpl.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <p className="font-medium text-sm leading-none truncate">{tpl.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tpl.product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tpl._count?.items ?? tpl.items.length} ítems ·{" "}
                    {tpl._count?.records ?? 0} registros
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      disabled={hasRecords}
                      onClick={() => !hasRecords && onConfigureItems(tpl)}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      {hasRecords ? "Bloqueado" : "Configurar"}
                    </Button>
                    <Switch
                      checked={tpl.isActive}
                      disabled={togglingId === tpl.id}
                      onCheckedChange={() => handleToggle(tpl)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive ml-auto"
                      onClick={() => setToDelete(tpl)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {hasRecords && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      Ítems bloqueados — tiene registros activos
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DestructiveDialog
        open={!!toDelete}
        onOpenChange={(open: boolean) => !open && setToDelete(null)}
        title="Eliminar template"
        description={`¿Eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        loading={!!deletingId}
        confirmLabel="Eliminar"
      />
    </>
  );
}
