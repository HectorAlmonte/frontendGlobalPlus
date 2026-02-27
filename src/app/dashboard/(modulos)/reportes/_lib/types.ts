export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ReporteIncidente = {
  number: number
  title: string
  type: string
  status: string
  areaName: string
  reportedBy: string
  reportedAt: string
  closedAt: string | null
  correctivePriority: string | null
  correctiveDueDate: string | null
}

export type ReporteTarea = {
  number: number
  title: string
  status: string
  priority: string
  dueDate: string | null
  progress: number
  createdAt: string
  workAreaName: string | null
  assignees: string[]
}

export type ReporteEpp = {
  number: number
  employeeName: string
  employeeDni: string
  reason: string
  deliveredAt: string
  signed: boolean
  signedAt: string | null
  itemCount: number
  createdBy: string
}

export type ReporteStorage = {
  createdAt: string
  productName: string
  productCode: string
  movementType: string
  quantity: number
  notes: string | null
  performedBy: string
  requestedBy: string | null
}
