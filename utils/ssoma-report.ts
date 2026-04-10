'use client'

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

import type {
  ActivityRow,
  AccidentRelationRow,
  CompanyCountRow,
  DailyCounterRow,
  DayValues,
  ReportStatus,
  MonthlyReportData,
  SsomaStatisticalReportData,
  SsomaStatisticalReportRecord,
  TrainingRow,
  WasteRow,
  WeekKey,
  WeeklyEvidenceMap,
  WeeklyReportData,
} from '@/types/ssoma-report'
import { EVIDENCE_CATEGORY_KEYS, WEEK_KEYS } from '@/types/ssoma-report'

const DAY_COLUMN_MAP = ['D', 'E', 'F', 'G', 'H', 'I', 'J'] as const

const HHT_BASE_LABELS = [
  'Cantidad de personal obrero RUAG',
  'Cantidad de personal obrero SUBCONTRATISTA',
  'Cantidad de personal de STAFF RUAG',
  'Cantidad de personal de STAFF SUBCONTRATISTA',
]

const ACCIDENT_LABELS = [
  'Accidente Leve',
  'Accidente Incapacitante',
  'Accidente Mortal',
]

const LOST_DAY_LABELS = ['Dias Perdidos']

const INCIDENT_LABELS = [
  'Incidentes',
  'Incidente Peligroso',
]

const ADMONITION_LABELS = [
  'Actos Inseguros RUAG',
  'Actos Inseguros Subcontratista',
  'Condiciones Inseguras RUAG',
  'Condiciones Inseguras Subcontratista',
]

const MANAGEMENT_DOCUMENT_LABELS = [
  'ATS RUAG',
  'ATS Subcontratista',
  'Permiso de Trabajo en Altura RUAG',
  'Permiso de Trabajo en Altura Subcontratista',
  'Permiso de Trabajo en Caliente RUAG',
  'Permiso de Trabajo en Caliente Subcontratista',
  'Permiso de Horario Extendido RUAG',
  'Permiso de Horario Extendido Subcontratista',
  'Otro documento RUAG',
  'Otro documento Subcontratista',
  'Otro permiso RUAG',
  'Otro permiso Subcontratista',
]

const INSPECTION_LABELS = [
  'Inspecciones de Seguridad Programadas',
  'Inspecciones de Seguridad No Programadas',
  'Otras',
]

const RELEVANT_FACTS_ITEMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

const WEEK_SECTION_ROWS = {
  hhtDayShift: 16,
  hhtNightShift: 31,
  hhtExtendedShift: 46,
  subcontractors: 87,
  trainings: 101,
  accidentRelations: 129,
  accidents: 134,
  lostDays: 140,
  incidents: 144,
  admonitions: 154,
  managementDocuments: 171,
  inspections: 188,
  actividadesOperativas: 194,
  actividadesSsoma: 202,
  observations: 210,
}

function createEmptyDayValues(): DayValues {
  return {
    lunes: '0',
    martes: '0',
    miercoles: '0',
    jueves: '0',
    viernes: '0',
    sabado: '0',
    domingo: '0',
  }
}

function createDailyCounterRows(labels: string[]): DailyCounterRow[] {
  return labels.map((label) => ({
    label,
    values: createEmptyDayValues(),
  }))
}

function createCompanyRows(total: number): CompanyCountRow[] {
  return Array.from({ length: total }, (_, index) => ({
    company: '',
    label: `${index + 1}`,
    values: createEmptyDayValues(),
  }))
}

function createTrainingRows(total: number): TrainingRow[] {
  return Array.from({ length: total }, () => ({
    date: '',
    type: '',
    topic: '',
    attendeesRuag: '0',
    attendeesSubcontractor: '0',
    hours: '0',
  }))
}

function createAccidentRelationRows(total: number): AccidentRelationRow[] {
  return Array.from({ length: total }, () => ({
    company: '',
    date: '',
    type: '',
    affectedName: '',
    description: '',
  }))
}

function createActivityRows(items: string[]): ActivityRow[] {
  return items.map((item) => ({
    item,
    description: '',
  }))
}

function createWasteRows(total: number): WasteRow[] {
  return Array.from({ length: total }, () => ({
    company: '',
    wasteType: '',
    weightKg: '',
    volumeM3: '',
  }))
}

function createEmptyWeeklyEvidenceMap(): WeeklyEvidenceMap {
  return EVIDENCE_CATEGORY_KEYS.reduce(
    (accumulator, key) => ({
      ...accumulator,
      [key]: [],
    }),
    {} as WeeklyEvidenceMap
  )
}

