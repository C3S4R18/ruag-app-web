'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import FichaForm from '@/components/FichaForm'
import ChatSystem from '@/components/ChatSystem' 
import { 
  LogOut, Calendar, Bell, FileText, ChevronRight, Lock, 
  CheckCircle, Save, X, Loader2, AlertCircle, Eye, 
  Menu, Home, UserCog, Key, Mail, ShieldCheck, Download, FileCheck, Briefcase, FileBadge,
  FolderDown, CloudOff, ExternalLink, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- IMPORTS DE DOCUMENTOS VISUALES (SSOMA + RRHH) ---
import { CargoRisstPrintable } from '@/components/CargoRisstPrintable'  
import { RegistroCapacitacionPrintable } from '@/components/RegistroCapacitacionPrintable'
import { EntregaEppPrintable } from '@/components/EntregaEppPrintable'
import { ActaEntregaIpercPrintable } from '@/components/ActaEntregaIpercPrintable'
import { InduccionHombreNuevoPrintable } from '@/components/InduccionHombreNuevoPrintable'
import { ActaDerechoSaberPrintable } from '@/components/ActaDerechoSaberPrintable'
// RRHH
import { CargoRitPrintable } from '@/components/CargoRitPrintable'
import { CargoPoliticaPrevencionPrintable } from '@/components/CargoPoliticaPrevencionPrintable'

// --- CONFIGURACIÓN DE CONTENIDO (TEXTO PARA CHECKLISTS) ---
const DOC_CONTENT: Record<string, string[]> = {
    // SSOMA
    risst: [], 
    capacitacion: [
        "Inducción",
        "Charla de seguridad",
        "Entrenamiento",
        "Simulacro de emergencia",
        "Capacitación"
    ],
    epp: [],
    iperc: [],
    induccion: [
        "Política de Seguridad y Salud en el Trabajo.",
        "Organización del sistema de gestión.",
        "Reglamento interno de SST.",
        "Derecho y obligaciones.",
        "Conceptos básicos de SST.",
        "Reglas de Tránsito.",
        "Trabajos de alto riesgo.",
        "Código de Colores.",
        "Sustancias peligrosas.",
        "Respuesta ante emergencias.",
        "EPPs."
    ],
    acta_derecho: [
        "Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA",
        "Reglamento Interno de Seguridad.",
        "Políticas de Seguridad y Salud Ocupacional y Medio Ambiente.",
        "Organización del sistema de gestión de la seguridad y salud en el trabajo en la obra.",
        "Derechos y obligaciones de los/las trabajadores/as y supervisores/as.",
        "Conceptos básicos de seguridad y salud en el trabajo.",
        "Reglas de tránsito (de ser aplicable a la obra).",
        "Conceptos básicos de seguridad y salud en el trabajo (Repaso).",
        "Plan de Seguridad y Salud Ocupacional, Plan de Prevención Ambiental.",
        "Reconocimiento del área de trabajo.",
        "Elementos de protección personal, tipos requeridos, manejo correcto, obligatoriedad y protecciones colectivas.",
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
        "Control, manejo, uso y transporte de sustancias peligrosas.",
        "Sistemas de bloqueos y uso de Tarjeta de Seguridad.",
        "Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.",
        "Combustibles; manejo, almacenamiento y transporte.",
        "Cambio de conducta, autocuidado, reconocimiento, sanciones, contacto personal.",
        "Prohibición de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.",
        "Identificación de Aspectos e Impactos Ambientales.",
        "Sobre Riesgos Ambientales, Manejo de residuos.",
        "Equipos Radioactivos.",
        "Preparación y respuesta ante emergencias.",
        "Trabajos de alto riesgo."
    ],
    // RRHH
    cargo_rit: [],
    cargo_politica_prevencion: []
}

// --- ETIQUETAS DE DOCUMENTOS (FIRMA DIGITAL) ---
const DOC_LABELS_SSOMA: Record<string, string> = {
    risst: "Cargo RISST",
    capacitacion: "Registro Capacitación",
    induccion: "Inducción Hombre Nuevo",
    epp: "Entrega de EPPs",
    acta_derecho: "Acta Derecho a Saber",
    iperc: "Entrega IPERC"
}

const DOC_LABELS_RRHH: Record<string, string> = {
    cargo_rit: "Cargo Reglamento Interno (RIT)",
    cargo_politica_prevencion: "Cargo Política Prevención",
}

// --- NUEVA CONFIGURACIÓN: DOCUMENTOS SUBIDOS POR ADMIN (SOLO LECTURA/DESCARGA) ---
const SSOMA_UPLOADS_CONFIG = [
    { id: 'cap_iperc', label: 'CAPACITACIÓN IPERC' },
    { id: 'cap_pets', label: 'CAPACITACIÓN PETS' },
    { id: 'rec_sst', label: 'RECOMENDACIONES SST' },
    { id: 'acta_saber', label: 'ACTA DERECHO A SABER' },
    { id: 'acta_acatamiento', label: 'ACTA ACATAMIENTO' },
    { id: 'entre_epp', label: 'ENTREGA EPP' },
    { id: 'reg_induccion', label: 'REGISTRO DE INDUCCIÓN' },
    { id: 'dif_pol_sst', label: 'DIFUSIÓN POLITICA DE SST' },
    { id: 'cap_hostigamiento', label: 'CAPACITACIÓN HOSTIGAMIENTO SEXUAL' },
    { id: 'reg_risst', label: 'REGISTRO RISST' },
    { id: 'camo', label: 'CAMO' },
    { id: 'acta_emo', label: 'ACTA DE ENTREGA EMO' },
    { id: 'cap_covid', label: 'CAPACITACIÓN PLAN COVID' },
    { id: 'acta_iperc', label: 'ACTA IPERC' },
    { id: 'ficha_covid', label: 'FICHA COVID' },
]

// --- LISTA DE CLAVES DE DESCARGA OBLIGATORIA ---
const MANDATORY_DOWNLOADS: Record<string, {file: string, label: string}> = {
    'risst_pdf_download': { file: 'REGLAMENTO INTERNO DE SEGURIDAD.pdf', label: 'Reglamento Interno RISST' },
    'rit_pdf_download': { file: 'REGLAMENTO INTERNO DE TRABAJO.pdf', label: 'Reglamento Interno de Trabajo' },
    'hostigamiento_pdf_download': { file: 'POLITICA DE HOSTIGAMIENTO SEXUAL.pdf', label: 'Política de Hostigamiento' },
    'beneficiarios_pdf_download': { file: 'DECLARACION DE BENEFICIARIOS_VIDA LEY_2019.pdf', label: 'Declaración Beneficiarios Vida Ley' },
    'calidad_pdf_download': { file: 'POLITICA DE CALIDAD.pdf', label: 'Política de Calidad' },
    'etica_pdf_download': { file: 'CODIGO DE ETICA Y CONDUCTA.pdf', label: 'Código de Ética y Conducta' },
    'antisoborno_pdf_download': { file: 'POLITICA ANTISOBORNO Y ANTICORRUPCIÓN.pdf', label: 'Política Antisoborno' }
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
  
  // ESTADOS PRINCIPALES (Agregado 'uploads')
  const [activeTab, setActiveTab] = useState<'home' | 'documents' | 'uploads' | 'profile'>('home')
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
  const [docToFill, setDocToFill] = useState<{id: string, category: 'ssoma' | 'rrhh'} | null>(null) 
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // --- COLA DE DESCARGAS OBLIGATORIAS ---
  const [downloadQueue, setDownloadQueue] = useState<{key: string, label: string, file: string}[]>([])

  // --- ESTADO DEL CHAT ---
  const [isChatOpen, setIsChatOpen] = useState(false)

  // REFS PARA REALTIME
  const docStatesRef = useRef(docStates)
  const fichaStatusRef = useRef(fichaStatus)
  const downloadQueueRef = useRef(downloadQueue)
  const isInitialLoad = useRef(true)

  useEffect(() => { docStatesRef.current = docStates }, [docStates])
  useEffect(() => { fichaStatusRef.current = fichaStatus }, [fichaStatus])
  useEffect(() => { downloadQueueRef.current = downloadQueue }, [downloadQueue])

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

    // --- REALTIME LISTENER ---
    const channel = supabase.channel('worker-docs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas' }, (payload: any) => {
            if (payload.new.user_id === userId) {
                if (isInitialLoad.current) return 

                const newData = payload.new
                setFullWorkerData(newData)
                const newDocs = newData.doc_states || {}
                const oldDocs = docStatesRef.current
                
                // Analizar cambios en documentos
                Object.keys(newDocs).forEach(key => {
                    const oldStatus = oldDocs[key]?.status
                    const newStatus = newDocs[key]?.status
                    const docName = DOC_LABELS_SSOMA[key] || DOC_LABELS_RRHH[key] || key

                    // Habilitación de firma
                    if (newStatus === 'unlocked' && oldStatus !== 'unlocked') {
                        addNotification(`Se ha habilitado el documento: ${docName}`)
                        toast.info(`📝 Habilitado: ${docName}`)
                        playNotificationSound()
                    }
                    
                    // Bloqueo
                    else if (newStatus === 'locked' && oldStatus === 'unlocked') {
                        addNotification(`El documento ha sido bloqueado: ${docName}`)
                        toast.warning(`🔒 Bloqueado: ${docName}`)
                    }
                    
                    // DETECCIÓN DE DESCARGAS PENDIENTES
                    if (newStatus === 'pending_download' && oldStatus !== 'pending_download') {
                        const config = MANDATORY_DOWNLOADS[key]
                        if (config) {
                            const alreadyInQueue = downloadQueueRef.current.some(item => item.key === key)
                            if (!alreadyInQueue) {
                                setDownloadQueue(prev => [...prev, { key, label: config.label, file: config.file }])
                                playNotificationSound()
                                toast.success(`Documento obligatorio recibido: ${config.label}`)
                            }
                        }
                    }
                })

                // Detectar si el Admin subió un archivo nuevo en 'uploads_state'
                const oldUploads = fullWorkerData?.uploads_state || {}
                const newUploads = newData.uploads_state || {}
                // Comparamos claves
                const newKeys = Object.keys(newUploads).filter(k => !oldUploads[k])
                if (newKeys.length > 0) {
                    addNotification("SSOMA ha subido nuevos documentos a tu carpeta.")
                    toast.success("📂 Nuevo archivo disponible en Archivos SSOMA")
                    playNotificationSound()
                }

                const newFichaState = newData.estado
                const oldFichaState = fichaStatusRef.current

                if (newFichaState === 'completado' && oldFichaState !== 'completado') {
                    addNotification("¡Tu ficha ha sido validada por la Administración!")
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

          // Comprobar descargas pendientes y llenar la cola
          const states = data.doc_states || {}
          const newQueue: any[] = []
          
          Object.keys(MANDATORY_DOWNLOADS).forEach(key => {
              if (states[key]?.status === 'pending_download') {
                  const config = MANDATORY_DOWNLOADS[key]
                  newQueue.push({ key, label: config.label, file: config.file })
              }
          })
          
          if (newQueue.length > 0) {
              setDownloadQueue(newQueue)
          }
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

  const handleDownloadAndNext = async () => {
      const currentItem = downloadQueue[0]
      if (!currentItem) return

      const link = document.createElement('a');
      link.href = `/${currentItem.file}`; 
      link.download = currentItem.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      try {
          const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', fichaId).single()
          const currentStates = currentFicha?.doc_states || {}
          
          const newStates = { 
              ...currentStates, 
              [currentItem.key]: { 
                  status: 'downloaded', 
                  downloaded_at: new Date().toISOString() 
              } 
          }
          
          await supabase.from('fichas').update({ doc_states: newStates }).eq('id', fichaId)
          
          const updatedQueue = downloadQueue.slice(1)
          setDownloadQueue(updatedQueue)
          
          if (updatedQueue.length > 0) {
              toast.success("Documento descargado. Siguiente...")
          } else {
              toast.success("¡Todo listo! Has descargado todos los documentos obligatorios.")
          }
          
          setDocStates(newStates)
      } catch (e) {
          console.error("Error al confirmar descarga", e)
          toast.error("Error de conexión. Intenta de nuevo.")
      }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }
  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const unreadCount = notifications.filter(n => !n.read).length

  // --- CÁLCULOS DEL DASHBOARD ---
  const allDocKeys = [...Object.keys(DOC_LABELS_SSOMA), ...Object.keys(DOC_LABELS_RRHH)]
  const totalDocs = allDocKeys.length
  const completedDocs = allDocKeys.filter(key => docStates[key]?.status === 'completed').length
  const unlockedSignDocs = allDocKeys.filter(key => docStates[key]?.status === 'unlocked').length
  const pendingDownloadsCount = downloadQueue.length
  const totalPendingAction = unlockedSignDocs + pendingDownloadsCount
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
                label="Mis Registros" 
                badge={totalPendingAction > 0 ? totalPendingAction : undefined}
            />
            
            {/* --- NUEVO ITEM SIDEBAR --- */}
            <NavItem 
                active={activeTab === 'uploads'} 
                onClick={() => { setActiveTab('uploads'); if(!isDesktop) setIsSidebarOpen(false) }} 
                icon={<FolderDown size={20}/>} 
                label="Archivos SSOMA" 
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
                    {activeTab === 'documents' && 'Firmas Digitales'}
                    {activeTab === 'uploads' && 'Documentos SSOMA'}
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

                {/* VISTA: DOCUMENTOS (Firmas) */}
                {activeTab === 'documents' && (
                    <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x: 0}} className="space-y-8 pb-20">
                        {/* SECCIÓN SSOMA */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                <ShieldCheck className="text-blue-600" size={24}/>
                                <h2 className="text-lg font-bold text-slate-800">Documentación SSOMA</h2>
                            </div>
                            <div className="grid gap-4">
                                {Object.entries(DOC_LABELS_SSOMA).map(([docId, label]) => (
                                    <DocItem 
                                        key={docId}
                                        id={docId}
                                        label={label}
                                        state={docStates[docId]}
                                        onClick={() => {
                                            const state = docStates[docId] || {}
                                            if (state.status === 'unlocked' || state.status === 'completed') setDocToFill({id: docId, category: 'ssoma'})
                                            else if (state.status !== 'completed') toast.error("Documento no disponible aún.")
                                        }}
                                        type="ssoma"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* SECCIÓN RRHH */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                <Briefcase className="text-purple-600" size={24}/>
                                <h2 className="text-lg font-bold text-slate-800">Documentación RRHH</h2>
                            </div>
                            <div className="grid gap-4">
                                {Object.entries(DOC_LABELS_RRHH).map(([docId, label]) => (
                                    <DocItem 
                                        key={docId}
                                        id={docId}
                                        label={label}
                                        state={docStates[docId]}
                                        onClick={() => {
                                            const state = docStates[docId] || {}
                                            if (state.status === 'unlocked' || state.status === 'completed') setDocToFill({id: docId, category: 'rrhh'})
                                            else if (state.status !== 'completed') toast.error("Documento no disponible aún.")
                                        }}
                                        type="rrhh"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- NUEVA VISTA: DOCUMENTOS SUBIDOS POR SSOMA --- */}
                {activeTab === 'uploads' && (
                    <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x: 0}} className="space-y-6 pb-20">
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6">
                            <h2 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2"><FolderDown/> Documentos Digitalizados</h2>
                            <p className="text-sm text-amber-800">Aquí encontrarás los documentos escaneados o digitales subidos por el equipo de SSOMA para tu legajo personal. Puedes visualizarlos y descargarlos.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SSOMA_UPLOADS_CONFIG.map(doc => {
                                const fileData = fullWorkerData?.uploads_state?.[doc.id]
                                const isAvailable = !!fileData

                                return (
                                    <div key={doc.id} className={`p-5 rounded-2xl border transition-all ${isAvailable ? 'bg-white border-emerald-200 shadow-sm hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                    <FileText size={22}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1" title={doc.label}>{doc.label}</h3>
                                                    <p className={`text-[10px] font-bold mt-0.5 ${isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isAvailable ? 'DISPONIBLE' : 'PENDIENTE DE CARGA'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isAvailable ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                                                    <Clock size={12}/>
                                                    <span>Subido: {new Date(fileData.uploaded_at).toLocaleDateString()}</span>
                                                </div>
                                                <button 
                                                    onClick={() => window.open(fileData.url, '_blank')}
                                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
                                                >
                                                    <ExternalLink size={14}/> VER DOCUMENTO
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-20 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                                <CloudOff size={20} className="mb-1"/>
                                                <span className="text-[10px] font-medium">Aún no disponible</span>
                                            </div>
                                        )}
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

      {/* --- MODAL LLENADO DOCUMENTOS (VISUALIZACIÓN DE CARGOS Y CHECKLISTS) --- */}
      <AnimatePresence>
        {docToFill && (
            <DocumentFillingModal 
                docId={docToFill.id}
                category={docToFill.category}
                fichaId={fichaId}
                existingData={docStates[docToFill.id]?.data || {}}
                status={docStates[docToFill.id]?.status || 'locked'}
                fullFichaData={fullWorkerData}
                onClose={() => setDocToFill(null)}
                onSave={() => { fetchFichaData(userId); setDocToFill(null) }}
            />
        )}
      </AnimatePresence>

      {/* --- MODAL DE DESCARGA OBLIGATORIA (COLA DE ESPERA) --- */}
      <AnimatePresence>
        {downloadQueue.length > 0 && (
            <DownloadModal 
                data={downloadQueue[0]} // Muestra siempre el primero
                queueCount={downloadQueue.length}
                onDownload={handleDownloadAndNext}
                userName={userName}
            />
        )}
      </AnimatePresence>

      {/* --- CHAT FLOTANTE --- */}
      {userId && (
          <ChatSystem 
              workerId={userId} 
              workerName={userName}
              currentUserId={userId}
              isAdmin={false}
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(!isChatOpen)} 
          />
      )}

    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function DocItem({ id, label, state, onClick, type }: any) {
    const status = state?.status || 'locked'
    const isUnlocked = status === 'unlocked'
    const isCompleted = status === 'completed'
    const isLocked = !isUnlocked && !isCompleted

    // Colores dinámicos según SSOMA (Azul) o RRHH (Morado)
    const activeColor = type === 'rrhh' ? 'purple' : 'blue'
    const completedColor = 'emerald'

    return (
        <div 
            onClick={onClick}
            className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${isUnlocked ? `bg-white border-${activeColor}-200 shadow-md hover:border-${activeColor}-400 hover:shadow-lg` : isCompleted ? `bg-${completedColor}-50/50 border-${completedColor}-100 hover:bg-${completedColor}-50` : 'bg-white border-slate-100 opacity-60 grayscale hover:opacity-80'}`}
        >
            {isUnlocked && <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${activeColor}-500`}/>}
            {isCompleted && <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${completedColor}-500`}/>}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isCompleted ? `bg-${completedColor}-100 text-${completedColor}-600` : isUnlocked ? `bg-${activeColor}-100 text-${activeColor}-600` : 'bg-slate-100 text-slate-400'}`}>
                        {isCompleted ? <CheckCircle size={24}/> : (type === 'rrhh' ? <Briefcase size={24}/> : <FileText size={24}/>)}
                    </div>
                    <div>
                        <h3 className={`font-bold text-base ${isUnlocked ? `text-${activeColor}-900` : 'text-slate-700'}`}>{label}</h3>
                        <p className="text-xs font-bold mt-1 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? `bg-${completedColor}-500` : isUnlocked ? `bg-${activeColor}-500 animate-pulse` : 'bg-slate-400'}`}></span>
                            <span className={isCompleted ? `text-${completedColor}-600` : isUnlocked ? `text-${activeColor}-600` : 'text-slate-400'}>
                                {isCompleted ? 'FIRMADO Y ENVIADO' : isUnlocked ? 'DISPONIBLE PARA FIRMA' : 'BLOQUEADO'}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-slate-100 transition-colors">
                    {isLocked ? <Lock size={20}/> : <ChevronRight size={20}/>}
                </div>
            </div>
        </div>
    )
}

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

// --- CARD DE PERFIL ---
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
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}

// --- MODAL DE LECTURA Y CONFIRMACIÓN DE DOCUMENTOS ---
function DocumentFillingModal({ docId, category, fichaId, existingData, fullFichaData, status = 'locked', onClose, onSave }: any) {
    const supabase = createClient()
    const [checks, setChecks] = useState<Record<string, boolean>>(existingData || {})
    const [saving, setSaving] = useState(false)
    const content = DOC_CONTENT[docId] || []
    const showChecklist = content.length > 0
    const isCompleted = status === 'completed'
    const isHorizontal = ['capacitacion', 'epp'].includes(docId)
    const [scale, setScale] = useState(1)
    const [modalStep, setModalStep] = useState<'checklist' | 'preview'>(showChecklist && !isCompleted ? 'checklist' : 'preview')
    const isChecklistStep = showChecklist && !isCompleted && modalStep === 'checklist'
    const checklistSelectedCount = content.filter((_, idx) => checks[`topic_${idx}`]).length

    useEffect(() => {
        const normalizedChecks = (content || []).reduce((acc, _, idx) => {
            acc[`topic_${idx}`] = !!existingData?.[`topic_${idx}`]
            return acc
        }, {} as Record<string, boolean>)

        setChecks(showChecklist ? normalizedChecks : (existingData || {}))
    }, [docId, existingData, showChecklist, content])

    useEffect(() => {
        setModalStep(showChecklist && !isCompleted ? 'checklist' : 'preview')
    }, [docId, showChecklist, isCompleted])
    
    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth
            if (width < 640) setScale(isHorizontal ? 0.34 : 0.45)
            else if (width < 1024) setScale(isHorizontal ? 0.48 : 0.65)
            else if (showChecklist && !isChecklistStep) setScale(isHorizontal ? 0.68 : 0.9)
            else if (showChecklist) setScale(isHorizontal ? 0.58 : 0.82)
            else setScale(isHorizontal ? 0.68 : 0.9)
        }
        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [showChecklist, isHorizontal, isChecklistStep])

    const previewFichaData = fullFichaData ? {
        ...fullFichaData,
        doc_states: {
            ...(fullFichaData.doc_states || {}),
            [docId]: {
                ...((fullFichaData.doc_states || {})[docId] || {}),
                data: showChecklist ? checks : ((fullFichaData.doc_states || {})[docId]?.data || existingData || {})
            }
        }
    } : fullFichaData

    const renderPrintablePreview = () => {
        const props = { ficha: previewFichaData }
        switch (docId) {
            // SSOMA
            case 'risst': return <CargoRisstPrintable {...props} />
            case 'capacitacion': return <RegistroCapacitacionPrintable {...props} />
            case 'epp': return <EntregaEppPrintable {...props} />
            case 'iperc': return <ActaEntregaIpercPrintable {...props} />
            case 'induccion': return <InduccionHombreNuevoPrintable {...props} /> 
            case 'acta_derecho': return <ActaDerechoSaberPrintable {...props} />
            // RRHH
            case 'cargo_rit': return <CargoRitPrintable {...props} />
            case 'cargo_politica_prevencion': return <CargoPoliticaPrevencionPrintable {...props} />
            default: return null
        }
    }

    const toggleCheck = (idx: number) => { setChecks(prev => ({ ...prev, [`topic_${idx}`]: !prev[`topic_${idx}`] })) }

    const handleSave = async () => {
        if (isCompleted) {
            onClose()
            return
        }

        setSaving(true)
        try {
            const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', fichaId).single()
            const currentStates = currentFicha?.doc_states || {}
            const dataToSave = showChecklist
                ? content.reduce((acc, _, idx) => {
                    acc[`topic_${idx}`] = !!checks[`topic_${idx}`]
                    return acc
                }, {} as Record<string, boolean>)
                : (Object.keys(existingData || {}).length > 0 ? existingData : { signed: true })

            const newStates = {
                ...currentStates,
                [docId]: {
                    ...(currentStates?.[docId] || {}),
                    status: 'completed',
                    data: dataToSave,
                    completed_at: new Date().toISOString()
                }
            }
            const { error } = await supabase.from('fichas').update({ doc_states: newStates }).eq('id', fichaId)
            if (error) throw error
            toast.success("Documento guardado y firmado correctamente")
            onSave()
        } catch (e) { toast.error("Error al guardar") } finally { setSaving(false) }
    }

    const docLabel = category === 'rrhh' ? DOC_LABELS_RRHH[docId] : DOC_LABELS_SSOMA[docId]

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
                initial={{scale:0.95, y: 20}} animate={{scale:1, y: 0}} exit={{scale:0.95, y: 20}} 
                className={`bg-white w-full ${isHorizontal ? 'max-w-7xl' : 'max-w-4xl'} rounded-3xl shadow-2xl flex flex-col h-[90vh] border border-white/20 transition-all duration-300 overflow-hidden`}
            >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl shrink-0 z-20 relative shadow-sm">
                    <div>
                        <span className={`text-[10px] font-bold ${category === 'rrhh' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'} px-2 py-1 rounded uppercase tracking-wider mb-1 inline-block`}>{category.toUpperCase()}</span>
                        <h3 className="font-bold text-lg text-slate-900">{docLabel}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isCompleted
                                ? "Documento ya confirmado. Puedes revisarlo nuevamente."
                                : isChecklistStep
                                    ? "Marca primero lo que corresponde y luego pasarás al documento para firmarlo."
                                    : showChecklist
                                        ? "Revisa cómo quedará el documento con tus marcas antes de firmarlo."
                                    : "Lee atentamente el documento antes de firmar."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {showChecklist && !isCompleted && (
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${isChecklistStep ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isChecklistStep ? 'Paso 1 de 2 · Marcas' : 'Paso 2 de 2 · Firma'}
                            </span>
                        )}
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-200/50 relative">
                    {isChecklistStep ? (
                        <div className="min-h-full flex items-center justify-center p-5 md:p-8">
                            <div className="w-full max-w-3xl bg-white rounded-[28px] border border-slate-200 shadow-xl p-5 md:p-7">
                                <div className="flex items-center justify-between gap-3 mb-5">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Marcación</p>
                                        <h4 className="text-lg font-bold text-slate-900">Selecciona lo que corresponde antes de firmar</h4>
                                        <p className="text-sm text-slate-500 mt-1">Estas marcas se guardarán exactamente así y luego aparecerán en la impresión del admin.</p>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold shrink-0">
                                        {checklistSelectedCount}/{content.length}
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[52vh] overflow-auto pr-1">
                                    {content.map((text, idx) => {
                                        const isChecked = !!checks[`topic_${idx}`]
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleCheck(idx)}
                                                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group ${isChecked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200 cursor-pointer'}`}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-300 group-hover:border-blue-300'}`}>
                                                    {isChecked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle size={14} className="text-white" /></motion.div>}
                                                </div>
                                                <span className={`text-sm leading-snug select-none transition-colors ${isChecked ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>{text}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                    <div className={`min-h-full ${showChecklist && isChecklistStep ? 'flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_360px]' : 'flex'}`}>
                        <div className="min-h-full flex items-start justify-center p-6 md:p-8 overflow-auto">
                            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 pointer-events-none select-none origin-top">
                                {renderPrintablePreview()}
                            </div>
                        </div>

                        {showChecklist && isChecklistStep && (
                            <div className="border-t xl:border-t-0 xl:border-l border-slate-200 bg-white p-5 md:p-6">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Marcación</p>
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {isCompleted ? 'Puntos guardados' : 'Selecciona lo que corresponde'}
                                        </h4>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                        {content.filter((_, idx) => checks[`topic_${idx}`]).length}/{content.length}
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[38vh] xl:max-h-[unset] xl:h-[calc(100%-3rem)] overflow-auto pr-1">
                                    {content.map((text, idx) => {
                                        const isChecked = !!checks[`topic_${idx}`]
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                disabled={isCompleted}
                                                onClick={() => toggleCheck(idx)}
                                                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group ${isChecked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200'} ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-300 group-hover:border-blue-300'}`}>
                                                    {isChecked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle size={14} className="text-white" /></motion.div>}
                                                </div>
                                                <span className={`text-sm leading-snug select-none transition-colors ${isChecked ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>{text}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white rounded-b-3xl shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
                        {isCompleted ? (
                            <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18}/>
                                <p className="text-xs text-emerald-800 leading-relaxed font-medium">Este documento ya fue guardado con tu conformidad. Puedes cerrarlo o revisarlo cuantas veces necesites.</p>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl mb-1 border border-blue-100">
                                <Eye className="text-blue-600 shrink-0 mt-0.5" size={18}/>
                                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                    {isChecklistStep
                                        ? "Al confirmar, guardaremos las marcas seleccionadas junto con tu conformidad digital para que administración lo imprima exactamente así."
                                        : "Al presionar confirmar, declaras bajo juramento haber leído, comprendido y recibido el documento mostrado en pantalla con tus datos y firma digital."}
                                </p>
                            </div>
                        )}
                        <div className={`grid gap-3 ${showChecklist && !isCompleted && !isChecklistStep ? 'md:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
                            {showChecklist && !isCompleted && !isChecklistStep && (
                                <button
                                    type="button"
                                    onClick={() => setModalStep('checklist')}
                                    className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                    VOLVER A MARCAS
                                </button>
                            )}
                            <button onClick={isCompleted ? onClose : (isChecklistStep ? () => setModalStep('preview') : handleSave)} disabled={saving} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                                {saving ? 'Validando...' : isCompleted ? 'CERRAR VISOR' : isChecklistStep ? 'CONTINUAR AL DOCUMENTO' : showChecklist ? 'FIRMAR Y GUARDAR' : 'CONFIRMAR LECTURA Y GUARDAR'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// --- MODAL DE DESCARGA OBLIGATORIA (RISST) ---
function DownloadModal({ data, queueCount, onDownload, userName }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-white/20"
            >
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-grid-lg"></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30 shadow-lg relative z-10">
                        <FileCheck size={40} className="text-white drop-shadow-md" />
                    </div>
                    <h2 className="text-2xl font-bold text-white relative z-10">Documento Importante</h2>
                    <p className="text-blue-100 text-sm mt-1 relative z-10">Acción requerida inmediata</p>
                    {queueCount > 1 && <span className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded-lg text-white text-xs font-bold border border-white/30">Faltan {queueCount}</span>}
                </div>

                <div className="p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-slate-800 font-medium text-lg">Hola <span className="font-bold text-indigo-600">{userName}</span>,</p>
                        <p className="text-slate-500 text-sm leading-relaxed">Se te ha enviado el siguiente documento obligatorio:</p>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-4 text-left border border-indigo-100">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-red-500 shrink-0"><FileText size={24} /></div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{data.label}</p>
                            <p className="text-xs text-slate-500 truncate w-48">{data.file}</p>
                        </div>
                    </div>

                    <button 
                        onClick={onDownload}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group"
                    >
                        <span className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors"><Download size={20} /></span>
                        DESCARGAR Y CONFIRMAR
                    </button>
                    
                    <p className="text-[10px] text-slate-400">Al descargar, confirmas la recepción digital de este documento.</p>
                </div>
            </motion.div>
        </div>
    )
}
