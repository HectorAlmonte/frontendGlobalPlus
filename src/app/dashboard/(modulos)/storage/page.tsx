"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Package, LayoutDashboard, BookOpen, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StorageDashboard from "./_components/StorageDashboard";
import ProductsTable from "./_components/ProductsTable";
import CategoriesManager from "./_components/CategoriesManager";
import type { StockAlertEvent } from "./_lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export default function StoragePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Socket.IO para alertas de stock en tiempo real
  useEffect(() => {
    const socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("storage:stock_alert", (event: StockAlertEvent) => {
      const { name, currentStock, unit, level } = event;

      if (level === "CRITICAL") {
        toast.error(`Stock agotado: ${name}`, {
          description: "Se requiere reposición inmediata",
          duration: 8000,
        });
      } else if (level === "LOW") {
        toast.warning(`Stock bajo: ${name}`, {
          description: `${currentStock} ${unit ?? ""} restantes`.trim(),
          duration: 6000,
        });
      } else {
        toast(`Precaución: ${name}`, {
          description: "Próximo a agotarse",
          duration: 5000,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleCatalogRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Almacén</h1>
          <p className="text-sm text-muted-foreground">
            Inventario, equipos y control de stock
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5">
            <Tag className="h-4 w-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <StorageDashboard refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="catalogo" className="mt-4">
          <ProductsTable onRefresh={handleCatalogRefresh} />
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <CategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
