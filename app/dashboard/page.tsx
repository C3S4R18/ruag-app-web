'use client'

import FichaForm from '@/components/FichaForm'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Calendar, ShieldCheck, Bell, FileText, ChevronRight, Lock, CheckCircle, Save, X, Loader2, FileCheck, AlertCircle, Eye, Maximize2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- IMPORTS DE DOCUMENTOS VISUALES ---
import { CargoRisstPrintable } from '@/components/CargoRisstPrintable'
import { RegistroCapacitacionPrintable } from '@/components/RegistroCapacitacionPrintable'
import { EntregaEppPrintable } from '@/components/EntregaEppPrintable'
import { ActaEntregaIpercPrintable } from '@/components/ActaEntregaIpercPrintable'
import { InduccionHombreNuevoPrintable } from '@/components/InduccionHombreNuevoPrintable'
import { ActaDerechoSaberPrintable } from '@/components/ActaDerechoSaberPrintable'

// --- CONFIGURACIÓN DE CONTENIDO ---
const DOC_CONTENT: Record<string, string[]> = {
    risst: [], 
    capacitacion: [],
    epp: [],
    iperc: [],
    induccion: [
        "Política de Seguridad y Salud en el Trabajo.",
        "Organización del sistema de gestión de la seguridad y salud.",
        "Reglamento interno de Seguridad y Salud en el trabajo.",
        "Derecho y obligaciones de los trabajadores y supervisores.",
        "Conceptos básicos de la seguridad y salud en el trabajo.",
        "Reglas de Tránsito (de ser aplicables a la obra).",
        "Trabajos de alto riesgo.",
        "Código de Colores y Señalización.",
        "Control de sustancias peligrosas.",
        "Preparación y respuesta ante emergencias.",
        "Equipos de protección personal."
    ],
    acta_derecho: [
        "Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA",
        "Reglamento Interno de Seguridad.",
        "Políticas de Seguridad y Salud Ocupacional y Medio Ambiente.",
        "Organización del sistema de gestión de la seguridad y salud en el trabajo en la obra.",
        "Derechos y obligaciones de los/las trabajadores/as y supervisores/as.",
        "Conceptos básicos de seguridad y salud en el trabajo.",
        "Reglas de tránsito (de ser aplicable a la obra).",
        "Conceptos básicos de seguridad y salud en el trabajo.",
        "Plan de Seguridad y Salud Ocupacional, Plan de Prevención Ambiental",
        "Reconocimiento del área de trabajo.",
        "Elementos de protección personal, tipos requeridos, manejo correcto, Obligatoriedad y protecciones colectivas.",
        "Control de Emergencias, Incendios, Uso de Extintores, Primeros Auxilios, Atención de lesionados.",
        "Procedimiento Trabajo en Altura, Procedimientos de Trabajo Seguro, uso correcto de arnés de seguridad.",
        "Superficies de Trabajo; andamios, escaleras, plataformas, elevadores de personas, etc.",
        "Manejo de materiales; maniobras, trabajo con equipos de levante (Tirford, tecles, estrobos, etc.).",
        "Riesgos eléctricos, equipos energizados.",
        "Esmeril angular; uso seguro.",
        "Oxicorte; uso, riesgos y medidas preventivas.",
        "Cilindros de Gases Comprimidos; manejo, almacenamiento y transporte.",
        "Trabajos de soldadura.",
        "Excavaciones, Entibaciones, Fortificaciones y Taludes.",
        "Vaciado de Concreto.",
        "Housekeeping (Orden y Aseo).",
        "Código de colores y señalización.",
        "Exposición a Ruidos, polvo y vibraciones.",
        "Desplazamientos por áreas de trabajo.",
        "Higiene Personal, Recomendaciones.",
        "Control, Manejo, uso y transporte de sustancias peligrosas.",
        "Sistemas de bloqueos y uso de Tarjeta de Seguridad.",
        "Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.",
        "Combustibles; Manejo, Almacenamiento y Transporte.",
        "Cambio de conducta, Autocuidado, Reconocimiento, Sanciones, Contacto Personal.",
        "Prohibición de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.",
        "Identificación de Aspectos e Impactos Ambientales.",
        "Sobre Riesgos Ambientales, Manejo de residuos.",
        "Equipos Radioactivos.",
        "Preparación y respuesta ante emergencias.",
        "Trabajos de alto riesgo."
    ]
}

const DOC_LABELS: Record<string, string> = {
    risst: "Cargo RISST",
    capacitacion: "Registro Capacitación",
    induccion: "Inducción Hombre Nuevo",
    epp: "Entrega de EPPs",
    acta_derecho: "Acta Derecho a Saber",
    iperc: "Entrega IPERC"
}

