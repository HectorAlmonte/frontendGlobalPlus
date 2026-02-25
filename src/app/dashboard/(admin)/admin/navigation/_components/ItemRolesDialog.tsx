"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import type { NavItem, NavRole } from "../_lib/types";
import { apiSetItemRoles } from "../_lib/api";

type Props = {
  open: boolean;
  item: NavItem | null;
  allRoles: NavRole[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function ItemRolesDialog({ open, item, allRoles, onClose, onSuccess }: Props) {
  const currentRoleIds = item?.roles?.map((r) => r.roleId) ?? [];
  const [selected, setSelected] = useState<string[]>(currentRoleIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (roleId: string) => {
    setSelected((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const submit = async () => {
    if (!item) return;
    setError("");
    try {
      setSaving(true);
      await apiSetItemRoles(item.id, selected);
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Error al guardar roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Roles de acceso</DialogTitle>
          <DialogDescription>
            {item?.title ?? "Item"} &mdash; selecciona los roles que pueden ver este item.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3 py-2">
          {allRoles.map((role) => (
            <div key={role.id} className="flex items-center gap-3">
              <Checkbox
                id={`role-${role.id}`}
                checked={selected.includes(role.id)}
                onCheckedChange={() => toggle(role.id)}
              />
              <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                <span className="font-medium">{role.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({role.key})</span>
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
