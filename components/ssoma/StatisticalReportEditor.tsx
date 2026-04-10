'use client'

import { useMemo, useState } from 'react'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  HardHat,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react'

import type {
  AccidentRelationRow,
  ActivityRow,
  CompanyCountRow,
  DailyCounterRow,
  DayKey,
  MonthlyReportData,
  SsomaStatisticalReportData,
  TrainingRow,
  WasteRow,
  WeekKey,
  WeeklyReportData,
} from '@/types/ssoma-report'
import { DAY_KEYS, WEEK_KEYS } from '@/types/ssoma-report'

type EditorTab = 'general' | 'monthly' | WeekKey

interface StatisticalReportEditorProps {
  data: SsomaStatisticalReportData
  onChange: (next: SsomaStatisticalReportData) => void
  onSave?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
  saveLabel?: string
  exportLabel?: string
  saving?: boolean
  exporting?: boolean
  extraActions?: React.ReactNode
}

const DAY_LABELS: Record<DayKey, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mie',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sab',
  domingo: 'Dom',
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'date' | 'number'
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 resize-y"
      />
    </label>
  )
}

function DailyCounterTable({
  rows,
  onChange,
  allowLabelEdit = false,
  labelHeader = 'Concepto',
}: {
  rows: DailyCounterRow[]
  onChange: (rows: DailyCounterRow[]) => void
  allowLabelEdit?: boolean
  labelHeader?: string
}) {
  const updateRow = (rowIndex: number, key: keyof DailyCounterRow, value: string) => {
    onChange(
      rows.map((row, index) => {
        if (index !== rowIndex) return row
        return { ...row, [key]: value }
      })
    )
  }

  const updateDayValue = (rowIndex: number, dayKey: DayKey, value: string) => {
    onChange(
      rows.map((row, index) => {
        if (index !== rowIndex) return row
        return {
          ...row,
          values: {
            ...row.values,
            [dayKey]: value,
          },
        }
      })
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-2 font-bold">{labelHeader}</th>
            {DAY_KEYS.map((dayKey) => (
              <th key={dayKey} className="px-3 py-2 font-bold text-center">
                {DAY_LABELS[dayKey]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.label}-${rowIndex}`} className="border-t border-slate-100">
              <td className="px-3 py-2 min-w-[240px]">
                {allowLabelEdit ? (
                  <input
                    value={row.label}
                    onChange={(event) => updateRow(rowIndex, 'label', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                  />
                ) : (
                  <span className="font-medium text-slate-700">{row.label}</span>
                )}
              </td>
              {DAY_KEYS.map((dayKey) => (
                <td key={dayKey} className="px-2 py-2 min-w-[90px]">
                  <input
                    type="number"
                    min="0"
                    value={row.values[dayKey]}
                    onChange={(event) => updateDayValue(rowIndex, dayKey, event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-blue-300 focus:bg-white"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompanyCountTable({ rows, onChange }: { rows: CompanyCountRow[]; onChange: (rows: CompanyCountRow[]) => void }) {
  const updateCompany = (rowIndex: number, company: string) => {
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, company } : row)))
  }

  const updateDayValue = (rowIndex: number, dayKey: DayKey, value: string) => {
    onChange(
      rows.map((row, index) => {
        if (index !== rowIndex) return row
        return {
          ...row,
          values: {
            ...row.values,
            [dayKey]: value,
          },
        }
      })
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-2 font-bold">Empresa</th>
            {DAY_KEYS.map((dayKey) => (
              <th key={dayKey} className="px-3 py-2 font-bold text-center">
                {DAY_LABELS[dayKey]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`company-${rowIndex}`} className="border-t border-slate-100">
              <td className="px-3 py-2 min-w-[240px]">
                <input
                  value={row.company}
                  onChange={(event) => updateCompany(rowIndex, event.target.value)}
                  placeholder={`Empresa ${rowIndex + 1}`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              {DAY_KEYS.map((dayKey) => (
                <td key={dayKey} className="px-2 py-2 min-w-[90px]">
                  <input
                    type="number"
                    min="0"
                    value={row.values[dayKey]}
                    onChange={(event) => updateDayValue(rowIndex, dayKey, event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-blue-300 focus:bg-white"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrainingTable({ rows, onChange }: { rows: TrainingRow[]; onChange: (rows: TrainingRow[]) => void }) {
  const updateRow = (rowIndex: number, key: keyof TrainingRow, value: string) => {
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)))
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-2 font-bold">Fecha</th>
            <th className="px-3 py-2 font-bold">Tipo</th>
            <th className="px-3 py-2 font-bold">Tema</th>
            <th className="px-3 py-2 font-bold">Asist. RUAG</th>
            <th className="px-3 py-2 font-bold">Asist. Subcont.</th>
            <th className="px-3 py-2 font-bold">Horas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`training-${rowIndex}`} className="border-t border-slate-100">
              <td className="px-3 py-2 min-w-[160px]">
                <input
                  type="date"
                  value={row.date}
                  onChange={(event) => updateRow(rowIndex, 'date', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[180px]">
                <input
                  value={row.type}
                  onChange={(event) => updateRow(rowIndex, 'type', event.target.value)}
                  placeholder="Charla diaria / Induccion"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[260px]">
                <input
                  value={row.topic}
                  onChange={(event) => updateRow(rowIndex, 'topic', event.target.value)}
                  placeholder="Tema de la capacitacion"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[120px]">
                <input
                  type="number"
                  min="0"
                  value={row.attendeesRuag}
                  onChange={(event) => updateRow(rowIndex, 'attendeesRuag', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[140px]">
                <input
                  type="number"
                  min="0"
                  value={row.attendeesSubcontractor}
                  onChange={(event) => updateRow(rowIndex, 'attendeesSubcontractor', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[120px]">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={row.hours}
                  onChange={(event) => updateRow(rowIndex, 'hours', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccidentRelationTable({
  rows,
  onChange,
}: {
  rows: AccidentRelationRow[]
  onChange: (rows: AccidentRelationRow[]) => void
}) {
  const updateRow = (rowIndex: number, key: keyof AccidentRelationRow, value: string) => {
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)))
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => (
        <div key={`relation-${rowIndex}`} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
            Registro {rowIndex + 1}
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Field label="Empresa" value={row.company} onChange={(value) => updateRow(rowIndex, 'company', value)} />
            <Field label="Fecha" type="date" value={row.date} onChange={(value) => updateRow(rowIndex, 'date', value)} />
            <Field label="Tipo" value={row.type} onChange={(value) => updateRow(rowIndex, 'type', value)} />
            <Field label="Afectado" value={row.affectedName} onChange={(value) => updateRow(rowIndex, 'affectedName', value)} />
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Descripcion"
              value={row.description}
              onChange={(value) => updateRow(rowIndex, 'description', value)}
              rows={3}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivitiesTable({
  rows,
  onChange,
  title,
}: {
  rows: ActivityRow[]
  onChange: (rows: ActivityRow[]) => void
  title: string
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div>
      {rows.map((row, rowIndex) => (
        <div key={`${title}-${rowIndex}`} className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 items-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            Item {row.item}
          </div>
          <textarea
            value={row.description}
            onChange={(event) =>
              onChange(
                rows.map((currentRow, index) => (index === rowIndex ? { ...currentRow, description: event.target.value } : currentRow))
              )
            }
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none resize-y focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            placeholder="Describe la actividad"
          />
        </div>
      ))}
    </div>
  )
}

function WasteTable({ rows, onChange }: { rows: WasteRow[]; onChange: (rows: WasteRow[]) => void }) {
  const updateRow = (rowIndex: number, key: keyof WasteRow, value: string) => {
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)))
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-2 font-bold">Empresa EO-RS</th>
            <th className="px-3 py-2 font-bold">Tipo de residuo</th>
            <th className="px-3 py-2 font-bold">Peso (Kg)</th>
            <th className="px-3 py-2 font-bold">Volumen (m3)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`waste-${rowIndex}`} className="border-t border-slate-100">
              <td className="px-3 py-2 min-w-[220px]">
                <input
                  value={row.company}
                  onChange={(event) => updateRow(rowIndex, 'company', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[260px]">
                <input
                  value={row.wasteType}
                  onChange={(event) => updateRow(rowIndex, 'wasteType', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[130px]">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.weightKg}
                  onChange={(event) => updateRow(rowIndex, 'weightKg', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none text-center focus:border-blue-300 focus:bg-white"
                />
              </td>
              <td className="px-3 py-2 min-w-[130px]">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.volumeM3}
                  onChange={(event) => updateRow(rowIndex, 'volumeM3', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none text-center focus:border-blue-300 focus:bg-white"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WeekTabView({ week, onChange }: { week: WeeklyReportData; onChange: (next: WeeklyReportData) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-3 gap-6">
        <SectionCard title="HHT turno diurno" description="Registra el personal por dia para el turno diurno.">
          <DailyCounterTable rows={week.hhtDayShift} onChange={(rows) => onChange({ ...week, hhtDayShift: rows })} />
        </SectionCard>
        <SectionCard title="HHT turno nocturno" description="Registra el personal por dia para el turno nocturno.">
          <DailyCounterTable rows={week.hhtNightShift} onChange={(rows) => onChange({ ...week, hhtNightShift: rows })} />
        </SectionCard>
        <SectionCard title="HHT horario extendido" description="Registra el personal por dia para horario extendido.">
          <DailyCounterTable rows={week.hhtExtendedShift} onChange={(rows) => onChange({ ...week, hhtExtendedShift: rows })} />
        </SectionCard>
      </div>

      <SectionCard title="Empresas subcontratistas" description="Cada fila alimenta la tabla de subcontratistas de la semana.">
        <CompanyCountTable rows={week.subcontractors} onChange={(rows) => onChange({ ...week, subcontractors: rows })} />
      </SectionCard>

      <SectionCard title="Capacitaciones SSOMA" description="Estos datos llenan la seccion de capacitaciones y las formulas de HHC.">
        <TrainingTable rows={week.trainings} onChange={(rows) => onChange({ ...week, trainings: rows })} />
      </SectionCard>

      <SectionCard title="Relacion de accidentes e incidentes" description="Usa esta seccion para registrar cada evento individual.">
        <AccidentRelationTable rows={week.accidentRelations} onChange={(rows) => onChange({ ...week, accidentRelations: rows })} />
      </SectionCard>

      <div className="grid xl:grid-cols-2 gap-6">
        <SectionCard title="Resumen de accidentes" description="Completa los totales diarios.">
          <DailyCounterTable rows={week.accidents} onChange={(rows) => onChange({ ...week, accidents: rows })} />
        </SectionCard>
        <SectionCard title="Dias perdidos" description="Completa el detalle diario de dias perdidos.">
          <DailyCounterTable rows={week.lostDays} onChange={(rows) => onChange({ ...week, lostDays: rows })} />
        </SectionCard>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <SectionCard title="Incidentes" description="Incluye incidentes e incidentes peligrosos.">
          <DailyCounterTable rows={week.incidents} onChange={(rows) => onChange({ ...week, incidents: rows })} />
        </SectionCard>
        <SectionCard title="Amonestaciones" description="Completa actos y condiciones inseguras.">
          <DailyCounterTable rows={week.admonitions} onChange={(rows) => onChange({ ...week, admonitions: rows })} />
        </SectionCard>
      </div>

      <SectionCard title="Documentacion de gestion SST" description="Las ultimas cuatro filas quedan libres para otros documentos o permisos.">
        <DailyCounterTable rows={week.managementDocuments} onChange={(rows) => onChange({ ...week, managementDocuments: rows })} allowLabelEdit />
      </SectionCard>

      <SectionCard title="Inspecciones de seguridad" description="Registra las inspecciones programadas, no programadas y otras.">
        <DailyCounterTable rows={week.inspections} onChange={(rows) => onChange({ ...week, inspections: rows })} />
      </SectionCard>

      <div className="grid xl:grid-cols-2 gap-6">
        <SectionCard title="Principales actividades operativas">
          <ActivitiesTable rows={week.actividadesOperativas} onChange={(rows) => onChange({ ...week, actividadesOperativas: rows })} title="Actividades operativas" />
        </SectionCard>
        <SectionCard title="Principales actividades SSOMA">
          <ActivitiesTable rows={week.actividadesSsoma} onChange={(rows) => onChange({ ...week, actividadesSsoma: rows })} title="Actividades SSOMA" />
        </SectionCard>
      </div>

      <SectionCard title="Observaciones / sugerencias / comentarios">
        <TextAreaField
          label="Observaciones"
          value={week.observations}
          onChange={(value) => onChange({ ...week, observations: value })}
          rows={7}
          placeholder="Escribe observaciones generales de la semana."
        />
      </SectionCard>
    </div>
  )
}

function MonthlyTabView({ monthly, onChange }: { monthly: MonthlyReportData; onChange: (next: MonthlyReportData) => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Hechos relevantes SSOMA" description="Esta seccion alimenta directamente el consolidado mensual.">
        <ActivitiesTable rows={monthly.relevantFacts} onChange={(rows) => onChange({ ...monthly, relevantFacts: rows })} title="Hechos relevantes" />
      </SectionCard>

      <SectionCard title="Relacion mensual de accidentes e incidentes">
        <AccidentRelationTable rows={monthly.accidentRelations} onChange={(rows) => onChange({ ...monthly, accidentRelations: rows })} />
      </SectionCard>

      <SectionCard title="Informacion de medio ambiente">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Consumo electrico total (Kwh)" type="number" value={monthly.environment.electricConsumptionKwh} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, electricConsumptionKwh: value } })} />
          <Field label="Diesel / Gasolina / GLP (galones)" type="number" value={monthly.environment.fuelConsumptionGallons} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, fuelConsumptionGallons: value } })} />
          <Field label="Agua potable (m3)" type="number" value={monthly.environment.potableWaterM3} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, potableWaterM3: value } })} />
          <Field label="Agua de cisterna (m3)" type="number" value={monthly.environment.cisternWaterM3} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, cisternWaterM3: value } })} />
          <Field label="Efluentes (m3)" type="number" value={monthly.environment.effluentsM3} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, effluentsM3: value } })} />
          <Field label="Residuos no peligrosos (m3)" type="number" value={monthly.environment.nonHazardousWasteM3} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, nonHazardousWasteM3: value } })} />
          <Field label="Residuos peligrosos (m3)" type="number" value={monthly.environment.hazardousWasteM3} onChange={(value) => onChange({ ...monthly, environment: { ...monthly.environment, hazardousWasteM3: value } })} />
        </div>
      </SectionCard>

      <div className="grid xl:grid-cols-2 gap-6">
        <SectionCard title="Segregacion de residuos solidos no peligrosos">
          <WasteTable rows={monthly.nonHazardousWasteRows} onChange={(rows) => onChange({ ...monthly, nonHazardousWasteRows: rows })} />
        </SectionCard>
        <SectionCard title="Segregacion de residuos solidos peligrosos">
          <WasteTable rows={monthly.hazardousWasteRows} onChange={(rows) => onChange({ ...monthly, hazardousWasteRows: rows })} />
        </SectionCard>
      </div>
    </div>
  )
}

export default function StatisticalReportEditor({
  data,
  onChange,
  onSave,
  onExport,
  saveLabel = 'Guardar reporte',
  exportLabel = 'Exportar Excel',
  saving = false,
  exporting = false,
  extraActions,
}: StatisticalReportEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('general')

  const tabs = useMemo(
    () => [
      { key: 'general' as const, label: 'General', icon: <ClipboardList size={16} /> },
      ...WEEK_KEYS.map((weekKey) => ({ key: weekKey, label: weekKey.replace('SEMANA ', 'Semana '), icon: <CalendarDays size={16} /> })),
      { key: 'monthly' as const, label: 'Consolidado', icon: <FileSpreadsheet size={16} /> },
    ],
    []
  )

  const updateRootField = (key: keyof SsomaStatisticalReportData, value: string) => {
    onChange({
      ...data,
      [key]: value,
    })
  }

  const updateWeek = (weekKey: WeekKey, next: WeeklyReportData) => {
    onChange({
      ...data,
      weeks: {
        ...data.weeks,
        [weekKey]: next,
      },
    })
  }

  const content =
    activeTab === 'general' ? (
      <div className="space-y-6">
        <SectionCard title="Datos generales del reporte" description="Estos campos alimentan todas las hojas semanales y el consolidado.">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Obra / proyecto" value={data.obraProyecto} onChange={(value) => updateRootField('obraProyecto', value)} />
            <Field label="Empresa" value={data.empresa} onChange={(value) => updateRootField('empresa', value)} />
            <Field label="Mes - ano" value={data.monthLabel} onChange={(value) => updateRootField('monthLabel', value)} placeholder="ABRIL 2026" />
            <Field label="Residente de obra" value={data.residentName} onChange={(value) => updateRootField('residentName', value)} />
            <Field label="Supervisor SSOMA" value={data.supervisorName} onChange={(value) => updateRootField('supervisorName', value)} />
          </div>
        </SectionCard>

        <SectionCard title="Datos del responsable" description="Esto ayuda a identificar quien completo el formulario desde el link publico.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nombre del responsable" value={data.respondentName} onChange={(value) => updateRootField('respondentName', value)} />
            <Field label="Correo del responsable" type="email" value={data.respondentEmail} onChange={(value) => updateRootField('respondentEmail', value)} />
          </div>
        </SectionCard>

        <SectionCard title="Guia rapida" description="La informacion se divide por semanas y por consolidado mensual.">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={16}/> Datos base</div>
              <p className="mt-2">Completa obra, empresa, mes, residente y supervisor una sola vez.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays size={16}/> Semanas</div>
              <p className="mt-2">Registra HHT, accidentes, capacitaciones, documentos, inspecciones y actividades.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="font-bold text-slate-800 flex items-center gap-2"><Factory size={16}/> Consolidado</div>
              <p className="mt-2">Completa hechos relevantes, medio ambiente y segregacion de residuos.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet size={16}/> Exportacion</div>
              <p className="mt-2">El boton exporta usando tu plantilla oficial y conserva formulas y formato.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    ) : activeTab === 'monthly' ? (
      <MonthlyTabView monthly={data.monthly} onChange={(next) => onChange({ ...data, monthly: next })} />
    ) : (
      <WeekTabView week={data.weeks[activeTab]} onChange={(next) => updateWeek(activeTab, next)} />
    )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-[0.25em]">
                <ShieldCheck size={14} />
                Seguridad SSOMA
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight flex items-center gap-2">
                <HardHat size={22} />
                Reporte Estadistico SSOMA
              </h2>
              <p className="mt-2 text-sm text-slate-300 max-w-3xl">
                Replica digital del formato Excel semanal y consolidado mensual, con exportacion directa a la plantilla oficial.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {extraActions}
              {onExport && (
                <button
                  onClick={() => void onExport()}
                  disabled={exporting}
                  className="px-4 py-3 rounded-2xl border border-white/15 bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  {exporting ? 'Exportando...' : exportLabel}
                </button>
              )}
              {onSave && (
                <button
                  onClick={() => void onSave()}
                  disabled={saving}
                  className="px-4 py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-900/30"
                >
                  {saveLabel.toLowerCase().includes('enviar') ? <Send size={16} /> : <Save size={16} />}
                  {saving ? 'Guardando...' : saveLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {content}
    </div>
  )
}
