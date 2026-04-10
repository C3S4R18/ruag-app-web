'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, FileSpreadsheet, Loader2, ShieldCheck, X, XCircle } from 'lucide-react'

import StatisticalReportEditor from '@/components/ssoma/StatisticalReportEditor'
import type { SsomaStatisticalReportRecord } from '@/types/ssoma-report'
import { buildInitialReportPayload, getReportStatusMeta } from '@/utils/ssoma-report'

export default function SsomaReportReviewModal({
  report,
  reviewNotes,
  processingStatus,
  onReviewNotesChange,
  onApprove,
  onReject,
  onClose,
}: {
  report: SsomaStatisticalReportRecord
  reviewNotes: string
  processingStatus: 'approved' | 'rejected' | null
  onReviewNotesChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  onClose: () => void
}) {
  const normalizedData = buildInitialReportPayload(report.data)
  const statusMeta = getReportStatusMeta(report.status)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 18 }}
        className="flex h-[92vh] w-full max-w-[1800px] flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-slate-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-500">
              <ShieldCheck size={14} />
              Revision SSOMA
            </div>
            <h3 className="mt-2 truncate text-2xl font-bold text-slate-900">{report.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded-full px-2.5 py-1 font-bold ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
              <span>{report.obra_proyecto || 'Sin obra'}</span>
              <span>{normalizedData.respondentName || report.respondent_name || 'Sin responsable'}</span>
              <span>{normalizedData.respondentEmail || report.respondent_email || 'Sin correo'}</span>
              {report.reviewed_by && <span>Aprobador: {report.reviewed_by}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
          Vista de revision: aqui ves exactamente lo enviado por el trabajador, con sus adjuntos dentro del mismo formulario.
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <StatisticalReportEditor
            data={normalizedData}
            onChange={() => {}}
            extraActions={
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/90">
                <FileSpreadsheet size={16} />
                {statusMeta.label}
              </div>
            }
          />
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Observaciones de revision
              </span>
              <textarea
                value={reviewNotes}
                onChange={(event) => onReviewNotesChange(event.target.value)}
                rows={3}
                placeholder="Escribe aqui el motivo de aprobacion o rechazo."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none resize-y focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <button
                onClick={onApprove}
                disabled={processingStatus !== null || report.status !== 'in_review'}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingStatus === 'approved' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Aprobar
              </button>
              <button
                onClick={onReject}
                disabled={processingStatus !== null || report.status !== 'in_review'}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingStatus === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Rechazar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
