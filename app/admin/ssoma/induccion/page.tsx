'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, ShieldCheck, CheckCircle2, 
  ArrowLeft, Loader2, Briefcase, 
  User, PlayCircle, GraduationCap, XCircle, Activity,
  RotateCcw, FileCheck, Download, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

export default function InduccionSSOMA() {
  const supabase = createClient()
  
  // --- ESTADOS ---
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'todos' | 'en_curso' | 'aprobados' | 'reprobados'>('todos')

  // --- CARGAR DATOS ---
  const fetchWorkers = async () => {
    const { data } = await supabase
        .from('fichas')
        .select('*')
        .order('updated_at', { ascending: false }) 
    
    if (data) {
        setWorkers(data)
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()

    // --- REALTIME ---
    const channel = supabase.channel('induccion-admin')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'fichas' }, 
        (payload: any) => {
            setWorkers((currentWorkers) => 
                currentWorkers.map((w) => 
                    w.id === payload.new.id ? { ...w, ...payload.new } : w
                )
            )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // --- LÓGICA DE FILTRADO ---
  const processedWorkers = workers.filter(worker => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = 
          `${worker.apellido_paterno} ${worker.nombres}`.toLowerCase().includes(term) || 
          (worker.dni && worker.dni.includes(term)) ||
          (worker.cargo && worker.cargo.toLowerCase().includes(term))

      const progress = worker.video_progress || 0
      const nota = worker.examen_nota

      if (filter === 'en_curso') return matchesSearch && progress > 0 && progress < 100
      if (filter === 'aprobados') return matchesSearch && nota !== null && nota >= 14
      if (filter === 'reprobados') return matchesSearch && nota !== null && nota < 14
      
      return matchesSearch
  })

  // Estadísticas
  const total = workers.length
  const enVivo = workers.filter(w => (w.video_progress || 0) > 0 && (w.video_progress || 0) < 100).length
  const aprobados = workers.filter(w => (w.examen_nota || 0) >= 14).length

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="group p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm">
                    <ArrowLeft size={20} className="text-slate-500 group-hover:text-slate-800"/> 
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                        <ShieldCheck className="text-blue-600" size={24}/> 
                        Monitor de Inducción
                    </h1>
                </div>
            </div>
            
            <div className="hidden md:flex gap-4">
                <div className="px-5 py-2 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Viendo Ahora</span>
                    <span className="text-2xl font-black text-blue-700 leading-none">{enVivo}</span>
                </div>
                <div className="px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Aprobados</span>
                    <span className="text-2xl font-black text-emerald-700 leading-none">{aprobados}</span>
                </div>
                <div className="px-5 py-2 bg-white border border-slate-200 rounded-xl flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-2xl font-black text-slate-700 leading-none">{total}</span>
                </div>
            </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6 mt-4">
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full md:w-96 group ml-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar obrero..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 rounded-xl outline-none text-sm font-medium transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 overflow-x-auto w-full md:w-auto">
                {['todos', 'en_curso', 'aprobados', 'reprobados'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        {/* LISTA DE TARJETAS */}
        <div className="grid grid-cols-1 gap-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-blue-500 mb-4" size={40}/><p className="text-sm text-slate-400 font-medium">Sincronizando...</p></div>
            ) : processedWorkers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300"><User size={40} className="mx-auto text-slate-300 mb-2"/><p className="text-slate-500 font-medium">No se encontraron trabajadores</p></div>
            ) : (
                <AnimatePresence mode="popLayout">
                    {processedWorkers.map((worker) => (
                        <WorkerCard key={worker.id} worker={worker} />
                    ))}
                </AnimatePresence>
            )}
        </div>
      </div>
    </div>
  )
}

