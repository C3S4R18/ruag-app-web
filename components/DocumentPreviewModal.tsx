'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon, X } from 'lucide-react'

type DocumentPreviewModalProps = {
  label: string
  url?: string
  urls?: string[]
  initialIndex?: number
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

export default function DocumentPreviewModal({
  label,
  url,
  urls,
  initialIndex = 0,
  onClose,
}: DocumentPreviewModalProps) {
  const documents = useMemo(() => {
    // Algunos campos en BD almacenan VARIAS páginas como un JSON serializado
    // (p. ej. `["url1","url2"]`). Si el caller nos pasa el string crudo como
    // `url`, lo parseamos aquí para que funcione bien la vista previa y el
    // botón "Abrir aparte" (sin esto, se intentaría navegar a `["http...`).
    const expand = (v: string): string[] => {
      const trimmed = v.trim()
      if (trimmed.startsWith('[')) {
        try {
          const arr = JSON.parse(trimmed)
          if (Array.isArray(arr)) {
            return arr
              .map((x) => (typeof x === 'string' ? x.trim() : ''))
              .filter(Boolean)
          }
        } catch { /* string normal con corchetes raros — caemos al return abajo */ }
      }
      return [trimmed]
    }

    const raw = urls?.length ? urls : url ? [url] : []
    return raw
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .flatMap(expand)
      .filter(Boolean)
  }, [url, urls])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!documents.length) {
      setActiveIndex(0)
      return
    }

    setActiveIndex(Math.min(Math.max(initialIndex, 0), documents.length - 1))
  }, [documents, initialIndex])

  const activeUrl = documents[activeIndex] || ''
  const kind = activeUrl ? getDocumentKind(activeUrl) : 'file'
  const downloadName = activeUrl ? getDownloadName(label, activeUrl) : label.replace(/\s+/g, '_')

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
              {documents.length > 1 && (
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Hoja {activeIndex + 1} de {documents.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeUrl && (
              <>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  <ExternalLink size={16} />
                  Abrir aparte
                </a>
                <a
                  href={activeUrl}
                  download={downloadName}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  <Download size={16} />
                  Descargar
                </a>
              </>
            )}
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
          <div className="w-full h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex">
            {documents.length > 1 && (
              <div className="w-28 shrink-0 border-r border-slate-200 bg-slate-50 p-3 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {documents.map((item, index) => {
                    const itemKind = getDocumentKind(item)
                    const isActive = index === activeIndex

                    return (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`text-left rounded-2xl border p-2 transition-all ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="aspect-[3/4] rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                          {itemKind === 'image' ? (
                            <img src={item} alt={`${label} ${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                              <FileText size={24} />
                              <span className="text-[10px] font-bold uppercase">PDF</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] font-bold text-slate-700 text-center">Hoja {index + 1}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {activeUrl && kind === 'pdf' && <iframe src={activeUrl} title={label} className="w-full h-full" />}

              {activeUrl && kind === 'image' && (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <img src={activeUrl} alt={label} className="max-w-full max-h-full object-contain" />
                </div>
              )}

              {(!activeUrl || kind === 'file') && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">No hay vista incrustada para este archivo</h4>
                    <p className="text-sm text-slate-500 mt-2">
                      Puedes abrirlo en una pestana nueva o descargarlo desde este mismo modal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
