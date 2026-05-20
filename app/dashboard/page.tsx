'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import FichaForm from '@/components/FichaForm'
import ChatSystem from '@/components/ChatSystem' 
import {
  LogOut, Calendar, Bell, FileText, ChevronRight, Lock,
  CheckCircle, Save, X, Loader2, AlertCircle, Eye,
  Menu, Home, Key, Mail, ShieldCheck, Download, FileCheck, Briefcase, FileBadge,
  Folder, CloudOff, ExternalLink, Clock, MessageSquareText, Sparkles, ArrowUpRight, Layers3,
  IdCard, Camera
} from 'lucide-react'
import AnimatedIcon from '@/components/AnimatedIcon'
import ProfilePhotoGate from '@/components/ProfilePhotoGate'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- IMPORTS DE DOCUMENTOS VISUALES (SSOMA + RRHH) ---
import { CargoRisstPrintable } from '@/components/CargoRisstPrintable'  
import { RegistroCapacitacionPrintable } from '@/components/RegistroCapacitacionPrintable'
import { EntregaEppPrintable } from '@/components/EntregaEppPrintable'
import { ActaEntregaIpercPrintable } from '@/components/ActaEntregaIpercPrintable'
import { InduccionHombreNuevoPrintable } from '@/components/InduccionHombreNuevoPrintable'
import { ActaDerechoSaberPrintable } from '@/components/ActaDerechoSaberPrintable'
import { FichaSintomatologicaPrintable } from '@/components/FichaSintomatologicaPrintable'
import { ActaAcatamientoPrintable } from '@/components/ActaAcatamientoPrintable'
import { ActaEntregaResultadosEmoPrintable } from '@/components/ActaEntregaResultadosEmoPrintable'
import { CargoRecomendacionesPrintable } from '@/components/CargoRecomendacionesPrintable'
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

const EPP_ITEMS = [
    "BARBIQUEJO",
    "BOTAS CON PUNTA DE ACERO",
    "CASCO DE SEGURIDAD",
    "POLO",
    "CHALECO REFLEXIVO DE SEGURIDAD",
    "LENTES CLAROS DE SEGURIDAD",
    "LENTES OSCUROS",
    "TAPONES AUDITIVOS",
    "GUANTES ANTICORTE NIVEL 5",
    "GUANTES DE CUERO",
    "GUANTES DE JEBE",
    "GUANTES PARA SOLDAR",
    "CARETA O PROTECTOR FACIAL",
    "MASCARILLA DESECHABLE",
    "RESPIRADOR DOBLE VIA",
    "RESPIRADOR DE UNA VIA",
    "ESCARPINES",
    "MANDIL DE SOLDADURA",
    "ZAPATOS DIELECTRICOS",
    "OVEROL O UNIFORME",
    "OTROS"
]

const DOCS_WITH_MANUAL_FIELDS = new Set(['epp', 'capacitacion', 'ficha_covid', 'acta_acatamiento', 'acta_emo', 'rec_sst'])

const COVID_RISK_FIELDS = [
    'risk_mayor_65',
    'risk_cancer',
    'risk_renal',
    'risk_pulmonar',
    'risk_cardiaca',
    'risk_dm',
    'risk_obesidad',
    'risk_inmuno',
    'risk_trasplante',
    'risk_cerebro',
    'risk_hipertension',
    'risk_down',
    'risk_embarazo',
    'risk_vih',
    'risk_otros',
]

const COVID_SYMPTOM_FIELDS = ['symptom_1', 'symptom_2', 'symptom_3', 'symptom_4', 'symptom_5']
const EMPTY_DOC_CONTENT: string[] = []
const EMPTY_DOC_DATA: Record<string, any> = {}

function buildDocumentFormState(docId: string, existingData: Record<string, any> = {}): Record<string, string> {
    if (docId === 'epp') {
        const state: Record<string, string> = {
            obra: existingData.obra || '',
            responsable_nombre: existingData.responsable_nombre || '',
            responsable_cargo: existingData.responsable_cargo || '',
            responsable_fecha: existingData.responsable_fecha || '',
            responsable_firma_texto: existingData.responsable_firma_texto || '',
        }
        EPP_ITEMS.forEach((_, rowIndex) => {
            for (let delivery = 1; delivery <= 4; delivery += 1) {
                state[`epp_${rowIndex}_delivery_${delivery}_date`] = existingData[`epp_${rowIndex}_delivery_${delivery}_date`] || ''
            }
        })
        return state
    }

    if (docId === 'capacitacion') {
        return {
            cantidad_trabajadores: existingData.cantidad_trabajadores || '',
            otros_detalle: existingData.otros_detalle || '',
            lugar: existingData.lugar || '',
            tema: existingData.tema || '',
            fecha: existingData.fecha || '',
            hora_inicio: existingData.hora_inicio || '',
            hora_fin: existingData.hora_fin || '',
            total_horas: existingData.total_horas || '',
            capacitador_nombre: existingData.capacitador_nombre || '',
            capacitador_firma_texto: existingData.capacitador_firma_texto || '',
            observaciones: existingData.observaciones || '',
            responsable_nombre: existingData.responsable_nombre || '',
            responsable_cargo: existingData.responsable_cargo || '',
            responsable_fecha: existingData.responsable_fecha || '',
            responsable_firma_texto: existingData.responsable_firma_texto || '',
        }
    }

    if (docId === 'ficha_covid') {
        const state: Record<string, string> = {
            area_trabajo: existingData.area_trabajo || '',
            direccion_domicilio: existingData.direccion_domicilio || '',
            celular: existingData.celular || '',
            medicacion_toma: existingData.medicacion_toma === true || existingData.medicacion_toma === 'si' ? 'si' : 'no',
            medicacion_detalle: existingData.medicacion_detalle || '',
            grupo_riesgo: existingData.grupo_riesgo === true || existingData.grupo_riesgo === 'si' ? 'si' : 'no',
            vacunas_dosis: existingData.vacunas_dosis || '',
            fecha_documento: existingData.fecha_documento || '',
        }
        COVID_SYMPTOM_FIELDS.forEach((field) => {
            state[field] = existingData[field] === true || existingData[field] === 'si' ? 'si' : 'no'
        })
        COVID_RISK_FIELDS.forEach((field) => {
            state[field] = existingData[field] === true || existingData[field] === 'si' ? 'si' : 'no'
        })
        return state
    }

    if (docId === 'acta_emo') {
        return {
            cargo: existingData.cargo || '',
            area: existingData.area || '',
            sede_obra: existingData.sede_obra || '',
            fecha_evaluacion: existingData.fecha_evaluacion || '',
            fecha_documento: existingData.fecha_documento || '',
            medico_ocupacional: existingData.medico_ocupacional || '',
        }
    }

    if (docId === 'acta_acatamiento' || docId === 'rec_sst') {
        return {
            fecha_documento: existingData.fecha_documento || '',
        }
    }

    return {}
}

function buildDocumentPayload(docId: string, checklistState: Record<string, boolean>, formState: Record<string, string>, existingData: Record<string, any> = {}) {
    const payload: Record<string, any> = { ...existingData }

    Object.keys(payload).forEach((key) => {
        if (key.startsWith('topic_')) delete payload[key]
    })

    const content = DOC_CONTENT[docId] || []
    content.forEach((_, idx) => {
        payload[`topic_${idx}`] = !!checklistState[`topic_${idx}`]
    })

    if (DOCS_WITH_MANUAL_FIELDS.has(docId)) {
        Object.entries(formState).forEach(([key, value]) => {
            payload[key] = value
        })
    }

    if (Object.keys(payload).length === 0) {
        payload.signed = true
    }

    return payload
}

// --- ETIQUETAS DE DOCUMENTOS (FIRMA DIGITAL) ---
const DOC_LABELS_SSOMA: Record<string, string> = {
    risst: "Cargo RISST",
    capacitacion: "Registro Capacitación",
    induccion: "Inducción Hombre Nuevo",
    epp: "Entrega de EPPs",
    acta_derecho: "Acta Derecho a Saber",
    iperc: "Entrega IPERC",
    ficha_covid: "Ficha Sintomatológica",
    acta_acatamiento: "Acta de Acatamiento",
    acta_emo: "Acta de Entrega de Resultados EMO",
    rec_sst: "Cargo de Entrega de Recomendaciones"
}

