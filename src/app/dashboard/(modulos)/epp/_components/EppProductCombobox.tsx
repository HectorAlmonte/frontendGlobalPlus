"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { apiSearchEppProducts } from "../_lib/api";
import type { ProductOption } from "../_lib/types";

interface Props {
  kind: "CONSUMABLE" | "EQUIPMENT";
  value: string;
  label: string;
  placeholder?: string;
  onSelect: (product: ProductOption) => void;
  onClear: () => void;
}

export function EppProductCombobox({
  kind,
  value,
  label,
  placeholder,
  onSelect,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      apiSearchEppProducts(kind, query)
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query, kind]);

  const displayLabel =
    kind === "CONSUMABLE"
      ? placeholder ?? "Buscar consumible..."
      : placeholder ?? "Buscar equipo...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value ? label : displayLabel}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onClear();
                  }
                }}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onSelect(p);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === p.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{p.label}</span>
                      {kind === "CONSUMABLE" && (
                        <span className="text-xs text-muted-foreground">
                          Stock disponible: {p.currentStock} {p.unit}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
