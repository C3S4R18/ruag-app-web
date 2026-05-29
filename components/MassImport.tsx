'use client'

import { useEffect, useRef, useState } from 'react'
import { UploadCloud, FileText, CheckCircle, Loader2, Play, Server, Database, ShieldCheck, X, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'progress'
type LogLine = { id: number; ts: string; level: LogLevel; text: string }
type Failure = { dni: string; nombre: string; razon: string }

export default function MassImport({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<{ ide: File | null, tra: File | null, ssa: File | null, dir: File | null }>({
    ide: null, tra: null, ssa: null, dir: null
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [stats, setStats] = useState({ total: 0, processed: 0, created: 0, updated: 0, errors: 0 })
  const [failures, setFailures] = useState<Failure[]>([])
  const [activeFileKey, setActiveFileKey] = useState<keyof typeof files | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)

  const logIdRef = useRef(0)
  const terminalRef = useRef<HTMLDivElement>(null)

  const addLog = (text: string, level: LogLevel = 'info') => {
    const ts = new Date().toLocaleTimeString('es-PE', { hour12: false })
    setLogs(prev => [...prev, { id: ++logIdRef.current, ts, level, text }])
  }

  // Auto-scroll del terminal al fondo cuando llegan logs nuevos.
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs.length])

  const playUploadSound = () => {
    const audio = new Audio('/upload_success.mp3')
    audio.play().catch(() => {})
  }

  const readFile = (file: File): Promise<string[]> => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      resolve(text.split(/\r\n|\n/).filter(line => line.trim().length > 10))
    }
    reader.readAsText(file, 'ISO-8859-1')
  })

  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim().length < 8) return null
    const parts = dateStr.trim().split('/')
    if (parts.length !== 3) return null
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }

  const reset = () => {
    setLogs([])
    setStats({ total: 0, processed: 0, created: 0, updated: 0, errors: 0 })
    setFailures([])
    setProgress(0)
    setStartedAt(null)
    setFinishedAt(null)
  }

  const handleProcess = async () => {
    if (!files.ide && !files.dir) {
      toast.error('Falta el archivo .IDE o .DIR para identificar a los trabajadores')
      return
    }

    playUploadSound()
    setProcessing(true)
    reset()
    setStartedAt(Date.now())
    addLog('Iniciando procesamiento…', 'info')

    try {
      const empleados = new Map<string, any>()

      // 1) IDE
      if (files.ide) {
        setActiveFileKey('ide')
        addLog('IDE · Identidades → leyendo archivo…', 'info')
        const linesIDE = await readFile(files.ide)
        addLog(`IDE · ${linesIDE.length} filas detectadas`, 'info')
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
            const emailReal = col.find(c => c.includes('@') && c.includes('.'))
            if (emailReal) emp.correo_contacto = emailReal.trim().toLowerCase()
            const civil = col.find(c => ['SOLTERO', 'CASADO', 'CONVIVIENTE', 'VIUDO', 'DIVORCIADO'].includes(c.trim().toUpperCase()))
            if (civil) emp.estado_civil = civil.trim()
            empleados.set(dni, emp)
          }
        })
        addLog(`IDE · ${empleados.size} trabajadores únicos identificados`, 'success')
      }

      // 2) DIR
      if (files.dir) {
        setActiveFileKey('dir')
        addLog('DIR · Direcciones → procesando…', 'info')
        const linesDIR = await readFile(files.dir)
        let dirHits = 0
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
                origen: 'DIR',
              }
              empleados.set(dni, emp)
            }
            const direccionCasa = col.find(c =>
              c.length > 5 &&
              !c.includes('-') &&
              (c.includes('AV.') || c.includes('JR.') || c.includes('CALLE') || c.includes('PSJ') || c.includes('URB') || c.includes('MZ') || c.includes('LT') || c.includes('BLOCK') || c.includes('INTERIOR') || c.includes('ASOC') || c.includes('COOP'))
            )
            if (direccionCasa) { emp.direccion = direccionCasa.trim(); dirHits++ }
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
        addLog(`DIR · ${dirHits} direcciones aplicadas`, 'success')
      }

      // 3) TRA
      if (files.tra) {
        setActiveFileKey('tra')
        addLog('TRA · Datos laborales → procesando…', 'info')
        const linesTRA = await readFile(files.tra)
        let traHits = 0
        linesTRA.forEach(line => {
          const col = line.split('|')
          const dni = col.find(c => empleados.has(c.trim()))?.trim()
          if (dni) {
            const emp = empleados.get(dni)
            const fecha = col.find(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c.trim()))
            if (fecha) emp.fecha_ingreso = parseDate(fecha)
            if (col[9] && col[9].length > 3) emp.cargo = col[9].trim()
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
            traHits++
          }
        })
        addLog(`TRA · ${traHits} registros laborales`, 'success')
      }

      // 4) SSA
      if (files.ssa) {
        setActiveFileKey('ssa')
        addLog('SSA · Datos de salud → procesando…', 'info')
        const linesSSA = await readFile(files.ssa)
        let ssaHits = 0
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
            ssaHits++
          }
        })
        addLog(`SSA · ${ssaHits} registros de salud`, 'success')
      }

      setActiveFileKey(null)

      const allEmployees = Array.from(empleados.values())
      const total = allEmployees.length
      const BATCH_SIZE = 10
      setStats(s => ({ ...s, total }))
      addLog(`Enviando ${total} registros al servidor en lotes de ${BATCH_SIZE}…`, 'info')

      let created = 0, updated = 0, errors = 0, processed = 0
      const allFailures: Failure[] = []

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = allEmployees.slice(i, i + BATCH_SIZE)
        try {
          const response = await fetch('/api/import-masivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees: batch }),
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error)
          created += result.success
          updated += (result.updated || 0)
          errors += result.errors
          if (Array.isArray(result.failures)) allFailures.push(...result.failures)
        } catch (err: any) {
          errors += batch.length
          addLog(`Lote ${i / BATCH_SIZE + 1}: ${err.message}`, 'error')
        }
        processed = Math.min(i + batch.length, total)
        const percent = Math.round((processed / total) * 100)
        setProgress(percent)
        setStats({ total, processed, created, updated, errors })
        if ((i / BATCH_SIZE) % 3 === 0 || processed === total) {
          addLog(`Lote ${i / BATCH_SIZE + 1}/${Math.ceil(total / BATCH_SIZE)} → ${processed}/${total} (${percent}%)`, 'progress')
        }
      }

      setProgress(100)
      setFailures(allFailures)
      setFinishedAt(Date.now())

      addLog('Proceso finalizado.', 'success')
      addLog(`Nuevos: ${created} · Actualizados: ${updated} · Errores: ${errors}`, 'success')
      if (allFailures.length > 0) {
        addLog(`${allFailures.length} trabajador(es) con error — revisa la lista de abajo.`, 'warn')
      }
      toast.success(`Carga completada · ${created + updated} registros`)

      // No cerramos el modal solo; el usuario revisa el resumen y cierra cuando quiere.
    } catch (error: any) {
      addLog(`ERROR CRÍTICO: ${error.message}`, 'error')
      toast.error('Error en el proceso')
      setProgress(0)
    } finally {
      setProcessing(false)
    }
  }

  const filesReady = Object.values(files).filter(Boolean).length
  const elapsed = startedAt ? Math.floor(((finishedAt ?? Date.now()) - startedAt) / 1000) : 0

  return (
    <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
      {/* HEADER */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Database size={18}/>
            </span>
            Importador T-REGISTRO
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">Carga los 4 archivos planos de SUNAT. Las direcciones de obra se ignoran.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold border border-emerald-200">
          <ShieldCheck size={12}/> Autocompletado activo
        </span>
      </div>

      {/* SLOTS DE ARCHIVO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <FileSlot label="IDE" sub="Identidad" file={files.ide} set={(f:any) => setFiles({...files, ide: f})} color="blue" active={activeFileKey === 'ide'} disabled={processing}/>
        <FileSlot label="TRA" sub="Laboral" file={files.tra} set={(f:any) => setFiles({...files, tra: f})} color="indigo" active={activeFileKey === 'tra'} disabled={processing}/>
        <FileSlot label="SSA" sub="Salud" file={files.ssa} set={(f:any) => setFiles({...files, ssa: f})} color="emerald" active={activeFileKey === 'ssa'} disabled={processing}/>
        <FileSlot label="DIR" sub="Direcciones" file={files.dir} set={(f:any) => setFiles({...files, dir: f})} color="orange" active={activeFileKey === 'dir'} disabled={processing}/>
      </div>

      {/* STATS LIVE */}
      <AnimatePresence>
        {(processing || stats.total > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatCard icon={<TrendingUp size={14}/>} label="Procesados" value={stats.processed} total={stats.total} accent="slate" pulse={processing}/>
              <StatCard label="Nuevos" value={stats.created} accent="emerald" pulse={processing && stats.created > 0}/>
              <StatCard label="Actualizados" value={stats.updated} accent="blue" pulse={processing && stats.updated > 0}/>
              <StatCard label="Errores" value={stats.errors} accent="rose" pulse={processing && stats.errors > 0}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TERMINAL */}
      <div className="bg-[#0b1220] rounded-2xl overflow-hidden mb-5 shadow-inner border border-slate-800">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"/>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"/>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"/>
            </div>
            <Server size={13} className="text-slate-500 ml-2"/>
            <span className="text-[11px] font-mono text-slate-400 tracking-wide">terminal · carga masiva</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
            {startedAt && (
              <span className="tabular-nums">⏱ {elapsed}s</span>
            )}
            {processing && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                en vivo
              </span>
            )}
          </div>
        </div>
        <div
          ref={terminalRef}
          className="px-4 py-3 h-56 sm:h-64 overflow-y-auto font-mono text-[12px] leading-relaxed scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <Server size={28} className="mb-2 opacity-40"/>
              <p className="text-[11px]">Esperando inicio del proceso…</p>
            </div>
          ) : (
            logs.map(line => <TerminalLine key={line.id} line={line}/>)
          )}
        </div>
        {/* Barra de progreso integrada */}
        <div className="h-1.5 bg-slate-800 w-full overflow-hidden border-t border-slate-800 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ backgroundSize: '200% 100%' }}
          />
          {processing && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-5rem', '100vw'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      </div>

      {/* RESUMEN DE FALLAS */}
      <AnimatePresence>
        {failures.length > 0 && !processing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-rose-200/70 bg-rose-100/50">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertCircle size={16}/> {failures.length} trabajador(es) con error
                </div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Requieren revisión</span>
              </div>
              <div className="max-h-44 overflow-y-auto p-2 space-y-1.5">
                {failures.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-rose-100">
                    <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shrink-0">{f.dni}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-slate-800 truncate">{f.nombre}</p>
                      <p className="text-[11px] text-rose-600 truncate">{f.razon}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTONES */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {finishedAt && !processing ? (
          <>
            <button
              onClick={() => { reset(); setFiles({ ide: null, tra: null, ssa: null, dir: null }) }}
              className="flex-1 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16}/> Nueva carga
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-4 rounded-2xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle size={16}/> Ver tabla actualizada
            </button>
          </>
        ) : (
          <button
            onClick={handleProcess}
            disabled={processing || filesReady === 0}
            className={`w-full py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 text-white transition-all text-sm shadow-lg ${
              processing
                ? 'bg-slate-700 cursor-wait shadow-slate-500/20'
                : filesReady === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30 active:scale-[0.99]'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={18}/>
                Procesando {progress}%…
              </>
            ) : (
              <>
                <Play fill="currentColor" size={16}/>
                {filesReady === 0 ? 'Carga al menos un archivo' : `Iniciar carga masiva · ${filesReady}/4 archivos`}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── COMPONENTES AUXILIARES ────────────────────────────────────── */

function StatCard({ label, value, total, icon, accent, pulse }: { label: string; value: number; total?: number; icon?: React.ReactNode; accent: 'slate' | 'emerald' | 'blue' | 'rose'; pulse?: boolean }) {
  const styles = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', accent: 'text-slate-500', border: 'border-slate-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'text-blue-600', border: 'border-blue-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', accent: 'text-rose-600', border: 'border-rose-200' },
  }[accent]
  return (
    <div className={`relative rounded-xl ${styles.bg} ${styles.border} border p-3 overflow-hidden`}>
      {pulse && (
        <motion.span
          aria-hidden
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${accent === 'rose' ? 'bg-rose-500' : accent === 'emerald' ? 'bg-emerald-500' : accent === 'blue' ? 'bg-blue-500' : 'bg-slate-500'}`}
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className={styles.accent}>{icon}</span>}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.accent}`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-xl font-black ${styles.text} tabular-nums`}
        >
          {value}
        </motion.span>
        {typeof total === 'number' && total > 0 && (
          <span className={`text-[11px] font-bold ${styles.accent}`}>/ {total}</span>
        )}
      </div>
    </div>
  )
}

