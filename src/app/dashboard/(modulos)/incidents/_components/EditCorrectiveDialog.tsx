"use client";

import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiPatchCorrective } from "../_lib/api";
import { X, Users, Search } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

async function apiSearchStaff(q: string): Promise<{ value: string; label: string }[]> {
  const url = new URL(`${API_BASE}/api/staff/search`);
  if (q.trim()) url.searchParams.set("q", q.trim());
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.label),
  }));
}

type Priority = "BAJA" | "MEDIA" | "ALTA";

type ResponsibleOption = { value: string; label: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incidentId: string | null;
  corrective: {
    priority: Priority;
    dueDate?: string | null;
    detail: string;
    responsible?: { id: string; nombres: string; apellidos: string }[];
  } | null;
  onSaved: () => void;
};

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function dateInputToIsoUtc(dateStr?: string | null) {
  const s = String(dateStr || "").trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

export default function EditCorrectiveDialog({
  open,
  onOpenChange,
  incidentId,
  corrective,
  onSaved,
}: Props) {
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const [dueDate, setDueDate] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Responsables
  const [responsibles, setResponsibles] = useState<ResponsibleOption[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffResults, setStaffResults] = useState<ResponsibleOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const staffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (staffDebounceRef.current) clearTimeout(staffDebounceRef.current);
    if (!staffSearch.trim()) { setStaffResults([]); return; }
    staffDebounceRef.current = setTimeout(async () => {
      setStaffLoading(true);
      try { setStaffResults(await apiSearchStaff(staffSearch)); }
      finally { setStaffLoading(false); }
    }, 300);
  }, [staffSearch]);

  function addResponsible(opt: ResponsibleOption) {
    if (responsibles.some((r) => r.value === opt.value)) return;
    setResponsibles((prev) => [...prev, opt]);
    setStaffSearch("");
    setStaffResults([]);
  }

  function removeResponsible(id: string) {
    setResponsibles((prev) => prev.filter((r) => r.value !== id));
  }

  useEffect(() => {
    if (open && corrective) {
      setPriority(corrective.priority);
      setDueDate(toDateInput(corrective.dueDate));
      setDetail(corrective.detail ?? "");
      setErr(null);
      setResponsibles(
        (corrective.responsible ?? []).map((r) => ({
          value: r.id,
          label: `${r.nombres} ${r.apellidos}`.trim(),
        }))
      );
      setStaffSearch("");
      setStaffResults([]);
    }
  }, [open, corrective]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const canSubmit = detail.trim().length >= 10 && !!incidentId;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setErr(null);

    try {
      await apiPatchCorrective(incidentId!, {
        priority,
        dueDate: dateInputToIsoUtc(dueDate) ?? null,
        detail: detail.trim(),
        responsibleIds: responsibles.map((r) => r.value),
      });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (saving) return; onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar correctivo</DialogTitle>
          <DialogDescription>
            Modifica la acción correctiva, prioridad o fecha tentativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {err && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAJA">Baja</SelectItem>
                <SelectItem value="MEDIA">Media</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha tentativa (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* ── Responsables ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Responsables (opcional)
            </Label>

            {responsibles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {responsibles.map((r) => (
                  <span key={r.value} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {r.label}
                    <button type="button" onClick={() => removeResponsible(r.value)} disabled={saving} className="ml-0.5 text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar empleado por nombre o DNI..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                disabled={saving}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {(staffResults.length > 0 || staffLoading) && (
              <div className="rounded-lg border bg-popover shadow-md overflow-hidden max-h-48 overflow-y-auto">
                {staffLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Buscando...</p>}
                {staffResults.map((opt) => {
                  const already = responsibles.some((r) => r.value === opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={already || saving}
                      onClick={() => addResponsible(opt)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {opt.label}
                      {already && <span className="ml-2 text-xs text-muted-foreground">(ya añadido)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Detalle del correctivo</Label>
            <Textarea
              rows={5}
              placeholder="Describe qué se hará, responsables, materiales, etc."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={saving}
            />
            {detail.trim().length > 0 && detail.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Mínimo 10 caracteres.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
