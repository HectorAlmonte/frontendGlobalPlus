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
  allowClear?: boolean; // ✅ opcional: permitir limpiar
};

export default function SearchSelect({
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyText = "Sin resultados",
  fetcher,
  selectedLabel,
  allowClear = false,
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

  // ✅ evita setState luego de un unmount / popover close rápido
  const aliveRef = React.useRef(true);
  React.useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return items.find((x) => x.value === value) ?? null;
  }, [items, value]);

  const buttonLabel = value
    ? selected?.label ?? selectedLabel ?? "Seleccionado"
    : placeholder;

  async function runFetch(q: string) {
    setLoading(true);
    try {
      const res = await fetcherRef.current(q);
      if (!aliveRef.current) return;
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      if (!aliveRef.current) return;
      setItems([]);
    } finally {
      if (!aliveRef.current) return;
      setLoading(false);
    }
  }

  // ✅ al abrir: lista inicial (sin duplicar llamadas)
  React.useEffect(() => {
    if (!open) return;

    setQuery(""); // limpia búsqueda
    runFetch(""); // trae primera lista

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ debounce al escribir (pero no dispara por el setQuery("") del open)
  const didOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (!open) {
      didOpenRef.current = false;
      return;
    }

    // la primera vez que abre ya hicimos runFetch("")
    if (!didOpenRef.current) {
      didOpenRef.current = true;
      return;
    }

    const t = setTimeout(() => {
      runFetch(query);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {buttonLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />

          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <CommandEmpty>{emptyText}</CommandEmpty>
          ) : null}

          <CommandGroup>
            {allowClear && value ? (
              <CommandItem
                key="__clear__"
                value="__clear__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <span className="truncate text-muted-foreground">
                  Limpiar selección
                </span>
              </CommandItem>
            ) : null}

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
