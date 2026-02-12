'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { 
    Search, Loader2, RotateCcw, UserX, CalendarOff, 
    Trash2, ArrowLeft, History, AlertOctagon 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Definimos la prop para recibir la función de regreso
interface CesadosManagerProps {
    onBack?: () => void;
}

export default function CesadosManager({ onBack }: CesadosManagerProps) {
    const supabase = createClient()
    const [cesados, setCesados] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchCesados = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas')
            .select('*')
            .eq('es_cesado', true)
            .order('fecha_cese', { ascending: false })

        if (error) toast.error("Error al cargar historial")
        else setCesados(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchCesados()
    }, [])

    const handleRestoreWorker = async (id: string, name: string) => {
        toast.promise(
            async () => {
                const { error } = await supabase.from('fichas').update({ 
                    es_cesado: false, 
                    fecha_cese: null,
                    in_vida_ley: false
                }).eq('id', id)
                if (error) throw error
                setCesados(prev => prev.filter(c => c.id !== id))
            },
            {
                loading: 'Restaurando trabajador...',
                success: `${name} ha regresado a la lista activa`,
                error: 'No se pudo restaurar el registro'
            }
        )
    }

    const handlePermanentDelete = async (id: string) => {
        if(!confirm("⚠️ ¿Eliminar definitivamente? Esta acción es IRREVERSIBLE.")) return
        
        const { error } = await supabase.from('fichas').delete().eq('id', id)
        if(error) toast.error("Error al eliminar")
        else {
            toast.success("Registro eliminado del sistema")
            setCesados(prev => prev.filter(c => c.id !== id))
        }
    }

    const filtered = cesados.filter(c => 
        (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.apellido_paterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dni || '').includes(searchTerm)
    )

    // Animaciones
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }
    
    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-rose-600" size={40}/></div>

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden font-sans">
            
            {/* --- HEADER PREMIUM --- */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-white to-rose-50/30 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Botón Volver */}
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm active:scale-95 group"
                            title="Regresar al Dashboard"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                        </button>
                    )}
                    
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <History size={20}/> 
                            </div>
                            Historial de Bajas
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium ml-1">
                            Gestión de personal cesado y archivo muerto.
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por DNI, Nombre..." 
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-4 focus:ring-rose-50 focus:border-rose-300 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* --- CONTENIDO --- */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <UserX size={40} className="opacity-30"/>
                        </div>
                        <p className="font-bold text-lg text-slate-500">No hay registros</p>
                        <p className="text-sm">No se encontraron trabajadores cesados.</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
                    >
                        {filtered.map((worker) => (
                            <motion.div 
                                variants={itemAnim}
                                key={worker.id} 
                                className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Barra lateral de estado */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
                                
                                {/* Etiqueta de Fecha */}
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100">
                                    <CalendarOff size={12}/>
                                    {worker.fecha_cese ? new Date(worker.fecha_cese).toLocaleDateString('es-PE') : 'N/A'}
                                </div>

                                <div className="flex items-start gap-4 mb-5 pl-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-white shadow-inner uppercase">
                                        {worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="font-bold text-slate-800 text-sm truncate uppercase group-hover:text-rose-700 transition-colors">
                                            {worker.apellido_paterno} {worker.apellido_materno}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">{worker.nombres}</p>
                                        <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{worker.dni}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-5 pl-2">
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                                        <span className="text-slate-400">Cargo:</span>
                                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{worker.cargo || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">Obra:</span>
                                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{worker.nombre_obra || '---'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pl-2">
                                    <button 
                                        onClick={() => handleRestoreWorker(worker.id, worker.nombres)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
                                        title="Regresar a activos"
                                    >
                                        <RotateCcw size={14}/> Restaurar
                                    </button>
                                    <button 
                                        onClick={() => handlePermanentDelete(worker.id)}
                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                                        title="Eliminar registro definitivamente"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    )
}