export function createEmptyWeeklyReportData(): WeeklyReportData {
  return {
    subcontractors: createCompanyRows(8),
    trainings: createTrainingRows(18),
    accidentRelations: createAccidentRelationRows(3),
    actividadesOperativas: createActivityRows(['1', '2', '3', '4', '5', '6']),
    actividadesSsoma: createActivityRows(['1', '2', '3', '4', '5', '6']),
    observations: '',
    hhtDayShift: createDailyCounterRows(HHT_BASE_LABELS),
    hhtNightShift: createDailyCounterRows(HHT_BASE_LABELS),
    hhtExtendedShift: createDailyCounterRows(HHT_BASE_LABELS),
    accidents: createDailyCounterRows(ACCIDENT_LABELS),
    lostDays: createDailyCounterRows(LOST_DAY_LABELS),
    incidents: createDailyCounterRows(INCIDENT_LABELS),
    admonitions: createDailyCounterRows(ADMONITION_LABELS),
    managementDocuments: createDailyCounterRows(MANAGEMENT_DOCUMENT_LABELS),
    inspections: createDailyCounterRows(INSPECTION_LABELS),
    evidence: createEmptyWeeklyEvidenceMap(),
  }
}

export function createEmptyMonthlyReportData(): MonthlyReportData {
  return {
    relevantFacts: createActivityRows(RELEVANT_FACTS_ITEMS),
    accidentRelations: createAccidentRelationRows(4),
    environment: {
      electricConsumptionKwh: '',
      fuelConsumptionGallons: '',
      potableWaterM3: '',
      cisternWaterM3: '',
      effluentsM3: '',
      nonHazardousWasteM3: '',
      hazardousWasteM3: '',
    },
    nonHazardousWasteRows: createWasteRows(6),
    hazardousWasteRows: createWasteRows(6),
  }
}

export function createEmptySsomaReportData(): SsomaStatisticalReportData {
  return {
    obraProyecto: '',
    empresa: 'RUAG S.R.L.',
    monthLabel: '',
    residentName: '',
    supervisorName: '',
    respondentName: '',
    respondentEmail: '',
    weeks: {
      'SEMANA 01': createEmptyWeeklyReportData(),
      'SEMANA 02': createEmptyWeeklyReportData(),
      'SEMANA 03': createEmptyWeeklyReportData(),
      'SEMANA 04': createEmptyWeeklyReportData(),
      'SEMANA 05': createEmptyWeeklyReportData(),
    },
    monthly: createEmptyMonthlyReportData(),
  }
}

export function buildInitialReportPayload(input?: Partial<SsomaStatisticalReportData>): SsomaStatisticalReportData {
  const base = createEmptySsomaReportData()

  if (!input) return base

  const mergeWeeklyReportData = (week?: Partial<WeeklyReportData>): WeeklyReportData => {
    const baseWeek = createEmptyWeeklyReportData()

    return {
      ...baseWeek,
      ...week,
      evidence: {
        ...baseWeek.evidence,
        ...(week?.evidence || {}),
      },
    }
  }

  const mergeMonthlyReportData = (monthly?: Partial<MonthlyReportData>): MonthlyReportData => {
    const baseMonthly = createEmptyMonthlyReportData()

    return {
      ...baseMonthly,
      ...monthly,
      environment: {
        ...baseMonthly.environment,
        ...(monthly?.environment || {}),
      },
    }
  }

  return {
    ...base,
    ...input,
    weeks: {
      'SEMANA 01': mergeWeeklyReportData(input.weeks?.['SEMANA 01']),
      'SEMANA 02': mergeWeeklyReportData(input.weeks?.['SEMANA 02']),
      'SEMANA 03': mergeWeeklyReportData(input.weeks?.['SEMANA 03']),
      'SEMANA 04': mergeWeeklyReportData(input.weeks?.['SEMANA 04']),
      'SEMANA 05': mergeWeeklyReportData(input.weeks?.['SEMANA 05']),
    },
    monthly: mergeMonthlyReportData(input.monthly),
  }
}

export function getAppBaseUrl(origin?: string) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  const runtimeBaseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  const baseUrl = configuredBaseUrl || runtimeBaseUrl

  return baseUrl.replace(/\/$/, '')
}

export function buildReportShareUrl(origin: string | undefined, token: string) {
  const baseUrl = getAppBaseUrl(origin)

  if (!baseUrl) {
    return `/ssoma/reporte-estadistico/${token}`
  }

  return `${baseUrl}/ssoma/reporte-estadistico/${token}`
}

