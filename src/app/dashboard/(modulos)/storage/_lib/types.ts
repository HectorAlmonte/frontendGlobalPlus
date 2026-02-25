// ─── Enums / Union types ────────────────────────────────────────────────────

export type StorageItemKind = "CONSUMABLE" | "EQUIPMENT";
export type StockMovementType = "ENTRY" | "EXIT" | "ADJUSTMENT" | "RETURN";
export type EquipmentStatus = "AVAILABLE" | "ASSIGNED" | "IN_MAINTENANCE" | "RETIRED";
export type EquipmentCondition = "GOOD" | "FAIR" | "POOR";
export type EquipmentLogType = "ENTRY" | "ASSIGNMENT" | "RETURN" | "MAINTENANCE" | "MAINTENANCE_FINISH" | "RETIREMENT";
export type StockAlertLevel = "CRITICAL" | "LOW" | "CAUTION";

// ─── Category ────────────────────────────────────────────────────────────────

export interface StorageCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface StorageProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  kind: StorageItemKind;
  category: { id: string; name: string };
  // Consumable fields
  unit?: string;
  currentStock?: number;
  minStock?: number;
  // Equipment fields
  brand?: string;
  model?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StorageProductDetail extends StorageProduct {
  // Equipment: units summary
  unitsTotal?: number;
  unitsAvailable?: number;
  unitsAssigned?: number;
  unitsInMaintenance?: number;
  unitsRetired?: number;
}

export interface ProductCreateInput {
  name: string;
  code: string;
  categoryId: string;
  kind: StorageItemKind;
  description?: string;
  // Consumable
  unit?: string;
  minStock?: number;
  initialStock?: number;
  // Equipment
  brand?: string;
  model?: string;
}

export interface ProductUpdateInput {
  name?: string;
  categoryId?: string;
  description?: string;
  unit?: string;
  minStock?: number;
  brand?: string;
  model?: string;
  isActive?: boolean;
}

// ─── Stock movements (consumable) ────────────────────────────────────────────

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  reference?: string;
  requestedBy?: { id: string; nombres: string; apellidos: string; dni: string };
  performedBy: {
    id: string;
    username: string;
    employee?: { nombres: string; apellidos: string };
  };
  createdAt: string;
}

export interface MovementCreateInput {
  type: StockMovementType;
  quantity: number;
  requestedById?: string; // employeeId — required for EXIT/RETURN
  reason?: string;
  notes?: string;
  reference?: string;
}

// ─── Equipment units ─────────────────────────────────────────────────────────

export interface StorageUnit {
  id: string;
  productId: string;
  product: Pick<StorageProduct, "id" | "name" | "code" | "brand" | "model">;
  serialNumber?: string;
  assetCode?: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  assignedTo?: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    cargo: string;
  };
  assignedAt?: string;
  lastServiceAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface UnitCreateInput {
  productId: string;
  serialNumber?: string;
  assetCode?: string;
  condition?: EquipmentCondition;
  notes?: string;
}

export interface UnitAssignInput {
  employeeId: string;
  notes?: string;
}

export interface UnitReturnInput {
  condition: EquipmentCondition;
  notes?: string;
}

export interface UnitMaintenanceInput {
  notes?: string;
}

export interface UnitMaintenanceFinishInput {
  condition: EquipmentCondition;
  notes?: string;
}

// ─── Equipment logs ──────────────────────────────────────────────────────────

export interface EquipmentLog {
  id: string;
  unitId: string;
  type: EquipmentLogType;
  notes?: string;
  condition?: EquipmentCondition;
  employee?: { id: string; nombres: string; apellidos: string; dni: string };
  performedBy: {
    id: string;
    username: string;
    employee?: { nombres: string; apellidos: string };
  };
  createdAt: string;
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface StorageStats {
  totalActiveProducts: number;
  equipmentSummary: {
    available: number;
    assigned: number;
    inMaintenance: number;
  };
  criticalStockCount: number; // currentStock === 0
  lowStockCount: number; // currentStock <= minStock
  stockAlerts: StockAlertItem[];
  recentMovements: RecentMovement[];
}

export interface StockAlertItem {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit?: string;
  level: StockAlertLevel;
}

export interface RecentMovement {
  id: string;
  createdAt: string;
  product: { id: string; name: string; code: string };
  type: StockMovementType;
  quantity: number;
  requestedBy?: { nombres: string; apellidos: string };
  performedBy: { username: string; employee?: { nombres: string; apellidos: string } };
}

// ─── Socket.IO event ─────────────────────────────────────────────────────────

export interface StockAlertEvent {
  productId: string;
  name: string;
  code: string;
  currentStock: number;
  minStock: number;
  unit?: string;
  level: StockAlertLevel;
}
