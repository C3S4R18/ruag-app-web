export const WEEK_KEYS = ['SEMANA 01', 'SEMANA 02', 'SEMANA 03', 'SEMANA 04', 'SEMANA 05'] as const
export const DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const

export type WeekKey = (typeof WEEK_KEYS)[number]
export type DayKey = (typeof DAY_KEYS)[number]
export type ReportStatus = 'draft' | 'submitted'

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
}