export function getReportStatusMeta(status: ReportStatus) {
  switch (status) {
    case 'in_review':
      return {
        label: 'En revision',
        shortLabel: 'REVISION',
        badgeClassName: 'bg-blue-100 text-blue-700',
        panelClassName: 'bg-blue-50 border-blue-200 text-blue-800',
      }
    case 'approved':
      return {
        label: 'Aprobado',
        shortLabel: 'APROBADO',
        badgeClassName: 'bg-emerald-100 text-emerald-700',
        panelClassName: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      }
    case 'rejected':
      return {
        label: 'Rechazado',
        shortLabel: 'RECHAZADO',
        badgeClassName: 'bg-rose-100 text-rose-700',
        panelClassName: 'bg-rose-50 border-rose-200 text-rose-800',
      }
    case 'draft':
    default:
      return {
        label: 'Borrador',
        shortLabel: 'BORRADOR',
        badgeClassName: 'bg-amber-100 text-amber-700',
        panelClassName: 'bg-amber-50 border-amber-200 text-amber-800',
      }
  }
}

function parseNumericInput(value: string | number | null | undefined) {
  if (typeof value === 'number') return value
  if (!value) return 0

  const normalized = String(value).replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function setCellValue(worksheet: ExcelJS.Worksheet, address: string, value: string | number | null | undefined) {
  worksheet.getCell(address).value = value === '' ? null : value ?? null
}

function setDailyValues(worksheet: ExcelJS.Worksheet, row: number, values: DayValues) {
  const orderedValues = [
    values.lunes,
    values.martes,
    values.miercoles,
    values.jueves,
    values.viernes,
    values.sabado,
    values.domingo,
  ]

  DAY_COLUMN_MAP.forEach((column, index) => {
    setCellValue(worksheet, `${column}${row}`, parseNumericInput(orderedValues[index]))
  })
}

function setWeeklyHeader(worksheet: ExcelJS.Worksheet, data: SsomaStatisticalReportData, weekIndex: number) {
  setCellValue(worksheet, 'C6', data.obraProyecto)
  setCellValue(worksheet, 'C7', data.empresa)
  setCellValue(worksheet, 'C8', data.monthLabel)
  setCellValue(worksheet, 'I8', weekIndex + 1)
  setCellValue(worksheet, 'C9', data.residentName)
  setCellValue(worksheet, 'I9', data.supervisorName)
}

function fillWeeklyHhtSection(worksheet: ExcelJS.Worksheet, startRow: number, rows: DailyCounterRow[]) {
  rows.forEach((row, index) => {
    const currentRow = startRow + index

    if (index >= 8 && row.label) {
      setCellValue(worksheet, `B${currentRow}`, row.label)
    }

    setDailyValues(worksheet, currentRow, row.values)
  })
}

function fillWeeklyData(worksheet: ExcelJS.Worksheet, data: SsomaStatisticalReportData, weekKey: WeekKey, weekIndex: number) {
  const week = data.weeks[weekKey]

  setWeeklyHeader(worksheet, data, weekIndex)
  fillWeeklyHhtSection(worksheet, WEEK_SECTION_ROWS.hhtDayShift, week.hhtDayShift)
  fillWeeklyHhtSection(worksheet, WEEK_SECTION_ROWS.hhtNightShift, week.hhtNightShift)
  fillWeeklyHhtSection(worksheet, WEEK_SECTION_ROWS.hhtExtendedShift, week.hhtExtendedShift)

  week.subcontractors.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.subcontractors + index
    setCellValue(worksheet, `B${currentRow}`, row.company)
    setDailyValues(worksheet, currentRow, row.values)
  })

  week.trainings.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.trainings + index
    setCellValue(worksheet, `A${currentRow}`, row.date)
    setCellValue(worksheet, `C${currentRow}`, row.type)
    setCellValue(worksheet, `D${currentRow}`, row.topic)
    setCellValue(worksheet, `G${currentRow}`, parseNumericInput(row.attendeesRuag))
    setCellValue(worksheet, `H${currentRow}`, parseNumericInput(row.attendeesSubcontractor))
    setCellValue(worksheet, `I${currentRow}`, parseNumericInput(row.hours))
  })

  week.accidentRelations.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.accidentRelations + index
    setCellValue(worksheet, `A${currentRow}`, row.company)
    setCellValue(worksheet, `C${currentRow}`, row.date)
    setCellValue(worksheet, `D${currentRow}`, row.type)
    setCellValue(worksheet, `E${currentRow}`, row.affectedName)
    setCellValue(worksheet, `H${currentRow}`, row.description)
  })

  week.accidents.forEach((row, index) => {
    setDailyValues(worksheet, WEEK_SECTION_ROWS.accidents + index, row.values)
  })

  week.lostDays.forEach((row, index) => {
    setDailyValues(worksheet, WEEK_SECTION_ROWS.lostDays + index, row.values)
  })

  week.incidents.forEach((row, index) => {
    setDailyValues(worksheet, WEEK_SECTION_ROWS.incidents + index, row.values)
  })

  week.admonitions.forEach((row, index) => {
    setDailyValues(worksheet, WEEK_SECTION_ROWS.admonitions + index, row.values)
  })

  week.managementDocuments.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.managementDocuments + index
    if (index >= 8 && row.label) {
      setCellValue(worksheet, `B${currentRow}`, row.label)
    }

    setDailyValues(worksheet, currentRow, row.values)
  })

  week.inspections.forEach((row, index) => {
    setDailyValues(worksheet, WEEK_SECTION_ROWS.inspections + index, row.values)
  })

  week.actividadesOperativas.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.actividadesOperativas + index
    setCellValue(worksheet, `C${currentRow}`, row.description)
  })

  week.actividadesSsoma.forEach((row, index) => {
    const currentRow = WEEK_SECTION_ROWS.actividadesSsoma + index
    setCellValue(worksheet, `C${currentRow}`, row.description)
  })

  setCellValue(worksheet, `A${WEEK_SECTION_ROWS.observations}`, week.observations)
}