interface NotificationItem {
    id: string;
    msg: string;
    time: string;
    read: boolean;
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [fichaId, setFichaId] = useState<string | null>(null)
  const [fullWorkerData, setFullWorkerData] = useState<any>(null)
  const [docStates, setDocStates] = useState<any>({})
  const [fichaStatus, setFichaStatus] = useState<string>('') 
  
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false)
  const [docToFill, setDocToFill] = useState<string | null>(null) 
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const docStatesRef = useRef(docStates)
  const fichaStatusRef = useRef(fichaStatus)
  const isInitialLoad = useRef(true)

  useEffect(() => { docStatesRef.current = docStates }, [docStates])
  useEffect(() => { fichaStatusRef.current = fichaStatus }, [fichaStatus])

  const playNotificationSound = () => {
      const audio = new Audio('/notification2.mp3')
      audio.play().catch(e => console.log("Audio bloqueado:", e))
  }

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('nombres').eq('id', user.id).single()
      if (profile) setUserName(profile.nombres.split(' ')[0])

      await fetchFichaData(user.id)
      isInitialLoad.current = false 
    }
    getUserData()

    const channel = supabase.channel('worker-docs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas' }, (payload: any) => {
            if (payload.new.user_id === userId) {
                if (isInitialLoad.current) return 

                const newData = payload.new
                setFullWorkerData(newData)
                const newDocs = newData.doc_states || {}
                const oldDocs = docStatesRef.current
                
                Object.keys(newDocs).forEach(key => {
                    const oldStatus = oldDocs[key]?.status
                    const newStatus = newDocs[key]?.status
                    const docName = DOC_LABELS[key] || key

                    if (newStatus === 'unlocked' && oldStatus !== 'unlocked') {
                        addNotification(`Se ha habilitado el documento: ${docName}`)
                        toast.info(`📝 Habilitado: ${docName}`)
                        playNotificationSound()
                    }
                    else if (newStatus === 'locked' && oldStatus === 'unlocked') {
                        addNotification(`El documento ha sido bloqueado: ${docName}`)
                        toast.warning(`🔒 Bloqueado: ${docName}`)
                    }
                })

                const newFichaState = newData.estado
                const oldFichaState = fichaStatusRef.current

                if (newFichaState === 'completado' && oldFichaState !== 'completado') {
                    addNotification("¡Tu ficha ha sido validada por SSOMA!")
                    toast.success("✅ Ficha Validada Correctamente")
                    playNotificationSound()
                }

                setDocStates(newDocs)
                setFichaStatus(newFichaState)
            }
        }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId]) 

  const fetchFichaData = async (uid: string) => {
      const { data } = await supabase.from('fichas').select('*').eq('user_id', uid).single()
      if (data) {
          setFichaId(data.id)
          setFullWorkerData(data)
          setDocStates(data.doc_states || {})
          setFichaStatus(data.estado || '')
      }
  }

  const addNotification = (msg: string) => {
      const newNotif: NotificationItem = {
          id: Date.now().toString(),
          msg,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          read: false
      }
      setNotifications(prev => [newNotif, ...prev])
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }
  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const unreadCount = notifications.filter(n => !n.read).length

  const docKeys = Object.keys(DOC_LABELS)
  const totalDocs = docKeys.length
  const completedDocs = docKeys.filter(key => docStates[key]?.status === 'completed').length
  const pendingDocs = docKeys.filter(key => docStates[key]?.status === 'unlocked').length
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 shadow-sm transition-all">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">R</div>
            <div className="leading-tight"><span className="font-bold text-lg tracking-tight text-slate-900 block">RUAG</span><span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Portal Obrero</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
                <button onClick={() => { setIsNotifOpen(!isNotifOpen); setNotifications(prev => prev.map(n => ({...n, read: true}))) }} className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-600 border border-transparent hover:border-slate-200">
                    <Bell size={20}/>{unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                </button>
                <AnimatePresence>{isNotifOpen && (<motion.div initial={{opacity:0, y: 10, scale: 0.95}} animate={{opacity:1, y: 0, scale: 1}} exit={{opacity:0, scale: 0.95}} className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"><div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notificaciones</span><button onClick={() => setNotifications([])} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">Borrar todo</button></div><div className="max-h-[300px] overflow-y-auto">{notifications.length === 0 ? (<div className="flex flex-col items-center justify-center py-8 text-slate-400"><Bell size={32} className="mb-2 opacity-20"/><p className="text-xs font-medium">Sin novedades</p></div>) : (notifications.map(n => (<div key={n.id} className="p-4 border-b border-slate-50 hover:bg-blue-50/50 transition-colors cursor-default"><p className="text-sm font-medium text-slate-800 leading-snug">{n.msg}</p><p className="text-[10px] text-slate-400 mt-1.5">{n.time}</p></div>)))}</div></motion.div>)}</AnimatePresence>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"><LogOut size={18} /> <span className="hidden sm:inline">Salir</span></button>
          </div>
        </div>
      </header>

      <div className="relative bg-white pt-8 pb-16 px-4 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-white pointer-events-none"/>
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div>
                  <div className="flex items-center gap-2 mb-2"><span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-200"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> ACTIVO</span><span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 flex items-center gap-1.5 capitalize"><Calendar size={12}/> {today}</span></div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Hola, {userName || 'Compañero'} 👋</h1>
                  <p className="text-slate-500 text-lg max-w-lg leading-relaxed">Bienvenido a tu espacio personal.</p>
              </div>
              <div className="w-full md:w-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90"><circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100" /><circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * progress) / 100} className="text-blue-600 transition-all duration-1000 ease-out" /></svg>
                        <span className="absolute text-xs font-bold text-blue-700">{progress}%</span>
                  </div>
                  <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Progreso</p><p className="text-sm font-bold text-slate-800">{completedDocs} de {totalDocs} Docs</p>{pendingDocs > 0 && <p className="text-xs text-amber-500 font-medium mt-0.5">{pendingDocs} pendientes</p>}</div>
              </div>
          </div>
          <button onClick={() => setIsDocDrawerOpen(true)} className="w-full md:w-auto bg-slate-900 text-white pl-6 pr-8 py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center md:justify-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors"><FileText size={20}/></div>
              <div className="text-left"><div className="text-sm font-bold">Gestionar Documentos</div><div className="text-xs text-slate-400 font-normal">Revisar y firmar pendientes</div></div>
              <ChevronRight className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24 -mt-6 max-w-5xl relative z-20"><FichaForm /></div>

      <AnimatePresence>
        {isDocDrawerOpen && (
            <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsDocDrawerOpen(false)} className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm"/>
                <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring', damping: 25, stiffness: 200}} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col border-l border-slate-100">
                    <div className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                        <div><h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">Documentación</h2><p className="text-xs text-slate-500">SSOMA - Seguridad y Salud</p></div>
                        <button onClick={() => setIsDocDrawerOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {pendingDocs > 0 ? (<div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 mb-2"><AlertCircle className="text-blue-600 shrink-0" size={20}/><div><p className="text-sm font-bold text-blue-800">Tienes {pendingDocs} documentos pendientes</p><p className="text-xs text-blue-600 mt-1">Por favor, revísalos y fírmalos para continuar.</p></div></div>) : (<div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 mb-2"><CheckCircle className="text-emerald-600 shrink-0" size={20}/><div><p className="text-sm font-bold text-emerald-800">¡Todo al día!</p><p className="text-xs text-emerald-600 mt-1">No tienes documentos pendientes de firma.</p></div></div>)}
                        {Object.entries(DOC_LABELS).map(([docId, label]) => {
                            const state = docStates[docId] || {}
                            const isUnlocked = state.status === 'unlocked'; const isCompleted = state.status === 'completed'; const isLocked = !isUnlocked && !isCompleted
                            return (
                                <motion.div layout key={docId} onClick={() => { if (isUnlocked) setDocToFill(docId); else if (isLocked) toast.error("Este documento aún no ha sido habilitado.") }} className={`relative p-4 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${isUnlocked ? 'bg-white border-blue-200 shadow-lg shadow-blue-100/50 hover:border-blue-400 hover:-translate-y-1' : isCompleted ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' : 'bg-white border-slate-200 opacity-60 grayscale hover:opacity-80'}`}>
                                    {isUnlocked && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"/>}{isCompleted && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"/>}
                                    <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{isCompleted ? <CheckCircle size={20}/> : <FileText size={20}/>}</div><div><h4 className={`font-bold text-sm ${isUnlocked ? 'text-blue-900' : 'text-slate-700'}`}>{label}</h4><p className="text-[10px] font-bold mt-0.5 flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isUnlocked ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span><span style={{color: isCompleted ? '#059669' : isUnlocked ? '#2563EB' : '#94A3B8'}}>{isCompleted ? 'FIRMADO Y ENVIADO' : isUnlocked ? 'DISPONIBLE PARA FIRMA' : 'BLOQUEADO'}</span></p></div></div><div className="text-slate-300 group-hover:text-blue-500 transition-colors">{isLocked ? <Lock size={18}/> : <ChevronRight size={20}/>}</div></div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {docToFill && (
            <DocumentFillingModal 
                docId={docToFill}
                fichaId={fichaId}
                existingData={docStates[docToFill]?.data || {}}
                fullFichaData={fullWorkerData}
                onClose={() => setDocToFill(null)}
                onSave={() => { fetchFichaData(userId); setDocToFill(null) }}
            />
        )}
      </AnimatePresence>
    </div>
  )
}

function DocumentFillingModal({ docId, fichaId, existingData, fullFichaData, onClose, onSave }: any) {
    const supabase = createClient()
    const [checks, setChecks] = useState<Record<string, boolean>>(existingData || {})
    const [saving, setSaving] = useState(false)
    const content = DOC_CONTENT[docId] || [] 
    
    // Detectamos si es horizontal para ajustar el ancho del modal
    const isHorizontal = ['capacitacion', 'epp'].includes(docId)
    const showChecklist = content.length > 0

    // Escala dinámica para que quepa en pantalla
    const [scale, setScale] = useState(1)
    
    useEffect(() => {
        if (!showChecklist) {
            // Ajustar escala al cargar
            const updateScale = () => {
                const width = window.innerWidth
                if (width < 640) setScale(0.45) // Móvil
                else if (width < 1024) setScale(0.65) // Tablet
                else setScale(0.85) // Desktop
            }
            updateScale()
            window.addEventListener('resize', updateScale)
            return () => window.removeEventListener('resize', updateScale)
        }
    }, [showChecklist])

    const renderPrintablePreview = () => {
        const props = { ficha: fullFichaData, ref: null as any }
        switch (docId) {
            case 'risst': return <CargoRisstPrintable {...props} />
            case 'capacitacion': return <RegistroCapacitacionPrintable {...props} />
            case 'epp': return <EntregaEppPrintable {...props} />
            case 'iperc': return <ActaEntregaIpercPrintable {...props} />
            case 'induccion': return <InduccionHombreNuevoPrintable {...props} /> 
            case 'acta_derecho': return <ActaDerechoSaberPrintable {...props} />
            default: return null
        }
    }

    const toggleCheck = (idx: number) => { setChecks(prev => ({ ...prev, [`topic_${idx}`]: !prev[`topic_${idx}`] })) }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', fichaId).single()
            const currentStates = currentFicha?.doc_states || {}
            const newStates = { ...currentStates, [docId]: { status: 'completed', data: checks, completed_at: new Date().toISOString() } }
            const { error } = await supabase.from('fichas').update({ doc_states: newStates }).eq('id', fichaId)
            if (error) throw error
            toast.success("Documento guardado y firmado correctamente")
            onSave()
        } catch (e) { toast.error("Error al guardar") } finally { setSaving(false) }
    }

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            {/* Modal Responsive: Se ensancha si es un documento horizontal */}
            <motion.div 
                initial={{scale:0.95, y: 20}} animate={{scale:1, y: 0}} exit={{scale:0.95, y: 20}} 
                className={`bg-white w-full ${isHorizontal ? 'max-w-7xl' : 'max-w-4xl'} rounded-3xl shadow-2xl flex flex-col h-[90vh] border border-white/20 transition-all duration-300 overflow-hidden`}
            >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl shrink-0 z-20 relative shadow-sm">
                    <div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider mb-1 inline-block">SSOMA</span>
                        <h3 className="font-bold text-lg text-slate-900">{DOC_LABELS[docId]}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{showChecklist ? "Marca los puntos tratados." : "Lee atentamente el documento completo."}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-auto bg-slate-200/50 relative">
                    {showChecklist ? (
                        <div className="p-6 space-y-3 max-w-3xl mx-auto">
                            {content.map((text, idx) => {
                                const isChecked = !!checks[`topic_${idx}`]
                                return (
                                    <div key={idx} onClick={() => toggleCheck(idx)} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${isChecked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                                        <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-300 group-hover:border-blue-300'}`}>{isChecked && <motion.div initial={{scale:0}} animate={{scale:1}}><CheckCircle size={14} className="text-white"/></motion.div>}</div>
                                        <span className={`text-sm leading-snug select-none transition-colors ${isChecked ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>{text}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        // VISTA DE LECTURA (DOCUMENTO REAL)
                        // Usamos un contenedor flexible con scroll automático en ambas direcciones
                        <div className="min-h-full flex items-center justify-center p-8 overflow-auto">
                            <div 
                                style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} 
                                className="bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 pointer-events-none select-none origin-top"
                            >
                                {renderPrintablePreview()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white rounded-b-3xl shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
                        {!showChecklist && (
                            <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl mb-1 border border-blue-100">
                                <Eye className="text-blue-600 shrink-0 mt-0.5" size={18}/>
                                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                    Al presionar confirmar, declaras bajo juramento haber leído, comprendido y recibido el documento mostrado en pantalla con tus datos y firma digital.
                                </p>
                            </div>
                        )}
                        <button onClick={handleSave} disabled={saving} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                            {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                            {saving ? 'Validando...' : 'CONFIRMAR LECTURA Y GUARDAR'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}