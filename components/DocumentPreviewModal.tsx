'use client'

import { Download, ExternalLink, FileText, Image as ImageIcon, X } from 'lucide-react'

type DocumentPreviewModalProps = {
  label: string
  url: string
  onClose: () => void
}

function getDocumentKind(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase()

  if (cleanUrl.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif|bmp|svg)$/.test(cleanUrl)) return 'image'

  return 'file'
}

function getDownloadName(label: string, url: string) {
  const cleanUrl = url.split('?')[0]
  const rawName = cleanUrl.split('/').pop()
  if (rawName) {
    try {
      return decodeURIComponent(rawName)
    } catch {
      return rawName
    }
  }

  return label.replace(/\s+/g, '_')
}

export default function DocumentPreviewModal({ label, url, onClose }: DocumentPreviewModalProps) {
  const kind = getDocumentKind(url)
  const downloadName = getDownloadName(label, url)

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[88vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              {kind === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Vista previa</p>
              <h3 className="text-lg font-bold text-slate-900 truncate">{label}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold"
            >
              <ExternalLink size={16} />
              Abrir aparte
            </a>
            <a
              href={url}
              download={downloadName}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              <Download size={16} />
              Descargar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              aria-label="Cerrar visor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 p-4 md:p-6 overflow-hidden">
          <div className="w-full h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {kind === 'pdf' && <iframe src={url} title={label} className="w-full h-full" />}

            {kind === 'image' && (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <img src={url} alt={label} className="max-w-full max-h-full object-contain" />
              </div>
            )}

            {kind === 'file' && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">No hay vista incrustada para este archivo</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Puedes abrirlo en una pestaña nueva o descargarlo desde este mismo modal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
