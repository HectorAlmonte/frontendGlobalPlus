import type {
  WorkSchedule,
  Holiday,
  BiometricMapping,
  UnmappedEmployee,
  AttendanceRecord,
  AttendanceListResponse,
  OvertimePendingItem,
  MonthlyAttendanceSummary,
  HourBankBalance,
  HourBankTxResponse,
  HourBankDebtorRow,
  VacationBalance,
  VacationTxResponse,
  ReportDetailResponse,
  ReportMonthlyResponse,
  ReportTardanzaResponse,
  ReportAusenciaResponse,
  HorasStats,
  ImportResult,
  CreateHorarioInput,
  CreateFeriadoInput,
  CreateMappingInput,
  UpdateMappingInput,
  AddPunchInput,
  OverrideDayInput,
  PatchAsistenciaInput,
  ApproveOvertimeInput,
  RejectOvertimeInput,
  AjusteHourBankInput,
  DescansoHourBankInput,
  PermisoHourBankInput,
  AcreditarVacacionesInput,
  AjusteVacacionesInput,
  ReporteDetalleParams,
  ReporteMensualParams,
  ReporteTardanzasParams,
  ReporteAusenciasParams,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const full = (path: string) => `${BASE}${path}`;

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function buildQs(params: Record<string, string | number | boolean | undefined | null>): string {
  return new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== "" && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export const apiGetHorasStats = () =>
  apiFetch<{ hours: HorasStats }>(full("/api/dashboard/stats")).then(
    (r) => r.hours
  );

// ─── Horario ─────────────────────────────────────────────────────────────────

export const apiGetHorarioActual = () =>
  apiFetch<WorkSchedule>(full("/api/horario/actual"));

export const apiGetHorarioHistorial = () =>
  apiFetch<WorkSchedule[]>(full("/api/horario/historial"));

export const apiGetHorarioPorFecha = (date: string) =>
  apiFetch<WorkSchedule>(full(`/api/horario/por-fecha/${date}`));

export const apiCreateHorario = (body: CreateHorarioInput) =>
  apiFetch<WorkSchedule>(full("/api/horario"), {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── Feriados ────────────────────────────────────────────────────────────────

export const apiListFeriados = (year: number) =>
  apiFetch<Holiday[]>(full(`/api/feriados?year=${year}`));

export const apiCreateFeriado = (body: CreateFeriadoInput) =>
  apiFetch<Holiday>(full("/api/feriados"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiDeleteFeriado = (id: string) =>
  apiFetch<void>(full(`/api/feriados/${id}`), { method: "DELETE" });

// ─── Mapeo biométrico ────────────────────────────────────────────────────────

export const apiListMappings = () =>
  apiFetch<BiometricMapping[]>(full("/api/biometric-mapping"));

export const apiSearchUnmappedEmployees = (q = "") =>
  apiFetch<UnmappedEmployee[]>(
    full(`/api/biometric-mapping/unmapped-employees${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  );

export const apiCreateMapping = (body: CreateMappingInput) =>
  apiFetch<BiometricMapping>(full("/api/biometric-mapping"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiUpdateMapping = (id: string, body: UpdateMappingInput) =>
  apiFetch<BiometricMapping>(full(`/api/biometric-mapping/${id}`), {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const apiDeleteMapping = (id: string) =>
  apiFetch<void>(full(`/api/biometric-mapping/${id}`), { method: "DELETE" });

// ─── Asistencia ──────────────────────────────────────────────────────────────

export const apiGetAsistencia = (
  employeeId: string,
  params: {
    from?: string;
    to?: string;
    status?: string;
    dayType?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const qs = buildQs({ ...params });
  return apiFetch<AttendanceListResponse>(
    full(`/api/asistencia/${employeeId}?${qs}`)
  );
};

export const apiGetAsistenciaDay = (employeeId: string, date: string) =>
  apiFetch<AttendanceRecord>(full(`/api/asistencia/${employeeId}/${date}`));

export const apiAddPunch = (body: AddPunchInput) =>
  apiFetch<AttendanceRecord>(full("/api/asistencia/punch"), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiOverrideDay = (
  employeeId: string,
  date: string,
  body: OverrideDayInput
) =>
  apiFetch<AttendanceRecord>(
    full(`/api/asistencia/${employeeId}/${date}/override`),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

export const apiDeleteOverride = (employeeId: string, date: string) =>
  apiFetch<AttendanceRecord>(
    full(`/api/asistencia/${employeeId}/${date}/override`),
    { method: "DELETE" }
  );

export const apiPatchAsistencia = (
  employeeId: string,
  date: string,
  body: PatchAsistenciaInput
) =>
  apiFetch<AttendanceRecord>(full(`/api/asistencia/${employeeId}/${date}`), {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const apiRecalcWeek = (employeeId: string, date: string) =>
  apiFetch<{ message: string }>(
    full(`/api/asistencia/${employeeId}/recalc?weekOf=${date}`),
    { method: "POST" }
  );

export const apiGetOvertimePending = () =>
  apiFetch<OvertimePendingItem[]>(full("/api/asistencia/overtime/pending"));

export const apiApproveOvertime = (
  employeeId: string,
  date: string,
  body: ApproveOvertimeInput
) =>
  apiFetch<AttendanceRecord>(
    full(`/api/asistencia/${employeeId}/${date}/overtime/approve`),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

export const apiRejectOvertime = (
  employeeId: string,
  date: string,
  body: RejectOvertimeInput
) =>
  apiFetch<AttendanceRecord>(
    full(`/api/asistencia/${employeeId}/${date}/overtime/reject`),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

export const apiImportXls = (file: File, forceReimport: boolean) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("forceReimport", String(forceReimport));
  return fetch(full("/api/asistencia/import"), {
    method: "POST",
    credentials: "include",
    body: fd,
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ImportResult>;
  });
};

export const apiGetResumenMensual = (
  employeeId: string,
  year: number,
  month: number
) =>
  apiFetch<MonthlyAttendanceSummary>(
    full(`/api/asistencia/${employeeId}/monthly?year=${year}&month=${month}`)
  );

// ─── Banco de horas ──────────────────────────────────────────────────────────

export const apiGetHourBank = (employeeId: string) =>
  apiFetch<HourBankBalance>(full(`/api/banco-horas/${employeeId}`));

export const apiGetHourBankTx = (
  employeeId: string,
  params: {
    txType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const qs = buildQs({ ...params });
  return apiFetch<HourBankTxResponse>(
    full(`/api/banco-horas/${employeeId}/transactions?${qs}`)
  );
};

export const apiAjusteHourBank = (
  employeeId: string,
  body: AjusteHourBankInput
) =>
  apiFetch<HourBankBalance>(full(`/api/banco-horas/${employeeId}/ajuste`), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiDescansoHourBank = (
  employeeId: string,
  body: DescansoHourBankInput
) =>
  apiFetch<HourBankBalance>(full(`/api/banco-horas/${employeeId}/descanso`), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPermisoHourBank = (
  employeeId: string,
  body: PermisoHourBankInput
) =>
  apiFetch<HourBankBalance>(full(`/api/banco-horas/${employeeId}/permiso`), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiGetDeudores = () =>
  apiFetch<HourBankDebtorRow[]>(full("/api/banco-horas/deudores"));

// ─── Vacaciones ──────────────────────────────────────────────────────────────

export const apiGetVacaciones = (employeeId: string) =>
  apiFetch<VacationBalance>(full(`/api/vacaciones/${employeeId}`));

export const apiGetVacacionesTx = (
  employeeId: string,
  params: { page?: number; limit?: number } = {}
) => {
  const qs = buildQs({ ...params });
  return apiFetch<VacationTxResponse>(
    full(`/api/vacaciones/${employeeId}/transactions?${qs}`)
  );
};

export const apiAcreditarVacaciones = (
  employeeId: string,
  body: AcreditarVacacionesInput
) =>
  apiFetch<VacationBalance>(full(`/api/vacaciones/${employeeId}/acreditar`), {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiAjusteVacaciones = (
  employeeId: string,
  body: AjusteVacacionesInput
) =>
  apiFetch<VacationBalance>(full(`/api/vacaciones/${employeeId}/ajuste`), {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── Reportes ────────────────────────────────────────────────────────────────

export const apiReporteDetalle = (params: ReporteDetalleParams) => {
  const qs = buildQs(params as unknown as Record<string, string | number | boolean | undefined | null>);
  return apiFetch<ReportDetailResponse>(
    full(`/api/reportes/asistencia/detalle?${qs}`)
  );
};

export const apiReporteMensual = (params: ReporteMensualParams) => {
  const qs = buildQs(params as unknown as Record<string, string | number | boolean | undefined | null>);
  return apiFetch<ReportMonthlyResponse>(
    full(`/api/reportes/asistencia/mensual?${qs}`)
  );
};

export const apiReporteTardanzas = (params: ReporteTardanzasParams) => {
  const qs = buildQs(params as unknown as Record<string, string | number | boolean | undefined | null>);
  return apiFetch<ReportTardanzaResponse>(
    full(`/api/reportes/asistencia/tardanzas?${qs}`)
  );
};

export const apiReporteAusencias = (params: ReporteAusenciasParams) => {
  const qs = buildQs(params as unknown as Record<string, string | number | boolean | undefined | null>);
  return apiFetch<ReportAusenciaResponse>(
    full(`/api/reportes/asistencia/ausencias?${qs}`)
  );
};

// ─── Staff search (shared) ───────────────────────────────────────────────────

export interface StaffSearchItem {
  id: string;
  label: string;
}

export const apiSearchStaff = (q = "") =>
  apiFetch<StaffSearchItem[]>(
    full(`/api/staff/search${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  );
