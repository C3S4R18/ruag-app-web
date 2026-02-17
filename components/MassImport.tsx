'use client'

import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle, Loader2, Play, Server, Database, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function MassImport({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<{ ide: File | null, tra: File | null, ssa: File | null, dir: File | null }>({
    ide: null, tra: null, ssa: null, dir: null
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev])

  // --- SONIDO AL TERMINAR ---
  const playUploadSound = () => {
    const audio = new Audio('/upload_success.mp3') 
    audio.play().catch(err => console.log("Audio bloqueado", err))
  }

  const readFile = (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // Dividir por líneas y filtrar vacías
        resolve(text.split(/\r\n|\n/).filter(line => line.trim().length > 10))
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
    // Al menos necesitamos IDE o DIR para saber quién es
    if (!files.ide && !files.dir) {
        toast.error("Falta el archivo .IDE o .DIR para identificar a los trabajadores")
        return
    }

    setProcessing(true)
    setProgress(0)
    setLogs([])
    addLog("🚀 Iniciando procesamiento...")

    try {
        const empleados = new Map<string, any>()

        // 1. ESCANEAR IDE (Identidad + CORREO REAL)
        if (files.ide) {
            const linesIDE = await readFile(files.ide)
            addLog(`📂 IDE: Analizando ${linesIDE.length} registros...`)
            linesIDE.forEach(line => {
                const col = line.split('|')
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
                    const celular = col.find(c => /9\d{8}/.test(c.trim()))
                    if (celular) emp.celular = celular.trim()

                    // --- AQUÍ CAPTURAMOS EL CORREO REAL ---
                    // En el T-Registro suele estar en la columna 9 (índice)
                    // Buscamos cualquier campo que tenga '@' y '.'
                    const emailReal = col.find(c => c.includes('@') && c.includes('.'))
                    if (emailReal) {
                        emp.correo_contacto = emailReal.trim().toLowerCase()
                    }
                    
                    const civil = col.find(c => ['SOLTERO', 'CASADO', 'CONVIVIENTE', 'VIUDO', 'DIVORCIADO'].includes(c.trim().toUpperCase()))
                    if (civil) emp.estado_civil = civil.trim()

                    empleados.set(dni, emp)
                }
            })
            addLog(`✅ IDE: Datos personales cargados.`)
        }

        // 2. ESCANEAR DIR (Direcciones de CASA - TODO)
        if (files.dir) {
            const linesDIR = await readFile(files.dir)
            addLog(`📍 DIR: Analizando domicilios...`)
            
            linesDIR.forEach(line => {
                const col = line.split('|')
                const dniRaw = col.find(c => /^\d{8,12}$/.test(c.trim()))
                
                if (dniRaw) {
                    const dni = dniRaw.trim()
                    let emp = empleados.get(dni)

                    if (!emp) {
                        const indexDni = col.indexOf(dniRaw)
                        emp = {
                            dni,
                            apellido_paterno: col[indexDni + 1]?.trim() || '',
                            apellido_materno: col[indexDni + 2]?.trim() || '',
                            nombres: col[indexDni + 3]?.trim() || 'Nuevo',
                        }
                        empleados.set(dni, emp)
                    }

                    // --- CAPTURAR DIRECCIÓN DE CASA ---
                    // Buscamos columnas que parezcan direcciones (AV, JR, CALLE, MZ, LT)
                    // Ignoramos la que tenga guiones '-' porque ese es el ubigeo
                    const direccionCasa = col.find(c => 
                        c.length > 5 && 
                        !c.includes('-') && 
                        (c.includes('AV.') || c.includes('JR.') || c.includes('CALLE') || c.includes('PSJ') || c.includes('URB') || c.includes('MZ') || c.includes('LT') || c.includes('BLOCK') || c.includes('INTERIOR') || c.includes('ASOC') || c.includes('COOP'))
                    )
                    
                    if (direccionCasa) {
                        emp.direccion = direccionCasa.trim()
                    }

                    // Ubigeo (DEPARTAMENTO-PROVINCIA-DISTRITO)
                    const ubicacion = col.find(c => c.includes('-') && c.split('-').length >= 3)
                    if (ubicacion) {
                        const partes = ubicacion.trim().split('-')
                        if (partes.length >= 3) {
                            emp.departamento = partes[0].trim()
                            emp.provincia = partes[1].trim()
                            emp.distrito = partes[2].trim()
                        }
                    }
                }
            })
        }

        // 3. ESCANEAR TRA (Laboral - SIN ESTABLECIMIENTO)
        if (files.tra) {
            const linesTRA = await readFile(files.tra)
            addLog(`👷 TRA: Analizando datos laborales...`)
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

                    // --- IMPORTANTE: IGNORAMOS ESTABLECIMIENTO ---
                    // No asignamos 'nombre_obra' desde aquí.
                    // El campo 'nombre_obra' se queda undefined/null para que la BD lo respete.

                    // Bancos y Cuentas
                    const bancos = ['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'NACION']
                    const idxBanco = col.findIndex(c => bancos.some(b => c.toUpperCase().includes(b)))
                    if (idxBanco !== -1) {
                        emp.banco = col[idxBanco].trim()
                        const posibleCta = col.slice(idxBanco + 1, idxBanco + 4).find(c => /^\d{10,20}$/.test(c.trim()))
                        if (posibleCta) {
                            const cta = posibleCta.trim()
                            emp.numero_cuenta = cta
                            if (cta.length >= 18) emp.cci = cta
                        }
                    }
                }
            })
        }

        // 4. ESCANEAR SSA (Salud - TODO)
        if (files.ssa) {
            const linesSSA = await readFile(files.ssa)
            addLog(`🏥 SSA: Analizando salud y pensiones...`)
            linesSSA.forEach(line => {
                const col = line.split('|')
                const dni = col.find(c => empleados.has(c.trim()))?.trim()
                if (dni) {
                    const emp = empleados.get(dni)
                    const pension = col.find(c => c.includes('SPP') || c.includes('ONP') || c.includes('INTEGRA') || c.includes('PRIMA') || c.includes('HABITAT') || c.includes('PROFUTURO'))
                    if (pension) {
                        if (pension.includes('ONP')) emp.sistema_pension = 'ONP'
                        else {
                            emp.sistema_pension = 'AFP'
                            emp.afp_nombre = pension.replace('SPP', '').trim()
                        }
                    }
                    const cuspp = col.find(c => /[0-9]+[a-zA-Z]+/.test(c.trim()) && c.trim().length < 15)
                    if (cuspp) emp.cuspp = cuspp.trim()
                }
            })
        }

        // --- ENVÍO AL SERVIDOR ---
        const allEmployees = Array.from(empleados.values())
        const total = allEmployees.length
        const BATCH_SIZE = 10
        
        addLog(`📦 Enviando ${total} registros al servidor...`)
        
        let processed = 0
        let errors = 0
        let updated = 0

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
                updated += (result.updated || 0)
                
                const percent = Math.round(((i + batch.length) / total) * 100)
                setProgress(percent)
                
                if (i % 50 === 0) addLog(`... Progreso: ${percent}%`)

            } catch (err: any) {
                console.error(err)
                addLog(`⚠️ Error lote ${i}: ${err.message}`)
                errors += batch.length
            }
        }

        setProgress(100)
        playUploadSound() 

        addLog(`✅ PROCESO FINALIZADO.`)
        addLog(`🆕 Nuevos: ${processed} | 🔄 Actualizados: ${updated} | ❌ Errores: ${errors}`)
        toast.success(`Carga completada con éxito.`)
        
        setTimeout(() => {
             onComplete()
        }, 4000)

    } catch (error: any) {
        addLog(`❌ ERROR CRÍTICO: ${error.message}`)
        toast.error("Error en el proceso")
        setProgress(0)
    } finally {
        setProcessing(false)
    }
  }

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Database className="text-blue-600"/> Importador T-REGISTRO</h3>
            <p className="text-xs text-slate-500 mt-1">Carga archivos planos de SUNAT. El sistema autocompletará datos faltantes sin duplicar.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2"><ShieldCheck size={12}/> Autocompletado Activo</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FileSlot label="1. IDE" sub="Identidad" file={files.ide} set={(f:any) => setFiles({...files, ide: f})} color="blue" />
        <FileSlot label="2. TRA" sub="Laboral" file={files.tra} set={(f:any) => setFiles({...files, tra: f})} color="indigo" />
        <FileSlot label="3. SSA" sub="Salud" file={files.ssa} set={(f:any) => setFiles({...files, ssa: f})} color="emerald" />
        <FileSlot label="4. DIR" sub="Direcciones" file={files.dir} set={(f:any) => setFiles({...files, dir: f})} color="orange" />
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden mb-6 shadow-inner border border-slate-800">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700"><Server size={14} className="text-slate-400"/><span className="text-xs font-mono text-slate-300">Terminal de Carga</span></div>
          <div className="p-4 h-40 overflow-y-auto font-mono text-xs flex flex-col-reverse gap-1">
              {logs.map((l, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-blue-200"><span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>{l}</motion.div>)}
          </div>
          {processing && <div className="h-2 bg-slate-800 w-full overflow-hidden border-t border-slate-700"><motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div>}
      </div>

      <button onClick={handleProcess} disabled={processing} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-white transition-all shadow-lg ${processing ? 'bg-slate-400 cursor-wait' : 'bg-slate-900 hover:bg-slate-800'}`}>{processing ? <><Loader2 className="animate-spin"/> Procesando ({progress}%)...</> : <><Play fill="currentColor"/> INICIAR CARGA MASIVA</>}</button>
    </div>
  )
}

function FileSlot({ label, sub, file, set, color }: any) {
    const colors: any = { 
        blue: 'text-blue-600 border-blue-200 bg-blue-50', 
        indigo: 'text-indigo-600 border-indigo-200 bg-indigo-50', 
        emerald: 'text-emerald-600 border-emerald-200 bg-emerald-50',
        orange: 'text-orange-600 border-orange-200 bg-orange-50'
    }
    return (
        <div className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center h-28 transition-all cursor-pointer group ${file ? colors[color].replace('dashed', 'solid bg-white') : 'border-slate-300 hover:bg-white'}`}>
            <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && set(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"/>
            {file ? <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center"><CheckCircle size={28} className="mb-1"/><span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span></motion.div> : <><FileText className="text-slate-300 group-hover:text-slate-500 mb-2" size={24}/><span className="text-xs font-bold text-slate-600">{label}</span><span className="text-[10px] text-slate-400">{sub}</span></>}
        </div>
    )
}