export type AreaRow = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string }[];
  _count?: { incidents: number; observedIncidents: number };
  createdAt: string;
  updatedAt: string;
};

export type AreaCreateInput = {
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
};

export type AreaUpdateInput = AreaCreateInput;
