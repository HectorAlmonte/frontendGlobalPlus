"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, PenLine } from "lucide-react";
import { toast } from "sonner";

import { SignaturePadCanvas } from "@/app/dashboard/(modulos)/epp/_components/SignaturePadCanvas";
import type { SignaturePadRef } from "@/app/dashboard/(modulos)/epp/_components/SignaturePadCanvas";

import { apiSignWorker, apiSignSecurity, apiSignSupervisor } from "../_lib/api";

type SignatureType = "worker" | "security" | "supervisor";

const TITLES: Record<SignatureType, string> = {
  worker: "Firma del operador",
  security: "Firma de seguridad",
  supervisor: "Firma del supervisor",
};

const INSTRUCTIONS: Record<SignatureType, string> = {
  worker: "El operador firma aquí confirmando que revisó el checklist.",
  security: "Seguridad certifica la revisión del equipo.",
  supervisor: "El supervisor aprueba y cierra el proceso.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  type: SignatureType;
  onSigned: () => void;
}

export default function SignatureDialog({
  open,
  onOpenChange,
  recordId,
  type,
  onSigned,
}: Props) {
  const padRef = useRef<SignaturePadRef>(null);
  const [signing, setSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = () => {
    padRef.current?.clear();
    setHasDrawn(false);
  };

  const handleConfirm = async () => {
    if (padRef.current?.isEmpty()) {
      toast.warning("Por favor firma en el área antes de confirmar.");
      return;
    }
    const dataUrl = padRef.current?.getDataURL();
    if (!dataUrl) {
      toast.warning("No se pudo capturar la firma.");
      return;
    }

    setSigning(true);
    try {
      if (type === "worker") {
        await apiSignWorker(recordId, dataUrl);
      } else if (type === "security") {
        await apiSignSecurity(recordId, dataUrl);
      } else {
        await apiSignSupervisor(recordId, dataUrl);
      }
      toast.success("Firma registrada correctamente");
      onSigned();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg || "Error al registrar la firma");
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!signing) {
          setHasDrawn(false);
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="w-full max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b bg-muted/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            {TITLES[type]}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{INSTRUCTIONS[type]}</p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            Firma con el dedo o el mouse en el área de abajo
          </p>

          {/* Canvas de firma — altura generosa para tablet/móvil */}
          <div className="rounded-lg overflow-hidden border border-muted-foreground/20 shadow-inner">
            <SignaturePadCanvas
              ref={padRef}
              height={260}
              onBegin={() => setHasDrawn(true)}
            />
          </div>

          {/* Instrucción de área táctil */}
          <p className="text-[11px] text-center text-muted-foreground">
            El área táctil captura la firma. Usa presión suave y continua.
          </p>
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-muted/20 flex-row justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={signing || !hasDrawn}
            className="h-11 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={signing}
              className="h-11"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={signing || !hasDrawn}
              className="h-11 gap-2 px-5"
            >
              {signing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar firma
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
