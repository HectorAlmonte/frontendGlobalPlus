export type RoleRow = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; employees: number };
};

export type RoleCreateInput = {
  key: string;
  name: string;
  description?: string | null;
};

export type RoleUpdateInput = {
  name?: string;
  description?: string | null;
};
