"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode } from "lucide-react";

interface Props {
  label?: string;
  fetcher: () => Promise<Blob>;
  filename?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function QrDownloadButton({
  label = "Descargar QR",
  fetcher,
  filename = "qr.png",
  variant = "outline",
  size = "default",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await fetcher();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al generar el QR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <QrCode className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-2">{label}</span>}
    </Button>
  );
}
