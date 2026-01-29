'use client'

import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle, Loader2, Play, RefreshCw, Server, Database, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function MassImport({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<{ ide: File | null, tra: File | null, ssa: File | null }>({
    ide: null, tra: null, ssa: null
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev])

  const readFile = (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // Filtramos líneas cortas que suelen ser basura
        resolve(text.split(/\r\n|\n/).filter(line => line.trim().length > 15))
      }
      reader.readAsText(file, 'ISO-8859-1') 
    })
  }

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim().length < 8) return null
    const parts = dateStr.trim().split('/')
    if (parts.length !== 3) return null
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }

  const handleProcess = async () => {
    if (!files.ide) {
        toast.error("El archivo .IDE es obligatorio para identificar a los trabajadores")
        return
    }

    setProcessing(true)
    setProgress(0)
    setLogs([])
    addLog("🚀 Iniciando procesamiento seguro...")

    try {
        const linesIDE = await readFile(files.ide)
        const linesTRA = files.tra ? await readFile(files.tra) : []
        const linesSSA = files.ssa ? await readFile(files.ssa) : []
        
        const empleados = new Map<string, any>()

        // 1. ESCANEAR IDE (Base)
        addLog(`📂 IDE: Leyendo ${linesIDE.length} filas...`)
        linesIDE.forEach(line => {
            const col = line.split('|')
            // Buscar DNI (8-12 dígitos numéricos)
            const dniIndex = col.findIndex(c => /^\d{8,12}$/.test(c.trim()))
            
            if (dniIndex !== -1) { 
                const dni = col[dniIndex].trim()
                
                const emp: any = {
                    dni,
                    apellido_paterno: col[dniIndex + 1]?.trim(),
                    apellido_materno: col[dniIndex + 2]?.trim(),
                    nombres: col[dniIndex + 3]?.trim(),
                    fecha_nacimiento: parseDate(col[dniIndex + 4]),
                }

                // Celular
                const celular = col.find(c => /9\d{8}/.test(c.trim()))
                if (celular) emp.celular = celular.trim()

                // Estado Civil
                const civil = col.find(c => ['SOLTERO', 'CASADO', 'CONVIVIENTE', 'VIUDO', 'DIVORCIADO'].includes(c.trim().toUpperCase()))
                if (civil) emp.estado_civil = civil.trim()

                empleados.set(dni, emp)
            }
        })
        addLog(`✅ IDE Identificados: ${empleados.size} trabajadores.`)

        // 2. ESCANEAR TRA (Laboral)
        if (linesTRA.length > 0) {
            addLog(`👷 TRA: Cruzando datos...`)
            linesTRA.forEach(line => {
                const col = line.split('|')
                const dni = col.find(c => empleados.has(c.trim()))?.trim()
                
                if (dni) {
                    const emp = empleados.get(dni)
                    
                    // Fecha Ingreso
                    const fecha = col.find(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c.trim()))
                    if (fecha) emp.fecha_ingreso = parseDate(fecha)

                    // Cargo (Columna 9 aprox)
                    if (col[9] && col[9].length > 3) emp.cargo = col[9].trim()

                    // Obra / Dirección
                    const dirLarga = col.find(c => c.length > 20 && (c.includes('AV.') || c.includes('JR.') || c.includes('CALLE') || c.includes('URB')))
                    if (dirLarga) {
                        emp.direccion = dirLarga.trim()
                        emp.nombre_obra = "RUAG - OBRA CENTRAL"
                        // Intentar sacar ubicación del final
                        const partes = dirLarga.split(' ')
                        if (partes.length > 4) {
                            emp.departamento = partes[partes.length - 1]
                            emp.provincia = partes[partes.length - 2]
                            emp.distrito = partes[partes.length - 3]
                        }
                    }

                    // Bancos
                    const bancos = ['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'NACION']
                    const idxBanco = col.findIndex(c => bancos.some(b => c.toUpperCase().includes(b)))
                    if (idxBanco !== -1) {
                        emp.banco = col[idxBanco].trim()
                        // Cuenta suele ser el siguiente número largo
                        const posibleCta = col.slice(idxBanco + 1, idxBanco + 4).find(c => /^\d{10,20}$/.test(c.trim()))
                        if (posibleCta) {
                            const cta = posibleCta.trim()
                            emp.numero_cuenta = cta
                            if (cta.length >= 18) emp.cci = cta
                        }
                    }

                    empleados.set(dni, emp)
                }
            })
        }

        // 3. ESCANEAR SSA (Salud)
        if (linesSSA.length > 0) {
            linesSSA.forEach(line => {
                const col = line.split('|')
                const dni = col.find(c => empleados.has(c.trim()))?.trim()
                if (dni) {
                    const emp = empleados.get(dni)
                    // Buscar Pensión
                    const pension = col.find(c => c.includes('SPP') || c.includes('ONP') || c.includes('INTEGRA') || c.includes('PRIMA'))
                    if (pension) {
                        if (pension.includes('ONP')) emp.sistema_pension = 'ONP'
                        else {
                            emp.sistema_pension = 'AFP'
                            emp.afp_nombre = pension.replace('SPP', '').trim()
                        }
                    }
                    // CUSPP
                    const cuspp = col.find(c => /[0-9]+[a-zA-Z]+/.test(c.trim()) && c.trim().length < 15)
                    if (cuspp) emp.cuspp = cuspp.trim()
                    
                    empleados.set(dni, emp)
                }
            })
        }

        // --- ENVÍO POR LOTES PEQUEÑOS (BATCHING 5) ---
        const allEmployees = Array.from(empleados.values())
        const total = allEmployees.length
        const BATCH_SIZE = 5 // Reducido a 5 para evitar timeouts
        
        addLog(`📦 Iniciando carga de ${total} registros (Lotes de ${BATCH_SIZE})...`)
        
        let processed = 0
        let errors = 0

        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = allEmployees.slice(i, i + BATCH_SIZE)
            
            try {
                const response = await fetch('/api/import-masivo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employees: batch })
                })
                
                const result = await response.json()
                if (!response.ok) throw new Error(result.error)
                
                errors += result.errors
                processed += result.success
                
                // Progreso Real
                const percent = Math.round(((i + batch.length) / total) * 100)
                setProgress(percent)
                
                // Logs visuales cada cierto tiempo
                if (i % 20 === 0) addLog(`... Procesando registro ${i + 1} al ${Math.min(i + BATCH_SIZE, total)}`)

            } catch (err: any) {
                console.error(err)
                addLog(`⚠️ Error en lote ${i}: ${err.message}`)
                errors += batch.length
            }
        }

        setProgress(100)
        addLog(`✅ FINALIZADO. Éxito: ${processed}. Errores: ${errors}`)
        toast.success(`Importación finalizada. ${processed} registros actualizados.`)
        onComplete()

    } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`)
        toast.error("Error crítico")
        setProgress(0)
    } finally {
        setProcessing(false)
    }
  }

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Database className="text-blue-600"/> Importador Seguro (Lotes)</h3>
            <p className="text-xs text-slate-500 mt-1">Carga lenta pero segura para evitar bloqueos del servidor.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2"><ShieldCheck size={12}/> Safe Mode</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <FileSlot label="1. Archivo IDE" sub="Identidad" file={files.ide} set={(f:any) => setFiles({...files, ide: f})} color="blue" />
        <FileSlot label="2. Archivo TRA" sub="Laboral" file={files.tra} set={(f:any) => setFiles({...files, tra: f})} color="indigo" />
        <FileSlot label="3. Archivo SSA" sub="Salud" file={files.ssa} set={(f:any) => setFiles({...files, ssa: f})} color="emerald" />
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden mb-6 shadow-inner border border-slate-800">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700"><Server size={14} className="text-slate-400"/><span className="text-xs font-mono text-slate-300">Terminal</span></div>
          <div className="p-4 h-40 overflow-y-auto font-mono text-xs flex flex-col-reverse gap-1">
              {logs.map((l, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-blue-200"><span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>{l}</motion.div>)}
          </div>
          {processing && <div className="h-2 bg-slate-800 w-full overflow-hidden border-t border-slate-700"><motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div>}
      </div>

      <button onClick={handleProcess} disabled={processing} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-white transition-all shadow-lg ${processing ? 'bg-slate-400 cursor-wait' : 'bg-slate-900 hover:bg-slate-800'}`}>{processing ? <><Loader2 className="animate-spin"/> Importando ({progress}%)...</> : <><Play fill="currentColor"/> INICIAR CARGA SEGURA</>}</button>
    </div>
  )
}

function FileSlot({ label, sub, file, set, color }: any) {
    const colors: any = { blue: 'text-blue-600 border-blue-200 bg-blue-50', indigo: 'text-indigo-600 border-indigo-200 bg-indigo-50', emerald: 'text-emerald-600 border-emerald-200 bg-emerald-50' }
    return (
        <div className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center h-28 transition-all cursor-pointer group ${file ? colors[color].replace('dashed', 'solid bg-white') : 'border-slate-300 hover:bg-white'}`}>
            <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && set(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"/>
            {file ? <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center"><CheckCircle size={28} className="mb-1"/><span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span></motion.div> : <><FileText className="text-slate-300 group-hover:text-slate-500 mb-2" size={24}/><span className="text-xs font-bold text-slate-600">{label}</span><span className="text-[10px] text-slate-400">{sub}</span></>}
        </div>
    )
}