function fillMonthlyData(worksheet: ExcelJS.Worksheet, data: SsomaStatisticalReportData) {
  const monthly = data.monthly

  setCellValue(worksheet, 'C5', data.obraProyecto)
  setCellValue(worksheet, 'C6', data.empresa)
  setCellValue(worksheet, 'C7', data.monthLabel)

  monthly.relevantFacts.forEach((row, index) => {
    setCellValue(worksheet, `C${63 + index}`, row.description)
  })

  monthly.accidentRelations.forEach((row, index) => {
    const currentRow = 75 + index
    setCellValue(worksheet, `A${currentRow}`, row.company)
    setCellValue(worksheet, `C${currentRow}`, row.date)
    setCellValue(worksheet, `D${currentRow}`, row.type)
    setCellValue(worksheet, `E${currentRow}`, row.affectedName)
    setCellValue(worksheet, `I${currentRow}`, row.description)
  })

  setCellValue(worksheet, 'G81', monthly.environment.electricConsumptionKwh)
  setCellValue(worksheet, 'G82', monthly.environment.fuelConsumptionGallons)
  setCellValue(worksheet, 'G83', monthly.environment.potableWaterM3)
  setCellValue(worksheet, 'G84', monthly.environment.cisternWaterM3)
  setCellValue(worksheet, 'G85', monthly.environment.effluentsM3)
  setCellValue(worksheet, 'G86', monthly.environment.nonHazardousWasteM3)
  setCellValue(worksheet, 'G87', monthly.environment.hazardousWasteM3)

  monthly.nonHazardousWasteRows.forEach((row, index) => {
    const currentRow = 91 + index
    setCellValue(worksheet, `A${currentRow}`, row.company)
    setCellValue(worksheet, `C${currentRow}`, row.wasteType)
    setCellValue(worksheet, `F${currentRow}`, row.weightKg)
    setCellValue(worksheet, `H${currentRow}`, row.volumeM3)
  })

  monthly.hazardousWasteRows.forEach((row, index) => {
    const currentRow = 99 + index
    setCellValue(worksheet, `A${currentRow}`, row.company)
    setCellValue(worksheet, `C${currentRow}`, row.wasteType)
    setCellValue(worksheet, `F${currentRow}`, row.weightKg)
    setCellValue(worksheet, `H${currentRow}`, row.volumeM3)
  })
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function loadTemplateWorkbook() {
  const response = await fetch('/templates/ssoma-reporte-estadistico-template.xlsx')

  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla del reporte estadistico.')
  }

  const workbook = new ExcelJS.Workbook()
  const arrayBuffer = await response.arrayBuffer()
  await workbook.xlsx.load(arrayBuffer)
  workbook.calcProperties.fullCalcOnLoad = true

  return workbook
}

export async function exportSsomaReportWorkbook(report: SsomaStatisticalReportRecord | { title: string; data: SsomaStatisticalReportData }) {
  const workbook = await loadTemplateWorkbook()

  WEEK_KEYS.forEach((weekKey, index) => {
    const worksheet = workbook.getWorksheet(weekKey)

    if (worksheet) {
      fillWeeklyData(worksheet, report.data, weekKey, index)
    }
  })

  const consolidatedWorksheet = workbook.getWorksheet(' CONS')
  if (consolidatedWorksheet) {
    fillMonthlyData(consolidatedWorksheet, report.data)
  }

  const fileBuffer = await workbook.xlsx.writeBuffer()
  const safeFileName = sanitizeFileName(report.title || `Reporte_SSOMA_${report.data.monthLabel || 'sin_mes'}`)
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, `${safeFileName || 'Reporte_SSOMA'}.xlsx`)
}
