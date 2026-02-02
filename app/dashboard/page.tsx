'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import FichaForm from '@/components/FichaForm'
import ChatSystem from '@/components/ChatSystem' // <--- IMPORTANTE: Asegúrate de tener este componente creado
import { 
  LogOut, Calendar, Bell, FileText, ChevronRight, Lock, 
  CheckCircle, Save, X, Loader2, AlertCircle, Eye, 
  Menu, Home, UserCog, Key, Mail, ShieldCheck
} from 'lucide-react'
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
  
  // ESTADOS PRINCIPALES
  const [activeTab, setActiveTab] = useState<'home' | 'documents' | 'profile'>('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) 
  const [isDesktop, setIsDesktop] = useState(true)

  // DATOS DEL USUARIO
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [fichaId, setFichaId] = useState<string | null>(null)
  const [fullWorkerData, setFullWorkerData] = useState<any>(null)
  
  // ESTADOS DE DOCUMENTOS
  const [docStates, setDocStates] = useState<any>({})
  const [fichaStatus, setFichaStatus] = useState<string>('') 
  
  // MODALES
  const [docToFill, setDocToFill] = useState<string | null>(null) 
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // REFS PARA REALTIME
  const docStatesRef = useRef(docStates)
  const fichaStatusRef = useRef(fichaStatus)
  const isInitialLoad = useRef(true)

  useEffect(() => { docStatesRef.current = docStates }, [docStates])
  useEffect(() => { fichaStatusRef.current = fichaStatus }, [fichaStatus])

  const playNotificationSound = () => {
      const audio = new Audio('/notification2.mp3')
      audio.play().catch(e => console.log("Audio bloqueado:", e))
  }

  // --- DETECTAR TAMAÑO DE PANTALLA ---
  useEffect(() => {
    const handleResize = () => {
        setIsDesktop(window.innerWidth >= 1024)
        if (window.innerWidth >= 1024) setIsSidebarOpen(false)
    }
    
    if (typeof window !== 'undefined') {
        handleResize()
        window.addEventListener('resize', handleResize)
    }
    return () => {
        if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize)
    }
  }, [])

  // --- CARGA INICIAL ---
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')

      const { data: profile } = await supabase.from('profiles').select('nombres').eq('id', user.id).single()
      if (profile) setUserName(profile.nombres.split(' ')[0])

      await fetchFichaData(user.id)
      isInitialLoad.current = false 
    }
    getUserData()

    // --- REALTIME LISTENER (SOLO PARA DOCUMENTOS Y ESTADO FICHA) ---
    // El chat maneja su propio realtime en el componente ChatSystem
    const channel = supabase.channel('worker-docs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas' }, (payload: any) => {
            if (payload.new.user_id === userId) {
                if (isInitialLoad.current) return 

                const newData = payload.new
                setFullWorkerData(newData)
                const newDocs = newData.doc_states || {}
                const oldDocs = docStatesRef.current
                
                // Detectar cambios en estado de documentos
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

  // --- CÁLCULOS DEL DASHBOARD ---
  const docKeys = Object.keys(DOC_LABELS)
  const totalDocs = docKeys.length
  const completedDocs = docKeys.filter(key => docStates[key]?.status === 'completed').length
  const pendingDocs = docKeys.filter(key => docStates[key]?.status === 'unlocked').length
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <AnimatePresence>
        {!isDesktop && isSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setIsSidebarOpen(false)} 
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden"
            />
        )}
      </AnimatePresence>

      <motion.aside 
        className={`bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-50 fixed lg:relative shadow-2xl lg:shadow-none w-72 lg:w-64`}
        initial={false}
        // CORRECCIÓN: Usamos 'isDesktop' en lugar de 'window.innerWidth'
        animate={{ 
            x: (isDesktop || isSidebarOpen) ? 0 : -288, 
            width: (isDesktop || isSidebarOpen) ? 260 : 0 
        }}
      >
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100 bg-white">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">R</div>
            <div>
                <h1 className="font-bold text-lg text-slate-800 leading-none">RUAG</h1>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Portal Obrero</span>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
                active={activeTab === 'home'} 
                onClick={() => { setActiveTab('home'); if(!isDesktop) setIsSidebarOpen(false) }} 
                icon={<Home size={20}/>} 
                label="Inicio" 
            />
            <NavItem 
                active={activeTab === 'documents'} 
                onClick={() => { setActiveTab('documents'); if(!isDesktop) setIsSidebarOpen(false) }} 
                icon={<FileText size={20}/>} 
                label="Mis Documentos" 
                badge={pendingDocs > 0 ? pendingDocs : undefined}
            />
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mi Cuenta</div>
            <NavItem 
                active={activeTab === 'profile'} 
                onClick={() => { setActiveTab('profile'); if(!isDesktop) setIsSidebarOpen(false) }} 
                icon={<UserCog size={20}/>} 
                label="Mi Perfil" 
            />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm group">
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Cerrar Sesión
            </button>
        </div>
      </motion.aside>


      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] relative overflow-hidden">
        
        {/* Header Superior */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                    <Menu size={24}/>
                </button>
                <h2 className="text-lg font-bold text-slate-800">
                    {activeTab === 'home' && 'Bienvenido'}
                    {activeTab === 'documents' && 'Gestión de Documentos'}
                    {activeTab === 'profile' && 'Configuración de Cuenta'}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => { setIsNotifOpen(!isNotifOpen); setNotifications(prev => prev.map(n => ({...n, read: true}))) }}
                        className="relative p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
                    >
                        <Bell size={20}/>
                        {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                    </button>
                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div initial={{opacity:0, y: 10, scale: 0.95}} animate={{opacity:1, y: 0, scale: 1}} exit={{opacity:0, scale: 0.95}} className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right ring-1 ring-black/5">
                                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Notificaciones</span>
                                    <button onClick={() => setNotifications([])} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Borrar</button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {notifications.length === 0 ? <p className="p-6 text-center text-xs text-slate-400">Sin novedades</p> : notifications.map(n => (
                                        <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-blue-50/50"><p className="text-sm text-slate-800 font-medium">{n.msg}</p><p className="text-[10px] text-slate-400 mt-1">{n.time}</p></div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold border border-blue-200 shadow-sm">
                    {userName.charAt(0)}
                </div>
            </div>
        </header>

        {/* --- CONTENIDO DINÁMICO --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-5xl mx-auto">
                
                {/* VISTA: HOME */}
                {activeTab === 'home' && (
                    <motion.div initial={{opacity:0, y: 20}} animate={{opacity:1, y: 0}} className="space-y-8 pb-20">
                        {/* Hero Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-bold mb-4">
                                        <Calendar size={12}/> {today}
                                    </div>
                                    <h1 className="text-3xl font-bold mb-2">Hola, {userName || 'Compañero'} 👋</h1>
                                    <p className="text-blue-100 max-w-md">Bienvenido a tu portal. Aquí puedes gestionar tus documentos y actualizar tu información.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 min-w-[200px]">
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90"><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-900/30"/><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={126} strokeDashoffset={126 - (126 * progress) / 100} className="text-white transition-all duration-1000"/></svg>
                                        <span className="absolute text-xs font-bold">{progress}%</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-200 font-bold uppercase">Documentación</p>
                                        <p className="text-sm font-bold">{completedDocs} / {totalDocs} listos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ficha Form (Visualización) */}
                        <FichaForm />
                    </motion.div>
                )}

                {/* VISTA: DOCUMENTOS */}
                {activeTab === 'documents' && (
                    <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x: 0}} className="space-y-6 pb-20">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-800">Tus Documentos</h2>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{pendingDocs} pendientes</span>
                        </div>

                        <div className="grid gap-4">
                            {Object.entries(DOC_LABELS).map(([docId, label]) => {
                                const state = docStates[docId] || {}
                                const isUnlocked = state.status === 'unlocked'
                                const isCompleted = state.status === 'completed'
                                const isLocked = !isUnlocked && !isCompleted

                                return (
                                    <div 
                                        key={docId}
                                        onClick={() => {
                                            if (isUnlocked) setDocToFill(docId)
                                            else if (isLocked) toast.error("Documento no disponible aún.")
                                        }}
                                        className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${isUnlocked ? 'bg-white border-blue-200 shadow-md hover:border-blue-400 hover:shadow-lg' : isCompleted ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' : 'bg-white border-slate-100 opacity-60 grayscale hover:opacity-80'}`}
                                    >
                                        {isUnlocked && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"/>}
                                        {isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"/>}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {isCompleted ? <CheckCircle size={24}/> : <FileText size={24}/>}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-base ${isUnlocked ? 'text-blue-900' : 'text-slate-700'}`}>{label}</h3>
                                                    <p className="text-xs font-bold mt-1 flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isUnlocked ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        <span style={{color: isCompleted ? '#059669' : isUnlocked ? '#2563EB' : '#94A3B8'}}>
                                                            {isCompleted ? 'FIRMADO Y ENVIADO' : isUnlocked ? 'DISPONIBLE PARA FIRMA' : 'BLOQUEADO'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                {isLocked ? <Lock size={20}/> : <ChevronRight size={20}/>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* VISTA: PERFIL */}
                {activeTab === 'profile' && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="max-w-lg mx-auto pb-20">
                        <ProfileSettingsCard userEmail={userEmail} supabase={supabase} />
                    </motion.div>
                )}

            </div>
        </div>

      </main>

      {/* --- MODAL LLENADO DOCUMENTOS --- */}
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

      {/* --- CHAT FLOTANTE PARA EL OBRERO --- */}
      <ChatSystem 
          workerId={userId} 
          workerName={userName}
          currentUserId={userId}
          isAdmin={false}
          isOpen={false} // El obrero gestiona su minimizado internamente
          onClose={() => {}} 
      />

    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function NavItem({ active, onClick, icon, label, badge }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <div className="flex items-center gap-3">
                <span className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>{icon}</span>
                <span>{label}</span>
            </div>
            {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{badge}</span>}
        </button>
    )
}

// --- CARD DE PERFIL (CAMBIO DE CONTRASEÑA) ---
function ProfileSettingsCard({ userEmail, supabase }: any) {
    const [email, setEmail] = useState(userEmail)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password && password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return }
        if (password && password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return }

        setLoading(true)
        const updates: any = { email }
        if (password) updates.password = password

        const { error } = await supabase.auth.updateUser(updates)

        if (error) {
            toast.error("Error al actualizar: " + error.message)
        } else {
            toast.success("✅ Credenciales actualizadas correctamente.")
            toast.info("Por favor, usa estos datos para tu próximo inicio de sesión.")
            setPassword('')
            setConfirmPassword('')
        }
        setLoading(false)
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 text-center bg-gradient-to-b from-white to-slate-50/50">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                    <UserCog size={36}/>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Configurar Cuenta</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Actualiza tu correo y contraseña para asegurar tu acceso al sistema.</p>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Correo Electrónico</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="tuemail@ejemplo.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Nueva Contraseña</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Confirmar Contraseña</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="Repite la contraseña"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}

function DocumentFillingModal({ docId, fichaId, existingData, fullFichaData, onClose, onSave }: any) {
    const supabase = createClient()
    const [checks, setChecks] = useState<Record<string, boolean>>(existingData || {})
    const [saving, setSaving] = useState(false)
    const content = DOC_CONTENT[docId] || [] 
    
    const isHorizontal = ['capacitacion', 'epp'].includes(docId)
    const showChecklist = content.length > 0
    const [scale, setScale] = useState(1)
    
    useEffect(() => {
        if (!showChecklist) {
            const updateScale = () => {
                const width = window.innerWidth
                if (width < 640) setScale(0.45) 
                else if (width < 1024) setScale(0.65)
                else setScale(0.85)
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
                        <div className="min-h-full flex items-center justify-center p-8 overflow-auto">
                            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 pointer-events-none select-none origin-top">
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
                                <p className="text-xs text-blue-800 leading-relaxed font-medium">Al presionar confirmar, declaras bajo juramento haber leído, comprendido y recibido el documento mostrado en pantalla con tus datos y firma digital.</p>
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