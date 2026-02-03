import type {
  TaskRow,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskPriority,
  TaskSubItem,
  TaskStats,
  TaskPeriod,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;

function full(path: string) {
  return API ? `${API}${path}` : path;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = "Error en la solicitud";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/* ── List ── */
export function apiListTasks(params?: {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  includeDeleted?: boolean;
  period?: TaskPeriod;
}) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.status) sp.set("status", params.status);
  if (params?.priority) sp.set("priority", params.priority);
  if (params?.includeDeleted !== undefined)
    sp.set("includeDeleted", params.includeDeleted ? "1" : "0");
  if (params?.period && params.period !== "all")
    sp.set("period", params.period);

  return apiFetch<TaskRow[]>(full(`/api/tasks?${sp.toString()}`));
}

/* ── Get one ── */
export function apiGetTask(id: string) {
  return apiFetch<TaskRow>(full(`/api/tasks/${id}`));
}

/* ── Create ── */
export function apiCreateTask(input: TaskCreateInput) {
  return apiFetch<TaskRow>(full(`/api/tasks`), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ── Update ── */
export function apiUpdateTask(id: string, input: TaskUpdateInput) {
  return apiFetch<TaskRow>(full(`/api/tasks/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* ── Soft delete ── */
export function apiDeleteTask(id: string) {
  return apiFetch<TaskRow>(full(`/api/tasks/${id}`), { method: "DELETE" });
}

/* ── Restore ── */
export function apiRestoreTask(id: string) {
  return apiFetch<TaskRow>(full(`/api/tasks/${id}/restore`), {
    method: "PATCH",
  });
}

/* ── Assignees ── */
export function apiAddAssignees(taskId: string, employeeIds: string[]) {
  return apiFetch<TaskRow>(full(`/api/tasks/${taskId}/assignees`), {
    method: "POST",
    body: JSON.stringify({ employeeIds }),
  });
}

export function apiRemoveAssignee(taskId: string, employeeId: string) {
  return apiFetch<TaskRow>(full(`/api/tasks/${taskId}/assignees/${employeeId}`), {
    method: "DELETE",
  });
}

/* ── Sub-items ── */
export function apiAddSubItem(taskId: string, title: string) {
  return apiFetch<TaskSubItem>(full(`/api/tasks/${taskId}/subitems`), {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function apiToggleSubItem(taskId: string, subItemId: string) {
  return apiFetch<TaskSubItem>(
    full(`/api/tasks/${taskId}/subitems/${subItemId}/toggle`),
    { method: "PATCH" }
  );
}

export function apiDeleteSubItem(taskId: string, subItemId: string) {
  return apiFetch<void>(
    full(`/api/tasks/${taskId}/subitems/${subItemId}`),
    { method: "DELETE" }
  );
}

/* ── Stats / KPIs ── */
export function apiGetTaskStats(period?: TaskPeriod) {
  const sp = new URLSearchParams();
  if (period && period !== "all") sp.set("period", period);
  const qs = sp.toString();
  return apiFetch<TaskStats>(full(`/api/tasks/stats${qs ? `?${qs}` : ""}`));
}

/* ── Search incidents (for linking) ── */
export async function apiSearchIncidents(
  q: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  const qTrim = q.trim();
  if (qTrim) sp.set("q", qTrim);

  const res = await fetch(full(`/api/incidents?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error buscando incidencias");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.id),
    label: String(x.title || x.code || x.id),
  }));
}

/* ── Search employees (for assignees) ── */
export async function apiSearchEmployees(
  q: string
): Promise<{ value: string; label: string }[]> {
  const sp = new URLSearchParams();
  const qTrim = q.trim();
  if (qTrim) sp.set("q", qTrim);

  const res = await fetch(full(`/api/staff/search?${sp.toString()}`), {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error buscando empleados");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    value: String(x.employeeId),
    label: String(x.label),
  }));
}
