'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Search, Loader2, RotateCcw, UserX, CalendarOff, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CesadosManager() {
    const supabase = createClient()
    const [cesados, setCesados] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchCesados = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas')
            .select('*')
            .eq('es_cesado', true) // SOLO LOS CESADOS
            .order('fecha_cese', { ascending: false })

        if (error) toast.error("Error al cargar cesados")
        else setCesados(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchCesados()
    }, [])

    const handleRestoreWorker = async (id: string, name: string) => {
        if(!confirm(`¿Restaurar a ${name} a la lista de trabajadores activos?`)) return

        const { error } = await supabase.from('fichas').update({ 
            es_cesado: false, 
            fecha_cese: null,
            in_vida_ley: false // Aseguramos que no esté en vida ley tampoco
        }).eq('id', id)

        if(error) {
            toast.error("Error al restaurar")
        } else {
            toast.success("Trabajador reactivado exitosamente")
            setCesados(prev => prev.filter(c => c.id !== id))
        }
    }

    // Opcional: Eliminar definitivamente de la base de datos
    const handlePermanentDelete = async (id: string) => {
        if(!confirm("⚠️ PELIGRO: Esto borrará permanentemente todos los datos, firmas y documentos de este trabajador. ¿Continuar?")) return
        
        const { error } = await supabase.from('fichas').delete().eq('id', id)
        if(error) toast.error("Error al eliminar")
        else {
            toast.success("Registro eliminado permanentemente")
            setCesados(prev => prev.filter(c => c.id !== id))
        }
    }

    const filtered = cesados.filter(c => 
        (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.apellido_paterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dni || '').includes(searchTerm)
    )

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-red-600" size={40}/></div>

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserX className="text-red-600"/> 
                        Historial de Cesados
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Personal dado de baja. Estos usuarios no aparecen en la lista principal ni en Vida Ley.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por DNI o Nombre..." 
                        className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 outline-none w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <UserX size={48} className="mb-4 opacity-20"/>
                        <p>No hay trabajadores cesados registrados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((worker) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={worker.id} 
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                                    CESADO
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{worker.apellido_paterno} {worker.apellido_materno}, {worker.nombres}</h3>
                                        <p className="text-xs text-slate-500 font-mono">{worker.dni}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <CalendarOff size={14}/>
                                        <span>Fecha de Cese: <b>{worker.fecha_cese ? new Date(worker.fecha_cese).toLocaleDateString() : 'No registrada'}</b></span>
                                    </div>
                                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        Cargo: {worker.cargo || 'Sin cargo'} <br/>
                                        Obra: {worker.nombre_obra || 'Sin obra'}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-2 pt-3 border-t border-slate-100">
                                    <button 
                                        onClick={() => handleRestoreWorker(worker.id, worker.nombres)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <RotateCcw size={14}/> Reactivar
                                    </button>
                                    <button 
                                        onClick={() => handlePermanentDelete(worker.id)}
                                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                                        title="Eliminar definitivamente"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}