'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, ShieldCheck, CheckCircle, AlertCircle, 
  ArrowLeft, Loader2, Briefcase, ArrowUpDown,
  Filter, User, Building2, HardHat
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
        .order('updated_at', { ascending: false }) // Orden inicial por fecha
    
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
        // Filtramos también por cargo para ser más útil
        const cargo = worker.cargo ? worker.cargo.toLowerCase() : ''
        return fullName.includes(term) || dni.includes(term) || cargo.includes(term)
    })
    .sort((a, b) => {
        const nameA = `${a.apellido_paterno} ${a.apellido_materno} ${a.nombres}`.toLowerCase()
        const nameB = `${b.apellido_paterno} ${b.apellido_materno} ${b.nombres}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')

  // Cálculo de estadísticas rápidas
  const total = workers.length
  const habilitados = workers.filter(w => w.ssoma_completed).length
  const porcentaje = total > 0 ? Math.round((habilitados / total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-4 md:p-8 flex flex-col items-center">
      
      <div className="w-full max-w-6xl">
        
        {/* HEADER DE NAVEGACIÓN */}
        <div className="flex justify-between items-center mb-8">
            <Link href="/admin" className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg group-hover:border-slate-300 transition-colors shadow-sm">
                    <ArrowLeft size={16}/> 
                </div>
                Volver al Panel General
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-full border border-blue-100">
                <ShieldCheck size={14}/> Monitor SSOMA
            </div>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[700px]">
            
            {/* TOOLBAR SUPERIOR */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white z-10 relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estado de Inducciones</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <User size={14}/> Total: <span className="font-bold text-slate-900">{total}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={14}/> Habilitados: <span className="font-bold">{habilitados}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Progreso: {porcentaje}%</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* BUSCADOR */}
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, DNI o cargo..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* BOTÓN ORDENAR */}
                    <button 
                        onClick={toggleSort}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
                        title={`Ordenar ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                    >
                        <ArrowUpDown size={18} />
                    </button>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="flex-1 bg-white overflow-y-auto relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                        <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                        <p className="text-sm font-medium text-slate-500 animate-pulse">Sincronizando registros...</p>
                    </div>
                ) : processedWorkers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Filter size={32} className="opacity-20 text-slate-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No se encontraron resultados</p>
                        <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 pl-8">Colaborador</th>
                                <th className="px-6 py-4">Cargo / Obra</th>
                                <th className="px-6 py-4">DNI</th>
                                <th className="px-6 py-4 text-right pr-8">Estado Inducción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence initial={false}>
                                {processedWorkers.map((worker, index) => (
                                    <motion.tr 
                                        layout
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        key={worker.id} 
                                        className="group hover:bg-blue-50/30 transition-colors"
                                    >
                                        {/* Columna Nombre */}
                                        <td className="px-6 py-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 transition-transform group-hover:scale-105
                                                    ${worker.ssoma_completed 
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100' 
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'}
                                                `}>
                                                    {worker.nombres.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                                                        {worker.apellido_paterno} {worker.apellido_materno}, {worker.nombres}
                                                    </div>
                                                    {/* ID opcional o email si existiera */}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Columna Cargo */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <Briefcase size={14} className="text-slate-400"/>
                                                    <span className="truncate max-w-[180px]">{worker.cargo || 'Sin Cargo'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Building2 size={12} className="text-slate-300"/>
                                                    <span className="truncate max-w-[180px]">{worker.nombre_obra || 'Obra Central'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Columna DNI */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-bold border border-slate-200">
                                                {worker.dni}
                                            </span>
                                        </td>

                                        {/* Columna Estado */}
                                        <td className="px-6 py-4 pr-8 text-right">
                                            {worker.ssoma_completed ? (
                                                <div className="inline-flex flex-col items-end gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                                        <CheckCircle size={12} className="fill-emerald-600 text-white" />
                                                        Habilitado
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-medium">Aprobado SSOMA</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-end gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        <AlertCircle size={12} className="text-slate-400" />
                                                        Pendiente
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">Falta Inducción</span>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* FOOTER */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 font-medium uppercase tracking-wider flex justify-between items-center">
               <span>Sistema de Gestión RUAG</span>
               <span>Mostrando {processedWorkers.length} registros</span>
            </div>

        </div>
      </div>
    </div>
  )
}