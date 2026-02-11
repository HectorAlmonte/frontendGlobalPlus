/**
 * =========================
 * ENUMS / UNIONS
 * =========================
 */

export type IncidentStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED";

export type IncidentFileStage =
  | "REPORT"
  | "CORRECTIVE"
  | "CLOSURE";

export type ObservedKind =
  | "NONE"
  | "USER"
  | "AREA"
  | "OTRO";

/**
 * Tipos de incidencia (estandarizados)
 */
export type IncidentType =
  | "HALLAZGO_ANORMAL"
  | "INCIDENTE"
  | "CONDICION_SUB_ESTANDAR"
  | "ACTO_SUB_ESTANDAR";

/**
 * =========================
 * SUBTAREAS / OBJETIVOS
 * =========================
 */

export type IncidentSubtask = {
  id: string;
  incidentId: string;
  title: string;
  detail?: string | null;
  assignedTo?: {
    id: string;
    username: string;
    employee?: {
      nombres: string;
      apellidos: string;
    };
  } | null;
  isCompleted: boolean;
  completedAt?: string | null;
  createdBy?: {
    id: string;
    username: string;
    employee?: {
      nombres: string;
      apellidos: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * =========================
 * LISTADO (tabla)
 * =========================
 */

export type IncidentListItem = {
  id: string;

  title: string | null;
  type: IncidentType;
  detail: string;
  number: number;
  status: IncidentStatus;
  reportedAt: string;
  occurredAt?: string | null;

  _count?: { subtasks: number; subtasksCompleted?: number };

  // ✅ NUEVO (fallback UI)
  areaNameSnapshot?: string | null;
  observedLabelSnapshot?: string | null;
  observedKind?: ObservedKind;

  reportedBy?: {
    id: string;
    username: string;
    employee: {
      nombres: string;
      apellidos: string;
    };
  };

  area?: {
    id: string;
    name: string;
  } | null;

  corrective?: {
    priority: "BAJA" | "MEDIA" | "ALTA";
    dueDate?: string | null;
  } | null;
};

/**
 * =========================
 * ARCHIVOS
 * =========================
 */

export type IncidentFile = {
  id: string;
  stage: IncidentFileStage;

  originalName: string | null;
  mimeType: string | null;
  path: string;

  createdAt: string;
};

/**
 * =========================
 * DETALLE DE INCIDENCIA
 * =========================
 */

export type IncidentDetail = IncidentListItem & {
  files: IncidentFile[];
  subtasks?: IncidentSubtask[];

  locationLabel?: string | null;

  causes?: any; // Json (array/string según backend)

  observedKind?: ObservedKind;
  observedOtherDetail?: string | null;

  observedUser?: {
    id: string;
    username: string;
  } | null;

  observedArea?: {
    id: string;
    name: string;
  } | null;

  corrective?: {
    id: string;
    detail: string;
    priority: "BAJA" | "MEDIA" | "ALTA";
    dueDate: string | null;

    createdBy?: {
      id: string;
      username: string;
    } | null;
  } | null;

  closure?: {
    id: string;
    detail: string;
    closedAt: string;

    closedBy?: {
      id: string;
      username: string;
    } | null;
  } | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
};

/**
 * =========================
 * KPI / PERIOD
 * =========================
 */

export type IncidentPeriod = "7d" | "15d" | "1m" | "1y" | "all";

export type IncidentStats = {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  byPriority: { BAJA: number; MEDIA: number; ALTA: number };
  overdue: number;
  resolutionRate: number;
  avgCloseDays: number;
};

/**
 * =========================
 * CREATE (FORM)
 * =========================
 */

/**
 * =========================
 * SUBTAREA CON INCIDENCIA (reporte global)
 * =========================
 */

export type SubtaskWithIncident = IncidentSubtask & {
  incident: {
    id: string;
    number: number;
    title: string | null;
    status: IncidentStatus;
    area?: { id: string; name: string } | null;
    corrective?: { priority: "BAJA" | "MEDIA" | "ALTA" } | null;
  };
};

export type CreateIncidentInput = {
  title: string;
  type: IncidentType;
  locationLabel: string;
  detail: string;

  // ✅ NUEVO
  areaId: string;

  observedKind: ObservedKind;
  observedUserId: string;
  observedAreaId: string;
  observedOtherDetail?: string;

  occurredAt?: string;

  causes: string;
  files: File[];
};
