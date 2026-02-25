"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Printer,
  PenLine,
  Eraser,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  User,
  Package,
  FileSignature,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SignaturePadCanvas, SignaturePadRef } from "./SignaturePadCanvas";
import { ReasonBadge, formatDateTime, formatDateOnly } from "../_lib/utils";
import { apiGetDelivery, apiSignDelivery } from "../_lib/api";
import type { EppDeliveryDetail, EppDeliveryItem } from "../_lib/types";

interface Props {
  deliveryId: string | null;
  onClose: () => void;
  onSigned: () => void;
}

function itemDescription(item: EppDeliveryItem): string {
  if (item.product) return item.product.name;
  if (item.unit?.product) return item.unit.product.name;
  return "—";
}

function itemCode(item: EppDeliveryItem): string {
  return item.product?.code ?? "—";
}

function itemUnit(item: EppDeliveryItem): string {
  return item.product?.unit ?? "—";
}

function itemQtyOrSerial(item: EppDeliveryItem): string {
  if (item.quantity !== null && item.quantity !== undefined)
    return String(item.quantity);
  if (item.unit)
    return item.unit.serialNumber ?? item.unit.assetCode ?? "—";
  return "—";
}

export function EppDetailSheet({ deliveryId, onClose, onSigned }: Props) {
  const [detail, setDetail] = useState<EppDeliveryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const sigRef = useRef<SignaturePadRef>(null);

  useEffect(() => {
    if (!deliveryId) return;
    setDetail(null);
    setLoading(true);
    apiGetDelivery(deliveryId)
      .then(setDetail)
      .catch(() => toast.error("No se pudo cargar el detalle"))
      .finally(() => setLoading(false));
  }, [deliveryId]);

  const handleSign = async () => {
    const data = sigRef.current?.getDataURL();
    if (!data) { toast.error("La firma está vacía"); return; }
    if (!deliveryId) return;
    setSigning(true);
    try {
      await apiSignDelivery(deliveryId, data);
      toast.success("Firma registrada correctamente");
      setSignOpen(false);
      onSigned();
      apiGetDelivery(deliveryId).then(setDetail);
    } catch {
      toast.error("Error al guardar la firma");
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <Sheet open={!!deliveryId} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent className="!w-full !max-w-full p-0 h-dvh flex flex-col">

          {/* ── Sticky header ── */}
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <SheetClose asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 -ml-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver a Entregas</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            </SheetClose>

            <p className="text-sm font-semibold truncate">
              {detail ? `Constancia #${String(detail.number).padStart(4, "0")}` : "Detalle de Entrega"}
            </p>

            {detail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 shrink-0"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            {loading && (
              <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando...
              </div>
            )}

            {!loading && detail && (
              <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-3xl mx-auto space-y-4 print:px-8 print:py-6">

                {/* ── Card: Encabezado constancia ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden text-center">
                  <div className="px-5 py-5 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Constancia de Entrega
                    </p>
                    <h2 className="text-lg font-bold uppercase tracking-wide">
                      Equipos de Protección Personal
                    </h2>
                    <div className="flex items-center justify-center gap-6 pt-1 text-sm">
                      <span className="text-muted-foreground">
                        N°{" "}
                        <strong className="text-foreground">
                          {String(detail.number).padStart(4, "0")}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">
                        Fecha:{" "}
                        <strong className="text-foreground">
                          {formatDateTime(detail.deliveredAt)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Card: Datos del trabajador ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold leading-none">Datos del Trabajador</p>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trabajador</p>
                      <p className="font-semibold mt-0.5">
                        {detail.employee.nombres} {detail.employee.apellidos}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DNI</p>
                      <p className="font-semibold mt-0.5">{detail.employee.dni}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cargo</p>
                      <p className="font-semibold mt-0.5">{detail.employee.cargo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Motivo</p>
                      <div className="mt-1">
                        <ReasonBadge reason={detail.reason} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entregado por</p>
                      <p className="font-semibold mt-0.5">{detail.createdBy.username}</p>
                    </div>
                    {detail.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observaciones</p>
                        <p className="mt-0.5 text-muted-foreground">{detail.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card: Equipos entregados ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Package className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold leading-none">Equipos Entregados</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {detail.items.length} ítem{detail.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-8">#</TableHead>
                          <TableHead className="hidden sm:table-cell">Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="hidden sm:table-cell">Unidad</TableHead>
                          <TableHead className="text-center">Cant. / N° Serie</TableHead>
                          <TableHead className="hidden md:table-cell">Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.items.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                            <TableCell className="hidden sm:table-cell font-mono text-xs">{itemCode(item)}</TableCell>
                            <TableCell className="text-sm font-medium">{itemDescription(item)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{itemUnit(item)}</TableCell>
                            <TableCell className="text-center text-sm font-semibold">{itemQtyOrSerial(item)}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.description || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* ── Card: Firma ── */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <FileSignature className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold leading-none">Firma del Trabajador</p>
                    </div>
                    {detail.signatureData ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Firmado el {formatDateOnly(detail.signedAt!)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <XCircle className="h-3.5 w-3.5" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    {detail.signatureData ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-lg border bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={detail.signatureData}
                            alt="Firma del trabajador"
                            className="max-h-28 w-auto"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">
                            {detail.employee.nombres} {detail.employee.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            DNI: {detail.employee.dni}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="h-24 w-56 border border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                          Sin firma
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSignOpen(true)}
                          className="gap-2"
                        >
                          <PenLine className="h-4 w-4" />
                          Capturar firma ahora
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Espacio inferior */}
                <div className="h-4 print:hidden" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Modal de firma ── */}
      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Capturar Firma</DialogTitle>
            <DialogDescription>
              El trabajador debe firmar para confirmar la recepción de los EPP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border bg-white">
              <SignaturePadCanvas ref={sigRef} height={200} />
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sigRef.current?.clear()}
                className="gap-1.5 text-muted-foreground"
              >
                <Eraser className="h-4 w-4" />
                Limpiar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSignOpen(false)} disabled={signing}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSign} disabled={signing}>
                  {signing ? "Guardando..." : "Guardar firma"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
