"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  value: { from?: Date; to?: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: Props) {
  const selected: DateRange | undefined =
    value.from || value.to ? { from: value.from, to: value.to } : undefined;

  const label =
    value.from && value.to
      ? `${format(value.from, "dd MMM yyyy", { locale: es })} - ${format(value.to, "dd MMM yyyy", { locale: es })}`
      : value.from
        ? format(value.from, "dd MMM yyyy", { locale: es })
        : "Seleccionar fechas";

  const hasValue = !!value.from || !!value.to;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal h-8 w-full",
              !hasValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            <span className="truncate text-xs">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(range) => {
              onChange({ from: range?.from, to: range?.to });
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange({})}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
