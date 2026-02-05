export type WorkAreaRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkAreaCreateInput = {
  name: string;
  code: string;
  description?: string;
};

export type WorkAreaUpdateInput = WorkAreaCreateInput;
