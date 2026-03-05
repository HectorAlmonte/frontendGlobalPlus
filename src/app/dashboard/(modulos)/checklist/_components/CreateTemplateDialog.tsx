"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { apiSearchEquipmentProducts, apiCreateTemplate } from "../_lib/api";
import type { ChecklistTemplate, ProductOption } from "../_lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (template: ChecklistTemplate) => void;
}

export default function CreateTemplateDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setProductSearch("");
      setSelectedProduct(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    apiSearchEquipmentProducts(productSearch || undefined)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, [open, productSearch]);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedProduct) return;
    setSubmitting(true);
    try {
      const tpl = await apiCreateTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        productId: selectedProduct.id,
      });
      toast.success("Template creado. Ahora configura los ítems.");
      onCreated(tpl);
    } catch {
      toast.error("Error al crear el template");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim().length > 0 && !!selectedProduct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b bg-muted/30">
          <DialogTitle className="text-base">Nuevo template de checklist</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label>
              Nombre del template <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ej: Checklist Cargador Frontal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Descripción (opcional)</Label>
            <Textarea
              placeholder="Revisión diaria antes de operación"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Producto (tipo equipo) */}
          <div className="space-y-1.5">
            <Label>
              Tipo de equipo <span className="text-destructive">*</span>
            </Label>
            {selectedProduct ? (
              <div className="flex items-center gap-2 rounded-lg border bg-primary/5 border-primary px-3 py-2.5">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedProduct.code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar tipo de equipo…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border bg-muted/20 p-2">
                  {loadingProducts ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded" />
                    ))
                  ) : products.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin resultados
                    </p>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="w-full text-left rounded px-2 py-2 text-sm hover:bg-muted/60 active:bg-muted transition-colors"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{p.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="h-10 gap-1.5">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear y configurar ítems
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
