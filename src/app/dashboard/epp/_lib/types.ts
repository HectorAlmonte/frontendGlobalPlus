export type EppReason = "PRIMERA_ENTREGA" | "RENOVACION" | "PERDIDA";
export type ItemKind = "CONSUMABLE" | "EQUIPMENT";

export interface EppStats {
  total: number;
  unsigned: number;
  thisMonth: number;
}

export interface EppEmployee {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
}

export interface EppEmployeeDetail extends EppEmployee {
  cargo: string;
}

export interface EppDeliveryRow {
  id: string;
  number: number;
  deliveredAt: string;
  reason: EppReason;
  notes: string | null;
  isSigned: boolean;
  signedAt: string | null;
  employee: EppEmployee;
  createdBy: { id: string; username: string };
  itemCount: number;
  createdAt: string;
}

export interface EppDeliveryItem {
  id: string;
  productId: string | null;
  product: { id: string; name: string; code: string; unit: string } | null;
  quantity: number | null;
  unitId: string | null;
  unit: {
    id: string;
    serialNumber: string | null;
    assetCode: string | null;
    product: { name: string };
  } | null;
  description: string | null;
}

export interface EppDeliveryDetail {
  id: string;
  number: number;
  deliveredAt: string;
  reason: EppReason;
  notes: string | null;
  signatureData: string | null;
  signedAt: string | null;
  employee: EppEmployeeDetail;
  createdBy: { id: string; username: string };
  items: EppDeliveryItem[];
}

export interface EppDeliveriesResponse {
  data: EppDeliveryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductOption {
  id: string;
  label: string;
  kind: "CONSUMABLE" | "EQUIPMENT";
  unit: string;
  currentStock: number;
}

export interface UnitOption {
  id: string;
  serialNumber: string | null;
  assetCode: string | null;
}

export interface StaffOption {
  id: string;
  label: string;
}

export interface EppCreateInput {
  employeeId: string;
  deliveredAt?: string;
  reason: EppReason;
  notes?: string;
  signatureData?: string;
  items: Array<
    | { productId: string; quantity: number; description?: string }
    | { unitId: string; description?: string }
  >;
}

/** Client-side form item state */
export interface FormItem {
  _key: string;
  kind: ItemKind;
  // CONSUMABLE
  productId: string;
  productLabel: string;
  productUnit: string;
  quantity: number;
  maxStock: number;
  // EQUIPMENT
  equipProductId: string;
  equipProductLabel: string;
  unitId: string;
  unitLabel: string;
  availableUnits: { id: string; label: string }[];
  loadingUnits: boolean;
  // shared
  description: string;
}
