/**
 * =========================
 * Tipos de documento
 * =========================
 */

export type DocumentType = {
  id: string;
  name: string;
  code: string;
};

/**
 * =========================
 * Versiones
 * =========================
 */

export type DocumentVersion = {
  id: string;
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  notes: string | null;
  validFrom: string;
  validUntil: string;
  isExpired: boolean;
  createdAt: string;
  uploadedBy?: {
    id: string;
    username: string;
    employee?: {
      nombres: string;
      apellidos: string;
    } | null;
  } | null;
};

/**
 * =========================
 * Listado (tabla)
 * =========================
 */

export type DocumentRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  moduleKey: string | null;

  documentType?: {
    id: string;
    name: string;
  } | null;

  area?: {
    id: string;
    name: string;
  } | null;

  currentVersion?: {
    versionNumber: number;
    validFrom: string;
    validUntil: string;
    isExpired: boolean;
  } | null;

  createdAt: string;
  updatedAt: string;
};

/**
 * =========================
 * Detalle
 * =========================
 */

export type DocumentDetail = DocumentRow & {
  versions: DocumentVersion[];
};

/**
 * =========================
 * Crear documento
 * =========================
 */

export type CreateDocumentInput = {
  name: string;
  documentTypeId: string;
  areaId: string;
  moduleKey: string;
  notes: string;
  file: File | null;
};

/**
 * =========================
 * Documento vinculado a módulo
 * =========================
 */

export type ModuleDocumentInfo = {
  id: string;
  code: string;
  name: string;
  moduleKey: string;
  currentVersion: {
    versionNumber: number;
    validFrom: string;
    validUntil: string;
    isExpired: boolean;
    fileUrl: string;
  } | null;
};
