// ─── Enums ───────────────────────────────────────────────────────────────────

export type ItemKind = "BOOLEAN" | "NUMERIC" | "SELECT" | "TEXT";

export type ItemResult = "OK" | "NOK" | "NA";

export type ChecklistStatus =
  | "ASSIGNED"
  | "FILLED"
  | "NO_CONFORME"
  | "WORKER_SIGNED"
  | "SECURITY_SIGNED"
  | "COMPLETED";

// ─── Template ────────────────────────────────────────────────────────────────

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  label: string;
  description: string | null;
  kind: ItemKind;
  /** JSON string con array de opciones — solo si kind === "SELECT" */
  options: string | null;
  isCritical: boolean;
  isRequired: boolean;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  productId: string;
  product: {
    id: string;
    name: string;
    code: string;
    brand: string | null;
    model: string | null;
  };
  isActive: boolean;
  isDeleted: boolean;
  items: ChecklistTemplateItem[];
  _count?: {
    items: number;
    records: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Record ──────────────────────────────────────────────────────────────────

export interface ChecklistRecordItem {
  id: string;
  recordId: string;
  templateItemId: string;
  templateItem: ChecklistTemplateItem;
  booleanValue: boolean | null;
  numericValue: number | null;
  selectedOption: string | null;
  textValue: string | null;
  result: ItemResult | null;
  observations: string | null;
  photoPath: string | null;
  photoUrl?: string;
}

export interface ChecklistRecord {
  id: string;
  unitId: string;
  unit: {
    id: string;
    serialNumber: string | null;
    assetCode: string | null;
    status: string;
    condition: string;
    product: {
      id: string;
      name: string;
      code: string;
      brand: string | null;
      model: string | null;
    };
  };
  templateId: string;
  template: ChecklistTemplate;
  /** ISO date — solo fecha: "2026-03-03T00:00:00.000Z" */
  date: string;

  // Asignación
  assignedById: string;
  assignedBy: { id: string; username: string };
  assignedAt: string;
  operatorId: string;
  operator: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };

  areaId: string | null;
  area: { id: string; name: string; code: string } | null;

  status: ChecklistStatus;
  observations: string | null;
  hasCriticalIssues: boolean;
  /** EquipmentLog creado automáticamente si hubo críticos NOK */
  equipmentLogId: string | null;

  // Firmas
  workerSignature: string | null;
  workerSignedAt: string | null;

  securitySignature: string | null;
  securitySignedAt: string | null;
  securitySignedById: string | null;
  securitySignedBy: { id: string; username: string } | null;

  supervisorSignature: string | null;
  supervisorSignedAt: string | null;
  supervisorSignedById: string | null;
  supervisorSignedBy: { id: string; username: string } | null;

  /** Solo presente en getById */
  items: ChecklistRecordItem[];

  createdAt: string;
  updatedAt: string;
}

// ─── Paginación ───────────────────────────────────────────────────────────────

export interface PaginatedRecords {
  data: ChecklistRecord[];
  total: number;
  page: number;
  limit: number;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface ChecklistStats {
  total: number;
  completed: number;
  critical: number;
  pendingSignatures: number;
  completionRate: number;
  byStatus: { status: ChecklistStatus; count: number }[];
  topNokItems: {
    id: string;
    label: string;
    isCritical: boolean;
    nokCount: number;
  }[];
}

// ─── Reporte pendientes ───────────────────────────────────────────────────────

export interface PendingReportItem extends ChecklistRecord {
  pendingAction: string;
}

export interface PendingReport {
  total: number;
  groups: {
    ASSIGNED?: PendingReportItem[];
    FILLED?: PendingReportItem[];
    NO_CONFORME?: PendingReportItem[];
    WORKER_SIGNED?: PendingReportItem[];
    SECURITY_SIGNED?: PendingReportItem[];
  };
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

export interface RecordFilters {
  unitId?: string;
  status?: ChecklistStatus | "";
  operatorId?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TemplateFilters {
  productId?: string;
  active?: "true" | "false";
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

/** Estado local de un ítem mientras se llena el checklist */
export interface FillItemState {
  templateItemId: string;
  result: ItemResult | null;
  booleanValue: boolean | null;
  numericValue: number | null;
  selectedOption: string | null;
  textValue: string | null;
  observations: string;
}

/** Input para crear un nuevo template */
export interface TemplateCreateInput {
  name: string;
  description?: string;
  productId: string;
}

/** Ítem para PUT /:id/items */
export interface TemplateItemInput {
  label: string;
  description?: string;
  kind: ItemKind;
  options?: string[];
  isCritical: boolean;
  isRequired: boolean;
  order: number;
}

/** Input para crear un registro */
export interface RecordCreateInput {
  unitId: string;
  templateId: string;
  operatorId: string;
  date?: string;
  areaId?: string;
}

/** Input para llenar un registro */
export interface FillRecordInput {
  observations?: string;
  items: Array<{
    templateItemId: string;
    result: ItemResult;
    booleanValue?: boolean | null;
    numericValue?: number | null;
    selectedOption?: string | null;
    textValue?: string | null;
    observations?: string;
  }>;
}

// ─── Opciones de selects ──────────────────────────────────────────────────────

export interface UnitOption {
  id: string;
  serialNumber: string | null;
  assetCode: string | null;
  status: string;
  product: { id: string; name: string; code: string };
}

export interface StaffOption {
  id: string;
  label: string;
}

export interface AreaOption {
  id: string;
  name: string;
  code: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  code: string;
  brand: string | null;
  model: string | null;
}
