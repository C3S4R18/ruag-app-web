export const WEEK_KEYS = ['SEMANA 01', 'SEMANA 02', 'SEMANA 03', 'SEMANA 04', 'SEMANA 05'] as const
export const DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const
export const REPORT_STATUS_KEYS = ['draft', 'in_review', 'approved', 'rejected'] as const
export const TRAINING_TYPE_OPTIONS = ['Charla diaria', 'Charla semanal', 'Capacitación específica', 'Inducción'] as const
export const EVIDENCE_CATEGORY_KEYS = ['accidents', 'lostDays', 'incidents', 'admonitions'] as const

export type WeekKey = (typeof WEEK_KEYS)[number]
export type DayKey = (typeof DAY_KEYS)[number]
export type ReportStatus = (typeof REPORT_STATUS_KEYS)[number]
export type EvidenceCategoryKey = (typeof EVIDENCE_CATEGORY_KEYS)[number]

export interface DayValues {
  lunes: string
  martes: string
  miercoles: string
  jueves: string
  viernes: string
  sabado: string
  domingo: string
}

export interface DailyCounterRow {
  label: string
  values: DayValues
}

export interface CompanyCountRow extends DailyCounterRow {
  company: string
}

export interface TrainingRow {
  date: string
  type: string
  topic: string
  attendeesRuag: string
  attendeesSubcontractor: string
  hours: string
}

export interface AccidentRelationRow {
  company: string
  date: string
  type: string
  affectedName: string
  description: string
}

export interface ActivityRow {
  item: string
  description: string
}

export interface WasteRow {
  company: string
  wasteType: string
  weightKg: string
  volumeM3: string
}

export interface SsomaEvidenceAttachment {
  id: string
  name: string
  url: string
  path: string
  contentType: string
  size: number
  uploadedAt: string
  category: EvidenceCategoryKey
}

export type WeeklyEvidenceMap = Record<EvidenceCategoryKey, SsomaEvidenceAttachment[]>

export interface WeeklyReportData {
  subcontractors: CompanyCountRow[]
  trainings: TrainingRow[]
  accidentRelations: AccidentRelationRow[]
  actividadesOperativas: ActivityRow[]
  actividadesSsoma: ActivityRow[]
  observations: string
  hhtDayShift: DailyCounterRow[]
  hhtNightShift: DailyCounterRow[]
  hhtExtendedShift: DailyCounterRow[]
  accidents: DailyCounterRow[]
  lostDays: DailyCounterRow[]
  incidents: DailyCounterRow[]
  admonitions: DailyCounterRow[]
  managementDocuments: DailyCounterRow[]
  inspections: DailyCounterRow[]
  evidence: WeeklyEvidenceMap
}

export interface MonthlyReportData {
  relevantFacts: ActivityRow[]
  accidentRelations: AccidentRelationRow[]
  environment: {
    electricConsumptionKwh: string
    fuelConsumptionGallons: string
    potableWaterM3: string
    cisternWaterM3: string
    effluentsM3: string
    nonHazardousWasteM3: string
    hazardousWasteM3: string
  }
  nonHazardousWasteRows: WasteRow[]
  hazardousWasteRows: WasteRow[]
}

export interface SsomaStatisticalReportData {
  obraProyecto: string
  empresa: string
  monthLabel: string
  residentName: string
  supervisorName: string
  respondentName: string
  respondentEmail: string
  weeks: Record<WeekKey, WeeklyReportData>
  monthly: MonthlyReportData
}

export interface SsomaStatisticalReportRecord {
  id: string
  public_token: string
  title: string
  obra_proyecto: string | null
  empresa: string | null
  mes_label: string | null
  assigned_to: string | null
  assigned_email: string | null
  respondent_name: string | null
  respondent_email: string | null
  status: ReportStatus
  data: SsomaStatisticalReportData
  created_at: string
  updated_at: string
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
}
