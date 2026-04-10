'use client'

import { Archive, Eye, FileSpreadsheet } from 'lucide-react'

import type { SsomaStatisticalReportRecord } from '@/types/ssoma-report'
import { buildInitialReportPayload, getReportStatusMeta } from '@/utils/ssoma-report'

export default function SsomaReviewInbox({
  pendingReports,
  archivedReports,
  onOpenReport,
}: {
  pendingReports: SsomaStatisticalReportRecord[]
  archivedReports: SsomaStatisticalReportRecord[]
  onOpenReport: (report: SsomaStatisticalReportRecord) => void
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-500">Seguridad SSOMA</div>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileSpreadsheet size={18} />
              Bandeja de revision
            </h3>
          </div>
          <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            {pendingReports.length} pendiente{pendingReports.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="space-y-4 p-6">
          {pendingReports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-400">
              No hay reportes SSOMA esperando revision en este momento.
            </div>
          ) : (
            pendingReports.map((report) => {
              const normalized = buildInitialReportPayload(report.data)
              const statusMeta = getReportStatusMeta(report.status)

              return (
                <div key={report.public_token} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusMeta.badgeClassName}`}>
                          {statusMeta.shortLabel}
                        </span>
                        <span className="text-xs text-slate-400">{report.mes_label || 'Sin mes'}</span>
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-slate-900">{report.title}</h4>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span>Obra: {report.obra_proyecto || 'Sin obra'}</span>
                        <span>Responsable: {normalized.respondentName || report.respondent_name || 'Sin nombre'}</span>
                        <span>Correo: {normalized.respondentEmail || report.respondent_email || 'Sin correo'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenReport(report)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      Revisar reporte
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-6 py-5 text-lg font-bold text-slate-900">
          <Archive size={18} />
          Archivados
        </div>

        <div className="space-y-3 p-6">
          {archivedReports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              Aun no hay reportes aprobados archivados.
            </div>
          ) : (
            archivedReports.map((report) => (
              <button
                key={report.public_token}
                onClick={() => onOpenReport(report)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm"
              >
                <div className="text-sm font-bold text-slate-800">{report.title}</div>
                <div className="mt-2 text-xs text-slate-500">{report.obra_proyecto || 'Sin obra'}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700">APROBADO</span>
                  <span>Aprobador: {report.reviewed_by || 'Administrador'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
