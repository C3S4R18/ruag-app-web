'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, ExternalLink, FileSpreadsheet, Link2, Loader2, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import StatisticalReportEditor from '@/components/ssoma/StatisticalReportEditor'
import type { SsomaStatisticalReportData, SsomaStatisticalReportRecord } from '@/types/ssoma-report'
import { buildInitialReportPayload, buildReportShareUrl, createEmptySsomaReportData, exportSsomaReportWorkbook, getAppBaseUrl } from '@/utils/ssoma-report'

function getDefaultMonthLabel() {
  return new Date().toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).toUpperCase()
}

export default function AdminSsomaStatisticalReportPage() {
  const [reports, setReports] = useState<SsomaStatisticalReportRecord[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [editorData, setEditorData] = useState<SsomaStatisticalReportData>(createEmptySsomaReportData())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const deferredSearch = useDeferredValue(search)
  const publicBaseUrl = getAppBaseUrl()

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ssoma-report', { cache: 'no-store' })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'No se pudieron cargar los reportes.')
      }

      setReports(json)
      if (!selectedToken && json[0]?.public_token) {
        setSelectedToken(json[0].public_token)
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReports()
  }, [])

  const filteredReports = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    if (!term) return reports

    return reports.filter((report) => {
      const haystack = [report.title, report.obra_proyecto, report.empresa, report.mes_label, report.assigned_to]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [deferredSearch, reports])

  const selectedReport = useMemo(
    () => reports.find((report) => report.public_token === selectedToken) || null,
    [reports, selectedToken]
  )

  useEffect(() => {
    if (!selectedReport) {
      setEditorData(createEmptySsomaReportData())
      return
    }

    setEditorData(buildInitialReportPayload(selectedReport.data))
  }, [selectedReport])

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
          title: selectedReport.title,
          obra_proyecto: editorData.obraProyecto,
          empresa: editorData.empresa,
          mes_label: editorData.monthLabel,
          respondent_name: editorData.respondentName,
          respondent_email: editorData.respondentEmail,
          data: editorData,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo guardar el reporte.')
      }

      setReports((prev) => prev.map((report) => (report.public_token === json.public_token ? json : report)))
      toast.success('Reporte estadistico guardado.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el reporte.')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    if (!selectedReport) return

    setExporting(true)
    try {
      await exportSsomaReportWorkbook({
        title: selectedReport.title,
        data: editorData,
      })
      toast.success('Excel generado con el formato oficial.')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo exportar el Excel.')
    } finally {
      setExporting(false)
    }
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

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1700px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-500">Seguridad SSOMA</div>
              <h1 className="text-xl font-bold text-slate-900">Reporte Estadistico</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => void fetchReports()} className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <RefreshCw size={16} />
              Actualizar
            </button>
            <button onClick={() => void handleCreate()} disabled={creating} className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Nuevo reporte
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-6 py-6 grid xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
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
                <Loader2 className="mx-auto animate-spin mb-3" size={24} />
                Cargando reportes...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No hay reportes para mostrar.</div>
            ) : (
              filteredReports.map((report) => {
                const active = report.public_token === selectedToken
                return (
                  <button
                    key={report.public_token}
                    onClick={() => setSelectedToken(report.public_token)}
                    className={`w-full text-left px-5 py-4 border-b border-slate-100 transition-all ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">{report.title}</div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{report.obra_proyecto || 'Sin obra / proyecto'}</div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          {report.mes_label || 'Sin mes'} • {report.status === 'submitted' ? 'Enviado' : 'Borrador'}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${report.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {report.status === 'submitted' ? 'ENVIADO' : 'BORRADOR'}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main className="space-y-6">
          {selectedReport ? (
            <>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Link seguro</div>
                  <div className="mt-2 font-mono text-xs text-slate-500 break-all">{buildReportShareUrl(publicBaseUrl, selectedReport.public_token)}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => void handleCopyLink()} className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Copy size={16} />
                    Copiar link
                  </button>
                  <a href={buildReportShareUrl(publicBaseUrl, selectedReport.public_token)} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                    <ExternalLink size={16} />
                    Abrir formulario
                  </a>
                </div>
              </div>

              <StatisticalReportEditor
                data={editorData}
                onChange={setEditorData}
                onSave={handleSave}
                onExport={handleExport}
                saveLabel="Guardar reporte"
                exportLabel="Exportar Excel"
                saving={saving}
                exporting={exporting}
                extraActions={
                  <div className="px-4 py-3 rounded-2xl border border-white/10 bg-white/10 text-white/90 font-bold text-sm flex items-center gap-2">
                    <Link2 size={16} />
                    {selectedReport.status === 'submitted' ? 'Formulario enviado' : 'Formulario en borrador'}
                  </div>
                }
              />
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              Crea o selecciona un reporte para empezar.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
