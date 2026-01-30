'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { FichaDocument } from './FichaPdf'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// --- COMPONENTES BIOMÉTRICOS ---
import BiometricSignature from './ssoma/BiometricSignature' 
import BiometricFingerprint from './ssoma/BiometricFingerprint'

// --- DOCUMENTOS IMPRIMIBLES ---
import { CargoRisstPrintable } from './CargoRisstPrintable'
import { RegistroCapacitacionPrintable } from './RegistroCapacitacionPrintable'
import { InduccionHombreNuevoPrintable } from './InduccionHombreNuevoPrintable'
import { EntregaEppPrintable } from './EntregaEppPrintable'
import { ActaDerechoSaberPrintable } from './ActaDerechoSaberPrintable'
import { ActaEntregaIpercPrintable } from './ActaEntregaIpercPrintable'

import { 
  FileText, Search, Download, Trash2, 
  CheckCircle, ShieldCheck, X, Save, 
  Loader2, Building2, Printer, 
  ChevronLeft, ChevronRight, User, Wallet, HardHat, 
  CheckSquare, Square, Unlock, Lock, FileBadge, BellRing, BellOff,
  PenTool, Fingerprint, Share2, MoreHorizontal, Edit3,
  FileCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FichaDrawerProps {
    ficha: any;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
    onDownload: () => void;
    downloading: boolean;
    onPrintPreview: (img: string) => void;
}

const DOC_OPTIONS = [
    { id: 'risst', label: 'Cargo RISST', desc: 'Anexo 03 - Reglamento Interno' },
    { id: 'capacitacion', label: 'Registro Capacitación', desc: 'SG-FOR-01 Inducción General' },
    { id: 'induccion', label: 'Inducción Hombre Nuevo', desc: 'SG-FOR-06' },
    { id: 'epp', label: 'Entrega de EPPs', desc: 'SG-FOR-08 Control de Equipos' },
    { id: 'derecho', label: 'Acta Derecho a Saber', desc: 'SG-FOR-110' },
    { id: 'iperc', label: 'Entrega IPERC', desc: 'SG-FOR-112' },
]

export default function AdminTable() {
  const supabase = createClient()
  const [fichas, setFichas] = useState<any[]>([])
  const [selectedFicha, setSelectedFicha] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // IMPRESIÓN
  const [showDocSelector, setShowDocSelector] = useState(false)
  const [selectedDocsToPrint, setSelectedDocsToPrint] = useState<string[]>([])
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null) 
  const [pdfFile, setPdfFile] = useState<File | null>(null) 
  const [preparingDoc, setPreparingDoc] = useState(false)
  const [printImage, setPrintImage] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // FILTROS & UI
  const [searchTerm, setSearchTerm] = useState('')
  const [filterObra, setFilterObra] = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // SOLUCIÓN AL AUDIO: Estado persistente
  const [audioEnabled, setAudioEnabled] = useState(false) 

  // Carga inicial y configuración de Audio
  useEffect(() => {
    // 1. Recuperar preferencia de audio del LocalStorage
    const savedAudioPref = localStorage.getItem('admin_audio_enabled')
    if (savedAudioPref === 'true') {
        setAudioEnabled(true)
    }

    fetchFichas()
    
    // Realtime Listener
    const channel = supabase.channel('realtime-fichas').on('postgres_changes', { event: '*', schema: 'public', table: 'fichas' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
             setFichas((prev) => [payload.new, ...prev])
             if(payload.new.estado === 'completado') { toast.success(`🔔 Nuevo Ingreso: ${payload.new.nombres}`); playSoundIfEnabled() }
          } else if (payload.eventType === 'UPDATE') {
             setFichas((prev) => prev.map(f => f.id === payload.new.id ? payload.new : f))
             if (payload.new.estado === 'completado') { toast.success(`✅ Completado: ${payload.new.nombres}`); playSoundIfEnabled() }
          } else if (payload.eventType === 'DELETE') {
             setFichas((prev) => prev.filter(f => f.id !== payload.old.id))
             setSelectedIds(prev => prev.filter(id => id !== payload.old.id))
          }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchFichas = async () => {
    if(fichas.length === 0) setLoading(true)
    const { data } = await supabase.from('fichas').select(`*, profiles(role)`).order('updated_at', { ascending: false })
    if (data) setFichas(data)
    setLoading(false)
  }

  // Reproductor de sonido inteligente (lee el estado actualizado o el localStorage directamente)
  const playSoundIfEnabled = () => {
    // Verificamos localStorage directamente por si el estado de React aún no se ha hidratado en un render rápido
    const isEnabled = localStorage.getItem('admin_audio_enabled') === 'true'
    
    if (isEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play().catch((e) => console.warn("Audio bloqueado por el navegador:", e))
    }
  }

  const toggleAudio = () => {
      const newState = !audioEnabled
      setAudioEnabled(newState)
      localStorage.setItem('admin_audio_enabled', String(newState))
      if (newState) {
          toast.success("🔊 Audio activado para notificaciones")
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => {})
      } else {
          toast.info("🔇 Audio desactivado")
      }
  }

  const handleSelectAll = (filteredData: any[]) => {
      if (selectedIds.length === filteredData.length && filteredData.length > 0) setSelectedIds([]) 
      else setSelectedIds(filteredData.map(f => f.id)) 
  }

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id))
      else setSelectedIds(prev => [...prev, id])
  }

  const handleBulkDelete = async () => {
      if (!confirm(`⚠️ ¿Estás seguro de eliminar ${selectedIds.length} fichas seleccionadas? Esta acción no se puede deshacer.`)) return
      setDeleting(true)
      try {
          const { error } = await supabase.from('fichas').delete().in('id', selectedIds)
          if (error) throw error
          toast.success("Registros eliminados correctamente")
          setSelectedIds([])
      } catch (error: any) { toast.error("Error: " + error.message) } finally { setDeleting(false) }
  }

  const handleDownloadPDF = async (ficha: any) => {
    try {
        setDownloadingPdf(true); toast.info("Generando PDF Digital...")
        const blob = await pdf(<FichaDocument ficha={ficha} />).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a'); link.href = url; link.download = `Ficha_${ficha.dni}.pdf`
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
        toast.success("Descarga completada")
    } catch (error: any) { toast.error("Error PDF: " + error.message) } finally { setDownloadingPdf(false) }
  }

  const handleDeleteLocal = () => { fetchFichas(); setSelectedFicha(null) }

  // --- LÓGICA DE IMPRESIÓN ---
  const handleOpenDocSelector = () => {
      if (selectedIds.length !== 1) { toast.warning("Por favor, selecciona exactamente 1 trabajador para imprimir sus documentos."); return }
      setSelectedDocsToPrint([]) 
      setShowDocSelector(true)
  }

  const toggleDocSelection = (docId: string) => {
      setSelectedDocsToPrint(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId])
  }

  const toggleSelectAllDocs = () => {
      setSelectedDocsToPrint(selectedDocsToPrint.length === DOC_OPTIONS.length ? [] : DOC_OPTIONS.map(d => d.id))
  }

  const handleGenerateCombinedDocs = async () => {
      if (selectedDocsToPrint.length === 0) { toast.warning("Selecciona al menos un documento"); return }
      setPreparingDoc(true)
      setShowDocSelector(false) 

      setTimeout(async () => {
          if (!printRef.current) { toast.error("Error de renderizado"); setPreparingDoc(false); return }
          
          try {
              const pdfDoc = new jsPDF('p', 'mm', 'a4')
              pdfDoc.deletePage(1)

              const elements = Array.from(printRef.current.children) as HTMLElement[]
              
              for (let i = 0; i < elements.length; i++) {
                  const element = elements[i]
                  
                  const canvas = await html2canvas(element, { 
                      scale: 2, 
                      useCORS: true, 
                      allowTaint: true,
                      backgroundColor: '#ffffff',
                      onclone: (clonedDoc) => {
                          const all = clonedDoc.querySelectorAll('*')
                          all.forEach((el: any) => { el.style.color = '#000000'; el.style.borderColor = '#000000' })
                      }
                  });

                  const imgData = canvas.toDataURL('image/png')
                  const imgProps = pdfDoc.getImageProperties(imgData)
                  const orientation = imgProps.width > imgProps.height ? 'l' : 'p'
                  const pdfWidth = orientation === 'p' ? 210 : 297
                  const pdfHeight = orientation === 'p' ? 297 : 210
                  
                  pdfDoc.addPage('a4', orientation)
                  pdfDoc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
              }

              const nombreArchivo = `Documentos_${workerToPrint?.nombres?.split(' ')[0] || 'Doc'}_${workerToPrint?.apellido_paterno || ''}.pdf`
              const pdfBlob = pdfDoc.output('blob')
              const pdfUrl = URL.createObjectURL(pdfBlob)
              const file = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' })

              setPdfBlobUrl(pdfUrl)
              setPdfFile(file)

          } catch (error: any) {
              console.error("Error PDF:", error)
              toast.error("Error al generar PDF: " + error.message)
          } finally {
              setPreparingDoc(false)
          }
      }, 1500) 
  }

  // --- FILTROS Y PAGINACIÓN ---
  const obrasUnicas = Array.from(new Set(fichas.map(f => f.nombre_obra).filter(Boolean)))
  const filteredAndSorted = fichas.filter(f => {
      const s = searchTerm.toLowerCase()
      return (f.nombres?.toLowerCase().includes(s) || f.apellido_paterno?.toLowerCase().includes(s) || f.dni?.includes(s)) &&
             (filterObra === 'Todas' || f.nombre_obra === filterObra) &&
             (filterEstado === 'Todos' || (filterEstado === 'Completado' ? f.estado === 'completado' : f.estado !== 'completado'))
  }).sort((a, b) => (a.apellido_paterno || '').localeCompare(b.apellido_paterno || ''))

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const workerToPrint = fichas.find(f => f.id === selectedIds[0])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterObra, filterEstado])

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
      
      {/* CONTENEDOR OCULTO DE IMPRESIÓN */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0 overflow-hidden" style={{ zIndex: -100 }}>
          <div ref={printRef} style={{ width: 'fit-content', background: 'white' }}>
              {workerToPrint && selectedDocsToPrint.map((docId) => (
                  <div key={docId} style={{ padding: 0, margin: 0 }}> 
                      {docId === 'risst' && <CargoRisstPrintable ficha={workerToPrint} />}
                      {docId === 'capacitacion' && <RegistroCapacitacionPrintable ficha={workerToPrint} />}
                      {docId === 'induccion' && <InduccionHombreNuevoPrintable ficha={workerToPrint} />}
                      {docId === 'epp' && <EntregaEppPrintable ficha={workerToPrint} />}
                      {docId === 'derecho' && <ActaDerechoSaberPrintable ficha={workerToPrint} />}
                      {docId === 'iperc' && <ActaEntregaIpercPrintable ficha={workerToPrint} />}
                  </div>
              ))}
          </div>
      </div>

      {/* BARRA DE HERRAMIENTAS SUPERIOR */}
      <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
            
            {/* Buscador */}
            <div className="relative w-full xl:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar trabajador por DNI o nombre..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none text-sm font-medium transition-all" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                {/* BOTÓN AUDIO MEJORADO (PERSISTENTE) */}
                <button 
                    onClick={toggleAudio} 
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${audioEnabled ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                    title={audioEnabled ? "Silenciar notificaciones" : "Activar sonido de notificaciones"}
                >
                    {audioEnabled ? <BellRing size={16} /> : <BellOff size={16}/>}
                    <span className="hidden sm:inline">{audioEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
                </button>

                {/* Filtros */}
                <select className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none hover:border-slate-300 cursor-pointer" value={filterObra} onChange={(e) => setFilterObra(e.target.value)}><option value="Todas">Todas las Obras</option>{obrasUnicas.map((obra: any) => <option key={obra} value={obra}>{obra}</option>)}</select>
                <select className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none hover:border-slate-300 cursor-pointer" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}><option value="Todos">Estado: Todos</option><option value="Completado">✅ Completados</option><option value="Pendiente">⏳ Pendientes</option></select>
                
                {/* Acciones Masivas */}
                {selectedIds.length > 0 && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl shadow-lg shadow-slate-900/20">
                        <button onClick={handleOpenDocSelector} disabled={preparingDoc} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-700 transition-colors">
                            {preparingDoc ? <Loader2 className="animate-spin" size={14}/> : <Printer size={14}/>} Imprimir
                        </button>
                        <button onClick={handleBulkDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors">
                            {deleting ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="flex-1 overflow-auto bg-white min-h-[500px]">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <tr>
                    <th className="px-4 py-4 w-12 text-center"><button onClick={() => handleSelectAll(filteredAndSorted)} className="text-slate-400 hover:text-slate-600 transition-colors">{selectedIds.length > 0 && selectedIds.length === filteredAndSorted.length ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</button></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Colaborador</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación / Cargo</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Biometría</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-400"><div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="font-medium animate-pulse">Cargando registros...</p></div></td></tr>
                ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-400"><p>No se encontraron resultados.</p></td></tr>
                ) : paginatedData.map((ficha, index) => (
                    <motion.tr 
                        key={ficha.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: index * 0.03 }} 
                        className={`transition-all group border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer ${selectedIds.includes(ficha.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedFicha(ficha)}
                    >
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleSelectOne(ficha.id)} className="text-slate-300 hover:text-blue-600 transition-colors">
                                {selectedIds.includes(ficha.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm border border-white shadow-sm shrink-0 uppercase">
                                    {ficha.nombres?.charAt(0)}{ficha.apellido_paterno?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{ficha.apellido_paterno} {ficha.apellido_materno}</p>
                                    <p className="text-slate-500 text-xs truncate">{ficha.nombres}</p>
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-mono mt-1 border border-slate-200">{ficha.dni}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm">
                                <p className="font-medium text-slate-700 truncate" title={ficha.nombre_obra}>{ficha.nombre_obra || '-'}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <HardHat size={12} className="text-slate-400"/>
                                    <p className="text-slate-500 text-xs truncate capitalize">{ficha.cargo || 'Sin Cargo'}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {ficha.estado === 'completado' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                    <CheckCircle size={12}/> Completado
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                    <Loader2 size={12} className="animate-spin"/> Pendiente
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${ficha.firma_url ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Firma Digital">
                                    <PenTool size={14}/>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${ficha.huella_url ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Huella Dactilar">
                                    <Fingerprint size={14}/>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedFicha(ficha) }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"><Edit3 size={16}/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(ficha) }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Descargar Ficha PDF">{downloadingPdf ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>}</button>
                            </div>
                        </td>
                    </motion.tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-sm sticky bottom-0 z-20">
          <div className="text-slate-500 font-medium">Mostrando <span className="text-slate-900 font-bold">{paginatedData.length}</span> de {filteredAndSorted.length} registros</div>
          <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all"><ChevronLeft size={18}/></button>
              <span className="text-slate-700 font-bold px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">{currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all"><ChevronRight size={18}/></button>
          </div>
      </div>

      {/* --- DRAWER EDICIÓN --- */}
      <AnimatePresence>
        {selectedFicha && (
            <FichaDrawer 
                ficha={selectedFicha} 
                onClose={() => setSelectedFicha(null)} 
                onUpdate={fetchFichas} 
                onDelete={handleDeleteLocal} 
                onDownload={() => handleDownloadPDF(selectedFicha)} 
                downloading={downloadingPdf} 
                onPrintPreview={(img) => setPrintImage(img)}
            />
        )}
      </AnimatePresence>

      {/* --- MODAL IMPRESIÓN (SELECCIÓN) --- */}
      <AnimatePresence>
        {showDocSelector && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowDocSelector(false)}>
                <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Printer className="text-blue-600" size={20}/> Imprimir Documentos</h3>
                        <button onClick={() => setShowDocSelector(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selección</span>
                            <button onClick={toggleSelectAllDocs} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                {selectedDocsToPrint.length === DOC_OPTIONS.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                            </button>
                        </div>

                        <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {DOC_OPTIONS.map((doc) => (
                                <label key={doc.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedDocsToPrint.includes(doc.id) ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedDocsToPrint.includes(doc.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {selectedDocsToPrint.includes(doc.id) && <CheckSquare size={14} className="text-white"/>}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={selectedDocsToPrint.includes(doc.id)} onChange={() => toggleDocSelection(doc.id)}/>
                                    <div><div className="font-bold text-slate-800 text-sm">{doc.label}</div><div className="text-xs text-slate-400">{doc.desc}</div></div>
                                </label>
                            ))}
                        </div>

                        <button 
                            onClick={handleGenerateCombinedDocs}
                            disabled={selectedDocsToPrint.length === 0 || preparingDoc}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {preparingDoc ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}
                            {preparingDoc ? 'Generando PDF...' : `Generar PDF (${selectedDocsToPrint.length})`}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL VISTA PREVIA PDF --- */}
      <AnimatePresence>
        {pdfBlobUrl && (
            <PdfPreviewModal pdfUrl={pdfBlobUrl} pdfFile={pdfFile} workerName={workerToPrint ? `${workerToPrint.nombres.split(' ')[0]} ${workerToPrint.apellido_paterno}` : ''} onClose={() => { setPdfBlobUrl(null); setPdfFile(null) }} />
        )}
      </AnimatePresence>

      <AnimatePresence>{printImage && (<PrintPreviewModal image={printImage} onClose={() => setPrintImage(null)} />)}</AnimatePresence>
    </div>
  )
}

// --- SUBCOMPONENTES ---

function FichaDrawer({ ficha, onClose, onUpdate, onDelete, onDownload, downloading, onPrintPreview }: FichaDrawerProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<any>(ficha) 
    const [saving, setSaving] = useState(false)
    const [loadingAction, setLoadingAction] = useState(false) 
    const supabase = createClient()
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let esposaObj = { paterno: '', materno: '', nombres: '', dni: '' }
        let hijosArr: any[] = []
        try { esposaObj = ficha.esposa ? JSON.parse(ficha.esposa) : esposaObj } catch(e) {}
        try { hijosArr = ficha.hijos ? JSON.parse(ficha.hijos) : [] } catch(e) {}
        setFormData({ ...ficha, esposa_datos: esposaObj, hijos_datos: hijosArr })
    }, [ficha])

    const handleSave = async () => {
        setSaving(true)
        const payload = { ...formData, esposa: JSON.stringify(formData.esposa_datos), hijos: JSON.stringify(formData.hijos_datos) }
        delete payload.esposa_datos; delete payload.hijos_datos; const cleaned = { ...payload }; delete cleaned.profiles 
        Object.keys(cleaned).forEach(k => { if(cleaned[k] === '') cleaned[k] = null })
        const { error } = await supabase.from('fichas').update(cleaned).eq('id', ficha.id)
        setSaving(false)
        if (error) toast.error("Error al guardar: " + error.message)
        else { toast.success("Datos actualizados"); setIsEditing(false); onUpdate() }
    }

    const handleChangeStatus = async (newStatus: 'pendiente' | 'completado') => {
        setLoadingAction(true)
        try {
            const { error } = await supabase.from('fichas').update({ estado: newStatus }).eq('id', ficha.id)
            if (error) throw error
            if(newStatus === 'pendiente') toast.success("Ficha ABIERTA para edición")
            else toast.success("Ficha CERRADA y Validada")
            onUpdate(); onClose()
        } catch (error: any) { toast.error("Error: " + error.message) } finally { setLoadingAction(false) }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100" onClick={e => e.stopPropagation()}>
                <div className="h-20 px-8 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200 uppercase">{ficha.nombres.charAt(0)}{ficha.apellido_paterno.charAt(0)}</div>
                        <div><h2 className="font-bold text-slate-800 text-lg leading-tight">{ficha.nombres} {ficha.apellido_paterno}</h2><p className="text-sm text-slate-500 font-mono">{ficha.dni}</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 scroll-smooth">
                    <div className="flex gap-3 sticky top-0 z-10 pb-4 bg-slate-50/50 backdrop-blur-sm">
                        <button onClick={onDownload} disabled={downloading} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50">{downloading ? <Loader2 className="animate-spin" size={16}/> : <><Download size={16}/> Descargar PDF Ficha</>}</button>
                        <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 flex items-center justify-center gap-2 border py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${isEditing ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>{isEditing ? 'Cancelar Edición' : 'Editar Información'}</button>
                    </div>

                    <Section title="Información Personal" icon={<User size={18}/>}>
                        <Grid>
                            <Field label="Apellido Paterno" name="apellido_paterno" val={formData.apellido_paterno} edit={isEditing} set={setFormData}/>
                            <Field label="Apellido Materno" name="apellido_materno" val={formData.apellido_materno} edit={isEditing} set={setFormData}/>
                            <Field label="Nombres" name="nombres" val={formData.nombres} edit={isEditing} set={setFormData}/>
                            <Field label="F. Nacimiento" name="fecha_nacimiento" val={formData.fecha_nacimiento} edit={isEditing} set={setFormData} type="date"/>
                            <Field label="DNI" name="dni" val={formData.dni} edit={isEditing} set={setFormData}/>
                            <Field label="Dirección" name="direccion" val={formData.direccion} edit={isEditing} set={setFormData} full/>
                            <Field label="Distrito" name="distrito" val={formData.distrito} edit={isEditing} set={setFormData}/>
                            <Field label="Provincia" name="provincia" val={formData.provincia} edit={isEditing} set={setFormData}/>
                            <Field label="Correo Electrónico" name="correo" val={formData.correo} edit={isEditing} set={setFormData}/>
                            <Field label="Celular" name="celular" val={formData.celular} edit={isEditing} set={setFormData}/>
                        </Grid>
                    </Section>

                    <Section title="Sistema de Pensiones" icon={<ShieldCheck size={18}/>}>
                        <Grid>
                            <Field label="Régimen" name="sistema_pension" val={formData.sistema_pension} edit={isEditing} set={setFormData}/>
                            <Field label="Nombre AFP" name="afp_nombre" val={formData.afp_nombre} edit={isEditing} set={setFormData}/>
                        </Grid>
                    </Section>

                    <Section title="Datos Bancarios" icon={<Wallet size={18}/>}>
                        <Grid>
                            <Field label="Banco" name="banco" val={formData.banco} edit={isEditing} set={setFormData}/>
                            <Field label="N° Cuenta" name="numero_cuenta" val={formData.numero_cuenta} edit={isEditing} set={setFormData}/>
                        </Grid>
                    </Section>

                    <Section title="Información Laboral" icon={<HardHat size={18}/>}>
                        <Grid>
                            <Field label="Categoría" name="categoria" val={formData.categoria} edit={isEditing} set={setFormData}/>
                            <Field label="Cargo" name="cargo" val={formData.cargo} edit={isEditing} set={setFormData}/>
                            <Field label="Nivel Educativo" name="nivel_educacion" val={formData.nivel_educacion} edit={isEditing} set={setFormData}/>
                            <Field label="Carrera/Profesión" name="carrera" val={formData.carrera} edit={isEditing} set={setFormData}/>
                        </Grid>
                    </Section>

                    <Section title="Documentos Adjuntos" icon={<FileBadge size={18}/>}>
                        <div className="grid grid-cols-2 gap-4">
                            <DocCard label="DNI (Frontal)" url={ficha.url_dni_frontal} />
                            <DocCard label="DNI (Reverso)" url={ficha.url_dni_reverso} />
                            <DocCard label="Carnet RETCC" url={ficha.url_carnet} />
                            <DocCard label="Antecedentes" url={ficha.url_antecedentes} />
                        </div>
                    </Section>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {ficha.estado === 'completado' ? (
                        <button onClick={() => handleChangeStatus('pendiente')} disabled={loadingAction} className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
                            {loadingAction ? <Loader2 className="animate-spin" size={18}/> : <><Unlock size={18}/> REABRIR FICHA</>}
                        </button>
                    ) : (
                        <button onClick={() => handleChangeStatus('completado')} disabled={loadingAction} className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg">
                            {loadingAction ? <Loader2 className="animate-spin" size={18}/> : <><Lock size={18}/> VALIDAR Y CERRAR</>}
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors">
                            {saving ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> GUARDAR CAMBIOS</>}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

function PdfPreviewModal({ pdfUrl, pdfFile, workerName, onClose }: { pdfUrl: string, pdfFile: File | null, workerName: string, onClose: () => void }) {
    const handleShareWhatsApp = async () => {
        if (!pdfFile) return
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            try { await navigator.share({ files: [pdfFile], title: 'Documentos SSOMA', text: `Adjunto documentos de ${workerName}.` }); return } catch (e) { console.warn(e) }
        }
        const link = document.createElement('a'); link.href = pdfUrl; link.download = pdfFile.name; link.target = "_blank"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success("✅ Descargado. Abriendo WhatsApp...");
        setTimeout(() => { window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, adjunto los documentos firmados de *${workerName}*.`)}`, '_blank') }, 1000)
    }
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-white shrink-0"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileCheck size={20} className="text-blue-600"/> Vista Previa</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
                <div className="flex-1 bg-slate-100 relative"><iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" /></div>
                <div className="p-5 border-t bg-white flex flex-col sm:flex-row gap-3 shrink-0"><button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Cerrar</button><button onClick={handleShareWhatsApp} className="flex-1 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg flex items-center justify-center gap-2"><Share2 size={18}/> Compartir por WhatsApp</button></div>
            </motion.div>
        </motion.div>
    )
}

function PrintPreviewModal({ image, onClose }: { image: string, onClose: () => void }) {
    const handlePrint = () => { const iframe = document.createElement('iframe'); iframe.style.position = 'absolute'; iframe.width='0'; iframe.height='0'; iframe.style.border='none'; document.body.appendChild(iframe); const doc = iframe.contentWindow?.document; if (doc) { doc.open(); doc.write(`<html><body onload="window.print()"><img src="${image}" style="width:100%"/></body></html>`); doc.close(); setTimeout(() => document.body.removeChild(iframe), 5000); } };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}><div className="p-4 border-b flex justify-between items-center bg-white"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Printer size={20} className="text-blue-600"/> Vista Previa</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center"><div className="bg-white shadow-xl p-2"><img src={image} className="w-full h-auto max-w-[300px] object-contain border" /></div></div><div className="p-5 border-t bg-white flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={handlePrint} className="flex-1 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"><Printer size={18}/> Imprimir</button></div></motion.div></motion.div>)
}

// Helpers de Diseño
function Section({title, icon, children}: any) { return <div className="space-y-4 pt-2"><h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pl-3 border-l-4 border-blue-600 flex items-center gap-2">{icon} {title}</h3><div className="pl-2">{children}</div></div> }
function Grid({children}: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div> }
function Field({label, name, val, edit, set, full, type="text"}: any) { return <div className={full ? 'md:col-span-2' : ''}><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">{label}</label>{edit ? <input type={type} value={val||''} onChange={e=>set((p:any)=>({...p,[name]:e.target.value}))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"/> : <div className="font-medium text-slate-800 text-sm border-b border-slate-100 py-1 truncate min-h-[28px]">{val||'-'}</div>}</div>}
function DocCard({label, url}: any) { if(!url) return null; return <a href={url} target="_blank" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText size={16}/></div><span className="text-xs font-bold text-slate-600 truncate group-hover:text-blue-700">{label}</span></a>}