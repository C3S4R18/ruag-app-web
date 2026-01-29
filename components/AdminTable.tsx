'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { FichaDocument } from './FichaPdf'
import html2canvas from 'html2canvas'
import { CargoRisstPrintable } from './CargoRisstPrintable'
import { 
  FileText, Search, Download, Trash2, 
  CheckCircle, ShieldCheck, X, Save, 
  Loader2, Building2, ExternalLink, Printer, Filter, 
  ChevronLeft, ChevronRight, User, Wallet, HeartPulse, HardHat, GraduationCap, CheckSquare, Square
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminTable() {
  const supabase = createClient()
  const [fichas, setFichas] = useState<any[]>([])
  const [selectedFicha, setSelectedFicha] = useState<any>(null)
  
  // SELECCIÓN MULTIPLE
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // FILTROS Y PAGINACIÓN
  const [searchTerm, setSearchTerm] = useState('')
  const [filterObra, setFilterObra] = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 

  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [printImage, setPrintImage] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFichas = async () => {
    if(fichas.length === 0) setLoading(true)
    const { data } = await supabase
      .from('fichas')
      .select(`*, profiles(role)`) 
      .order('updated_at', { ascending: false })
    
    if (data) setFichas(data)
    setLoading(false)
  }

  const playSound = () => {
    try {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(e => {})
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchFichas()
    const channel = supabase.channel('realtime-fichas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fichas' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
             setFichas((prev) => [payload.new, ...prev])
             if(payload.new.estado === 'completado') {
                 toast.success(`🔔 Nuevo: ${payload.new.nombres}`)
                 playSound()
             }
          } 
          else if (payload.eventType === 'UPDATE') {
             setFichas((prev) => prev.map(f => f.id === payload.new.id ? payload.new : f))
          }
          else if (payload.eventType === 'DELETE') {
             setFichas((prev) => prev.filter(f => f.id !== payload.old.id))
             // Remover de la selección si se borró
             setSelectedIds(prev => prev.filter(id => id !== payload.old.id))
          }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // --- LOGICA DE SELECCION MASIVA ---
  const handleSelectAll = (filteredData: any[]) => {
      if (selectedIds.length === filteredData.length && filteredData.length > 0) {
          setSelectedIds([]) // Desmarcar todo
      } else {
          setSelectedIds(filteredData.map(f => f.id)) // Marcar todo lo visible
      }
  }

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(prev => prev.filter(i => i !== id))
      } else {
          setSelectedIds(prev => [...prev, id])
      }
  }

  const handleBulkDelete = async () => {
      if (!confirm(`⚠️ ¿ESTÁS SEGURO?\n\nVas a eliminar ${selectedIds.length} fichas. Esto no se puede deshacer.\n\n(Nota: Los usuarios seguirán existiendo, solo se borra la ficha para volver a importarla)`)) return

      setDeleting(true)
      try {
          const { error } = await supabase.from('fichas').delete().in('id', selectedIds)
          if (error) throw error
          
          toast.success(`${selectedIds.length} fichas eliminadas correctamente`)
          setSelectedIds([]) // Limpiar selección
          // La tabla se actualiza sola por el Realtime
      } catch (error: any) {
          toast.error("Error al eliminar: " + error.message)
      } finally {
          setDeleting(false)
      }
  }

  const handleDownloadPDF = async (ficha: any) => {
    try {
        setDownloadingPdf(true)
        toast.info("Generando PDF...")
        const blob = await pdf(<FichaDocument ficha={ficha} />).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Ficha_${ficha.dni}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Descargado")
    } catch (error: any) {
        toast.error("Error PDF: " + error.message) 
    } finally { 
        setDownloadingPdf(false) 
    }
  }

  const handleDeleteLocal = () => {
      fetchFichas() 
      setSelectedFicha(null) 
  }

  // --- FILTROS ---
  const obrasUnicas = Array.from(new Set(fichas.map(f => f.nombre_obra).filter(Boolean)))

  const filteredAndSorted = fichas.filter(f => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
          f.nombres?.toLowerCase().includes(searchLower) || 
          f.apellido_paterno?.toLowerCase().includes(searchLower) || 
          f.dni?.includes(searchLower)
      
      const matchesObra = filterObra === 'Todas' || f.nombre_obra === filterObra
      const matchesEstado = filterEstado === 'Todos' || 
          (filterEstado === 'Completado' ? f.estado === 'completado' : f.estado !== 'completado')

      return matchesSearch && matchesObra && matchesEstado
  }).sort((a, b) => {
      const nameA = (a.apellido_paterno || '').toLowerCase()
      const nameB = (b.apellido_paterno || '').toLowerCase()
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
  })

  // --- PAGINACIÓN ---
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterObra, filterEstado])

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* BARRA SUPERIOR */}
      <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Buscador */}
            <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Acciones Masivas */}
            {selectedIds.length > 0 && (
                <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600">{selectedIds.length} seleccionados</span>
                    <button 
                        onClick={handleBulkDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
                    >
                        {deleting ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>}
                        Eliminar Fichas
                    </button>
                </motion.div>
            )}

            {/* Filtros (Ocultar si hay selección masiva para no saturar) */}
            {selectedIds.length === 0 && (
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <select 
                        className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
                        value={filterObra}
                        onChange={(e) => setFilterObra(e.target.value)}
                    >
                        <option value="Todas">Todas las Obras</option>
                        {obrasUnicas.map((obra: any) => <option key={obra} value={obra}>{obra}</option>)}
                    </select>
                    <select 
                        className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                    >
                        <option value="Todos">Todos</option>
                        <option value="Completado">Verificados</option>
                        <option value="Pendiente">Pendientes</option>
                    </select>
                </div>
            )}
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 overflow-auto bg-white min-h-[500px]">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="px-4 py-4 w-12 text-center">
                        <button onClick={() => handleSelectAll(filteredAndSorted)} className="text-slate-400 hover:text-slate-600">
                            {selectedIds.length > 0 && selectedIds.length === filteredAndSorted.length ? <CheckSquare size={20}/> : <Square size={20}/>}
                        </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo / Obra</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Legal</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-blue-500" size={32}/><p>Cargando base de datos...</p></div></td></tr>
                ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-400 flex flex-col items-center"><Search size={40} className="mb-2 opacity-20"/><p>No se encontraron registros</p></td></tr>
                ) : (
                    paginatedData.map((ficha, index) => (
                        <motion.tr 
                            key={ficha.id} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ delay: index * 0.05 }}
                            className={`transition-colors group border-b border-slate-50 last:border-0 ${selectedIds.includes(ficha.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                            <td className="px-4 py-4 text-center">
                                <button onClick={(e) => { e.stopPropagation(); handleSelectOne(ficha.id) }} className="text-slate-400 hover:text-blue-600">
                                    {selectedIds.includes(ficha.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                                </button>
                            </td>
                            <td className="px-6 py-4 max-w-[250px] cursor-pointer" onClick={() => setSelectedFicha(ficha)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200 shadow-sm shrink-0">
                                        {ficha.nombres?.charAt(0)}{ficha.apellido_paterno?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{ficha.apellido_paterno} {ficha.apellido_materno}</p>
                                        <p className="text-slate-500 text-xs truncate">{ficha.nombres}</p>
                                        <p className="text-[10px] text-blue-500 font-mono mt-0.5">{ficha.dni}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 max-w-[200px]" onClick={() => setSelectedFicha(ficha)}>
                                <div className="text-sm">
                                    <p className="font-medium text-slate-700 truncate" title={ficha.nombre_obra}>{ficha.nombre_obra || '-'}</p>
                                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-1 truncate"><Building2 size={12}/> {ficha.cargo || 'Sin Cargo'}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {ficha.estado === 'completado' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Completado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Pendiente
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {ficha.estado === 'completado' ? (
                                    <div className="flex justify-center" title="Declaración Jurada Aceptada">
                                        <ShieldCheck className="text-blue-600 fill-blue-50" size={20}/>
                                    </div>
                                ) : (
                                    <span className="text-slate-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(ficha) }} 
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group-hover:bg-white group-hover:shadow-sm"
                                    title="Descargar PDF"
                                >
                                    {downloadingPdf ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>}
                                </button>
                            </td>
                        </motion.tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* FOOTER PAGINACIÓN */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm sticky bottom-0 z-20">
          <div className="text-slate-500">
              Mostrando <span className="font-bold text-slate-800">{paginatedData.length}</span> de <span className="font-bold text-slate-800">{filteredAndSorted.length}</span> resultados
          </div>
          <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all border border-transparent hover:border-slate-200"
              >
                  <ChevronLeft size={18}/>
              </button>
              <span className="text-slate-600 font-medium px-2">Página {currentPage} de {totalPages || 1}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all border border-transparent hover:border-slate-200"
              >
                  <ChevronRight size={18}/>
              </button>
          </div>
      </div>

      {/* MODALES Y DRAWERS */}
      <AnimatePresence>
        {selectedFicha && (
            <FichaDrawer 
                ficha={selectedFicha} 
                onClose={() => setSelectedFicha(null)} 
                onUpdate={fetchFichas} 
                onDelete={handleDeleteLocal} 
                onDownload={() => handleDownloadPDF(selectedFicha)} 
                downloading={downloadingPdf} 
                onPrintPreview={(img: string) => setPrintImage(img)}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {printImage && (
            <PrintPreviewModal image={printImage} onClose={() => setPrintImage(null)} />
        )}
      </AnimatePresence>

    </div>
  )
}

// ... (Resto de componentes auxiliares: PrintPreviewModal, FichaDrawer, Section, Grid, Field, DocCard se mantienen igual que la versión anterior)
// IMPORTANTE: Asegúrate de mantener la función FichaDrawer y las demás al final del archivo.
// Si necesitas que te las repita dímelo, pero son las mismas del código anterior.

function PrintPreviewModal({ image, onClose }: { image: string, onClose: () => void }) {
    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`<html><head><title>Imprimir</title><style>@page{size:A4;margin:0}body{margin:0;display:flex;justify-content:center}img{width:100%;max-width:21cm}</style></head><body><img src="${image}" onload="window.print()"/></body></html>`);
            doc.close();
            setTimeout(() => { document.body.removeChild(iframe) }, 5000);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-white"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Printer size={20} className="text-blue-600"/> Vista Previa</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center"><div className="bg-white shadow-xl p-2"><img src={image} className="w-full h-auto max-w-[300px] object-contain border" /></div></div>
                <div className="p-5 border-t bg-white flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={handlePrint} className="flex-1 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"><Printer size={18}/> Imprimir</button></div>
            </motion.div>
        </motion.div>
    )
}

function FichaDrawer({ ficha, onClose, onUpdate, onDelete, onDownload, downloading, onPrintPreview }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState(ficha)
    const [saving, setSaving] = useState(false)
    const [printing, setPrinting] = useState(false)
    const supabase = createClient()
    const printRef = useRef<HTMLDivElement>(null);

    const handleSave = async () => {
        setSaving(true)
        const cleaned = { ...formData }
        Object.keys(cleaned).forEach(k => { if(cleaned[k] === '') cleaned[k] = null })
        const { error } = await supabase.from('fichas').update(cleaned).eq('id', ficha.id)
        setSaving(false)
        if (error) toast.error("Error al guardar")
        else { toast.success("Guardado"); setIsEditing(false); onUpdate() }
    }
    const handleReset = async () => { if (!confirm("⚠️ ¿Eliminar ficha?")) return; const { error } = await supabase.from('fichas').delete().eq('id', ficha.id); if (error) toast.error("Error"); else { toast.success("Eliminado"); onDelete() } }

    const handleGenerateImage = async () => {
        if (!printRef.current) return; setPrinting(true); toast.info("Generando..."); try { await new Promise(resolve => setTimeout(resolve, 500)); const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', ignoreElements: (el) => el.tagName === 'IFRAME' || el.tagName === 'SCRIPT' }); onPrintPreview(canvas.toDataURL('image/png')) } catch (error) { toast.error("Error") } finally { setPrinting(false) }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <div className="fixed top-0 left-0 pointer-events-none opacity-0 overflow-hidden" style={{ zIndex: -100 }}><CargoRisstPrintable ref={printRef} ficha={ficha} /></div>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }} className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100" onClick={e => e.stopPropagation()}>
                <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center bg-white z-10"><div className="flex items-center gap-3"><div><h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">{ficha.nombres} {ficha.apellido_paterno}</h2><p className="text-xs text-slate-400">{ficha.dni}</p></div></div><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={18}/></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    <div className="grid grid-cols-3 gap-2 sticky top-0 z-10 py-2"><button onClick={handleGenerateImage} disabled={printing} className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50">{printing ? <Loader2 className="animate-spin" size={14}/> : <><Printer size={14}/> Cargo RISST</>}</button><button onClick={onDownload} disabled={downloading} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50">{downloading ? <Loader2 className="animate-spin" size={14}/> : <><Download size={14}/> PDF Digital</>}</button><button onClick={() => setIsEditing(!isEditing)} className="flex items-center justify-center gap-2 border py-2.5 rounded-lg text-xs font-bold shadow-sm bg-white text-slate-700">{isEditing ? 'Cancelar' : 'Editar Datos'}</button></div>
                    <Section title="1. Personal" icon={<User size={16}/>}><Grid><Field label="Nombres" name="nombres" val={formData.nombres} edit={isEditing} set={setFormData} full/><Field label="Ap. Paterno" name="apellido_paterno" val={formData.apellido_paterno} edit={isEditing} set={setFormData}/><Field label="Ap. Materno" name="apellido_materno" val={formData.apellido_materno} edit={isEditing} set={setFormData}/><Field label="DNI" name="dni" val={formData.dni} edit={isEditing} set={setFormData}/><Field label="Fecha Nac." name="fecha_nacimiento" val={formData.fecha_nacimiento} edit={isEditing} set={setFormData}/><Field label="Celular" name="celular" val={formData.celular} edit={isEditing} set={setFormData}/><Field label="Civil" name="estado_civil" val={formData.estado_civil} edit={isEditing} set={setFormData}/><Field label="Dirección" name="direccion" val={formData.direccion} edit={isEditing} set={setFormData} full/><Field label="Distrito" name="distrito" val={formData.distrito} edit={isEditing} set={setFormData}/><Field label="Provincia" name="provincia" val={formData.provincia} edit={isEditing} set={setFormData}/></Grid></Section>
                    <Section title="2. Laboral" icon={<HardHat size={16}/>}><Grid><Field label="Obra" name="nombre_obra" val={formData.nombre_obra} edit={isEditing} set={setFormData} full/><Field label="Fecha Ingreso" name="fecha_ingreso" val={formData.fecha_ingreso} edit={isEditing} set={setFormData}/><Field label="Cargo" name="cargo" val={formData.cargo} edit={isEditing} set={setFormData}/><Field label="Categoría" name="categoria" val={formData.categoria} edit={isEditing} set={setFormData}/><Field label="Carnet RETCC" name="carnet_retcc" val={formData.carnet_retcc} edit={isEditing} set={setFormData}/><Field label="Vencimiento RETCC" name="fecha_vencimiento_retcc" val={formData.fecha_vencimiento_retcc} edit={isEditing} set={setFormData}/></Grid></Section>
                    <Section title="3. Financiero" icon={<Wallet size={16}/>}><Grid><Field label="Régimen" name="sistema_pension" val={formData.sistema_pension} edit={isEditing} set={setFormData}/><Field label="AFP/CUSPP" name="afp_nombre" val={formData.afp_nombre} edit={isEditing} set={setFormData}/><Field label="Banco" name="banco" val={formData.banco} edit={isEditing} set={setFormData}/><Field label="Cuenta" name="numero_cuenta" val={formData.numero_cuenta} edit={isEditing} set={setFormData}/><Field label="CCI" name="cci" val={formData.cci} edit={isEditing} set={setFormData} full/></Grid></Section>
                    <Section title="4. Familia" icon={<GraduationCap size={16}/>}><Grid><Field label="Nivel Educ." name="nivel_educacion" val={formData.nivel_educacion} edit={isEditing} set={setFormData}/><Field label="Carrera" name="carrera" val={formData.carrera} edit={isEditing} set={setFormData}/><Field label="Esposa" name="esposa" val={formData.esposa} edit={isEditing} set={setFormData}/><Field label="Hijos" name="hijos" val={formData.hijos} edit={isEditing} set={setFormData}/></Grid></Section>
                    <Section title="5. Emergencia" icon={<HeartPulse size={16}/>}><Grid><Field label="Contacto" name="emergencia_nombre" val={formData.emergencia_nombre} edit={isEditing} set={setFormData} full/><Field label="Teléfono" name="emergencia_celular" val={formData.emergencia_celular} edit={isEditing} set={setFormData}/></Grid></Section>
                    <Section title="6. Documentos" icon={<FileText size={16}/>}><div className="grid grid-cols-2 gap-3"><DocCard label="DNI Frontal" url={ficha.url_dni_frontal} /><DocCard label="DNI Reverso" url={ficha.url_dni_reverso} /><DocCard label="CV" url={ficha.url_cv} /><DocCard label="Carnet RETCC" url={ficha.url_carnet} /><DocCard label="Antecedentes" url={ficha.url_antecedentes} /><DocCard label="Certificado" url={ficha.url_constancia_estudios} /><DocCard label="Acta Matrimonio" url={ficha.url_acta_matrimonio} /></div></Section>
                </div>
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-20"><button onClick={handleReset} className="text-slate-400 hover:text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors px-2 py-1"><Trash2 size={16}/> ELIMINAR FICHA</button>{isEditing && <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">{saving ? 'Guardando...' : <><Save size={16}/> Guardar</>}</button>}</div>
            </motion.div>
        </motion.div>
    )
}

function Section({title, icon, children}: any) { return <div className="space-y-4"><h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pl-2 border-l-4 border-blue-600 flex items-center gap-2">{icon} {title}</h3>{children}</div> }
function Grid({children}: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">{children}</div> }
function Field({label, name, val, edit, set, full}: any) { return <div className={full ? 'md:col-span-2' : ''}><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{label}</label>{edit ? <input value={val||''} onChange={e=>set((p:any)=>({...p,[name]:e.target.value}))} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"/> : <p className="font-medium text-slate-700 text-sm border-b border-transparent py-1 truncate">{val||'-'}</p>}</div>}
function DocCard({label, url}: any) { if(!url) return null; return <a href={url} target="_blank" className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group"><ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500"/><span className="text-xs font-bold text-slate-600 truncate group-hover:text-blue-700">{label}</span></a>}