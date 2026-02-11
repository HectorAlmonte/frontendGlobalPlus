"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  activeCount?: number;
  onClear?: () => void;
  children: React.ReactNode;
};

export function FilterPopover({ activeCount = 0, onClear, children }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Filtros</h4>
          {activeCount > 0 && onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
        <Separator className="my-3" />
        <div className="space-y-4">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
