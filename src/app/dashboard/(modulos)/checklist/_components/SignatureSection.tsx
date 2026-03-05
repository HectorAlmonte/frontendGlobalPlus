"use client";

import { useState } from "react";
import { PenLine, Lock, CheckCircle2, User, Shield, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWord } from "@/context/AppContext";
import { hasRole } from "@/lib/utils";

import {
  canSignWorker,
  canSignSecurity,
  canSignSupervisor,
  getSignatureUrl,
  formatDateTime,
} from "../_lib/utils";
import type { ChecklistRecord } from "../_lib/types";
import SignatureDialog from "./SignatureDialog";

type SignatureType = "worker" | "security" | "supervisor";

interface SignatureBlockProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  signature: string | null;
  signedAt: string | null;
  signedBy?: string | null;
  canSign: boolean;
  onSign: () => void;
  step: number;
  currentStep: number;
}

function SignatureBlock({
  icon,
  title,
  subtitle,
  signature,
  signedAt,
  signedBy,
  canSign,
  onSign,
  step,
  currentStep,
}: SignatureBlockProps) {
  const isSigned = !!signature;
  const isPending = !isSigned && step === currentStep;
  const isLocked = !isSigned && step > currentStep;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isSigned
          ? "border-green-200 dark:border-green-800"
          : isPending
          ? "border-primary/40"
          : "border-muted"
      }`}
    >
      {/* Header del bloque */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b ${
          isSigned
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : isPending
            ? "bg-primary/5 border-primary/20"
            : "bg-muted/30"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isSigned
              ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              : isPending
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isSigned ? <CheckCircle2 className="h-4 w-4" /> : icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Estado badge */}
        {isSigned ? (
          <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full shrink-0">
            Firmado
          </span>
        ) : isPending ? (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
            Pendiente
          </span>
        ) : (
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {isSigned ? (
          <div className="space-y-3">
            {/* Imagen de la firma */}
            <div className="rounded-lg border bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSignatureUrl(signature)!}
                alt={`Firma — ${title}`}
                className="w-full h-28 object-contain"
              />
            </div>
            {/* Meta de la firma */}
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {signedBy && <p>Por: <span className="font-medium text-foreground">{signedBy}</span></p>}
              {signedAt && <p>{formatDateTime(signedAt)}</p>}
            </div>
          </div>
        ) : isPending && canSign ? (
          <div className="space-y-3">
            {/* Placeholder del área de firma */}
            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 h-24 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center px-4">
                Toca el botón para capturar la firma
              </p>
            </div>
            <Button
              onClick={onSign}
              className="w-full h-11 gap-2"
              size="lg"
            >
              <PenLine className="h-4 w-4" />
              Firmar ahora
            </Button>
          </div>
        ) : isPending && !canSign ? (
          <div className="rounded-lg border-2 border-dashed border-muted h-24 flex flex-col items-center justify-center gap-1.5">
            <PenLine className="h-5 w-5 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground text-center px-4">
              No tienes permiso para esta firma
            </p>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-muted h-20 flex flex-col items-center justify-center gap-1.5">
            <Lock className="h-5 w-5 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">
              Esperando paso anterior
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Valor numérico del estado para comparar pasos ─────────────────────────

function currentStep(record: ChecklistRecord): number {
  switch (record.status) {
    case "ASSIGNED":
    case "FILLED":
    case "NO_CONFORME":
      return 0; // turno firma trabajador
    case "WORKER_SIGNED":
      return 1; // turno firma seguridad
    case "SECURITY_SIGNED":
      return 2; // turno firma supervisor
    case "COMPLETED":
      return 3; // todo firmado
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  record: ChecklistRecord;
  onRefresh: () => void;
}

export default function SignatureSection({ record, onRefresh }: Props) {
  const { user } = useWord();
  const [signingType, setSigningType] = useState<SignatureType | null>(null);

  const roles = (user as any)?.roles?.map((r: any) => r.key as string) ??
    ((user as any)?.role?.key ? [(user as any).role.key as string] : []);

  const step = currentStep(record);

  const workerCanSign = canSignWorker(record.status);
  const securityCanSign = canSignSecurity(roles, record.status);
  const supervisorCanSign = canSignSupervisor(roles, record.status);

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header de sección */}
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            3
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-none">Firmas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {record.status === "COMPLETED"
                ? "Proceso completado — todas las firmas registradas"
                : "Se requieren 3 firmas para cerrar el proceso"}
            </p>
          </div>
        </div>

        {/* Bloques de firma — 3 col en tablet, 1 col en mobile y en xl (columna lateral) */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
          {/* Firma 1 — Operador */}
          <SignatureBlock
            icon={<User className="h-4 w-4" />}
            title="Operador"
            subtitle={`${record.operator.nombres} ${record.operator.apellidos}`}
            signature={record.workerSignature}
            signedAt={record.workerSignedAt}
            canSign={workerCanSign}
            onSign={() => setSigningType("worker")}
            step={0}
            currentStep={step}
          />

          {/* Firma 2 — Seguridad */}
          <SignatureBlock
            icon={<Shield className="h-4 w-4" />}
            title="Seguridad"
            subtitle="SEGURIDAD · SUPERVISOR · ADMIN"
            signature={record.securitySignature}
            signedAt={record.securitySignedAt}
            signedBy={record.securitySignedBy?.username}
            canSign={securityCanSign}
            onSign={() => setSigningType("security")}
            step={1}
            currentStep={step}
          />

          {/* Firma 3 — Supervisor */}
          <SignatureBlock
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Supervisor"
            subtitle="SUPERVISOR · ADMIN"
            signature={record.supervisorSignature}
            signedAt={record.supervisorSignedAt}
            signedBy={record.supervisorSignedBy?.username}
            canSign={supervisorCanSign}
            onSign={() => setSigningType("supervisor")}
            step={2}
            currentStep={step}
          />
        </div>

        {/* Nota firma del trabajador */}
        {!record.workerSignature && (
          <div className="px-5 py-3 border-t bg-amber-50 dark:bg-amber-900/10">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Nota:</span> El operador firma directamente en este
              dispositivo. Entrégale la tablet/pantalla para que firme con el dedo.
            </p>
          </div>
        )}
      </div>

      {/* Dialog de firma */}
      {signingType && (
        <SignatureDialog
          open={!!signingType}
          onOpenChange={(open) => !open && setSigningType(null)}
          recordId={record.id}
          type={signingType}
          onSigned={() => {
            setSigningType(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
