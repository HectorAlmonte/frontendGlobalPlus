"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;

  searchPlaceholder?: string;
  emptyText?: string;

  fetcher: (q: string) => Promise<Option[]>;
  selectedLabel?: string; // ✅ opcional: para mostrar label aunque no esté en items
};

export default function SearchSelect({
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyText = "Sin resultados",
  fetcher,
  selectedLabel,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Option[]>([]);
  const [query, setQuery] = React.useState("");

  // ✅ evita refetch raro si fetcher cambia por render
  const fetcherRef = React.useRef(fetcher);
  React.useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return items.find((x) => x.value === value) ?? null;
  }, [items, value]);

  async function runFetch(q: string) {
    setLoading(true);
    try {
      const res = await fetcherRef.current(q);
      setItems(res);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ al abrir: trae lista inicial
  React.useEffect(() => {
    if (!open) return;
    setQuery("");      // limpia búsqueda
    runFetch("");      // trae primera lista (top 20)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ debounce al escribir
  React.useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      runFetch(query);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const buttonLabel = value
    ? selected?.label ?? selectedLabel ?? "Seleccionado"
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {buttonLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />

          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}

          <CommandEmpty>{emptyText}</CommandEmpty>

          <CommandGroup>
            {items.map((it) => (
              <CommandItem
                key={it.value}
                value={it.label}
                onSelect={() => {
                  onChange(it.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === it.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{it.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