const DOC_LABELS_SSOMA_CLEAN: Record<string, string> = {
    risst: "Cargo RISST",
    capacitacion: "Registro Capacitacion",
    induccion: "Induccion Hombre Nuevo",
    epp: "Entrega de EPPs",
    acta_derecho: "Acta Derecho a Saber",
    iperc: "Entrega IPERC",
    ficha_covid: "Ficha Sintomatologica",
    acta_acatamiento: "Acta de Acatamiento",
    acta_emo: "Acta de Entrega de Resultados EMO",
    rec_sst: "Cargo de Entrega de Recomendaciones",
}

const DOC_LABELS_RRHH: Record<string, string> = {
    cargo_rit: "Cargo Reglamento Interno (RIT)",
    cargo_politica_prevencion: "Cargo Política Prevención",
}

// --- NUEVA CONFIGURACIÓN: DOCUMENTOS SUBIDOS POR ADMIN (SOLO LECTURA/DESCARGA) ---
const SSOMA_UPLOADS_CONFIG = [
    { id: 'cap_iperc', label: 'CAPACITACIÓN IPERC' },
    { id: 'cap_pets', label: 'CAPACITACIÓN PETS' },
    { id: 'acta_saber', label: 'ACTA DERECHO A SABER' },
    { id: 'entre_epp', label: 'ENTREGA EPP' },
    { id: 'reg_induccion', label: 'REGISTRO DE INDUCCIÓN' },
    { id: 'dif_pol_sst', label: 'DIFUSIÓN POLITICA DE SST' },
    { id: 'cap_hostigamiento', label: 'CAPACITACIÓN HOSTIGAMIENTO SEXUAL' },
    { id: 'reg_risst', label: 'REGISTRO RISST' },
    { id: 'camo', label: 'CAMO' },
    { id: 'cap_covid', label: 'CAPACITACIÓN PLAN COVID' },
    { id: 'acta_iperc', label: 'ACTA IPERC' },
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

const shouldPromptMandatoryDownload = (docState: any) => {
    if (!docState || docState.status !== 'pending_download') return false

    const sentAt = typeof docState.sent_at === 'string' ? docState.sent_at : ''
    const promptedAt = typeof docState.prompted_at === 'string' ? docState.prompted_at : ''

    if (!sentAt) return !promptedAt
    if (!promptedAt) return true

    return promptedAt < sentAt
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [showPhotoGate, setShowPhotoGate] = useState(false) 
  
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

  const markMandatoryDownloadsPrompted = async (keys: string[]) => {
      if (!fichaId || keys.length === 0) return

      try {
          const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', fichaId).single()
          const currentStates = currentFicha?.doc_states || {}
          const nextStates = { ...currentStates }
          const promptedAt = new Date().toISOString()
          let changed = false

          keys.forEach((key) => {
              const currentState = currentStates[key]
              if (shouldPromptMandatoryDownload(currentState)) {
                  nextStates[key] = {
                      ...currentState,
                      prompted_at: promptedAt,
                  }
                  changed = true
              }
          })

          if (!changed) return

          await supabase.from('fichas').update({ doc_states: nextStates }).eq('id', fichaId)
          setDocStates(nextStates)
          docStatesRef.current = nextStates
          setFullWorkerData((prev: any) => prev ? { ...prev, doc_states: nextStates } : prev)
      } catch (error) {
          console.error('No se pudo marcar la descarga obligatoria como mostrada', error)
      }
  }

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
          const docName = DOC_LABELS_SSOMA_CLEAN[key] || DOC_LABELS_RRHH[key] || key

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
                    if (shouldPromptMandatoryDownload(newDocs[key])) {
                        const config = MANDATORY_DOWNLOADS[key]
                        if (config) {
                            const alreadyInQueue = downloadQueueRef.current.some(item => item.key === key)
                            if (!alreadyInQueue) {
                                setDownloadQueue(prev => [...prev, { key, label: config.label, file: config.file }])
                                void markMandatoryDownloadsPrompted([key])
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

          // ── Gate de foto de perfil ──
          // Si no tiene foto, bloqueamos el dashboard hasta que suba una.
          const photoUrl = (data as any).foto_perfil_url || null
          setProfilePhotoUrl(photoUrl)
          if (!photoUrl) setShowPhotoGate(true)

          // Comprobar descargas pendientes y llenar la cola una sola vez por envío
          const states = data.doc_states || {}
          const newQueue: any[] = []
          const keysToMarkAsPrompted: string[] = []
          
          Object.keys(MANDATORY_DOWNLOADS).forEach(key => {
              if (shouldPromptMandatoryDownload(states[key])) {
                  const config = MANDATORY_DOWNLOADS[key]
                  newQueue.push({ key, label: config.label, file: config.file })
                  keysToMarkAsPrompted.push(key)
              }
          })
          
          if (newQueue.length > 0) {
              setDownloadQueue(newQueue)
              void markMandatoryDownloadsPrompted(keysToMarkAsPrompted)
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
                  ...(currentStates[currentItem.key] || {}),
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
  const allDocKeys = [...Object.keys(DOC_LABELS_SSOMA_CLEAN), ...Object.keys(DOC_LABELS_RRHH)]
  const totalDocs = allDocKeys.length
  const completedDocs = allDocKeys.filter(key => docStates[key]?.status === 'completed').length
  const unlockedSignDocs = allDocKeys.filter(key => docStates[key]?.status === 'unlocked').length
  const pendingDownloadsCount = downloadQueue.length
  const totalPendingAction = unlockedSignDocs + pendingDownloadsCount
  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0

  return (
    <div className="flex h-screen font-sans text-stone-900 overflow-hidden relative">
      {/* Fondo cálido global con sutil noise/gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-stone-100 via-stone-50 to-red-50/40" />
      <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(1200px 600px at 90% -10%, rgba(220,38,38,0.10), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(120,113,108,0.10), transparent 60%)'
      }} />

      {/* --- SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {!isDesktop && isSidebarOpen && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-stone-900/40 z-40 backdrop-blur-sm lg:hidden"
            />
        )}
      </AnimatePresence>

      <motion.aside
        className={`bg-white/70 backdrop-blur-xl border-r border-white/60 flex flex-col h-full shrink-0 z-50 fixed lg:relative shadow-2xl shadow-red-900/5 lg:shadow-none w-72 lg:w-64`}
        initial={false}
        animate={{
            x: (isDesktop || isSidebarOpen) ? 0 : -288,
            width: (isDesktop || isSidebarOpen) ? 260 : 0
        }}
      >
        {/* Brand block — bloque crimson como el hero del móvil */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-stone-200/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10" />
            <div className="absolute -right-8 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-9 h-9 bg-white/95 rounded-lg flex items-center justify-center text-red-700 font-black text-lg shadow-lg ring-1 ring-white/40">R</div>
            <div>
                <h1 className="font-extrabold text-lg text-white leading-none tracking-tight">RUAG</h1>
                <span className="text-[10px] font-bold text-red-200 uppercase tracking-[0.18em]">Portal Obrero</span>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <div className="pt-1 pb-2 px-4 text-[10px] font-bold text-red-700 uppercase tracking-[0.2em] flex items-center gap-2">
                <span>Navegación</span>
                <span className="flex-1 h-px bg-stone-200" />
            </div>
            <NavItem
                active={activeTab === 'home'}
                onClick={() => { setActiveTab('home'); if(!isDesktop) setIsSidebarOpen(false) }}
                icon={<AnimatedIcon name="actualizarFicha" size={26} bounceOnMount={false}/>}
                label="Inicio"
            />
            <NavItem
                active={activeTab === 'documents'}
                onClick={() => { setActiveTab('documents'); if(!isDesktop) setIsSidebarOpen(false) }}
                icon={<AnimatedIcon name="misRegistros" size={26} bounceOnMount={false}/>}
                label="Mis Registros"
                badge={totalPendingAction > 0 ? totalPendingAction : undefined}
            />

            {/* --- ARCHIVOS SSOMA (icono GIF, alineado con app móvil) --- */}
            <NavItem
                active={activeTab === 'uploads'}
                onClick={() => { setActiveTab('uploads'); if(!isDesktop) setIsSidebarOpen(false) }}
                icon={<AnimatedIcon name="archivosSsoma" size={26} bounceOnMount={false}/>}
                label="Archivos SSOMA"
            />

            <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-red-700 uppercase tracking-[0.2em] flex items-center gap-2">
                <span>Mi Cuenta</span>
                <span className="flex-1 h-px bg-stone-200" />
            </div>
            <NavItem
                active={activeTab === 'profile'}
                onClick={() => { setActiveTab('profile'); if(!isDesktop) setIsSidebarOpen(false) }}
                icon={<AnimatedIcon name="miPerfil" size={26} bounceOnMount={false}/>}
                label="Mi Perfil"
            />
        </nav>

        <div className="p-4 border-t border-stone-200/60">
            <motion.button
                onClick={handleLogout}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-stone-600 hover:bg-red-50/80 hover:text-red-700 hover:ring-1 hover:ring-red-200 backdrop-blur transition-all font-bold text-sm group"
            >
                <motion.span
                    className="inline-flex"
                    whileHover={{ x: -3, rotate: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                >
                    <LogOut size={18}/>
                </motion.span>
                Cerrar Sesión
            </motion.button>
        </div>
      </motion.aside>


      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">

        {/* Header Superior — glass cream */}
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/60 px-4 md:px-8 flex items-center justify-between shrink-0 z-30 sticky top-0 shadow-sm shadow-red-900/5">
            <div className="flex items-center gap-4">
                <motion.button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    whileTap={{ scale: 0.9 }}
                    className="lg:hidden p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-500/25 ring-1 ring-white/40"
                >
                    <motion.span
                        className="inline-flex"
                        animate={{ rotate: isSidebarOpen ? 90 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                    </motion.span>
                </motion.button>
                <div className="flex flex-col leading-tight">
                    <span className="text-[9px] font-bold text-red-700 uppercase tracking-[0.2em]">
                        0{Math.max(1, ['home','documents','uploads','profile'].indexOf(activeTab) + 1)} · RUAG
                    </span>
                    <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
                        {activeTab === 'home' && 'Bienvenido'}
                        {activeTab === 'documents' && 'Firmas Digitales'}
                        {activeTab === 'uploads' && 'Documentos SSOMA'}
                        {activeTab === 'profile' && 'Configuración de Cuenta'}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <motion.button
                        onClick={() => { setIsNotifOpen(!isNotifOpen); setNotifications(prev => prev.map(n => ({...n, read: true}))) }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="relative p-2.5 rounded-xl bg-white/70 backdrop-blur border border-white/60 hover:border-red-200 hover:bg-white transition-colors text-stone-700 shadow-sm"
                    >
                        <motion.span
                            className="inline-flex"
                            animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, -4, 4, 0] } : { rotate: 0 }}
                            transition={unreadCount > 0 ? { duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' } : { duration: 0.2 }}
                            style={{ transformOrigin: '50% 10%' }}
                        >
                            <Bell size={18} strokeWidth={2.2} fill={unreadCount > 0 ? 'currentColor' : 'none'} fillOpacity={unreadCount > 0 ? 0.12 : 0}/>
                        </motion.span>
                        {unreadCount > 0 && (
                            <>
                                <motion.span
                                    className="absolute top-1.5 right-2 w-2 h-2 bg-red-600 rounded-full border border-white"
                                    animate={{ scale: [1, 1.25, 1] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <motion.span
                                    className="absolute top-1.5 right-2 w-2 h-2 bg-red-500/70 rounded-full"
                                    animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                                />
                            </>
                        )}
                    </motion.button>
                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div initial={{opacity:0, y: 10, scale: 0.95}} animate={{opacity:1, y: 0, scale: 1}} exit={{opacity:0, scale: 0.95}} className="absolute right-0 top-12 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-red-900/10 border border-white/60 overflow-hidden z-50 origin-top-right ring-1 ring-stone-900/5">
                                <div className="p-3 border-b border-stone-200/60 bg-gradient-to-br from-red-50/60 to-stone-50/60 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-[0.18em]">Notificaciones</span>
                                    <button onClick={() => setNotifications([])} className="text-red-700 hover:text-red-900 text-xs font-bold">Borrar</button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {notifications.length === 0 ? <p className="p-6 text-center text-xs text-stone-400">Sin novedades</p> : notifications.map(n => (
                                        <div key={n.id} className="p-3 border-b border-stone-100 hover:bg-red-50/40"><p className="text-sm text-stone-800 font-medium">{n.msg}</p><p className="text-[10px] text-stone-400 mt-1">{n.time}</p></div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 0 4px rgba(220,38,38,0.18)' }}
                    className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-xl flex items-center justify-center font-black border-2 border-white shadow-md ring-1 ring-red-200 cursor-pointer select-none"
                >
                    {userName.charAt(0)}
                </motion.div>
            </div>
        </header>

        {/* --- CONTENIDO DINÁMICO --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-5xl mx-auto">
                
                {/* VISTA: HOME */}
                {activeTab === 'home' && (
                    <motion.div initial={{opacity:0, y: 20}} animate={{opacity:1, y: 0}} className="space-y-8 pb-20">
                        {/* HERO CRIMSON GLASS */}
                        <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-2xl shadow-red-900/20">
                            {/* fondo gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10"/>
                            {/* glow lights */}
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-20 -right-20 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none"
                            />
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.5, 0.25] }}
                                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -bottom-24 -left-12 w-80 h-80 bg-red-500/30 rounded-full blur-3xl pointer-events-none"
                            />
                            <div className="relative z-10 p-8 text-stone-50">
                                {/* Top meta-row */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                                        <span className="relative flex">
                                            <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-300 opacity-75 animate-ping"/>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-300"/>
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">Online · RUAG/01</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 hidden sm:inline">{today}</span>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">01 — BIENVENIDO</span>
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95] mt-2 mb-3">
                                            {(userName || 'Compañero').toUpperCase()}
                                        </h1>
                                        <div className="w-12 h-0.5 bg-red-300 mb-3"/>
                                        <p className="text-white/75 max-w-md text-sm leading-relaxed">
                                            Portal RUAG. Gestiona tu ficha, firma documentos y mantén tu legajo al día — desde cualquier lugar.
                                        </p>
                                    </div>

                                    {/* Métrica glass-dark */}
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 min-w-[210px]">
                                        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/15"/>
                                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                    strokeDasharray={150.8}
                                                    strokeDashoffset={150.8 - (150.8 * progress) / 100}
                                                    strokeLinecap="round"
                                                    className="text-red-300 transition-all duration-1000"/>
                                            </svg>
                                            <span className="absolute text-xs font-black">{progress}%</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/55 font-bold uppercase tracking-[0.18em]">Documentación</p>
                                            <p className="text-2xl font-black tracking-tight leading-none mt-1">{completedDocs.toString().padStart(2,'0')}<span className="text-white/40 text-base"> / {totalDocs}</span></p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-200 mt-0.5">listos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-bold text-red-700 uppercase tracking-[0.22em]">02 — Acciones</span>
                                <span className="flex-1 h-px bg-stone-200" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight mb-1">
                                Accesos <span className="italic text-red-700">rápidos</span>
                            </h3>
                            <p className="text-sm text-stone-500 mb-5">Las tres rutas que más usas. Diseñadas para tocar, no para pensar.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <QuickAction
                                    index="01"
                                    icon="misRegistros"
                                    label="Mis Registros"
                                    badge={totalPendingAction > 0 ? totalPendingAction : undefined}
                                    onClick={() => setActiveTab('documents')}
                                />
                                <QuickAction
                                    index="02"
                                    icon="archivosSsoma"
                                    label="Archivos SSOMA"
                                    onClick={() => setActiveTab('uploads')}
                                />
                                <QuickAction
                                    index="03"
                                    icon="miPerfil"
                                    label="Mi Perfil"
                                    onClick={() => setActiveTab('profile')}
                                />
                            </div>
                        </div>

                        {/* Ficha Form (Visualización) */}
                        <FichaForm />
                    </motion.div>
                )}

                {/* VISTA: DOCUMENTOS (Firmas) */}
                {activeTab === 'documents' && (() => {
                    const allDocs = [...Object.entries(DOC_LABELS_SSOMA_CLEAN), ...Object.entries(DOC_LABELS_RRHH)]
                    const totalDocsView = allDocs.length
                    const completedView = allDocs.filter(([id]) => docStates[id]?.status === 'completed').length
                    const unlockedView = allDocs.filter(([id]) => docStates[id]?.status === 'unlocked').length
                    const lockedView = totalDocsView - completedView - unlockedView
                    const progressView = totalDocsView > 0 ? Math.round((completedView / totalDocsView) * 100) : 0

                    return (
                    <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x: 0}} className="space-y-8 pb-20">

                        {/* HERO COMPACTO con stats */}
                        <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-xl shadow-red-900/15">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10"/>
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-16 -right-12 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none"
                            />
                            <div className="relative z-10 p-6 md:p-7 text-stone-50">
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                                            <span className="relative flex">
                                                <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-300 opacity-75 animate-ping"/>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-300"/>
                                            </span>
                                            <span>01 · Registros</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                                            Mis <span className="italic text-red-300">Registros</span>
                                        </h2>
                                        <p className="text-white/70 text-xs md:text-sm mt-2 max-w-xl">Documentos y firmas habilitados por el administrador.</p>
                                    </div>
                                    {/* Progress ring */}
                                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3 min-w-[150px]">
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/15"/>
                                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                    strokeDasharray={150.8}
                                                    strokeDashoffset={150.8 - (150.8 * progressView) / 100}
                                                    strokeLinecap="round"
                                                    className="text-red-300 transition-all duration-1000"/>
                                            </svg>
                                            <span className="absolute text-[10px] font-black">{progressView}%</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/55 font-bold uppercase tracking-[0.18em]">Avance</p>
                                            <p className="text-lg font-black leading-none mt-0.5">{completedView}<span className="text-white/40 text-xs"> / {totalDocsView}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats pills compactas */}
                                <div className="grid grid-cols-3 gap-2">
                                    <DocStatPill icon="✓" label="Firmados" value={completedView} accent="emerald" />
                                    <DocStatPill icon="●" label="Disponibles" value={unlockedView} accent="amber" pulse />
                                    <DocStatPill icon="🔒" label="Bloqueados" value={lockedView} accent="slate" />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN SSOMA */}
                        <DocSection
                            index="02"
                            kicker="SSOMA · Seguridad"
                            title="SSOMA"
                            accent="Seguridad"
                            count={Object.keys(DOC_LABELS_SSOMA_CLEAN).length}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {Object.entries(DOC_LABELS_SSOMA_CLEAN).map(([docId, label], i) => (
                                    <DocItem
                                        key={docId}
                                        id={docId}
                                        index={(i + 1).toString().padStart(2, '0')}
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
                        </DocSection>

                        {/* SECCIÓN RRHH */}
                        <DocSection
                            index="03"
                            kicker="RRHH · Administrativo"
                            title="Recursos"
                            accent="Humanos"
                            count={Object.keys(DOC_LABELS_RRHH).length}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {Object.entries(DOC_LABELS_RRHH).map(([docId, label], i) => (
                                    <DocItem
                                        key={docId}
                                        id={docId}
                                        index={(i + 1).toString().padStart(2, '0')}
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
                        </DocSection>
                    </motion.div>
                    )
                })()}

                {/* --- NUEVA VISTA: DOCUMENTOS SUBIDOS POR SSOMA --- */}
                {activeTab === 'uploads' && (
                    <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x: 0}} className="space-y-8 pb-20">
                        {/* HERO GLASS CRIMSON */}
                        <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-xl shadow-red-900/15">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10"/>
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-16 -right-16 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none"
                            />
                            <div className="relative z-10 p-7 md:p-8 text-stone-50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center">
                                        <AnimatedIcon name="archivosSsoma" size={32} bounceOnMount={false}/>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">01 — Centro</span>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none mt-1">
                                            SSOMA <span className="italic text-red-300">Digital</span>
                                        </h2>
                                    </div>
                                </div>
                                <div className="w-12 h-0.5 bg-red-300 mb-3"/>
                                <p className="text-white/75 text-sm max-w-xl leading-relaxed">PDFs, anexos y archivos que el administrador deja listos para tu revisión.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="w-1 h-5 bg-red-600 rounded-full"/>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.22em]">02 — Tus archivos</span>
                            <span className="flex-1 h-px bg-stone-200" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SSOMA_UPLOADS_CONFIG.map((doc, idx) => {
                                const fileData = fullWorkerData?.uploads_state?.[doc.id]
                                const isAvailable = !!fileData

                                return (
                                    <motion.div
                                        key={doc.id}
                                        whileHover={isAvailable ? { y: -2 } : {}}
                                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                                        className={`relative p-5 rounded-2xl border backdrop-blur-xl overflow-hidden transition-all
                                            ${isAvailable
                                                ? 'bg-white/70 border-red-200 ring-1 ring-white/60 shadow-md shadow-red-900/5 hover:shadow-xl hover:shadow-red-900/15 hover:border-red-300'
                                                : 'bg-stone-100/60 border-stone-200/60 opacity-70'}`}
                                    >
                                        <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full ${isAvailable ? 'bg-gradient-to-b from-red-400 to-red-700' : 'bg-stone-300'}`}/>
                                        <div className="pl-2 flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-2xl font-black text-stone-300 leading-none tracking-tight">{(idx+1).toString().padStart(2,'0')}</span>
                                                <div className={`w-11 h-11 rounded-xl backdrop-blur ring-1 flex items-center justify-center shrink-0
                                                    ${isAvailable ? 'bg-white/80 text-red-700 ring-red-100' : 'bg-white/40 text-stone-400 ring-stone-200/60'}`}>
                                                    <FileText size={20}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className={`font-extrabold text-[14px] tracking-tight leading-tight line-clamp-2 ${isAvailable ? 'text-stone-900' : 'text-stone-500'}`} title={doc.label}>{doc.label}</h3>
                                                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-[0.2em] flex items-center gap-1.5 ${isAvailable ? 'text-red-700' : 'text-stone-400'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-red-500 animate-pulse' : 'bg-stone-400'}`}/>
                                                        {isAvailable ? 'Disponible' : 'Pendiente de carga'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isAvailable ? (
                                            <div className="pl-2 space-y-3">
                                                <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-white/50 backdrop-blur ring-1 ring-stone-200/60 p-2.5 rounded-lg">
                                                    <Clock size={12} className="text-red-700 shrink-0"/>
                                                    <span className="font-medium">Subido: {new Date(fileData.uploaded_at).toLocaleDateString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => window.open(fileData.url, '_blank')}
                                                    className="w-full py-2.5 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20 ring-1 ring-white/40 active:scale-95"
                                                >
                                                    <ExternalLink size={14}/> Ver documento
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ml-2 flex flex-col items-center justify-center h-20 text-stone-300 border-2 border-dashed border-stone-200/70 rounded-xl">
                                                <CloudOff size={20} className="mb-1"/>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Aún no disponible</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* VISTA: PERFIL */}
                {activeTab === 'profile' && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="max-w-lg mx-auto pb-20 space-y-6">
                        <ProfilePhotoCard
                            photoUrl={profilePhotoUrl}
                            workerName={userName}
                            onEdit={() => setShowPhotoGate(true)}
                        />
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

      {/* --- GATE FOTO DE PERFIL (bloquea sólo si no hay foto previa) --- */}
      <AnimatePresence>
        {showPhotoGate && userId && (
            <ProfilePhotoGate
                userId={userId}
                workerName={userName}
                dismissible={!!profilePhotoUrl}
                onDismiss={() => setShowPhotoGate(false)}
                onUploaded={(url) => {
                    setProfilePhotoUrl(url)
                    setFullWorkerData((prev: any) => prev ? { ...prev, foto_perfil_url: url } : prev)
                    setShowPhotoGate(false)
                }}
            />
        )}
      </AnimatePresence>

    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function QuickAction({ icon, label, accent = 'blue', badge, onClick, index = '01' }: { icon: 'actualizarFicha' | 'misRegistros' | 'archivosSsoma' | 'miPerfil' | 'chat', label: string, accent?: 'blue' | 'indigo' | 'amber' | 'rose', badge?: number, onClick: () => void, index?: string }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className="group relative bg-white/70 backdrop-blur-xl ring-1 ring-white/60 border border-white/60 rounded-2xl p-5 text-left overflow-hidden shadow-md shadow-red-900/5 hover:shadow-xl hover:shadow-red-900/15 hover:ring-red-200 transition-all"
        >
            {/* Línea vertical de acento crimson a la izquierda */}
            <div className="absolute left-0 top-5 bottom-5 w-[3px] bg-gradient-to-b from-red-500 to-red-800 rounded-r-full"/>
            {/* Glow detrás del icono al hover */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-300/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"/>

            <div className="relative pl-2 flex items-start justify-between mb-3">
                {/* Index editorial */}
                <span className="text-2xl font-black text-stone-300 tracking-tight leading-none">{index}</span>
                <div className="flex items-center gap-2">
                    {badge && badge > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                            className="bg-gradient-to-br from-red-600 to-red-800 text-white text-[10px] font-extrabold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-md shadow-red-500/30 ring-1 ring-white/40"
                        >
                            {badge}
                        </motion.span>
                    )}
                    {/* Icono GIF dentro de un chip glass */}
                    <div className="w-11 h-11 rounded-xl bg-white/70 backdrop-blur ring-1 ring-white/70 border border-white/40 flex items-center justify-center shadow-sm">
                        <AnimatedIcon name={icon} size={32} bounceOnMount={false}/>
                    </div>
                </div>
            </div>
            <div className="relative pl-2">
                <p className="text-sm font-extrabold text-stone-900 leading-tight tracking-tight">{label}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-red-700 uppercase tracking-[0.2em]">
                    <span>Abrir</span>
                    <ArrowUpRight size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                </div>
            </div>
        </motion.button>
    )
}

function DocStatPill({ icon, label, value, accent, pulse }: { icon: string, label: string, value: number, accent: 'emerald' | 'amber' | 'slate', pulse?: boolean }) {
    const colors: Record<string, { bg: string, txt: string, dot: string }> = {
        emerald: { bg: 'bg-emerald-300/15 border-emerald-300/30', txt: 'text-emerald-200', dot: 'bg-emerald-300' },
        amber:   { bg: 'bg-amber-300/15 border-amber-300/30',     txt: 'text-amber-200',   dot: 'bg-amber-300' },
        slate:   { bg: 'bg-white/8 border-white/15',               txt: 'text-white/65',    dot: 'bg-white/50' },
    }
    const c = colors[accent]
    return (
        <div className={`relative ${c.bg} border backdrop-blur rounded-xl px-3 py-2.5 flex items-center gap-3`}>
            <span className={`relative inline-flex w-2 h-2 rounded-full ${c.dot}`}>
                {pulse && <span className={`absolute inset-0 ${c.dot} rounded-full animate-ping opacity-75`}/>}
            </span>
            <div className="flex-1 min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${c.txt}`}>{label}</p>
                <p className="text-xl font-black text-white tracking-tight leading-none mt-0.5">{value.toString().padStart(2, '0')}</p>
            </div>
        </div>
    )
}

function DocSection({ index, kicker, title, accent, count, children }: { index: string, kicker: string, title: string, accent: string, count: number, children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-end justify-between gap-3 mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-1 h-4 bg-red-600 rounded-full"/>
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-[0.22em]">{index} — {kicker}</span>
                        <span className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.18em]">{count.toString().padStart(2,'0')} docs</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
                        {title} <span className="italic text-red-700">{accent}</span>
                    </h3>
                </div>
            </div>
            {children}
        </div>
    )
}

function DocItem({ id, label, state, onClick, type, index }: any) {
    const status = state?.status || 'locked'
    const isUnlocked = status === 'unlocked'
    const isCompleted = status === 'completed'
    const isLocked = !isUnlocked && !isCompleted
    const isOpenable = isUnlocked || isCompleted

    return (
        <motion.div
            onClick={onClick}
            whileHover={!isLocked ? { y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.99 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`group relative rounded-2xl border cursor-pointer overflow-hidden transition-all
                ${isCompleted ? 'bg-gradient-to-br from-emerald-50/70 via-white/80 to-white/80 border-emerald-200/80 ring-1 ring-emerald-100/60 hover:shadow-lg hover:shadow-emerald-900/10 hover:border-emerald-300' :
                  isUnlocked ? 'bg-gradient-to-br from-red-50/70 via-white/80 to-white/80 border-red-200/80 ring-1 ring-red-100/60 shadow-md shadow-red-900/5 hover:shadow-xl hover:shadow-red-900/15 hover:border-red-300' :
                  'bg-stone-100/50 border-stone-200/60 grayscale opacity-60 hover:opacity-80'}
                backdrop-blur-xl`}
        >
            {/* Línea vertical de acento por estado */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isCompleted ? 'bg-gradient-to-b from-emerald-400 to-emerald-700' : isUnlocked ? 'bg-gradient-to-b from-red-400 to-red-700' : 'bg-stone-300'}`}/>

            {/* Glow al hover */}
            {!isLocked && (
                <div className={`absolute -right-12 -bottom-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${isCompleted ? 'bg-emerald-300/30' : 'bg-red-300/30'}`}/>
            )}

            <div className="relative p-4 flex items-start gap-4">
                {/* Index + Icono */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <span className={`text-xs font-black tracking-tight ${isCompleted ? 'text-emerald-600' : isUnlocked ? 'text-red-700' : 'text-stone-400'}`}>
                        {index || ''}
                    </span>
                    <motion.div
                        whileHover={!isLocked ? { rotate: [-3, 3, -3, 0], scale: 1.08 } : {}}
                        transition={{ duration: 0.5 }}
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center ring-1 transition-colors backdrop-blur
                            ${isCompleted ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                              isUnlocked ? 'bg-white/90 text-red-700 ring-red-200' :
                              'bg-white/40 text-stone-400 ring-stone-200/60'}`}
                    >
                        {isCompleted ? (
                            <Eye size={20} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12}/>
                        ) : type === 'rrhh' ? (
                            <Briefcase size={20} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12}/>
                        ) : (
                            <FileText size={20} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12}/>
                        )}
                        {isCompleted && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full ring-2 ring-white flex items-center justify-center">
                                <CheckCircle size={9} className="text-white"/>
                            </span>
                        )}
                    </motion.div>
                </div>

                {/* Cuerpo: label + status + categoría */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className={`font-extrabold text-[14px] tracking-tight leading-snug ${isLocked ? 'text-stone-500' : 'text-stone-900'}`}>
                            {label}
                        </h3>
                        <motion.div
                            animate={isLocked || !isOpenable ? {} : { x: [0, 3, 0] }}
                            transition={isLocked ? {} : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                            className={`shrink-0 p-1.5 rounded-lg ring-1 transition-colors ${
                                isLocked ? 'bg-stone-50 text-stone-300 ring-stone-200/60' :
                                isCompleted ? 'bg-white text-emerald-700 ring-emerald-200 group-hover:bg-emerald-50' :
                                'bg-white text-red-700 ring-red-200 group-hover:bg-red-50'
                            }`}
                        >
                            {isLocked ? <Lock size={14}/> : <ArrowUpRight size={14}/>}
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Categoría pill */}
                        <span className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full ring-1 ${
                            type === 'rrhh' ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-stone-100 text-stone-600 ring-stone-200'
                        }`}>
                            {type === 'rrhh' ? 'RRHH' : 'SSOMA'}
                        </span>
                        {/* Estado pill */}
                        <span className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full ring-1 inline-flex items-center gap-1.5 ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                            isUnlocked ? 'bg-red-50 text-red-700 ring-red-200' :
                            'bg-stone-50 text-stone-500 ring-stone-200'
                        }`}>
                            <span className={`w-1 h-1 rounded-full ${isCompleted ? 'bg-emerald-600' : isUnlocked ? 'bg-red-600 animate-pulse' : 'bg-stone-400'}`}/>
                            {isCompleted ? 'Enviado' : isUnlocked ? 'Pendiente firma' : 'Bloqueado'}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function NavItem({ active, onClick, icon, activeIcon, label, badge }: any) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ x: active ? 0 : 3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold group overflow-hidden ${active ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
        >
            {active && (
                <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-xl border border-white/70 shadow-sm shadow-red-900/10 ring-1 ring-red-200/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            )}
            {active && (
                <motion.span
                    layoutId="nav-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-red-500 to-red-800 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            )}
            <span className={`relative flex items-center gap-3 z-10`}>
                <motion.span
                    key={active ? 'active' : 'idle'}
                    initial={{ scale: 0.7, rotate: active ? -12 : 0, opacity: 0.6 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    whileHover={!active ? { scale: 1.15, rotate: -6 } : { scale: 1.08 }}
                    className={`inline-flex ${active ? 'text-red-700' : 'text-stone-400 group-hover:text-red-700'}`}
                >
                    {active && activeIcon ? activeIcon : icon}
                </motion.span>
                <span>{label}</span>
            </span>
            {badge && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                    className="relative z-10 bg-gradient-to-br from-red-600 to-red-800 text-white text-[10px] font-extrabold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-md shadow-red-500/30 ring-1 ring-white/40"
                >
                    {badge}
                </motion.span>
            )}
        </motion.button>
    )
}

// --- CARD DE PERFIL ---
function ProfilePhotoCard({ photoUrl, workerName, onEdit }: { photoUrl: string | null; workerName: string; onEdit: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/[0.04] overflow-hidden"
        >
            <div className="p-6 flex items-center gap-5">
                {/* Avatar grande */}
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="relative h-24 w-24 shrink-0 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner"
                >
                    {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt="Foto perfil" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 text-3xl font-black">
                            {workerName?.charAt(0) || 'R'}
                        </div>
                    )}
                    {photoUrl && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white"
                        >
                            <CheckCircle size={12} />
                        </motion.span>
                    )}
                </motion.div>

                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">Foto de perfil</p>
                    <h3 className="mt-1 text-[17px] font-black text-slate-900 tracking-tight truncate">
                        {photoUrl ? 'Foto activa' : 'Aún sin foto'}
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                        {photoUrl
                            ? 'Toca el botón para reemplazarla con una nueva.'
                            : 'Sube una foto formal para identificarte ante el administrador.'}
                    </p>
                </div>
            </div>

            <div className="px-6 pb-6">
                <motion.button
                    onClick={onEdit}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white text-[12px] font-bold uppercase tracking-[0.18em] shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all"
                >
                    <Camera size={16} />
                    {photoUrl ? 'Cambiar foto' : 'Subir foto ahora'}
                </motion.button>
            </div>
        </motion.div>
    )
}

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
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-red-900/10 border border-white/60 ring-1 ring-white/60 overflow-hidden">
            {/* Hero glass crimson */}
            <div className="relative overflow-hidden p-8 border-b border-white/60 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10"/>
                <motion.div
                    aria-hidden
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 16 }}
                    whileHover={{ rotate: [0, -8, 8, -4, 4, 0], transition: { duration: 0.6 } }}
                    className="relative w-20 h-20 bg-white/95 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-white/40 shadow-xl"
                >
                    <motion.span
                        className="absolute inset-0 rounded-2xl ring-2 ring-red-300/60"
                        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <IdCard size={36} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12}/>
                </motion.div>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">00 — Ajustes</span>
                <h2 className="text-2xl md:text-3xl font-black text-stone-50 tracking-tight mt-2">
                    Configurar <span className="italic text-red-300">Cuenta</span>
                </h2>
                <p className="text-white/70 text-xs md:text-sm mt-2 max-w-xs mx-auto leading-relaxed">Actualiza tu correo y contraseña para asegurar tu acceso al sistema.</p>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-5">
                <div>
                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-[0.22em] mb-2 pl-1">Correo Electrónico</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18}/>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur border border-white/60 ring-1 ring-stone-200/60 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:ring-4 focus:ring-red-200/50 focus:border-red-400 outline-none transition-all"
                            placeholder="tuemail@ejemplo.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-[0.22em] mb-2 pl-1">Nueva Contraseña</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18}/>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur border border-white/60 ring-1 ring-stone-200/60 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:ring-4 focus:ring-red-200/50 focus:border-red-400 outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-[0.22em] mb-2 pl-1">Confirmar Contraseña</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18}/>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur border border-white/60 ring-1 ring-stone-200/60 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:ring-4 focus:ring-red-200/50 focus:border-red-400 outline-none transition-all"
                            placeholder="Repite la contraseña"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-br from-red-600 to-red-900 text-white rounded-xl font-extrabold uppercase tracking-[0.18em] text-sm shadow-lg shadow-red-500/30 ring-1 ring-white/40 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-70 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {loading ? 'Actualizando…' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}

// --- MODAL DE LECTURA Y CONFIRMACIÓN DE DOCUMENTOS ---
function DocumentFillingModal({ docId, category, fichaId, existingData, fullFichaData, status = 'locked', onClose, onSave }: any) {
    const supabase = createClient()
    const safeExistingData = existingData && Object.keys(existingData).length > 0 ? existingData : EMPTY_DOC_DATA
    const [checks, setChecks] = useState<Record<string, boolean>>(safeExistingData)
    const [manualFields, setManualFields] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const content = DOC_CONTENT[docId] ?? EMPTY_DOC_CONTENT
    const showChecklist = content.length > 0
    const hasManualFields = DOCS_WITH_MANUAL_FIELDS.has(docId)
    const isCompleted = status === 'completed'
    const isHorizontal = ['capacitacion', 'epp'].includes(docId)
    const [scale, setScale] = useState(1)
    const [modalStep, setModalStep] = useState<'checklist' | 'form' | 'preview'>(showChecklist && !isCompleted ? 'checklist' : hasManualFields ? 'form' : 'preview')
    const isChecklistStep = showChecklist && modalStep === 'checklist'
    const isFormStep = hasManualFields && modalStep === 'form'
    const checklistSelectedCount = content.filter((_, idx) => checks[`topic_${idx}`]).length
    const allChecked = content.length > 0 && checklistSelectedCount === content.length

    useEffect(() => {
        const normalizedChecks = (content || []).reduce((acc, _, idx) => {
            acc[`topic_${idx}`] = !!safeExistingData?.[`topic_${idx}`]
            return acc
        }, {} as Record<string, boolean>)

        setChecks(showChecklist ? normalizedChecks : safeExistingData)
        setManualFields(buildDocumentFormState(docId, safeExistingData))
    }, [docId, safeExistingData, showChecklist, content])

    useEffect(() => {
        setModalStep(showChecklist && !isCompleted ? 'checklist' : hasManualFields ? 'form' : 'preview')
    }, [docId, showChecklist, isCompleted, hasManualFields])
    
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
                data: buildDocumentPayload(docId, checks, manualFields, ((fullFichaData.doc_states || {})[docId]?.data || safeExistingData))
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
            case 'ficha_covid': return <FichaSintomatologicaPrintable {...props} />
            case 'acta_acatamiento': return <ActaAcatamientoPrintable {...props} />
            case 'acta_emo': return <ActaEntregaResultadosEmoPrintable {...props} />
            case 'rec_sst': return <CargoRecomendacionesPrintable {...props} />
            // RRHH
            case 'cargo_rit': return <CargoRitPrintable {...props} />
            case 'cargo_politica_prevencion': return <CargoPoliticaPrevencionPrintable {...props} />
            default: return null
        }
    }

    const toggleCheck = (idx: number) => { setChecks(prev => ({ ...prev, [`topic_${idx}`]: !prev[`topic_${idx}`] })) }
    const setAllChecks = (checked: boolean) => {
        setChecks(content.reduce((acc, _, idx) => {
            acc[`topic_${idx}`] = checked
            return acc
        }, {} as Record<string, boolean>))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', fichaId).single()
            const currentStates = currentFicha?.doc_states || {}
            const dataToSave = buildDocumentPayload(docId, checks, manualFields, currentStates?.[docId]?.data || safeExistingData)

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
            toast.success(isCompleted ? "Documento actualizado correctamente" : "Documento guardado y firmado correctamente")
            onSave()
        } catch (e) { toast.error("Error al guardar") } finally { setSaving(false) }
    }

    const docLabel = category === 'rrhh' ? DOC_LABELS_RRHH[docId] : DOC_LABELS_SSOMA_CLEAN[docId]

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
                                ? "Documento enviado. Puedes revisarlo, editarlo y volver a guardarlo."
                                : isChecklistStep
                                    ? "Marca primero lo que corresponde y luego pasarás al documento para firmarlo."
                                    : showChecklist
                                        ? "Revisa cómo quedará el documento con tus marcas antes de firmarlo."
                                    : "Lee atentamente el documento antes de firmar."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(showChecklist || hasManualFields) && (
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${isChecklistStep ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
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
                                        <h4 className="text-lg font-bold text-slate-900">Selecciona lo que corresponde antes de enviarlo</h4>
                                        <p className="text-sm text-slate-500 mt-1">Estas marcas se guardarán exactamente así y luego aparecerán en la impresión del admin.</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                            {checklistSelectedCount}/{content.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAllChecks(!allChecked)}
                                            className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            {allChecked ? 'Limpiar' : 'Marcar todo'}
                                        </button>
                                    </div>
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
                    ) : isFormStep ? (
                        <div className="min-h-full p-5 md:p-8">
                            <div className="max-w-5xl mx-auto bg-white rounded-[28px] border border-slate-200 shadow-xl p-5 md:p-7">
                                <ManualDocumentForm docId={docId} values={manualFields} onChange={setManualFields} />
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
                            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <Eye className="text-slate-600 shrink-0 mt-0.5" size={18}/>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">Este documento ya fue enviado. Puedes previsualizarlo, volver a editar sus marcas y guardar una nueva versión cuando lo necesites.</p>
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
                        <div className={`grid gap-3 ${(showChecklist || hasManualFields) && !isChecklistStep && !isFormStep ? 'md:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
                            {(showChecklist || hasManualFields) && !isChecklistStep && !isFormStep && (
                                <button
                                    type="button"
                                    onClick={() => setModalStep(hasManualFields ? 'form' : 'checklist')}
                                    className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                    {hasManualFields ? 'EDITAR DATOS' : 'EDITAR MARCAS'}
                                </button>
                            )}
                            <button onClick={isChecklistStep ? () => setModalStep(hasManualFields ? 'form' : 'preview') : isFormStep ? () => setModalStep('preview') : handleSave} disabled={saving} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                                {saving ? 'Validando...' : isChecklistStep ? (hasManualFields ? 'CONTINUAR A DATOS' : 'CONTINUAR AL DOCUMENTO') : isFormStep ? 'CONTINUAR A VISTA PREVIA' : isCompleted ? 'GUARDAR CAMBIOS' : showChecklist ? 'FIRMAR Y GUARDAR' : 'CONFIRMAR LECTURA Y GUARDAR'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function ManualDocumentForm({ docId, values, onChange }: { docId: string; values: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
    const updateField = (key: string, value: string) => {
        onChange({ ...values, [key]: value })
    }

    const renderYesNo = (key: string) => (
        <div className="flex flex-wrap gap-2">
            {['si', 'no'].map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => updateField(key, option)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${values[key] === option ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                >
                    {option === 'si' ? 'Si' : 'No'}
                </button>
            ))}
        </div>
    )

    if (docId === 'ficha_covid') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa la ficha sintomatologica</h4>
                    <p className="text-sm text-slate-500 mt-1">Estos datos llenaran digitalmente el formato COVID antes de enviarlo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Area de trabajo
                        <input type="text" value={values.area_trabajo || ''} onChange={(e) => updateField('area_trabajo', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Celular
                        <input type="text" value={values.celular || ''} onChange={(e) => updateField('celular', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Direccion domiciliaria
                        <input type="text" value={values.direccion_domicilio || ''} onChange={(e) => updateField('direccion_domicilio', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>

                <div className="space-y-3">
                    <div>
                        <h5 className="text-sm font-bold text-slate-900">Sintomas en los ultimos 10 dias</h5>
                        <p className="text-xs text-slate-500 mt-1">Marca "Si" o "No" para cada pregunta.</p>
                    </div>
                    {[
                        ['symptom_1', 'Sensacion de alza termica, fiebre o malestar'],
                        ['symptom_2', 'Dolor de garganta, tos, estornudos o dificultad para respirar'],
                        ['symptom_3', 'Dolor de cabeza, diarrea o congestion nasal'],
                        ['symptom_4', 'Perdida del gusto y/o del olfato'],
                        ['symptom_5', 'Contacto con caso confirmado de COVID-19'],
                    ].map(([key, label]) => (
                        <div key={key} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                            {renderYesNo(key)}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                        <p className="text-sm font-bold text-slate-900 mb-3">Tomas alguna medicacion?</p>
                        <div className="mb-3">{renderYesNo('medicacion_toma')}</div>
                        <label className="text-xs font-semibold text-slate-500">Detalle de medicacion
                            <input type="text" value={values.medicacion_detalle || ''} onChange={(e) => updateField('medicacion_detalle', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                        </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                        <p className="text-sm font-bold text-slate-900 mb-3">Perteneces a grupo de riesgo?</p>
                        {renderYesNo('grupo_riesgo')}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                    <p className="text-sm font-bold text-slate-900 mb-3">Factores de riesgo</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {[
                            ['risk_mayor_65', 'Mayor de 65 anos'],
                            ['risk_cancer', 'Cancer'],
                            ['risk_renal', 'Enfermedad renal cronica'],
                            ['risk_pulmonar', 'Enfermedad pulmonar cronica'],
                            ['risk_cardiaca', 'Afecciones cardiacas'],
                            ['risk_dm', 'Diabetes mellitus'],
                            ['risk_obesidad', 'Obesidad'],
                            ['risk_inmuno', 'Inmunosupresion'],
                            ['risk_trasplante', 'Trasplante de organos'],
                            ['risk_cerebro', 'Enfermedad cerebrovascular'],
                            ['risk_hipertension', 'Hipertension arterial'],
                            ['risk_down', 'Sindrome de Down'],
                            ['risk_embarazo', 'Embarazo'],
                            ['risk_vih', 'VIH'],
                            ['risk_otros', 'Otros'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => updateField(key, values[key] === 'si' ? 'no' : 'si')}
                                className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${values[key] === 'si' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                            >
                                <span>{label}</span>
                                <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-black ${values[key] === 'si' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'}`}>X</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Dosis de vacuna / observacion
                        <input type="text" value={values.vacunas_dosis || ''} onChange={(e) => updateField('vacunas_dosis', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Fecha del documento
                        <input type="date" value={values.fecha_documento || ''} onChange={(e) => updateField('fecha_documento', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>
            </div>
        )
    }

    if (docId === 'acta_emo') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa los campos del acta EMO</h4>
                    <p className="text-sm text-slate-500 mt-1">Se usaran para rellenar el formato de entrega de resultados del examen medico ocupacional.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        ['cargo', 'Cargo', 'text'],
                        ['area', 'Area', 'text'],
                        ['sede_obra', 'Sede / obra', 'text'],
                        ['fecha_evaluacion', 'Fecha de evaluacion', 'date'],
                        ['fecha_documento', 'Fecha del documento', 'date'],
                        ['medico_ocupacional', 'Medico ocupacional', 'text'],
                    ].map(([key, label, type]) => (
                        <label key={key} className="text-xs font-semibold text-slate-500">
                            {label}
                            <input type={type} value={values[key] || ''} onChange={(e) => updateField(key, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                        </label>
                    ))}
                </div>
            </div>
        )
    }

    if (docId === 'acta_acatamiento' || docId === 'rec_sst') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">{docId === 'acta_acatamiento' ? 'Completa el acta de acatamiento' : 'Completa el cargo de recomendaciones'}</h4>
                    <p className="text-sm text-slate-500 mt-1">La fecha se reflejara directamente en la version digital del documento.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Fecha del documento
                        <input type="date" value={values.fecha_documento || ''} onChange={(e) => updateField('fecha_documento', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>
            </div>
        )
    }

    if (docId === 'epp') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa las fechas de entrega y el responsable</h4>
                    <p className="text-sm text-slate-500 mt-1">Las celdas de firma se mostrarán como conformidad digital al guardar el documento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Obra
                        <input type="text" value={values.obra || ''} onChange={(e) => updateField('obra', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>

                <div className="space-y-4 max-h-[52vh] overflow-auto pr-1">
                    {EPP_ITEMS.map((item, rowIndex) => (
                        <div key={item} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                            <p className="text-sm font-bold text-slate-800 mb-3">{item}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((delivery) => (
                                    <label key={delivery} className="text-xs font-semibold text-slate-500">
                                        {`${delivery}ra entrega`.replace('3ra', '3ra').replace('4ra', '4ta')}
                                        <input
                                            type="date"
                                            value={values[`epp_${rowIndex}_delivery_${delivery}_date`] || ''}
                                            onChange={(e) => updateField(`epp_${rowIndex}_delivery_${delivery}_date`, e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Responsable - Nombre
                        <input type="text" value={values.responsable_nombre || ''} onChange={(e) => updateField('responsable_nombre', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Responsable - Cargo
                        <input type="text" value={values.responsable_cargo || ''} onChange={(e) => updateField('responsable_cargo', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Responsable - Fecha
                        <input type="date" value={values.responsable_fecha || ''} onChange={(e) => updateField('responsable_fecha', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Responsable - Firma (texto)
                        <input type="text" value={values.responsable_firma_texto || ''} onChange={(e) => updateField('responsable_firma_texto', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>
            </div>
        )
    }

    if (docId === 'capacitacion') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa los campos del registro</h4>
                    <p className="text-sm text-slate-500 mt-1">Esto llenará los espacios en blanco del formato antes de la firma final.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        ['cantidad_trabajadores', 'N° trabajadores en el centro laboral', 'text'],
                        ['otros_detalle', 'Otros (especificar)', 'text'],
                        ['lugar', 'Lugar', 'text'],
                        ['tema', 'Tema', 'text'],
                        ['fecha', 'Fecha', 'date'],
                        ['hora_inicio', 'Hora inicio', 'time'],
                        ['hora_fin', 'Hora fin', 'time'],
                        ['total_horas', 'Total horas', 'text'],
                        ['capacitador_nombre', 'Nombre del capacitador', 'text'],
                        ['capacitador_firma_texto', 'Firma del capacitador (texto)', 'text'],
                        ['responsable_nombre', 'Responsable del registro - nombre', 'text'],
                        ['responsable_cargo', 'Responsable del registro - cargo', 'text'],
                        ['responsable_fecha', 'Responsable del registro - fecha', 'date'],
                        ['responsable_firma_texto', 'Responsable del registro - firma (texto)', 'text'],
                    ].map(([key, label, type]) => (
                        <label key={key} className="text-xs font-semibold text-slate-500">
                            {label}
                            <input type={type} value={values[key] || ''} onChange={(e) => updateField(key, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                        </label>
                    ))}
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Observaciones
                        <textarea value={values.observaciones || ''} onChange={(e) => updateField('observaciones', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-y" />
                    </label>
                </div>
            </div>
        )
    }

    if (docId === 'ficha_covid') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa la ficha sintomatológica</h4>
                    <p className="text-sm text-slate-500 mt-1">Estos datos llenarán digitalmente el formato COVID antes de enviarlo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Área de trabajo
                        <input type="text" value={values.area_trabajo || ''} onChange={(e) => updateField('area_trabajo', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Celular
                        <input type="text" value={values.celular || ''} onChange={(e) => updateField('celular', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Dirección domiciliaria
                        <input type="text" value={values.direccion_domicilio || ''} onChange={(e) => updateField('direccion_domicilio', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>

                <div className="space-y-3">
                    <div>
                        <h5 className="text-sm font-bold text-slate-900">Síntomas en los últimos 10 días</h5>
                        <p className="text-xs text-slate-500 mt-1">Marca "Sí" o "No" para cada pregunta.</p>
                    </div>
                    {[
                        ['symptom_1', 'Sensación de alza térmica, fiebre o malestar'],
                        ['symptom_2', 'Dolor de garganta, tos, estornudos o dificultad para respirar'],
                        ['symptom_3', 'Dolor de cabeza, diarrea o congestión nasal'],
                        ['symptom_4', 'Pérdida del gusto y/o del olfato'],
                        ['symptom_5', 'Contacto con caso confirmado de COVID-19'],
                    ].map(([key, label]) => (
                        <div key={key} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                            <div className="flex flex-wrap gap-2">
                                {['si', 'no'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => updateField(key, option)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${values[key] === option ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                    >
                                        {option === 'si' ? 'Sí' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                        <p className="text-sm font-bold text-slate-900 mb-3">¿Tomas alguna medicación?</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {['si', 'no'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateField('medicacion_toma', option)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${values.medicacion_toma === option ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                >
                                    {option === 'si' ? 'Sí' : 'No'}
                                </button>
                            ))}
                        </div>
                        <label className="text-xs font-semibold text-slate-500">Detalle de medicación
                            <input type="text" value={values.medicacion_detalle || ''} onChange={(e) => updateField('medicacion_detalle', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                        </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                        <p className="text-sm font-bold text-slate-900 mb-3">¿Perteneces a grupo de riesgo?</p>
                        <div className="flex flex-wrap gap-2">
                            {['si', 'no'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateField('grupo_riesgo', option)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${values.grupo_riesgo === option ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                >
                                    {option === 'si' ? 'Sí' : 'No'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                    <p className="text-sm font-bold text-slate-900 mb-3">Factores de riesgo</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {[
                            ['risk_mayor_65', 'Mayor de 65 años'],
                            ['risk_cancer', 'Cáncer'],
                            ['risk_renal', 'Enfermedad renal crónica'],
                            ['risk_pulmonar', 'Enfermedad pulmonar crónica'],
                            ['risk_cardiaca', 'Afecciones cardíacas'],
                            ['risk_dm', 'Diabetes mellitus'],
                            ['risk_obesidad', 'Obesidad'],
                            ['risk_inmuno', 'Inmunosupresión'],
                            ['risk_trasplante', 'Trasplante de órganos'],
                            ['risk_cerebro', 'Enfermedad cerebrovascular'],
                            ['risk_hipertension', 'Hipertensión arterial'],
                            ['risk_down', 'Síndrome de Down'],
                            ['risk_embarazo', 'Embarazo'],
                            ['risk_vih', 'VIH'],
                            ['risk_otros', 'Otros'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => updateField(key, values[key] === 'si' ? 'no' : 'si')}
                                className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${values[key] === 'si' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                            >
                                <span>{label}</span>
                                <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-black ${values[key] === 'si' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'}`}>X</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Dosis de vacuna / observación
                        <input type="text" value={values.vacunas_dosis || ''} onChange={(e) => updateField('vacunas_dosis', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Fecha del documento
                        <input type="date" value={values.fecha_documento || ''} onChange={(e) => updateField('fecha_documento', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>
            </div>
        )
    }

    if (docId === 'acta_emo') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">Completa los campos del acta EMO</h4>
                    <p className="text-sm text-slate-500 mt-1">Se usarán para rellenar el formato de entrega de resultados del examen médico ocupacional.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        ['cargo', 'Cargo', 'text'],
                        ['area', 'Área', 'text'],
                        ['sede_obra', 'Sede / obra', 'text'],
                        ['fecha_evaluacion', 'Fecha de evaluación', 'date'],
                        ['fecha_documento', 'Fecha del documento', 'date'],
                        ['medico_ocupacional', 'Médico ocupacional', 'text'],
                    ].map(([key, label, type]) => (
                        <label key={key} className="text-xs font-semibold text-slate-500">
                            {label}
                            <input type={type} value={values[key] || ''} onChange={(e) => updateField(key, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                        </label>
                    ))}
                </div>
            </div>
        )
    }

    if (docId === 'acta_acatamiento' || docId === 'rec_sst') {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Datos manuales</p>
                    <h4 className="text-lg font-bold text-slate-900">{docId === 'acta_acatamiento' ? 'Completa el acta de acatamiento' : 'Completa el cargo de recomendaciones'}</h4>
                    <p className="text-sm text-slate-500 mt-1">La fecha se reflejará directamente en la versión digital del documento.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-semibold text-slate-500">Fecha del documento
                        <input type="date" value={values.fecha_documento || ''} onChange={(e) => updateField('fecha_documento', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                    </label>
                </div>
            </div>
        )
    }

    return null
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
