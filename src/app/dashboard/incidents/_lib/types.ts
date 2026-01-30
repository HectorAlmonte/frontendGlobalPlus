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
  | "AREA";

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

  locationLabel?: string | null;

  causes?: any; // Json (array/string según backend)

  observedKind?: ObservedKind;

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
 * CREATE (FORM)
 * =========================
 */

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

  causes: string;
  files: File[];
};
