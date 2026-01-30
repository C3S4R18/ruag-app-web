'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, ShieldCheck, CheckCircle, AlertCircle, 
  ArrowLeft, Loader2, Briefcase, ArrowUpDown,
  Filter, User
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function InduccionSSOMA() {
  const supabase = createClient()
  
  // --- ESTADOS ---
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // --- CARGAR DATOS ---
  const fetchWorkers = async () => {
    setLoading(true)
    const { data, error } = await supabase
        .from('fichas')
        .select('*')
    
    if (error) {
        toast.error("Error al cargar datos")
    } else if (data) {
        setWorkers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const processedWorkers = workers
    .filter(worker => {
        const term = searchTerm.toLowerCase()
        const fullName = `${worker.apellido_paterno} ${worker.apellido_materno} ${worker.nombres}`.toLowerCase()
        const dni = worker.dni ? worker.dni.toLowerCase() : ''
        return fullName.includes(term) || dni.includes(term)
    })
    .sort((a, b) => {
        const nameA = `${a.apellido_paterno} ${a.apellido_materno} ${a.nombres}`.toLowerCase()
        const nameB = `${b.apellido_paterno} ${b.apellido_materno} ${b.nombres}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')

  return (
    // 1. FONDO GRIS MATE (Evita el brillo excesivo)
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-6 flex flex-col items-center">
      
      <div className="w-full max-w-6xl mt-4">
        
        {/* HEADER SIMPLE */}
        <div className="flex justify-between items-center mb-6 px-1">
            <Link href="/admin" className="text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm flex items-center gap-2">
                <ArrowLeft size={16}/> Volver al Panel
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <ShieldCheck size={14}/> Monitor SSOMA
            </div>
        </div>

        {/* TARJETA PRINCIPAL (Plana, bordes finos, sin sombras locas) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            
            {/* TOOLBAR */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Estado de Inducciones</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Total: <span className="font-medium text-gray-900">{workers.length}</span> • 
                        Habilitados: <span className="font-medium text-emerald-600">{workers.filter(w => w.ssoma_completed).length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* BUSCADOR MODERNO (Gris suave, focus ring sutil) */}
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar trabajador..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/5 focus:border-gray-300 transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* BOTÓN ORDENAR (Minimalista) */}
                    <button 
                        onClick={toggleSort}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title="Ordenar lista"
                    >
                        <ArrowUpDown size={18} />
                    </button>
                </div>
            </div>

            {/* LISTA */}
            <div className="flex-1 bg-white overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <p className="text-sm">Cargando datos...</p>
                    </div>
                ) : processedWorkers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Filter size={32} strokeWidth={1.5} className="mb-2 opacity-20" />
                        <p className="text-sm">No se encontraron resultados</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Colaborador</th>
                                <th className="px-6 py-3 font-medium">Cargo</th>
                                <th className="px-6 py-3 font-medium">DNI</th>
                                <th className="px-6 py-3 font-medium text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence initial={false}>
                                {processedWorkers.map((worker) => (
                                    <motion.tr 
                                        layout
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={worker.id} 
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Nombre */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${worker.ssoma_completed 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-amber-100 text-amber-700'}
                                                `}>
                                                    {worker.nombres.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900 text-sm">
                                                    {worker.apellido_paterno} {worker.apellido_materno}, {worker.nombres}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Cargo */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Briefcase size={14} className="text-gray-400"/>
                                                <span className="truncate max-w-[150px]">{worker.cargo || '—'}</span>
                                            </div>
                                        </td>

                                        {/* DNI */}
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {worker.dni}
                                        </td>

                                        {/* Estado (Badge Moderno) */}
                                        <td className="px-6 py-4 text-right">
                                            {worker.ssoma_completed ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle size={12} className="fill-emerald-600 text-white" />
                                                    Habilitado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                    <AlertCircle size={12} className="fill-amber-500 text-white" />
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* Footer sutil */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
               <span>Sistema RUAG v1.0</span>
               <span>Orden: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </div>

        </div>
      </div>
    </div>
  )
}