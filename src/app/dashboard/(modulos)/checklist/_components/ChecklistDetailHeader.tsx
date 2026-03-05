"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Wrench,
  Calendar,
  User,
  Layers,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatRecordDate, getUnitLabel, STEPPER_STEPS, getStatusStep } from "../_lib/utils";
import type { ChecklistRecord } from "../_lib/types";

interface Props {
  record: ChecklistRecord;
  onBack: () => void;
}

export default function ChecklistDetailHeader({ record, onBack }: Props) {
  const step = getStatusStep(record.status);

  return (
    <div className="space-y-3">
      {/* Nav + título */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-none truncate">
            {record.unit.product.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getUnitLabel(record.unit)}
            {record.unit.product.brand && ` · ${record.unit.product.brand}`}
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      {/* Alert crítico */}
      {record.hasCriticalIssues && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Ítems críticos fuera de conformidad
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
              Se generó un log de mantenimiento automáticamente.
            </p>
            {record.equipmentLogId && (
              <Link
                href={`/dashboard/storage/units/${record.unitId}`}
                className="text-xs font-medium text-red-700 dark:text-red-300 underline underline-offset-2 mt-1 inline-block"
              >
                Ver log de mantenimiento →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2.5 px-4 py-3 border-r border-b lg:border-b-0">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="text-sm font-medium">{formatRecordDate(record.date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-4 py-3 border-b lg:border-b-0 lg:border-r">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Operador</p>
              <p className="text-sm font-medium leading-tight">
                {record.operator.nombres} {record.operator.apellidos}
              </p>
              <p className="text-xs text-muted-foreground">{record.operator.dni}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-4 py-3 border-r lg:border-r">
            <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Template</p>
              <p className="text-sm font-medium truncate">{record.template.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-4 py-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Área</p>
              <p className="text-sm font-medium">{record.area?.name ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border bg-card shadow-sm px-4 py-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPPER_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs hidden sm:inline whitespace-nowrap ${
                  i === step ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < STEPPER_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 sm:w-10 rounded mx-1 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
