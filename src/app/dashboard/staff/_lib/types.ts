export type RoleDTO = {
  id: string;
  key: string;
  name: string;
};

export type StaffRow = {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  cargo: string;
  status: "ACTIVO" | "INACTIVO";
  fechaIngreso: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  roles: RoleDTO[];
  user: null | {
    id: string;
    username: string;
    isActive: boolean;
    isDeleted: boolean;
    lastLoginAt: string | null;
    roles: RoleDTO[];
  };
};

export type StaffCreateInput = {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  cargo: string;
  fechaIngreso?: string;
  roleIds: string[];
};

export type StaffUpdateInput = {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  cargo?: string;
  status?: string;
  fechaIngreso?: string;
  roleIds?: string[];
  userIsActive?: boolean;
};

/** Roles que generan cuenta de usuario automáticamente */
export const ROLES_WITH_ACCOUNT = ["ADMIN", "SUPERVISOR", "SEGURIDAD"];
