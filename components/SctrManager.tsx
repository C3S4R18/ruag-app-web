'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { Loader2, FileSpreadsheet, Search, ArrowLeft, Save, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function SctrManager({ onBack }: { onBack?: () => void }) {
    const supabase = createClient()
    const [workers, setWorkers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [search, setSearch] = useState('')

    // Cargar trabajadores que están en SCTR
    const fetchSctrWorkers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas')
            .select('*')
            .eq('in_sctr', true) // CAMPO CLAVE
            .eq('es_cesado', false) // Solo activos
            .order('apellido_paterno', { ascending: true })
        
        if (error) toast.error("Error al cargar SCTR: " + error.message)
        else setWorkers(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchSctrWorkers() }, [])

    // Función para devolver al Dashboard (Quitar de SCTR)
    const handleRestore = async (id: string) => {
        if(!confirm("¿Regresar este trabajador al Dashboard General?")) return;
        const { error } = await supabase.from('fichas').update({ in_sctr: false }).eq('id', id)
        if(error) toast.error("Error")
        else {
            toast.success("Trabajador restaurado")
            setWorkers(prev => prev.filter(w => w.id !== id))
        }
    }

    // EXPORTAR EXCEL CON EL FORMATO EXACTO (Hoja1.csv)
    const handleExportExcel = () => {
        setExporting(true)
        try {
            // Mapeo exacto según tu archivo 'Trama Vida Ley FEBRERO 2.xlsx'
            // Estructura: A=O, B=1, C=DNI, D=1, E=F.Nac, F=Paterno, G=Materno, H=Nombres, I=S, J="", K=Obra
            const excelData = workers.map(w => ({
                'TipoTrab': 'O',                      // Col A
                'TipoDoc': '1',                       // Col B (DNI)
                'NumDoc': w.dni || '',                // Col C
                'Nac': '1',                           // Col D (Nacionalidad Peruana)
                'FecNac': w.fecha_nacimiento ? new Date(w.fecha_nacimiento).toLocaleDateString('es-PE') : '', // Col E
                'ApePaterno': w.apellido_paterno || '', // Col F
                'ApeMaterno': w.apellido_materno || '', // Col G
                'Nombres': w.nombres || '',           // Col H
                'Moneda': 'S',                        // Col I
                'Remuneracion': '',                   // Col J (Vacío según formato)
                'Ubicacion': w.nombre_obra || ''      // Col K (Obra/Sede)
            }))

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Trama SCTR")
            
            // Nombre del archivo
            XLSX.writeFile(workbook, `Trama_SCTR_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
            toast.success("Excel SCTR exportado correctamente")
        } catch (e:any) {
            toast.error("Error al exportar: " + e.message)
        } finally {
            setExporting(false)
        }
    }

    const filtered = workers.filter(w => 
        (w.nombres + w.apellido_paterno + w.dni).toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header SCTR */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all text-slate-500">
                            <ArrowLeft size={20}/>
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheckIcon className="text-amber-600"/> Gestión SCTR
                        </h2>
                        <p className="text-xs text-slate-500">Nómina para Seguro Complementario de Trabajo de Riesgo</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Buscar en SCTR..." 
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleExportExcel} 
                        disabled={exporting || workers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={16}/> : <FileSpreadsheet size={16}/>}
                        Descargar Trama SCTR
                    </button>
                </div>
            </div>

            {/* Tabla Simple */}
            <div className="flex-1 overflow-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Users size={48} className="mb-4 opacity-20"/>
                        <p>No hay trabajadores asignados a SCTR</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-3">DNI</th>
                                <th className="px-6 py-3">Apellidos y Nombres</th>
                                <th className="px-6 py-3">F. Nacimiento</th>
                                <th className="px-6 py-3">Obra / Sede</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((w) => (
                                <tr key={w.id} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="px-6 py-3 font-mono text-slate-600">{w.dni}</td>
                                    <td className="px-6 py-3 font-bold text-slate-700">{w.apellido_paterno} {w.apellido_materno}, {w.nombres}</td>
                                    <td className="px-6 py-3 text-slate-600">{w.fecha_nacimiento}</td>
                                    <td className="px-6 py-3">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-600 border border-slate-200">
                                            {w.nombre_obra || 'Sin Asignar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={() => handleRestore(w.id)}
                                            className="text-red-400 hover:text-red-600 font-medium text-xs hover:underline"
                                        >
                                            Quitar de SCTR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                Mostrando {filtered.length} registros para SCTR
            </div>
        </div>
    )
}

function ShieldCheckIcon({className}:any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
}