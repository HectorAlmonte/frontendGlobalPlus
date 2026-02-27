// ─── Enums ─────────────────────────────────────────────────────────────────

export type DayType =
  | "WORKED"
  | "REST"
  | "HOLIDAY"
  | "VACATION"
  | "ABSENT"
  | "PERMIT"
  | "MEDICAL_LEAVE"
  | "TRAINING"
  | "SUSPENSION"
  | "COMPENSATORY_REST";

export type AttendanceRecordStatus =
  | "COMPLETE"
  | "INCOMPLETE"
  | "PENDING_OVERTIME"
  | "CLOSED";

export type OvertimeStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type HourBankTxType =
  | "OVERTIME_ACCRUAL"
  | "COMPENSATORY_REST"
  | "PERMIT"
  | "MANUAL_ADJUSTMENT";

export type VacationTxType =
  | "ACCRUAL"
  | "USAGE"
  | "MANUAL_ADJUSTMENT";

export type PunchSource = "BIOMETRIC" | "MANUAL" | "SYSTEM";

// ─── Work Schedule ──────────────────────────────────────────────────────────

export interface WorkScheduleDay {
  dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
  isWorkDay: boolean;
  startTime: string | null; // "HH:MM"
  endTime: string | null;
  entryGraceMins: number; // minutes (backend field name)
  exitGraceMins: number;  // minutes (backend field name)
}

export interface WorkSchedule {
  id: string;
  name: string;
  effectiveFrom: string; // ISO date
  notes: string | null;
  days: WorkScheduleDay[];
  createdBy: { id: string; username: string } | null;
  createdAt: string;
}

// ─── Holiday ────────────────────────────────────────────────────────────────

export interface Holiday {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  isNational: boolean;
  isRecurring: boolean;
}

// ─── Biometric Mapping ──────────────────────────────────────────────────────

