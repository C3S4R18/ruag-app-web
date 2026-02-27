'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Save, FileSpreadsheet, Loader2, Search, RotateCcw, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- COMPONENTE DE ALERTA MODERNA Y ANIMADA (CORREGIDO CON TYPESCRIPT) ---
interface ModernConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const ModernConfirmDialog = ({ isOpen, onClose, onConfirm, title, description }: ModernConfirmDialogProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    {/* Overlay de fondo con animación */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30"
                        onClick={onClose}
                    />

                    {/* Contenedor del diálogo con animación */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-slate-950 p-7 rounded-3xl border border-slate-800 shadow-2xl relative z-10"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-950 rounded-full border border-red-800 flex-shrink-0">
                                <AlertTriangle className="text-red-500" size={26}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
                                <p className="text-slate-400 mt-2 text-sm leading-relaxed">{description}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-9">
                            <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 transition text-sm">
                                Cancelar
                            </button>
                            <button onClick={onConfirm} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 text-sm">
                                Aceptar y Continuar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
// -----------------------------------------------------

export default function VidaLeyManager() {
    const supabase = createClient()
    const [workers, setWorkers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    // --- NUEVO ESTADO: SELECCIÓN MÚLTIPLE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // --- ESTADOS PARA CONTROLAR LOS DIÁLOGOS DE CONFIRMACIÓN ---
    const [confirmSingleId, setConfirmSingleId] = useState<string | null>(null);
    const [confirmMultipleOpen, setConfirmMultipleOpen] = useState(false);

    // Cargar trabajadores que están en "Vida Ley"
    const fetchWorkers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas')
            .select('*')
            .eq('in_vida_ley', true) // SOLO LOS QUE ESTÁN EN VIDA LEY
            .order('apellido_paterno', { ascending: true })

        if (error) {
            toast.error("Error al cargar datos")
        } else {
            // Mapeamos los datos para la "Vista Excel"
            const mapped = data.map(w => {
                const savedData = w.datos_vida_ley || {}
                return {
                    id: w.id, // ID interno para updates
                    nombres: savedData.nombres || w.nombres,
                    paterno: savedData.paterno || w.apellido_paterno,
                    materno: savedData.materno || w.apellido_materno,
                    tipoTrab: savedData.tipoTrab || 'O',
                    tipoDoc: savedData.tipoDoc || 'DNI',
                    nroDoc: savedData.nroDoc || w.dni,
                    sexo: savedData.sexo || 'M',
                    fechaNac: savedData.fechaNac || (w.fecha_nacimiento ? new Date(w.fecha_nacimiento).toISOString().split('T')[0] : ''),
                    moneda: savedData.moneda || 'S',
                    remuneracion: savedData.remuneracion || '2200', // Valor por defecto común
                    sede: savedData.sede || w.nombre_obra || ''
                }
            })
            setWorkers(mapped)
            setSelectedIds(new Set()) // Limpiar selección al recargar
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchWorkers()
    }, [])

    // Manejar cambios en las celdas (Input change)
    const handleCellChange = (id: string, field: string, value: string) => {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w))
    }

    // Guardar cambios en Supabase (campo JSONB)
    const handleSaveChanges = async () => {
        setSaving(true)
        try {
            // Actualizamos uno por uno
            const promises = workers.map(w => {
                const { id, ...dataToSave } = w
                return supabase.from('fichas').update({ datos_vida_ley: dataToSave }).eq('id', id)
            })
            await Promise.all(promises)
            toast.success("Datos guardados en el sistema")
        } catch (e) {
            toast.error("Error al guardar cambios")
        } finally {
            setSaving(false)
        }
    }

    // Exportar a Excel (Formato Final)
    const handleExportExcel = () => {
        const excelData = workers.map(w => ({
            'Nombres': w.nombres,
            'Paterno': w.paterno,
            'Materno': w.materno,
            'TipoTrab': w.tipoTrab,
            'TipoDoc': w.tipoDoc,
            'NroDoc': w.nroDoc,
            'Sexo': w.sexo,
            // Formatear fecha para excel dd/mm/yyyy
            'FechaNac': w.fechaNac ? w.fechaNac.split('-').reverse().join('/') : '',
            'Moneda': w.moneda,
            'Remuneracion': parseFloat(w.remuneracion || '0'),
            'Sede': w.sede
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Planilla Vida Ley")
        XLSX.writeFile(workbook, `Trama_Vida_Ley_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
        toast.success("Excel descargado correctamente")
    }

    // --- FUNCIÓN PARA REGRESAR A LA TABLA PRINCIPAL (UNO SOLO) ---
    const handleRemoveFromVidaLeyClick = (id: string) => {
        setConfirmSingleId(id);
    };

    const confirmSingleAction = async () => {
        if (!confirmSingleId) return;
        const id = confirmSingleId;
        setConfirmSingleId(null); 

        // Al poner in_vida_ley en false, vuelve a aparecer en AdminTable
        const { error } = await supabase.from('fichas').update({ in_vida_ley: false, datos_vida_ley: null }).eq('id', id)
        
        if(error) {
            toast.error("Error al mover el trabajador")
        } else {
            toast.success("Trabajador regresado a lista principal")
            setWorkers(prev => prev.filter(w => w.id !== id))
            setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; })
        }
    };

    // --- NUEVA FUNCIÓN: REGRESAR MASIVAMENTE ---
    const handleRemoveMultipleClick = () => {
        if (selectedIds.size === 0) return;
        setConfirmMultipleOpen(true);
    };

    const confirmMultipleAction = async () => {
        setConfirmMultipleOpen(false);
        const idsArray = Array.from(selectedIds);
        
        const { error } = await supabase
            .from('fichas')
            .update({ in_vida_ley: false, datos_vida_ley: null })
            .in('id', idsArray)
        
        if(error) {
            toast.error("Error al mover trabajadores")
        } else {
            toast.success(`${selectedIds.size} trabajadores regresados a lista principal`)
            setWorkers(prev => prev.filter(w => !selectedIds.has(w.id)))
            setSelectedIds(new Set()) 
        }
    };

    // --- MANEJO DE CHECKBOXES ---
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredWorkers.map(w => w.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    // --- NUEVO: FUNCIÓN PARA ENVIAR POR OUTLOOK ---
    const handleEnviarOutlook = () => {
        handleExportExcel();

        const destinatario = "emision@atlanticcorredores.com";
        const fecha = new Date().toLocaleDateString('es-PE');
        const asunto = `Envío de Trama Vida Ley - ${fecha}`;
        const cuerpo = `Estimados,\n\nAdjunto sírvanse encontrar la trama Vida Ley actualizada.\n\nAtentamente,\nAdministración RUAG`;

        const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

        setTimeout(() => {
            window.location.href = mailtoLink;
            toast.info("Outlook abierto. Por favor adjunta el Excel descargado.", { duration: 5000, icon: '📧' });
        }, 1000);
    }

    const filteredWorkers = workers.filter(w => 
        (w.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (w.paterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.nroDoc || '').includes(searchTerm)
    )

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" size={40}/></div>

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
            {/* Header de la Vista Excel */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-600"/> 
                        Gestión Trama Vida Ley
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Edita los datos directamente en la tabla antes de exportar. 
                        <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">Campos Amarillos = Obligatorios</span>
                    </p>
                </div>
                
                <div className="flex gap-3 items-center">
                    
                    {/* BOTÓN MASIVO CONDICIONAL */}
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handleRemoveMultipleClick}
                            className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors mr-2 border border-red-200"
                            title="Regresar seleccionados al Dashboard"
                        >
                            <RotateCcw size={16}/> 
                            Regresar Seleccionados ({selectedIds.size})
                        </button>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Buscar en lista..." 
                            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <button onClick={handleSaveChanges} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50" title="Guardar cambios">
                        {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    </button>
                    
                    <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-emerald-200" title="Solo descargar Excel">
                        <FileSpreadsheet size={16}/> Excel
                    </button>

                    <button 
                        onClick={handleEnviarOutlook}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0078D4] hover:bg-[#005a9e] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95 border border-white/10"
                        title="Descargar y abrir Outlook"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <span className="hidden xl:inline">Enviar a Atlantic</span>
                    </button>
                </div>
            </div>

            {/* TABLA TIPO EXCEL */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
                <div className="bg-white shadow-sm border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-800 text-white sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-r border-slate-600 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="cursor-pointer"
                                        checked={filteredWorkers.length > 0 && selectedIds.size === filteredWorkers.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                                <th className="p-3 border-r border-slate-600 w-10 text-center">#</th>
                                <th className="p-3 border-r border-slate-600 min-w-[150px]">Nombres</th>
                                <th className="p-3 border-r border-slate-600 min-w-[120px]">Paterno</th>
                                <th className="p-3 border-r border-slate-600 min-w-[120px]">Materno</th>
                                <th className="p-3 border-r border-slate-600 w-20 text-center bg-yellow-600/20">TipoTrab</th>
                                <th className="p-3 border-r border-slate-600 w-20 text-center bg-yellow-600/20">TipoDoc</th>
                                <th className="p-3 border-r border-slate-600 w-24 bg-yellow-600/20">Nro Doc</th>
                                <th className="p-3 border-r border-slate-600 w-16 text-center">Sexo</th>
                                <th className="p-3 border-r border-slate-600 w-32 bg-yellow-600/20">F. Nacimiento</th>
                                <th className="p-3 border-r border-slate-600 w-16 text-center">Moneda</th>
                                <th className="p-3 border-r border-slate-600 w-28 bg-yellow-600/20">Remuneración</th>
                                <th className="p-3 border-r border-slate-600 min-w-[150px]">Sede (Obra)</th>
                                <th className="p-3 w-10 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredWorkers.map((w, idx) => (
                                <tr key={w.id} className={`hover:bg-blue-50/50 group ${selectedIds.has(w.id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="p-1 border-r text-center">
                                        <input 
                                            type="checkbox" 
                                            className="cursor-pointer"
                                            checked={selectedIds.has(w.id)}
                                            onChange={(e) => handleSelectOne(w.id, e.target.checked)}
                                        />
                                    </td>
                                    
                                    <td className="p-1 border-r text-center text-slate-400 font-mono">{idx + 1}</td>
                                    
                                    <td className="p-0 border-r"><input type="text" className="w-full h-full p-2 outline-none bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.nombres} onChange={(e) => handleCellChange(w.id, 'nombres', e.target.value)}/></td>
                                    <td className="p-0 border-r"><input type="text" className="w-full h-full p-2 outline-none bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.paterno} onChange={(e) => handleCellChange(w.id, 'paterno', e.target.value)}/></td>
                                    <td className="p-0 border-r"><input type="text" className="w-full h-full p-2 outline-none bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.materno} onChange={(e) => handleCellChange(w.id, 'materno', e.target.value)}/></td>
                                    
                                    <td className="p-0 border-r bg-yellow-50/30"><select className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer" value={w.tipoTrab} onChange={(e) => handleCellChange(w.id, 'tipoTrab', e.target.value)}><option value="O">O</option><option value="E">E</option></select></td>
                                    <td className="p-0 border-r bg-yellow-50/30"><select className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer" value={w.tipoDoc} onChange={(e) => handleCellChange(w.id, 'tipoDoc', e.target.value)}><option value="DNI">DNI</option><option value="CEX">CEX</option></select></td>
                                    
                                    <td className="p-0 border-r bg-yellow-50/30"><input type="text" className="w-full h-full p-2 outline-none bg-transparent font-mono text-center focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.nroDoc} onChange={(e) => handleCellChange(w.id, 'nroDoc', e.target.value)}/></td>
                                    <td className="p-0 border-r"><select className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer" value={w.sexo} onChange={(e) => handleCellChange(w.id, 'sexo', e.target.value)}><option value="M">M</option><option value="F">F</option></select></td>
                                    
                                    <td className="p-0 border-r bg-yellow-50/30"><input type="date" className="w-full h-full p-2 outline-none bg-transparent text-center focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.fechaNac} onChange={(e) => handleCellChange(w.id, 'fechaNac', e.target.value)}/></td>
                                    <td className="p-0 border-r"><select className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer" value={w.moneda} onChange={(e) => handleCellChange(w.id, 'moneda', e.target.value)}><option value="S">S</option><option value="D">D</option></select></td>
                                    
                                    <td className="p-0 border-r bg-yellow-50/30"><input type="number" className="w-full h-full p-2 outline-none bg-transparent text-right font-bold text-slate-700 focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.remuneracion} onChange={(e) => handleCellChange(w.id, 'remuneracion', e.target.value)}/></td>
                                    <td className="p-0 border-r"><input type="text" className="w-full h-full p-2 outline-none bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500" value={w.sede} onChange={(e) => handleCellChange(w.id, 'sede', e.target.value)}/></td>
                                    
                                    <td className="p-0 text-center border-l border-slate-200">
                                        <button 
                                            onClick={() => handleRemoveFromVidaLeyClick(w.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full h-full flex items-center justify-center" 
                                            title="Regresar a lista principal"
                                        >
                                            <RotateCcw size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredWorkers.length === 0 && <div className="text-center p-10 text-slate-400">No hay trabajadores en la lista de Vida Ley. Agrégalos desde el Panel Principal.</div>}
            </div>

            {/* Diálogo para confirmación individual */}
            <ModernConfirmDialog 
                isOpen={confirmSingleId !== null}
                onClose={() => setConfirmSingleId(null)}
                onConfirm={confirmSingleAction}
                title="¿Regresar trabajador?"
                description="¿Estás seguro de regresar este trabajador a la lista principal de activos? Dejará de aparecer en esta trama."
            />

            {/* Diálogo para confirmación masiva */}
            <ModernConfirmDialog 
                isOpen={confirmMultipleOpen}
                onClose={() => setConfirmMultipleOpen(false)}
                onConfirm={confirmMultipleAction}
                title={`¿Regresar ${selectedIds.size} trabajadores?`}
                description={`¿Estás seguro de regresar los ${selectedIds.size} trabajadores seleccionados a la lista principal de activos? Dejarán de aparecer en esta trama.`}
            />
        </div>
    )
}