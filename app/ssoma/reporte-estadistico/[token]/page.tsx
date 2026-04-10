'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import StatisticalReportEditor from '@/components/ssoma/StatisticalReportEditor'
import type { SsomaStatisticalReportData, SsomaStatisticalReportRecord } from '@/types/ssoma-report'
import { buildInitialReportPayload, exportSsomaReportWorkbook } from '@/utils/ssoma-report'

export default function PublicSsomaStatisticalReportPage() {
  const params = useParams<{ token: string }>()
  const token = String(params?.token || '')

  const [report, setReport] = useState<SsomaStatisticalReportRecord | null>(null)
  const [editorData, setEditorData] = useState<SsomaStatisticalReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) return

    const fetchReport = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch(`/api/ssoma-report/${token}`, { cache: 'no-store' })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || 'No se pudo abrir el formulario.')
        }

        setReport(json)
        setEditorData(buildInitialReportPayload(json.data))
      } catch (error: any) {
        setErrorMessage(error.message || 'No se pudo abrir el formulario.')
      } finally {
        setLoading(false)
      }
    }

    void fetchReport()
  }, [token])

  const handlePersist = async (nextStatus: 'draft' | 'submitted') => {
    if (!report || !editorData) return

    const setBusy = nextStatus === 'submitted' ? setSubmitting : setSaving
    setBusy(true)

    try {
      const response = await fetch(`/api/ssoma-report/${report.public_token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_proyecto: editorData.obraProyecto,
          empresa: editorData.empresa,
          mes_label: editorData.monthLabel,
          respondent_name: editorData.respondentName,
          respondent_email: editorData.respondentEmail,
          status: nextStatus,
          data: editorData,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo guardar el formulario.')
      }

      setReport(json)
      setEditorData(buildInitialReportPayload(json.data))
      toast.success(nextStatus === 'submitted' ? 'Formulario enviado correctamente.' : 'Cambios guardados.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el formulario.')
    } finally {
      setBusy(false)
    }
  }

  const handleExport = async () => {
    if (!report || !editorData) return

    setExporting(true)
    try {
      await exportSsomaReportWorkbook({
        title: report.title,
        data: editorData,
      })
      toast.success('Excel generado con el formato oficial.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo exportar el Excel.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-8 py-10 text-center text-slate-500">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          Cargando formulario SSOMA...
        </div>
      </div>
    )
  }

  if (errorMessage || !report || !editorData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-lg bg-white rounded-3xl border border-red-200 shadow-sm px-8 py-10 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={34} />
          <h1 className="text-xl font-bold text-slate-900">No pude abrir el reporte</h1>
          <p className="mt-3 text-sm text-slate-500">{errorMessage || 'El link no existe o ya no esta disponible.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1700px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-500 flex items-center gap-2">
              <ShieldCheck size={14} />
              Seguridad SSOMA
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{report.title}</h1>
          </div>

          <div className={`px-4 py-2 rounded-full text-xs font-bold ${report.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {report.status === 'submitted' ? 'FORMULARIO ENVIADO' : 'FORMULARIO EN BORRADOR'}
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-6 py-6 space-y-6">
        {report.status === 'submitted' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl p-5 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <div className="font-bold">Este reporte ya fue enviado.</div>
              <p className="text-sm mt-1">Si necesitas hacer ajustes, puedes guardar nuevamente o volver a enviarlo desde este mismo link.</p>
            </div>
          </div>
        )}

        <StatisticalReportEditor
          data={editorData}
          onChange={setEditorData}
          onSave={() => void handlePersist('submitted')}
          onExport={handleExport}
          saveLabel={submitting ? 'Enviando...' : 'Guardar y enviar'}
          exportLabel="Exportar Excel"
          saving={submitting}
          exporting={exporting}
          extraActions={
            <button
              onClick={() => void handlePersist('draft')}
              disabled={saving}
              className="px-4 py-3 rounded-2xl border border-white/15 bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          }
        />
      </div>
    </div>
  )
}
