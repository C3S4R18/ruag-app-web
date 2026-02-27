'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { 
    Loader2, FileSpreadsheet, Search, ArrowLeft, 
    ShieldCheck, AlertCircle, Users, Trash2, RotateCcw, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
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

export default function SctrManager({ onBack }: { onBack?: () => void }) {
    const supabase = createClient()
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [search, setSearch] = useState('')

    // --- NUEVO ESTADO: SELECCIÓN MÚLTIPLE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // --- ESTADOS PARA CONTROLAR LOS DIÁLOGOS DE CONFIRMACIÓN ---
    const [confirmSingleId, setConfirmSingleId] = useState<string | null>(null);
    const [confirmMultipleOpen, setConfirmMultipleOpen] = useState(false);

    // Cargar trabajadores que están en SCTR
    const fetchSctrWorkers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas')
            .select('*')
            .eq('in_sctr', true)
            .eq('es_cesado', false)
            .order('apellido_paterno', { ascending: true })
        
        if (error) {
            toast.error("Error al cargar SCTR: " + error.message)
        } else {
            const formattedData = (data || []).map(w => ({
                id: w.id,
                tipo_doc: w.dni?.length === 8 ? '1' : '4',
                num_doc: w.dni || '',
                nombres: w.nombres || '',
                ape_paterno: w.apellido_paterno || '',
                ape_materno: w.apellido_materno || '',
                fec_nac: w.fecha_nacimiento ? w.fecha_nacimiento.split('-').reverse().join('/') : '',
                nacionalidad: w.nacionalidad || 'PERUANA',
                sexo: w.sexo || 'M',
                sueldo: '1130.00',
                nivel_riesgo: '04'
            }))
            setRows(formattedData)
            setSelectedIds(new Set()) // Limpiar selección al recargar
        }
        setLoading(false)
    }

    useEffect(() => { fetchSctrWorkers() }, [])

    const handleCellChange = (id: string, field: string, value: string) => {
        setRows(prev => prev.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    // --- FUNCIÓN PARA REGRESAR A LA TABLA PRINCIPAL (UNO SOLO) ---
    const handleRemoveFromSctrClick = (id: string) => {
        setConfirmSingleId(id);
    };

    const confirmSingleAction = async () => {
        if (!confirmSingleId) return;
        const id = confirmSingleId;
        setConfirmSingleId(null); 

        const { error } = await supabase.from('fichas').update({ in_sctr: false }).eq('id', id)
        
        if(error) {
            toast.error("Error al remover")
        } else {
            toast.success("Trabajador removido de SCTR")
            setRows(prev => prev.filter(w => w.id !== id))
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
            .update({ in_sctr: false })
            .in('id', idsArray)
        
        if(error) {
            toast.error("Error al remover trabajadores")
        } else {
            toast.success(`${selectedIds.size} trabajadores removidos de SCTR`)
            setRows(prev => prev.filter(w => !selectedIds.has(w.id)))
            setSelectedIds(new Set()) 
        }
    };

    // --- MANEJO DE CHECKBOXES ---
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredRows.map(w => w.id)))
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

    // --- FUNCIÓN DE EXPORTACIÓN AVANZADA ---
    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Hoja1');

            worksheet.columns = [
                { key: 'tipo_doc', width: 25 },
                { key: 'num_doc', width: 20 },
                { key: 'nombres', width: 35 },
                { key: 'ape_paterno', width: 30 },
                { key: 'ape_materno', width: 30 },
                { key: 'fec_nac', width: 20 },
                { key: 'nacionalidad', width: 25 },
                { key: 'sexo', width: 10 },
                { key: 'sueldo', width: 15 },
                { key: 'nivel_riesgo', width: 15 },
            ];

            const headers = [
                "Tipo de Documento de Identidad\n\nSólo se permite número 1:DNI, 2:CE, 3:OTROS 4:PAS",
                "Número de Documento\n\nPara DNI: 8 dígitos; Otros: 12 dígitos",
                "Nombres\n\nMáximo 30 caracteres; sólo se permite letras, vocales y \"Ñ\"\n\n* No se permiten tildes",
                "Apellido Paterno\n\nMáximo 30 caracteres; sólo se permite letras, vocales y \"Ñ\"\n\n* No se permiten tildes",
                "Apellido Materno\n\nMáximo 30 caracteres; sólo se permite letras, vocales y \"Ñ\"\n\n*Obligatorio para DNI\n**Opcional para otros Tipos de Documento\n*** No se permiten tildes",
                "Fecha de Nacimiento\n\nTipo Fecha en formato DD/MM/AAAA",
                "Nacionalidad\n\nMáximo 30 caracteres; sólo se permite letras, vocales y \"Ñ\"\n\n*Opcional para DNI\n**Obligatorio para otros Tipos de Documento\n*** No se permiten tildes",
                "Sexo\n\nSólo se permite M: Masculino,F: Femenino",
                "Importe Sueldo\n\nSolo se permite dígitos y 2 decimales (sin formato de moneda)",
                "Nivel de Riesgo\n\n*Obligatorio para contratos emitidos con más de 1 riesgo"
            ];

            const headerRow = worksheet.addRow(headers);
            headerRow.height = 160; 
            
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF000000' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            });

            rows.forEach((r) => {
                const row = worksheet.addRow({
                    tipo_doc: r.tipo_doc,
                    num_doc: r.num_doc,
                    nombres: r.nombres,
                    ape_paterno: r.ape_paterno,
                    ape_materno: r.ape_materno,
                    fec_nac: r.fec_nac,
                    nacionalidad: r.nacionalidad,
                    sexo: r.sexo,
                    sueldo: parseFloat(r.sueldo).toFixed(2), 
                    nivel_riesgo: r.nivel_riesgo
                });

                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.font = { name: 'Arial', size: 9 };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            saveAs(blob, `Trama_SCTR_FEBRERO_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
            
            toast.success("Excel generado con formato oficial");

        } catch (e:any) {
            console.error(e)
            toast.error("Error al exportar: " + e.message)
        } finally {
            setExporting(false)
        }
    }

    const handleEnviarOutlook = () => {
        handleExportExcel();

        const destinatario = "emision@atlanticcorredores.com";
        const fecha = new Date().toLocaleDateString('es-PE');
        const asunto = `Envío de Trama SCTR - ${fecha}`;
        const cuerpo = `Estimados,\n\nAdjunto sírvanse encontrar la trama SCTR actualizada.\n\nAtentamente,\nAdministración RUAG`;

        const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

        setTimeout(() => {
            window.location.href = mailtoLink;
            toast.info("Outlook abierto. No olvides adjuntar el Excel descargado.", { duration: 5000, icon: '📧' });
        }, 1000);
    }

    const filteredRows = rows.filter(r => 
        (r.nombres + r.ape_paterno + r.num_doc).toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-600" size={40}/></div>

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
            
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {onBack && (
                        <button onClick={onBack} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all text-slate-500">
                            <ArrowLeft size={20}/>
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-amber-600" size={28}/> 
                            Trama SCTR (Editable)
                        </h2>
                        <p className="text-xs text-slate-500 font-medium ml-1">Edita los datos aquí antes de exportar el Excel.</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">

                    {/* BOTÓN MASIVO CONDICIONAL */}
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handleRemoveMultipleClick}
                            className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors mr-2 border border-red-200"
                            title="Regresar seleccionados al Dashboard"
                        >
                            <Trash2 size={16}/> 
                            Quitar Seleccionados ({selectedIds.size})
                        </button>
                    )}

                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Buscar trabajador..." 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleExportExcel} 
                        disabled={exporting || rows.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 active:scale-95"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>}
                        <span className="hidden sm:inline">Exportar Excel</span>
                    </button>

                    <button 
                        onClick={handleEnviarOutlook}
                        disabled={exporting || rows.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-[#0078D4] hover:bg-[#005a9e] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 border border-white/10 disabled:opacity-50"
                        title="Descargar y enviar por Outlook"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <span className="hidden xl:inline">Enviar a Atlantic</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50/50 p-1">
                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <div className="p-6 bg-slate-100 rounded-full"><Users size={48} className="opacity-20"/></div>
                        <p className="font-medium">No hay trabajadores en la bandeja de SCTR.</p>
                        <p className="text-xs text-slate-400 max-w-xs text-center">Ve al Dashboard y usa el botón "A SCTR" para agregar personal aquí.</p>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white min-w-[1200px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-3 py-4 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="cursor-pointer"
                                            checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-3 py-4 w-12 text-center">#</th>
                                    <th className="px-3 py-4 min-w-[80px]">Tipo Doc</th>
                                    <th className="px-3 py-4 min-w-[100px]">Núm Doc</th>
                                    <th className="px-3 py-4 min-w-[150px]">Nombres</th>
                                    <th className="px-3 py-4 min-w-[120px]">Ape Paterno</th>
                                    <th className="px-3 py-4 min-w-[120px]">Ape Materno</th>
                                    <th className="px-3 py-4 min-w-[100px]">F. Nacim</th>
                                    <th className="px-3 py-4 min-w-[100px]">Nacionalidad</th>
                                    <th className="px-3 py-4 w-20">Sexo</th>
                                    <th className="px-3 py-4 min-w-[100px]">Sueldo (S/)</th>
                                    <th className="px-3 py-4 text-center w-16">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.map((r, index) => (
                                    <tr key={r.id} className={`hover:bg-amber-50/30 transition-colors group ${selectedIds.has(r.id) ? 'bg-amber-50/20' : ''}`}>
                                        
                                        <td className="px-3 py-2 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="cursor-pointer"
                                                checked={selectedIds.has(r.id)}
                                                onChange={(e) => handleSelectOne(r.id, e.target.checked)}
                                            />
                                        </td>

                                        <td className="px-3 py-2 text-center text-slate-400 text-xs font-mono">{index + 1}</td>
                                        
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.tipo_doc} 
                                                onChange={(e) => handleCellChange(r.id, 'tipo_doc', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium outline-none transition-all text-center"
                                            />
                                        </td>
                                        
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.num_doc} 
                                                onChange={(e) => handleCellChange(r.id, 'num_doc', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.nombres} 
                                                onChange={(e) => handleCellChange(r.id, 'nombres', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.ape_paterno} 
                                                onChange={(e) => handleCellChange(r.id, 'ape_paterno', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.ape_materno} 
                                                onChange={(e) => handleCellChange(r.id, 'ape_materno', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.fec_nac} 
                                                onChange={(e) => handleCellChange(r.id, 'fec_nac', e.target.value)}
                                                placeholder="DD/MM/AAAA"
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs text-center outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.nacionalidad} 
                                                onChange={(e) => handleCellChange(r.id, 'nacionalidad', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs text-center uppercase outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-2 py-1">
                                            <select 
                                                value={r.sexo} 
                                                onChange={(e) => handleCellChange(r.id, 'sexo', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-1 py-1.5 text-xs text-center outline-none cursor-pointer"
                                            >
                                                <option value="M">M</option>
                                                <option value="F">F</option>
                                            </select>
                                        </td>

                                        <td className="px-2 py-1">
                                            <input 
                                                type="number" value={r.sueldo} 
                                                onChange={(e) => handleCellChange(r.id, 'sueldo', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-mono font-bold text-right outline-none transition-all"
                                            />
                                        </td>

                                        <td className="px-3 py-2 text-center">
                                            <button 
                                                onClick={() => handleRemoveFromSctrClick(r.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Quitar de SCTR (Volver a Dashboard)"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <AlertCircle size={14} className="text-amber-500"/>
                   <span>Los cambios realizados aquí son <b>temporales para la exportación</b> y no afectan la ficha original del trabajador.</span>
                </div>
                <div className="font-mono font-bold">
                    Total: {filteredRows.length}
                </div>
            </div>

            {/* --- COMPONENTES DE ALERTA MODERNA (AÑADIDO) --- */}
            {/* Diálogo para confirmación individual */}
            <ModernConfirmDialog 
                isOpen={confirmSingleId !== null}
                onClose={() => setConfirmSingleId(null)}
                onConfirm={confirmSingleAction}
                title="¿Quitar trabajador?"
                description="¿Estás seguro de quitar este trabajador de la lista SCTR? Volverá a aparecer en el Dashboard principal."
            />

            {/* Diálogo para confirmación masiva */}
            <ModernConfirmDialog 
                isOpen={confirmMultipleOpen}
                onClose={() => setConfirmMultipleOpen(false)}
                onConfirm={confirmMultipleAction}
                title={`¿Quitar ${selectedIds.size} trabajadores?`}
                description={`¿Estás seguro de quitar los ${selectedIds.size} trabajadores seleccionados de la lista SCTR? Volverán a aparecer en el Dashboard principal.`}
            />
            {/* ------------------------------------------------ */}
        </div>
    )
}