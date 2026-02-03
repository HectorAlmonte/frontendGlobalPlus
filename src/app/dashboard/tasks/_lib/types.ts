export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "BAJA" | "MEDIA" | "ALTA";

export type TaskSubItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  completedAt: string | null;
  createdAt: string;
};

export type TaskAssignee = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    cargo: string | null;
  };
  assignedAt: string;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  progress: number;
  incidentId: string | null;
  incident: {
    id: string;
    number: number;
    title: string;
    status: string;
  } | null;
  subItems: TaskSubItem[];
  assignees: TaskAssignee[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
    employee?: { nombres: string; apellidos: string } | null;
  } | null;
};

export type TaskCreateInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  incidentId?: string | null;
  assignees?: string[];
  subItems?: { title: string }[];
};

export type TaskUpdateInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  incidentId?: string | null;
};

export type TaskPeriod = "7d" | "15d" | "1m" | "1y" | "all";

export type TaskStats = {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  completionRate: number;
  avgProgress: number;
  subtasks: { total: number; completed: number };
  assignees: number;
};
