"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // 👁️ estados de visibilidad
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const minLen = 8;

  const validate = () => {
    if (!currentPassword || !newPassword || !confirm) {
      return "Completa todos los campos.";
    }
    if (newPassword.length < minLen) {
      return `La nueva contraseña debe tener al menos ${minLen} caracteres.`;
    }
    if (newPassword !== confirm) {
      return "La confirmación no coincide con la nueva contraseña.";
    }
    if (currentPassword === newPassword) {
      return "La nueva contraseña no puede ser igual a la actual.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setErr(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo cambiar la contraseña.");
      }

      setOk("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: any) {
      setErr(e.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    setShow,
    autoComplete,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    autoComplete?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cambiar contraseña
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualiza tu contraseña. Te pediremos tu contraseña actual por seguridad.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              setShow={setShowCurrent}
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="Nueva contraseña"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                setShow={setShowNew}
                autoComplete="new-password"
                placeholder={`Mínimo ${minLen} caracteres`}
              />

              <PasswordInput
                label="Confirmar nueva contraseña"
                value={confirm}
                onChange={setConfirm}
                show={showConfirm}
                setShow={setShowConfirm}
                autoComplete="new-password"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            {ok && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {ok}
              </div>
            )}
            {err && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirm("");
                  setOk(null);
                  setErr(null);
                }}
                disabled={loading}
              >
                Limpiar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
