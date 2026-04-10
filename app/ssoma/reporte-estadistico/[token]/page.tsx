'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import StatisticalReportEditor from '@/components/ssoma/StatisticalReportEditor'
import type {
  EvidenceCategoryKey,
  SsomaEvidenceAttachment,
  SsomaStatisticalReportData,
  SsomaStatisticalReportRecord,
  WeekKey,
} from '@/types/ssoma-report'
import { buildInitialReportPayload, exportSsomaReportWorkbook, getReportStatusMeta } from '@/utils/ssoma-report'

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
  const latestStatusRef = useRef<SsomaStatisticalReportRecord['status'] | null>(null)

  const fetchReport = async (options?: { syncData?: boolean; silent?: boolean }) => {
    const syncData = options?.syncData ?? false
    const silent = options?.silent ?? false

    if (!token) return

    if (!silent) {
      setLoading(true)
      setErrorMessage('')
    }

    try {
      const response = await fetch(`/api/ssoma-report/${token}`, { cache: 'no-store' })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'No se pudo abrir el formulario.')
      }

      if (latestStatusRef.current && latestStatusRef.current !== json.status) {
        const nextMessage =
          json.status === 'approved'
            ? 'Tu reporte fue aprobado.'
            : json.status === 'rejected'
              ? 'Tu reporte fue rechazado. Revisa las observaciones.'
              : 'Tu reporte paso a revision.'

        toast.success(nextMessage)
      }

      latestStatusRef.current = json.status
      setReport((current) => {
        if (!current || syncData) return json

        return {
          ...current,
          status: json.status,
          submitted_at: json.submitted_at,
          reviewed_at: json.reviewed_at,
          reviewed_by: json.reviewed_by,
          review_notes: json.review_notes,
          updated_at: json.updated_at,
        }
      })

      if (syncData) {
        setEditorData(buildInitialReportPayload(json.data))
      }
    } catch (error: any) {
      if (!silent) {
        setErrorMessage(error.message || 'No se pudo abrir el formulario.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!token) return

    void fetchReport({ syncData: true })

    const interval = window.setInterval(() => {
      void fetchReport({ silent: true })
    }, 7000)

    return () => window.clearInterval(interval)
  }, [token])

  const handlePersist = async (nextStatus: 'draft' | 'in_review') => {
    if (!report || !editorData) return

    const setBusy = nextStatus === 'in_review' ? setSubmitting : setSaving
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
      latestStatusRef.current = json.status
      toast.success(nextStatus === 'in_review' ? 'Formulario enviado a revision.' : 'Cambios guardados.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el formulario.')
    } finally {
      setBusy(false)
    }
  }

  const handleUploadEvidence = async (weekKey: WeekKey, category: EvidenceCategoryKey, file: File): Promise<SsomaEvidenceAttachment> => {
    if (!report) {
      throw new Error('El reporte aun no esta listo para adjuntar archivos.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('weekKey', weekKey)
    formData.append('category', category)

    const response = await fetch(`/api/ssoma-report/${report.public_token}/evidence`, {
      method: 'POST',
      body: formData,
    })

    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.error || 'No se pudo subir el adjunto.')
    }

    return json
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

  const statusMeta = getReportStatusMeta(report.status)

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

          <div className={`px-4 py-2 rounded-full text-xs font-bold ${statusMeta.badgeClassName}`}>
            FORMULARIO {statusMeta.shortLabel}
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-6 py-6 space-y-6">
        {report.status !== 'draft' && (
          <div className={`${statusMeta.panelClassName} border rounded-3xl p-5 flex items-start gap-3`}>
            {report.status === 'approved' ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            )}
            <div>
              <div className="font-bold">
                {report.status === 'in_review' && 'Tu reporte esta en revision.'}
                {report.status === 'approved' && 'Tu reporte fue aprobado.'}
                {report.status === 'rejected' && 'Tu reporte fue rechazado.'}
              </div>
              <p className="text-sm mt-1">
                {report.status === 'in_review' && 'El equipo admin ya puede revisarlo y decidir si lo aprueba o rechaza.'}
                {report.status === 'approved' && 'Si necesitas actualizar algo, puedes volver a guardar y reenviar desde este mismo link.'}
                {report.status === 'rejected' && 'Puedes corregir la informacion, guardar borrador y volver a enviarlo cuando este listo.'}
              </p>
              {report.review_notes && <p className="text-sm mt-3 font-medium">Observacion: {report.review_notes}</p>}
            </div>
          </div>
        )}

        <StatisticalReportEditor
          data={editorData}
          onChange={setEditorData}
          onSave={() => void handlePersist('in_review')}
          onExport={handleExport}
          onUploadEvidence={handleUploadEvidence}
          saveLabel={submitting ? 'Enviando...' : report.status === 'approved' ? 'Guardar y reenviar' : 'Guardar y enviar a revision'}
          exportLabel="Exportar Excel"
          saving={submitting}
          exporting={exporting}
          extraActions={
            <button
              onClick={() => void handlePersist('draft')}
              disabled={saving || submitting}
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
