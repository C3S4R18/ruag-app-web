'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import SsomaReviewInbox from '@/components/ssoma/SsomaReviewInbox'
import StatisticalReportEditor from '@/components/ssoma/StatisticalReportEditor'
import SsomaReportReviewModal from '@/components/ssoma/SsomaReportReviewModal'
import { createClient } from '@/utils/supabase/client'
import type {
  EvidenceCategoryKey,
  SsomaEvidenceAttachment,
  SsomaStatisticalReportData,
  SsomaStatisticalReportRecord,
  WeekKey,
} from '@/types/ssoma-report'
import {
  buildInitialReportPayload,
  buildReportShareUrl,
  createEmptySsomaReportData,
  exportSsomaReportWorkbook,
  getAppBaseUrl,
  getReportStatusMeta,
} from '@/utils/ssoma-report'

function getDefaultMonthLabel() {
  return new Date().toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).toUpperCase()
}

export default function AdminSsomaStatisticalReportPage() {
  const [requestedToken, setRequestedToken] = useState<string | null>(null)

  const [reports, setReports] = useState<SsomaStatisticalReportRecord[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(requestedToken)
  const [editorData, setEditorData] = useState<SsomaStatisticalReportData>(createEmptySsomaReportData())
  const [reportMeta, setReportMeta] = useState({
    title: '',
    assignedTo: '',
    assignedEmail: '',
  })
  const [reviewNotes, setReviewNotes] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reviewingStatus, setReviewingStatus] = useState<'approved' | 'rejected' | null>(null)
  const [reviewModalReport, setReviewModalReport] = useState<SsomaStatisticalReportRecord | null>(null)
  const [reviewerName, setReviewerName] = useState('Administrador')

  const deferredSearch = useDeferredValue(search)
  const publicBaseUrl = getAppBaseUrl()

  const fetchReports = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const response = await fetch('/api/ssoma-report', { cache: 'no-store' })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'No se pudieron cargar los reportes.')
      }

      setReports(json)
      setSelectedToken((current) => {
        if (requestedToken && json.some((report: SsomaStatisticalReportRecord) => report.public_token === requestedToken)) {
          return requestedToken
        }

        if (current && json.some((report: SsomaStatisticalReportRecord) => report.public_token === current)) {
          return current
        }

        return json[0]?.public_token || null
      })
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || 'No se pudieron cargar los reportes.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    setRequestedToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  useEffect(() => {
    const loadReviewer = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('nombres').eq('id', user.id).single()
      const nextReviewer =
        profile?.nombres?.trim()?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'Administrador'

      setReviewerName(nextReviewer)
    }

    void loadReviewer()
  }, [])

  useEffect(() => {
    void fetchReports()

    const supabase = createClient()
    const realtimeChannel = supabase
      .channel('ssoma-reportes-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ssoma_reportes_estadisticos' }, () => {
        void fetchReports(true)
      })
      .subscribe()

    const interval = window.setInterval(() => {
      void fetchReports(true)
    }, 8000)

    return () => {
      window.clearInterval(interval)
      supabase.removeChannel(realtimeChannel)
    }
  }, [requestedToken])

  const filteredReports = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    if (!term) return reports

    return reports.filter((report) => {
      const haystack = [
        report.title,
        report.obra_proyecto,
        report.empresa,
        report.mes_label,
        report.assigned_to,
        report.respondent_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [deferredSearch, reports])

  const pendingReports = useMemo(
    () =>
      reports
        .filter((report) => report.status === 'in_review')
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
        ),
    [reports]
  )

  const archivedReports = useMemo(
    () =>
      reports
        .filter((report) => report.status === 'approved')
        .sort(
          (a, b) =>
            new Date(b.reviewed_at || b.updated_at || b.created_at || 0).getTime() -
            new Date(a.reviewed_at || a.updated_at || a.created_at || 0).getTime()
        )
        .slice(0, 8),
    [reports]
  )

  const selectedReport = useMemo(
    () => reports.find((report) => report.public_token === selectedToken) || null,
    [reports, selectedToken]
  )

  useEffect(() => {
    if (!selectedReport) {
      setEditorData(createEmptySsomaReportData())
      setReportMeta({
        title: '',
        assignedTo: '',
        assignedEmail: '',
      })
      setReviewNotes('')
      return
    }

    setEditorData(buildInitialReportPayload(selectedReport.data))
    setReportMeta({
      title: selectedReport.title,
      assignedTo: selectedReport.assigned_to || '',
      assignedEmail: selectedReport.assigned_email || '',
    })
    setReviewNotes(selectedReport.review_notes || '')
  }, [selectedReport])

  const syncReportRecord = (updatedRecord: SsomaStatisticalReportRecord) => {
    setReports((prev) => prev.map((report) => (report.public_token === updatedRecord.public_token ? updatedRecord : report)))
  }

  const openReviewReport = (report: SsomaStatisticalReportRecord) => {
    setSelectedToken(report.public_token)
    setReviewNotes(report.review_notes || '')
    setReviewModalReport(report)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const initialData = buildInitialReportPayload({
        monthLabel: getDefaultMonthLabel(),
      })

      const response = await fetch('/api/ssoma-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Reporte Estadistico SSOMA ${initialData.monthLabel}`.trim(),
          obra_proyecto: initialData.obraProyecto,
          empresa: initialData.empresa,
          mes_label: initialData.monthLabel,
          data: initialData,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo crear el reporte.')
      }

      setReports((prev) => [json, ...prev])
      setSelectedToken(json.public_token)
      toast.success('Nuevo reporte estadistico creado.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear el reporte.')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    if (!selectedReport) return

    setSaving(true)
    try {
      const response = await fetch(`/api/ssoma-report/${selectedReport.public_token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportMeta.title,
          obra_proyecto: editorData.obraProyecto,
          empresa: editorData.empresa,
          mes_label: editorData.monthLabel,
          assigned_to: reportMeta.assignedTo || null,
          assigned_email: reportMeta.assignedEmail || null,
          respondent_name: editorData.respondentName,
          respondent_email: editorData.respondentEmail,
          review_notes: reviewNotes || null,
          data: editorData,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo guardar el reporte.')
      }

      syncReportRecord(json)
      toast.success('Reporte estadistico guardado.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el reporte.')
    } finally {
      setSaving(false)
    }
  }

  const handleReview = async (nextStatus: 'approved' | 'rejected') => {
    const reviewTarget = reviewModalReport || selectedReport
    if (!reviewTarget) return

    const isSelectedReport = reviewTarget.public_token === selectedReport?.public_token
    const normalizedReviewData = isSelectedReport ? editorData : buildInitialReportPayload(reviewTarget.data)

    setReviewingStatus(nextStatus)
    try {
      const response = await fetch(`/api/ssoma-report/${reviewTarget.public_token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isSelectedReport ? reportMeta.title : reviewTarget.title,
          obra_proyecto: normalizedReviewData.obraProyecto,
          empresa: normalizedReviewData.empresa,
          mes_label: normalizedReviewData.monthLabel,
          assigned_to: isSelectedReport ? reportMeta.assignedTo || null : reviewTarget.assigned_to || null,
          assigned_email: isSelectedReport ? reportMeta.assignedEmail || null : reviewTarget.assigned_email || null,
          respondent_name: normalizedReviewData.respondentName || reviewTarget.respondent_name || null,
          respondent_email: normalizedReviewData.respondentEmail || reviewTarget.respondent_email || null,
          reviewed_by: reviewerName || 'Administrador',
          review_notes: reviewNotes || null,
          status: nextStatus,
          data: normalizedReviewData,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo actualizar la revision.')
      }

      syncReportRecord(json)
      setReviewModalReport(null)
      toast.success(nextStatus === 'approved' ? 'Reporte aprobado.' : 'Reporte rechazado.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar la revision.')
    } finally {
      setReviewingStatus(null)
    }
  }

  const handleExport = async () => {
    if (!selectedReport) return

    setExporting(true)
    try {
      await exportSsomaReportWorkbook({
        title: reportMeta.title || selectedReport.title,
        data: editorData,
      })
      toast.success('Excel generado con el formato oficial.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo exportar el Excel.')
    } finally {
      setExporting(false)
    }
  }

  const handleUploadEvidence = async (weekKey: WeekKey, category: EvidenceCategoryKey, file: File): Promise<SsomaEvidenceAttachment> => {
    if (!selectedReport) {
      throw new Error('Selecciona un reporte antes de subir adjuntos.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('weekKey', weekKey)
    formData.append('category', category)

    const response = await fetch(`/api/ssoma-report/${selectedReport.public_token}/evidence`, {
      method: 'POST',
      body: formData,
    })

    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.error || 'No se pudo subir el adjunto.')
    }

    return json
  }

  const handleCopyLink = async () => {
    if (!selectedReport) return

    try {
      const shareUrl = buildReportShareUrl(publicBaseUrl, selectedReport.public_token)
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copiado.')
    } catch {
      toast.error('No se pudo copiar el link.')
    }
  }

  const currentStatusMeta = selectedReport ? getReportStatusMeta(selectedReport.status) : null
  const previewReport = selectedReport ? { ...selectedReport, data: editorData, review_notes: reviewNotes } : null

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1700px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-500">Seguridad SSOMA</div>
              <h1 className="text-xl font-bold text-slate-900">Reporte Estadistico</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchReports()}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Nuevo reporte
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1700px] items-start gap-6 px-6 py-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <FileSpreadsheet size={18} />
              Reportes creados
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar reporte..."
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="mx-auto mb-3 animate-spin" size={24} />
                Cargando reportes...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No hay reportes para mostrar.</div>
            ) : (
              filteredReports.map((report) => {
                const active = report.public_token === selectedToken
                const statusMeta = getReportStatusMeta(report.status)

                return (
                  <button
                    key={report.public_token}
                    onClick={() => setSelectedToken(report.public_token)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition-all ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-800">{report.title}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{report.obra_proyecto || 'Sin obra / proyecto'}</div>
                        <div className="mt-2 text-[11px] text-slate-400">
                          {report.mes_label || 'Sin mes'} • {statusMeta.label}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusMeta.badgeClassName}`}>
                        {statusMeta.shortLabel}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main className="space-y-6">
          <SsomaReviewInbox pendingReports={pendingReports} archivedReports={archivedReports} onOpenReport={openReviewReport} />

          {selectedReport && currentStatusMeta ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Link seguro</div>
                    <div className="mt-2 break-all font-mono text-xs text-slate-500">
                      {buildReportShareUrl(publicBaseUrl, selectedReport.public_token)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => void handleCopyLink()}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                      >
                        <Copy size={16} />
                        Copiar link
                      </button>
                      <a
                        href={buildReportShareUrl(publicBaseUrl, selectedReport.public_token)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                      >
                        <ExternalLink size={16} />
                        Abrir formulario
                      </a>
                      <button
                        onClick={() => previewReport && openReviewReport(previewReport)}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        Abrir revision
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Titulo
                      </span>
                      <input
                        value={reportMeta.title}
                        onChange={(event) => setReportMeta((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Asignado a
                      </span>
                      <input
                        value={reportMeta.assignedTo}
                        onChange={(event) => setReportMeta((prev) => ({ ...prev, assignedTo: event.target.value }))}
                        placeholder="Nombre del responsable"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                    <label className="block md:col-span-2 xl:col-span-1">
                      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Correo asignado
                      </span>
                      <input
                        type="email"
                        value={reportMeta.assignedEmail}
                        onChange={(event) => setReportMeta((prev) => ({ ...prev, assignedEmail: event.target.value }))}
                        placeholder="correo@empresa.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className={`rounded-2xl border p-4 ${currentStatusMeta.panelClassName}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Link2 size={16} />
                      Estado actual: {currentStatusMeta.label}
                    </div>
                    <p className="mt-2 text-sm">
                      Responsable: {editorData.respondentName || selectedReport.respondent_name || 'Sin nombre'} • Correo:{' '}
                      {editorData.respondentEmail || selectedReport.respondent_email || 'Sin correo'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Revision completa
                    </div>
                    <p className="mt-2">
                      Abre el modal para ver todo el formulario enviado por el trabajador y decidir si se aprueba o rechaza.
                    </p>
                    {selectedReport.reviewed_by && (
                      <p className="mt-3 font-medium text-slate-700">Aprobador: {selectedReport.reviewed_by}</p>
                    )}
                  </div>
                </div>
              </div>

              <StatisticalReportEditor
                data={editorData}
                onChange={setEditorData}
                onSave={handleSave}
                onExport={handleExport}
                onUploadEvidence={handleUploadEvidence}
                saveLabel="Guardar reporte"
                exportLabel="Exportar Excel"
                saving={saving}
                exporting={exporting}
                extraActions={
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/90">
                    <Link2 size={16} />
                    {currentStatusMeta.label}
                  </div>
                }
              />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
              Crea o selecciona un reporte para empezar.
            </div>
          )}
        </main>
      </div>

      {reviewModalReport && (
        <SsomaReportReviewModal
          report={reviewModalReport}
          reviewNotes={reviewNotes}
          processingStatus={reviewingStatus}
          onReviewNotesChange={setReviewNotes}
          onApprove={() => void handleReview('approved')}
          onReject={() => void handleReview('rejected')}
          onClose={() => setReviewModalReport(null)}
        />
      )}
    </div>
  )
}
