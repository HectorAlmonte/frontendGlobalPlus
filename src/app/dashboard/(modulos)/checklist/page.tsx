"use client";

import { useState, useCallback } from "react";
import { Plus, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";
import { hasRole } from "@/lib/utils";
import { useWord } from "@/context/AppContext";

import ChecklistStatsCards from "./_components/ChecklistStatsCards";
import PendingTab from "./_components/PendingTab";
import AllRecordsTab from "./_components/AllRecordsTab";
import TemplatesTab from "./_components/TemplatesTab";
import CreateRecordDialog from "./_components/CreateRecordDialog";
import CreateTemplateDialog from "./_components/CreateTemplateDialog";
import TemplateItemsEditor from "./_components/TemplateItemsEditor";

import type { ChecklistTemplate } from "./_lib/types";

export default function ChecklistPage() {
  const { user } = useWord();
  const [activeTab, setActiveTab] = usePersistedState("checklist-tab", "pending");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [createRecordOpen, setCreateRecordOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  const canCreate =
    hasRole(user, "ADMIN") ||
    hasRole(user, "SUPERVISOR") ||
    hasRole(user, "SEGURIDAD");

  const canManageTemplates =
    hasRole(user, "ADMIN") || hasRole(user, "SUPERVISOR");

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useModuleShortcuts({
    onNew: canCreate ? () => setCreateRecordOpen(true) : undefined,
  });

  // Socket.IO — escucha eventos del módulo checklist
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    if (!BASE) return;

    const socket = io(BASE, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on(
      "checklist:critical_issue",
      ({ unitLabel, message }: { recordId: string; unitLabel: string; message: string }) => {
        toast.error(`Ítem crítico NOK — ${unitLabel}`, {
          description: message,
          duration: 6000,
        });
        refresh();
      }
    );

    socket.on(
      "checklist:worker_signed",
      ({ message }: { recordId: string; message: string }) => {
        toast.info(message);
        refresh();
      }
    );

    socket.on(
      "checklist:security_signed",
      ({ message }: { recordId: string; message: string }) => {
        toast.info(message);
        refresh();
      }
    );

    socket.on(
      "checklist:completed",
      ({
        unitLabel,
        hasCriticalIssues,
        message,
      }: {
        recordId: string;
        unitLabel: string;
        hasCriticalIssues: boolean;
        message: string;
      }) => {
        if (hasCriticalIssues) {
          toast.warning(`Checklist completado con observaciones — ${unitLabel}`, {
            description: message,
          });
        } else {
          toast.success(`Checklist completado — ${unitLabel}`, {
            description: message,
          });
        }
        refresh();
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [refresh]);

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-none">Checklist de Equipos</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Revisión diaria de operación
            </p>
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-2 shrink-0">
          {canManageTemplates && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex h-9 gap-1.5"
              onClick={() => setCreateTemplateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Template
            </Button>
          )}
          {canCreate && (
            <Button
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setCreateRecordOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo checklist</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <ChecklistStatsCards refreshKey={refreshKey} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 w-full sm:w-auto">
          <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Todos
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Templates
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="pending" className="mt-0">
            <PendingTab refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <AllRecordsTab refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <TemplatesTab
              refreshKey={refreshKey}
              onConfigureItems={(tpl) => setEditingTemplate(tpl)}
              onRefresh={refresh}
            />

            {/* Botón nuevo template en mobile (dentro del tab) */}
            {canManageTemplates && (
              <div className="mt-4 sm:hidden">
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={() => setCreateTemplateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo template
                </Button>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Dialogs / Sheets */}
      <CreateRecordDialog
        open={createRecordOpen}
        onOpenChange={setCreateRecordOpen}
        onCreated={refresh}
      />

      <CreateTemplateDialog
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        onCreated={(tpl) => {
          refresh();
          setCreateTemplateOpen(false);
          setEditingTemplate(tpl);
        }}
      />

      <TemplateItemsEditor
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSaved={refresh}
      />
    </div>
  );
}