function TerminalLine({ line }: { line: LogLine }) {
  const colors: Record<LogLevel, { text: string; bullet: string; symbol: string }> = {
    info: { text: 'text-slate-200', bullet: 'bg-slate-500', symbol: '›' },
    success: { text: 'text-emerald-400', bullet: 'bg-emerald-500', symbol: '✓' },
    warn: { text: 'text-amber-400', bullet: 'bg-amber-500', symbol: '!' },
    error: { text: 'text-rose-400', bullet: 'bg-rose-500', symbol: '✗' },
    progress: { text: 'text-blue-300', bullet: 'bg-blue-500', symbol: '→' },
  }
  const c = colors[line.level]
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-2 py-0.5"
    >
      <span className="text-slate-600 shrink-0 select-none">[{line.ts}]</span>
      <span className={`${c.text} shrink-0 font-bold w-3 text-center`}>{c.symbol}</span>
      <span className={c.text}>{line.text}</span>
    </motion.div>
  )
}

function FileSlot({ label, sub, file, set, color, active, disabled }: any) {
  const palette: Record<string, { ring: string; text: string; bg: string; border: string; glow: string }> = {
    blue: { ring: 'ring-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', glow: 'shadow-blue-200' },
    indigo: { ring: 'ring-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-300', glow: 'shadow-indigo-200' },
    emerald: { ring: 'ring-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', glow: 'shadow-emerald-200' },
    orange: { ring: 'ring-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', glow: 'shadow-orange-200' },
  }
  const colors = palette[color] || palette.blue

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={active ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      className={`relative border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center h-24 transition-all group overflow-hidden ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${
        active
          ? `${colors.bg} ${colors.border} ring-2 ${colors.ring} shadow-lg ${colors.glow}`
          : file
            ? `${colors.bg} ${colors.border} border-solid`
            : 'border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
      }`}
    >
      {!disabled && (
        <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && set(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"/>
      )}
      {file ? (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex flex-col items-center ${colors.text}`}>
          {active ? (
            <Loader2 size={22} className="mb-1 animate-spin"/>
          ) : (
            <CheckCircle size={22} className="mb-1"/>
          )}
          <span className="text-[10px] font-bold leading-tight">{label}</span>
          <span className="text-[9px] text-slate-500 truncate max-w-[110px] block">{file.name.split('_').slice(0, 2).join('_')}…</span>
        </motion.div>
      ) : (
        <>
          <UploadCloud size={20} className="text-slate-300 group-hover:text-slate-500 mb-1 transition-colors"/>
          <span className="text-xs font-bold text-slate-700">{label}</span>
          <span className="text-[10px] text-slate-400">{sub}</span>
        </>
      )}
    </motion.div>
  )
}