export interface BiometricMapping {
  id: string;
  biometricId: string;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export interface UnmappedEmployee {
  id: string;
  label: string; // "Nombre - DNI"
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export interface AttendancePunch {
  id: string;
  punchedAt: string; // ISO datetime
  source: PunchSource;
  notes: string | null;
  createdBy: { id: string; username: string } | null;
}

export interface AttendanceRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  dayType: DayType;
  status: AttendanceRecordStatus;
  scheduledMinutes: number;
  effectiveMinutes: number;
  lateMinutes: number;
  overtimeRawMinutes: number;
  overtimeEffectiveMinutes: number;
  overtimeMultiplier: number;
  overtimeStatus: OvertimeStatus;
  isHoliday: boolean;
  isNightShift: boolean;
  documentRef: string | null;
  overrideNotes: string | null;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
  punches?: AttendancePunch[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceListResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OvertimePendingItem {
  recordId: string;
  date: string;
  dayType: DayType;
  overtimeRawMinutes: number;
  overtimeMultiplier: number;
  overtimeStatus: OvertimeStatus;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  employee: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  year: number;
  month: number;
  workedDays: number;
  effectiveMinutes: number;
  lateMinutes: number;
  approvedOvertimeMinutes: number;
  hourBankBalance: number;
  vacationBalance: number;
  dayTypeSummary: Partial<Record<DayType, number>>;
}

// ─── Hour Bank ───────────────────────────────────────────────────────────────

export interface HourBankBalance {
  employeeId: string;
  totalMinutes: number;
  isNegative: boolean;
  lastUpdated: string;
}

export interface HourBankTransaction {
  id: string;
  txType: HourBankTxType;
  minutes: number;
  balanceAfter: number;
  notes: string | null;
  reason: string | null;
  createdBy: { id: string; username: string } | null;
  createdAt: string;
}

export interface HourBankTxResponse {
  data: HourBankTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HourBankDebtorRow {
  employeeId: string;
  employee: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  totalMinutes: number;
}

// ─── Vacaciones ──────────────────────────────────────────────────────────────

export interface VacationBalance {
  employeeId: string;
  availableDays: number;
  usedDays: number;
  periodStart: string | null;
}

export interface VacationTransaction {
  id: string;
  txType: VacationTxType;
  days: number;
  balanceAfter: number;
  periodFrom: string | null;
  periodTo: string | null;
  notes: string | null;
  createdBy: { id: string; username: string } | null;
  createdAt: string;
}

export interface VacationTxResponse {
  data: VacationTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Reportes ────────────────────────────────────────────────────────────────

export interface ReportDetailItem {
  recordId: string;
  date: string;
  dayType: DayType;
  status: AttendanceRecordStatus;
  scheduledMinutes: number;
  effectiveMinutes: number;
  lateMinutes: number;
  overtimeEffectiveMinutes: number;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface ReportDetailResponse {
  data: ReportDetailItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportMonthlyItem {
  employeeId: string;
  employee: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  year: number;
  month: number;
  workedDays: number;
  effectiveMinutes: number;
  lateMinutes: number;
  approvedOvertimeMinutes: number;
  hourBankBalance: number;
  vacationBalance: number;
  dayTypeSummary: Partial<Record<DayType, number>>;
}

export interface ReportMonthlyResponse {
  data: ReportMonthlyItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportTardanzaItem {
  recordId: string;
  date: string;
  lateMinutes: number;
  scheduledMinutes: number;
  effectiveMinutes: number;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface ReportTardanzaResponse {
  data: ReportTardanzaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportAusenciaItem {
  recordId: string;
  date: string;
  dayType: DayType;
  documentRef: string | null;
  notes: string | null;
  registeredBy: string | null;
  employee: {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface ReportAusenciaResponse {
  data: ReportAusenciaItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface HorasStats {
  pendingOvertimeCount: number;
  incompleteRecordsCount: number;
  debtorCount: number;
  absenceAlertsCount: number;
  totalPositiveMinutes: number;
  totalNegativeMinutes: number;
}

// ─── Import Result ───────────────────────────────────────────────────────────

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  incomplete: number;
  errors: Array<{
    biometricId: string;
    date: string;
    reason: string;
  }>;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateHorarioInput {
  name: string;
  effectiveFrom: string; // "YYYY-MM-DD"
  notes?: string;
  days: Array<{
    dayOfWeek: number;
    isWorkDay: boolean;
    startTime?: string;
    endTime?: string;
    graceEntry?: number;
    graceExit?: number;
  }>;
}

export interface CreateFeriadoInput {
  date: string; // "YYYY-MM-DD"
  name: string;
  isNational?: boolean;
  isRecurring?: boolean;
}

export interface CreateMappingInput {
  biometricId: string;
  employeeId: string;
  notes?: string;
}

export interface UpdateMappingInput {
  isActive?: boolean;
  notes?: string;
}

export interface AddPunchInput {
  employeeId: string;
  punchedAt: string; // ISO datetime
  notes?: string;
}

export interface OverrideDayInput {
  dayType: DayType;
  notes?: string;
  documentRef?: string;
}

export interface PatchAsistenciaInput {
  effectiveMinutes?: number;
  overtimeEffectiveMinutes?: number;
  notes: string;
}

export interface ApproveOvertimeInput {
  notes?: string;
}

export interface RejectOvertimeInput {
  notes: string;
}

export interface AjusteHourBankInput {
  minutes: number;
  notes: string;
}

export interface DescansoHourBankInput {
  minutes: number;
  notes?: string;
}

export interface PermisoHourBankInput {
  minutes: number;
  reason: string;
  notes?: string;
}

export interface AcreditarVacacionesInput {
  days: number;
  periodStart: string;
  notes?: string;
}

export interface AjusteVacacionesInput {
  days: number;
  notes: string;
}

export interface ReporteDetalleParams {
  dateFrom: string;
  dateTo: string;
  employeeId?: string;
  status?: AttendanceRecordStatus;
  dayType?: DayType;
  page?: number;
  limit?: number;
}

export interface ReporteMensualParams {
  year: number;
  month: number;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface ReporteTardanzasParams {
  dateFrom: string;
  dateTo: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface ReporteAusenciasParams {
  dateFrom: string;
  dateTo: string;
  dayType?: DayType;
  employeeId?: string;
  page?: number;
  limit?: number;
}