function WorkerCard({ worker }: { worker: any }) {
    const supabase = createClient()
    const [actionLoading, setActionLoading] = useState(false)

    const videoProgress = worker.video_progress || 0 
    const examenNota = worker.examen_nota 
    const tieneNota = examenNota !== null && examenNota !== undefined
    const aprobado = tieneNota && examenNota >= 14
    const workerDisplayName = [worker.apellido_paterno, worker.apellido_materno, worker.nombres].filter(Boolean).join(' ') || worker.dni || 'Trabajador sin nombre'
    const workerInitial = String(worker.nombres || worker.apellido_paterno || worker.dni || '?').charAt(0).toUpperCase()
    
    const isLive = videoProgress > 0 && videoProgress < 100
    const isFinishedVideo = videoProgress === 100

    // --- ACCIÓN 1: REINICIAR INDUCCIÓN ---
    const handleReset = async () => {
        if (!confirm(`¿Estás seguro de REINICIAR la inducción de ${worker.nombres}?\n\nEl obrero tendrá que ver el video y dar el examen nuevamente.`)) return

        setActionLoading(true)
        try {
            const { error } = await supabase.from('fichas').update({
                video_progress: 0,
                examen_nota: null,
                ssoma_completed: false
            }).eq('id', worker.id)

            if (error) throw error
            toast.success("Inducción reiniciada correctamente")
        } catch (error) {
            toast.error("Error al reiniciar")
        } finally {
            setActionLoading(false)
        }
    }

    // --- ACCIÓN 2: DESCARGAR CERTIFICADO (ADMIN) ---
    const handleDownloadCert = () => {
        setActionLoading(true)
        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();

            const img = new Image();
            img.src = '/certificado_base.jpg'; // Asegúrate que la imagen está en /public

            img.onload = () => {
                doc.addImage(img, 'JPEG', 0, 0, width, height);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(28);
                doc.setTextColor(0, 0, 0);
                
                const fullName = `${worker.nombres} ${worker.apellido_paterno} ${worker.apellido_materno}`.toUpperCase();
                doc.text(fullName, width / 2, height / 2, { align: 'center' });

                doc.save(`Certificado_${worker.dni}.pdf`);
                toast.success("Certificado descargado");
                setActionLoading(false)
            };

            img.onerror = () => {
                toast.error("No se encontró la plantilla 'certificado_base.jpg' en /public");
                setActionLoading(false)
            }
        } catch (e) {
            toast.error("Error generando PDF")
            setActionLoading(false)
        }
    }
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group bg-white rounded-2xl border p-5 flex flex-col lg:flex-row items-center gap-6 transition-all hover:shadow-lg ${isLive ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
        >
            {/* 1. PERFIL */}
            <div className="flex items-center gap-4 w-full lg:w-[280px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold border-2 shrink-0 ${isLive ? 'bg-blue-50 border-blue-200 text-blue-600' : aprobado ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {workerInitial}
                    {isLive && <span className="absolute top-[-4px] right-[-4px] flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">{workerDisplayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500 border border-slate-200">{worker.dni}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px] flex items-center gap-1"><Briefcase size={10}/> {worker.cargo || 'Obrero'}</span>
                    </div>
                </div>
            </div>

            {/* 2. ESTADO VIDEO */}
            <div className="flex-1 w-full lg:px-4">
                <div className="flex justify-between items-end mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isFinishedVideo ? 'text-emerald-600' : isLive ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                        {isLive ? <Activity size={12}/> : <PlayCircle size={12}/>}
                        {isFinishedVideo ? 'Video Completado' : isLive ? 'Viendo Video...' : 'Pendiente'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{videoProgress}%</span>
                </div>
                
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                    <motion.div 
                        initial={false}
                        animate={{ width: `${videoProgress}%` }}
                        transition={{ type: "tween", ease: "linear", duration: 0.5 }}
                        className={`h-full relative ${isFinishedVideo ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                    >
                        {isLive && (
                            <div className="absolute top-0 left-0 bottom-0 right-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:10px_10px] animate-[pulse_1s_infinite]"></div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* 3. RESULTADO EXAMEN */}
            <div className="w-full lg:w-[150px] flex justify-end">
                {tieneNota ? (
                    <div className={`flex flex-col items-center justify-center w-full p-2 rounded-xl border-2 ${aprobado ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${aprobado ? 'text-emerald-600' : 'text-red-600'}`}>
                            {aprobado ? 'APROBADO' : 'REPROBADO'}
                        </span>
                        <div className="flex items-center gap-1">
                            {aprobado ? <CheckCircle2 size={16} className="text-emerald-500"/> : <XCircle size={16} className="text-red-500"/>}
                            <span className={`text-xl font-black ${aprobado ? 'text-emerald-700' : 'text-red-700'}`}>{examenNota}</span>
                            <span className="text-[10px] font-medium text-slate-400 mt-1">/ 20</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-slate-50 border border-slate-200 border-dashed text-slate-400">
                        <GraduationCap size={16}/>
                        <span className="text-[10px] font-bold">Sin Examen</span>
                    </div>
                )}
            </div>

            {/* 4. ACCIONES (BOTONES) */}
            <div className="w-full lg:w-[140px] flex flex-row lg:flex-col gap-2 justify-end pl-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0">
                
                {/* BOTÓN CERTIFICADO (Solo si aprobó) */}
                {aprobado && (
                    <button 
                        onClick={handleDownloadCert}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Descargar Certificado"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={14}/> : <FileCheck size={14}/>}
                        Certificado
                    </button>
                )}

                {/* BOTÓN REINICIAR (Siempre visible) */}
                <button 
                    onClick={handleReset}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Reiniciar Inducción"
                >
                    <RotateCcw size={14}/>
                    Reiniciar
                </button>
            </div>

        </motion.div>
    )
}
