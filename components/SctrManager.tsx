'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
// CAMBIO: Usamos ExcelJS para estilos avanzados (Colores, Bordes, WrapText)
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { 
    Loader2, FileSpreadsheet, Search, ArrowLeft, 
    ShieldCheck, AlertCircle, Users, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function SctrManager({ onBack }: { onBack?: () => void }) {
    const supabase = createClient()
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [search, setSearch] = useState('')

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
        }
        setLoading(false)
    }

    useEffect(() => { fetchSctrWorkers() }, [])

    const handleCellChange = (id: string, field: string, value: string) => {
        setRows(prev => prev.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    const handleRemoveFromSctr = async (id: string) => {
        if(!confirm("¿Quitar de la lista SCTR? Volverá al Dashboard.")) return;
        const { error } = await supabase.from('fichas').update({ in_sctr: false }).eq('id', id)
        if(error) toast.error("Error")
        else {
            toast.success("Trabajador removido de SCTR")
            setRows(prev => prev.filter(w => w.id !== id))
        }
    }

    // --- FUNCIÓN DE EXPORTACIÓN AVANZADA (DISEÑO EXACTO) ---
    const handleExportExcel = async () => {
        setExporting(true)
        try {
            // 1. Crear Workbook y Hoja
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Hoja1');

            // 2. Definir Columnas y Anchos
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

            // 3. Definir los Encabezados Largos (Con saltos de línea)
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

            // 4. Agregar Fila de Encabezados
            const headerRow = worksheet.addRow(headers);
            
            // 5. ESTILAR ENCABEZADOS (Aquí está la magia del diseño)
            headerRow.height = 160; // Altura grande para que entre el texto
            
            headerRow.eachCell((cell) => {
                // Color de Fondo Amarillo (FFD966 es similar al Excel estándar)
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFD966' } 
                };
                // Borde Negro Fino
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                // Fuente Negrita
                cell.font = {
                    name: 'Arial',
                    size: 8, // Letra pequeña como en la trama
                    bold: true,
                    color: { argb: 'FF000000' }
                };
                // Alineación: Centrado y Ajuste de Texto (Wrap)
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
            });

            // 6. Agregar Datos de Filas
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
                    sueldo: parseFloat(r.sueldo).toFixed(2), // Formato 0.00
                    nivel_riesgo: r.nivel_riesgo
                });

                // Estilar celdas de datos (Bordes y Fuente)
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.font = { name: 'Arial', size: 9 };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
            });

            // 7. Generar Buffer y Descargar
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
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 active:scale-95"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>}
                        <span className="hidden sm:inline">Exportar Excel</span>
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
                                    <tr key={r.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="px-3 py-2 text-center text-slate-400 text-xs font-mono">{index + 1}</td>
                                        
                                        {/* TIPO DOC */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.tipo_doc} 
                                                onChange={(e) => handleCellChange(r.id, 'tipo_doc', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium outline-none transition-all text-center"
                                            />
                                        </td>
                                        
                                        {/* NUM DOC */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.num_doc} 
                                                onChange={(e) => handleCellChange(r.id, 'num_doc', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        {/* NOMBRES */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.nombres} 
                                                onChange={(e) => handleCellChange(r.id, 'nombres', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        {/* PATERNO */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.ape_paterno} 
                                                onChange={(e) => handleCellChange(r.id, 'ape_paterno', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        {/* MATERNO */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.ape_materno} 
                                                onChange={(e) => handleCellChange(r.id, 'ape_materno', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-medium uppercase text-slate-700 outline-none transition-all"
                                            />
                                        </td>

                                        {/* FECHA NAC */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.fec_nac} 
                                                onChange={(e) => handleCellChange(r.id, 'fec_nac', e.target.value)}
                                                placeholder="DD/MM/AAAA"
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs text-center outline-none transition-all"
                                            />
                                        </td>

                                        {/* NACIONALIDAD */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="text" value={r.nacionalidad} 
                                                onChange={(e) => handleCellChange(r.id, 'nacionalidad', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs text-center uppercase outline-none transition-all"
                                            />
                                        </td>

                                        {/* SEXO */}
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

                                        {/* SUELDO */}
                                        <td className="px-2 py-1">
                                            <input 
                                                type="number" value={r.sueldo} 
                                                onChange={(e) => handleCellChange(r.id, 'sueldo', e.target.value)}
                                                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-amber-400 focus:bg-white rounded px-2 py-1.5 text-xs font-mono font-bold text-right outline-none transition-all"
                                            />
                                        </td>

                                        {/* ACCIONES */}
                                        <td className="px-3 py-2 text-center">
                                            <button 
                                                onClick={() => handleRemoveFromSctr(r.id)}
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

            {/* Footer Informativo */}
            <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <AlertCircle size={14} className="text-amber-500"/>
                   <span>Los cambios realizados aquí son <b>temporales para la exportación</b> y no afectan la ficha original del trabajador.</span>
                </div>
                <div className="font-mono font-bold">
                   Total: {filteredRows.length}
                </div>
            </div>
        </div>
    )
}