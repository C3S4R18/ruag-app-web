'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminTable from '@/components/AdminTable'
import MassImport from '@/components/MassImport'
import ChatSystem from '@/components/ChatSystem'
import AdminTour from '@/components/AdminTour'
import BiometricBatchUpload from '@/components/BiometricBatchUpload'
import VidaLeyManager from '@/components/VidaLeyManager'
import CesadosManager from '@/components/CesadosManager'
import SctrManager from '@/components/SctrManager'

// IMPORTS COMPONENTES
import BiometricSignature from '@/components/ssoma/BiometricSignature'
import BiometricFingerprint from '@/components/ssoma/BiometricFingerprint'

import {
  LayoutGrid, Users, LogOut, ShieldCheck,
  Search, TrendingUp, Activity, HardHat, UploadCloud, X,
  LayoutDashboard, Fingerprint, Menu, PenTool, CheckCircle, Loader2,
  FileText, Lock, Unlock, ScanLine, Trash2, ChevronRight,
  UserCog, Mail, Key, Save, Send, ScanFace, Zap, Briefcase, FileBadge,
  HeartHandshake, CheckSquare, Square, ExternalLink, ArrowUpDown,
  Award, BookOpen, ShieldAlert, FileSpreadsheet, UserX, Wifi, WifiOff,
  Building, ArrowRightCircle, PlusCircle, Maximize2, FileCheck, Layers, Eye,
  Minimize2, FolderUp, Paperclip, Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- INTERFAZ PARA DOCUMENTOS ---
interface DocDefinition {
  id: string;
  label: string;
  type?: string;
  desc?: string;
}

// --- CONFIGURACIÓN DOCUMENTOS SSOMA (REGISTROS SIG) ---
const DIGITAL_DOCS: DocDefinition[] = [
  { id: 'risst', label: 'Cargo RISST', type: 'lock' },
  { id: 'capacitacion', label: 'Registro Capacitación', type: 'lock' },
  { id: 'induccion', label: 'Inducción Hombre Nuevo', type: 'lock' },
  { id: 'epp', label: 'Entrega de EPPs', type: 'lock' },
  { id: 'acta_derecho', label: 'Acta Derecho a Saber', type: 'lock' },
  { id: 'iperc', label: 'Entrega IPERC', type: 'lock' },
]

// --- NUEVA CONFIGURACIÓN: DOCUMENTOS PARA SUBIR (SSOMA -> OBRERO) ---
const SSOMA_UPLOADS_CONFIG: DocDefinition[] = [
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

// --- CONFIGURACIÓN DOCUMENTOS RRHH ---
const RRHH_DOCS_CONFIG: DocDefinition[] = [
  { id: 'rit_pdf_download', label: 'Reglamento Interno Trabajo (RIT)', type: 'pdf' },
  { id: 'hostigamiento_pdf_download', label: 'Política Hostigamiento', type: 'pdf' },
  { id: 'beneficiarios_pdf_download', label: 'Declaración Beneficiarios', type: 'pdf' },
  { id: 'etica_pdf_download', label: 'Código de Ética y Conducta', type: 'pdf' },
  { id: 'antisoborno_pdf_download', label: 'Política Antisoborno', type: 'pdf' },
  { id: 'cargo_politica_prevencion', label: 'Cargo Política Prevención', type: 'lock' },
  { id: 'cargo_rit', label: 'Cargo Reglamento Trabajo', type: 'lock' },
]

// --- CONFIGURACIÓN DOCUMENTOS RRHH (CARGOS PARA HABILITAR) ---
const RRHH_DOCS: DocDefinition[] = [
  { id: 'cargo_politica_prevencion', label: 'Cargo Política de Prevención' },
  { id: 'cargo_rit', label: 'Cargo del Reglamento de Trabajo' },
]

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  // VISTAS (Se agregó 'upload_docs')
  const [activeView, setActiveView] = useState<'dashboard' | 'biometria' | 'documentos' | 'upload_docs' | 'rrhh' | 'profile' | 'vida_ley' | 'sctr' | 'cesados'>('dashboard')
  
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // --- MODALES DE IMPORTACIÓN ---
  const [showImport, setShowImport] = useState(false)
  const [showBioImport, setShowBioImport] = useState(false)

  // --- GESTIÓN DE OBRAS (CENTRO DE COSTOS) ---
  const [showCostCenter, setShowCostCenter] = useState(false)
  const [obrasList, setObrasList] = useState<any[]>([]) 
  const [currentObra, setCurrentObra] = useState<any>(null) 
  const [obraForm, setObraForm] = useState({ numero: '', nombre: '' })
  const [draggedWorker, setDraggedWorker] = useState<any>(null)
  
  // Obreros en la obra seleccionada
  const [workersInCurrentObra, setWorkersInCurrentObra] = useState<any[]>([])

  // --- PANTALLA DETALLE DE OBRA ---
  const [showObraDetails, setShowObraDetails] = useState(false)

  // --- NUEVO MODAL: ADMINISTRADORES ---
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminsData, setAdminsData] = useState<any[]>([])

  // --- DETECTOR ONLINE/OFFLINE ---
  const [isSystemOnline, setIsSystemOnline] = useState(true)

  // --- ESTADO PARA COMUNICACIÓN CON TABLA HIJA ---
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // --- REALTIME (GOOGLE SHEETS BUBBLES) ---
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const channelRef = useRef<any>(null)

  // Datos
  const [workersData, setWorkersData] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // --- ORDENAMIENTO ---
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Selección de Modales Individuales
  const [selectedWorkerBiometria, setSelectedWorkerBiometria] = useState<any>(null)
  const [selectedWorkerDocs, setSelectedWorkerDocs] = useState<any>(null) // SSOMA REGISTROS
  const [selectedWorkerUpload, setSelectedWorkerUpload] = useState<any>(null) // NUEVO: SSOMA SUBIDAS
  const [selectedWorkerRRHH, setSelectedWorkerRRHH] = useState<any>(null) // RRHH
  const [chatWorker, setChatWorker] = useState<any>(null)

  // --- SELECCIÓN MÚLTIPLE (GRID/LIST) ---
  const [selectedGridIds, setSelectedGridIds] = useState<string[]>([])
  const [showMassActionModal, setShowMassActionModal] = useState(false)
  const [massActionType, setMassActionType] = useState<'ssoma' | 'rrhh'>('ssoma')
  const [selectedMassDocs, setSelectedMassDocs] = useState<string[]>([])
  const [processingMass, setProcessingMass] = useState(false)

  const workersDataRef = useRef(workersData)

  useEffect(() => { workersDataRef.current = workersData }, [workersData])

  // Limpiar selección al cambiar de vista y cerrar centro de costos
  useEffect(() => {
      setSelectedGridIds([])
      setShowMassActionModal(false)
      // Si salimos del dashboard, cerramos el centro de costos
      if (activeView !== 'dashboard') {
          setShowCostCenter(false)
      }
  }, [activeView])

  const playAdminSound = () => {
      const isAudioEnabled = localStorage.getItem('admin_audio_enabled') === 'true'
      if (isAudioEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(e => console.log("Audio admin bloqueado:", e))
      }
  }

  // Notificar cambios a otros admins
  const broadcastChange = async (action: string, details: string) => {
    if (channelRef.current) {
        await channelRef.current.send({
            type: 'broadcast',
            event: 'admin_action',
            payload: { user: userName, action, details }
        })
    }
  }

  // DETECTOR DE CONEXIÓN A INTERNET
  useEffect(() => {
      if (typeof window !== 'undefined') {
          setIsSystemOnline(navigator.onLine)
          
          const handleOnline = () => { setIsSystemOnline(true); toast.success("Conexión restaurada") }
          const handleOffline = () => { setIsSystemOnline(false); toast.error("Sin conexión a internet") }

          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)

          return () => {
              window.removeEventListener('online', handleOnline)
              window.removeEventListener('offline', handleOffline)
          }
      }
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')
      
      const { data: profile } = await supabase.from('profiles').select('role, nombres').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard') }
      else {
          setIsAdmin(true);
          const name = profile.nombres.split(' ')[0]
          setUserName(name)
          
          // --- LOGICA DE PRESENCIA (BURBUJAS) ---
          const currentUserData = {
             name: name,
             online_at: new Date().toISOString(),
             color: '#' + Math.floor(Math.random()*16777215).toString(16)
          };
          setOnlineUsers([currentUserData]);

          const channel = supabase.channel('admin_room', {
              config: { presence: { key: user.id } }
          })

          channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const users = Object.values(newState).map((u: any) => u[0])
                setOnlineUsers(users)
            })
            .on('broadcast', { event: 'admin_action' }, ({ payload }: any) => {
                if (payload.user !== name) {
                    toast.info(
                        <div className="flex flex-col">
                            <span className="font-bold text-xs">{payload.user} {payload.action}</span>
                            <span className="text-[10px] opacity-80">{payload.details}</span>
                        </div>,
                        { duration: 4000, icon: <Zap size={16} className="text-amber-500"/> }
                    )
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track(currentUserData)
                }
            })
            channelRef.current = channel
      }
      setLoading(false)
    }
    checkUser()

    const handleResize = () => {
        const mobile = window.innerWidth < 1024
        setIsMobile(mobile)
        if (mobile) setSidebarOpen(false)
        else setSidebarOpen(true)
    }
    
    if (typeof window !== 'undefined') {
        handleResize()
        window.addEventListener('resize', handleResize)
    }
    return () => {
        if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize)
        if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  // --- CARGAR DATOS ---
  const fetchData = async () => {
      if (workersData.length === 0) setLoadingData(true)
      
      // 1. OBREROS
      const { data: workers, error: errorWorkers } = await supabase
        .from('fichas')
        .select('*, profiles!inner(role)')
        .neq('profiles.role', 'admin')
        .order('updated_at', { ascending: false })
      
      // 2. ADMINS
      const { data: admins } = await supabase.from('profiles').select('*').eq('role', 'admin')

      // 3. OBRAS
      const { data: obras } = await supabase.from('obras').select('*').order('created_at', { ascending: false })

      if(errorWorkers) toast.error("Error al cargar datos")
      
      if(workers) setWorkersData(workers)
      if(admins) setAdminsData(admins)
      if(obras) setObrasList(obras)
      
      setLoadingData(false)
  }

  // --- ACTUALIZAR OBREROS DE LA OBRA SELECCIONADA ---
  useEffect(() => {
      if (currentObra) {
          const filtered = workersData.filter(w => w.nombre_obra === currentObra.nombre)
          setWorkersInCurrentObra(filtered)
      } else {
          setWorkersInCurrentObra([])
      }
  }, [currentObra, workersData])

  useEffect(() => {
      fetchData()

      // SUSCRIPCIÓN A CAMBIOS
      const channel = supabase.channel('admin-docs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas' }, (payload: any) => {
            const newRow = payload.new
            setWorkersData(prev => prev.map(w => w.id === newRow.id ? newRow : w))
            
            // Si la ficha actualizada pertenece a la obra actual
            if (currentObra && newRow.nombre_obra === currentObra.nombre) {
                setWorkersInCurrentObra(prev => {
                    const exists = prev.find(p => p.id === newRow.id)
                    if (exists) return prev.map(p => p.id === newRow.id ? newRow : p)
                    return [...prev, newRow]
                })
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'obras' }, (payload: any) => {
            // Manejar cambios en la tabla de obras en tiempo real
            if (payload.eventType === 'INSERT') {
                setObrasList(prev => [payload.new, ...prev])
            } else if (payload.eventType === 'DELETE') {
                setObrasList(prev => prev.filter(o => o.id !== payload.old.id))
                // Si eliminaron la obra que estoy viendo, limpiarla
                if (currentObra && currentObra.id === payload.old.id) {
                    setCurrentObra(null)
                    setWorkersInCurrentObra([])
                }
            }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
  }, [currentObra])

  // --- FILTRO Y ORDENAMIENTO ---
  const filteredWorkers = workersData.filter(worker => 
      (worker.nombres || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (worker.apellido_paterno || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (worker.dni || '').includes(searchQuery)
  ).sort((a, b) => {
      const nameA = `${a.apellido_paterno} ${a.nombres}`.toLowerCase();
      const nameB = `${b.apellido_paterno} ${b.nombres}`.toLowerCase();
      
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
  });

  const handleNavClick = (view: any) => {
      setActiveView(view)
      if (isMobile) setSidebarOpen(false)
  }

  // --- LÓGICA CENTRO DE COSTOS (OBRAS) ---
  const handleCreateObra = async (e: any) => {
    e.preventDefault()
    if (!obraForm.nombre || !obraForm.numero) {
        toast.error("Complete ambos campos")
        return
    }

    const duplicate = obrasList.find(o => o.nombre.toLowerCase() === obraForm.nombre.toLowerCase() || o.numero === obraForm.numero)
    if (duplicate) {
        toast.error("Ya existe una obra con ese Nombre o Número.")
        return
    }

    try {
        const { data, error } = await supabase.from('obras').insert({
            numero: obraForm.numero,
            nombre: obraForm.nombre
        }).select().single()

        if (error) throw error

        toast.success(`Obra "${obraForm.nombre}" creada`)
        setObrasList(prev => [data, ...prev])
        setCurrentObra(data)
        setObraForm({ numero: '', nombre: '' })

    } catch (err: any) {
        console.error(err)
        toast.error("Error al crear obra: " + err.message)
    }
  }

  // --- ELIMINAR OBRA Y DESVINCULAR PERSONAL ---
  const handleDeleteObra = async (id: string, nombreObra: string, e: any) => {
      e.stopPropagation() 
      
      if (!confirm(`¿Estás seguro de ELIMINAR la obra "${nombreObra}"?\n\nEsta acción borrará la obra y DESVINCULARÁ a todos los obreros asignados a ella.`)) return

      try {
          // 1. DESVINCULAR OBREROS (Poner nombre_obra en null)
          const { error: updateError } = await supabase
              .from('fichas')
              .update({ nombre_obra: null })
              .eq('nombre_obra', nombreObra)

          if (updateError) throw updateError

          // 2. ELIMINAR LA OBRA
          const { error: deleteError } = await supabase
              .from('obras')
              .delete()
              .eq('id', id)

          if (deleteError) throw deleteError
          
          toast.success("Obra eliminada y personal desvinculado")
          
          // 3. ACTUALIZAR ESTADO LOCAL
          setObrasList(prev => prev.filter(o => o.id !== id))
          
          setWorkersData(prev => prev.map(w => 
             w.nombre_obra === nombreObra ? { ...w, nombre_obra: null } : w
          ))

          if (currentObra?.id === id) {
              setCurrentObra(null)
              setWorkersInCurrentObra([])
          }
      } catch (err: any) {
          console.error(err)
          toast.error("Error al eliminar: " + err.message)
      }
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, worker: any) => {
      e.dataTransfer.setData("workerId", worker.id)
      setDraggedWorker(worker)
  }

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault() 
  }

  const handleDropOnObra = async (e: React.DragEvent) => {
    e.preventDefault()
    const workerId = e.dataTransfer.getData("workerId")
    if (!workerId || !currentObra) return

    const worker = workersData.find(w => w.id === workerId)
    if (!worker) return

    if (worker.nombre_obra === currentObra.nombre) {
        toast.info("El obrero ya está en esta obra")
        return
    }

    try {
        const { error } = await supabase
            .from('fichas')
            .update({ nombre_obra: currentObra.nombre })
            .eq('id', workerId)

        if (error) throw error

        toast.success(`${worker.nombres} asignado a ${currentObra.nombre}`)
        setWorkersInCurrentObra(prev => [...prev, { ...worker, nombre_obra: currentObra.nombre }])
        broadcastChange('asignó', `obrero a ${currentObra.nombre}`)

    } catch (err: any) {
        toast.error("Error al asignar: " + err.message)
    }
    setDraggedWorker(null)
  }


  // --- RESTO DE FUNCIONES ---
  const openFirstWorkerDrawerForTour = () => {
      const targetWorker = filteredWorkers.length > 0 ? filteredWorkers[0] : (workersData.length > 0 ? workersData[0] : null);
      if (targetWorker) {
          if (activeView === 'biometria') setSelectedWorkerBiometria(targetWorker);
          else if (activeView === 'documentos') setSelectedWorkerDocs(targetWorker);
          else if (activeView === 'rrhh') setSelectedWorkerRRHH(targetWorker);
      } else {
          toast.warning("Para ver esta parte del tour, necesitas tener al menos un trabajador registrado.");
      }
  }

  const closeDrawersForTour = () => {
      setSelectedWorkerDocs(null);
      setSelectedWorkerBiometria(null);
      setSelectedWorkerRRHH(null);
  }

  // --- LÓGICA SELECCIÓN MÚLTIPLE ---
  const handleGridSelect = (id: string) => {
      if (selectedGridIds.includes(id)) {
          setSelectedGridIds(prev => prev.filter(i => i !== id))
      } else {
          setSelectedGridIds(prev => [...prev, id])
      }
  }

  const handleGridSelectAll = () => {
      if (selectedGridIds.length === filteredWorkers.length) {
          setSelectedGridIds([])
      } else {
          setSelectedGridIds(filteredWorkers.map(w => w.id))
      }
  }

  const handleOpenMassAction = () => {
      if (activeView === 'documentos') setMassActionType('ssoma')
      else if (activeView === 'rrhh') setMassActionType('rrhh')
      else return 

      setSelectedMassDocs([])
      setShowMassActionModal(true)
  }

  const handleToggleMassDoc = (docId: string) => {
      if (selectedMassDocs.includes(docId)) setSelectedMassDocs(prev => prev.filter(d => d !== docId))
      else setSelectedMassDocs(prev => [...prev, docId])
  }

  const executeMassAction = async () => {
      if (selectedMassDocs.length === 0) { toast.warning("Selecciona al menos un documento"); return }
      setProcessingMass(true)

      const docConfigList = massActionType === 'ssoma' ? DIGITAL_DOCS : RRHH_DOCS_CONFIG
      const docsToProcess = docConfigList.filter(d => selectedMassDocs.includes(d.id))

      let successCount = 0

      for (const workerId of selectedGridIds) {
          const worker = workersData.find(w => w.id === workerId)
          if (!worker) continue

          const currentStates = worker.doc_states || {}
          let newStates = { ...currentStates }
          
          docsToProcess.forEach(doc => {
              if (doc.type === 'pdf') {
                  let fileName = ''
                  if (doc.id === 'risst_pdf_download') fileName = 'REGLAMENTO INTERNO DE SEGURIDAD.pdf'
                  else if (doc.id === 'rit_pdf_download') fileName = 'REGLAMENTO INTERNO DE TRABAJO.pdf'
                  else if (doc.id === 'hostigamiento_pdf_download') fileName = 'POLITICA DE HOSTIGAMIENTO SEXUAL.pdf'
                  else if (doc.id === 'beneficiarios_pdf_download') fileName = 'DECLARACION DE BENEFICIARIOS_VIDA LEY_2019.pdf'
                  else if (doc.id === 'etica_pdf_download') fileName = 'CODIGO DE ETICA Y CONDUCTA.pdf'
                  else if (doc.id === 'antisoborno_pdf_download') fileName = 'POLITICA ANTISOBORNO Y ANTICORRUPCIÓN.pdf'

                  newStates[doc.id] = {
                      status: 'pending_download',
                      sent_at: new Date().toISOString(),
                      label: doc.label,
                      file: fileName
                  }
              } else {
                  if (newStates[doc.id]?.status !== 'completed') {
                      newStates[doc.id] = {
                          status: 'unlocked',
                          updated_at: new Date().toISOString()
                      }
                  }
              }
          })

          const { error } = await supabase.from('fichas').update({ doc_states: newStates }).eq('id', workerId)
          if (!error) successCount++
      }

      setProcessingMass(false)
      setShowMassActionModal(false)
      setSelectedGridIds([])
      toast.success(`Acción masiva completada en ${successCount} trabajadores.`)
      broadcastChange('realizó', `envío masivo de ${selectedMassDocs.length} documentos a ${successCount} personas`)
      fetchData()
  }


  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setSidebarOpen(false)} 
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden"
            />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
            width: isSidebarOpen ? 280 : 0, 
            x: isMobile && !isSidebarOpen ? -280 : 0,
            opacity: !isMobile && !isSidebarOpen ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`bg-slate-900 text-white flex flex-col h-full shrink-0 z-50 shadow-2xl border-r border-slate-800 ${isMobile ? 'fixed left-0 top-0 bottom-0' : 'relative'} overflow-hidden whitespace-nowrap`}
      >
        <div className="h-20 flex items-center gap-4 px-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
                <ShieldCheck size={22} className="text-white" />
            </div>
            <div className="min-w-0">
                <h1 className="font-bold text-xl tracking-tight text-white leading-none">RUAG</h1>
                <span className="text-xs text-blue-400 font-medium tracking-wide">Panel Administrativo</span>
            </div>
        </div>

        {/* --- SIDEBAR --- */}
        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            {/* Dashboard General */}
            <div>
                <SidebarItem active={activeView === 'dashboard'} onClick={() => handleNavClick('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard General" />
            </div>

            {/* GRUPO 1 */}
            <div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="px-4 mb-3 mt-2">
                    <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 uppercase tracking-widest">Gestión de Talento</h3>
                </motion.div>
                <div className="space-y-1">
                    <div id="nav-rrhh">
                        <SidebarItem active={activeView === 'rrhh'} onClick={() => handleNavClick('rrhh')} icon={<Briefcase size={20} className="text-purple-400"/>} label="Gestión RRHH" />
                    </div>
                    <div id="nav-vida_ley">
                        <SidebarItem active={activeView === 'vida_ley'} onClick={() => handleNavClick('vida_ley')} icon={<FileSpreadsheet size={20} className="text-emerald-400"/>} label="Trama Vida Ley" />
                    </div>
                    <div id="nav-cesados">
                        <SidebarItem active={activeView === 'cesados'} onClick={() => handleNavClick('cesados')} icon={<UserX size={20} className="text-rose-400"/>} label="Historial Cesados" />
                    </div>
                </div>
            </div>

            {/* GRUPO 2 */}
            <div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="px-4 mb-3 mt-2">
                    <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 uppercase tracking-widest">Seguridad (SSOMA)</h3>
                </motion.div>
                <div className="space-y-1">
                    <div id="nav-documentos">
                        <SidebarItem active={activeView === 'documentos'} onClick={() => handleNavClick('documentos')} icon={<HardHat size={20} className="text-blue-400"/>} label="Registros SIG" />
                    </div>
                    <div id="nav-upload-docs">
                         {/* --- NUEVA OPCIÓN SIDEBAR --- */}
                        <SidebarItem active={activeView === 'upload_docs'} onClick={() => handleNavClick('upload_docs')} icon={<FolderUp size={20} className="text-amber-400"/>} label="Subir Documentos" />
                    </div>
                    <div id="nav-sctr">
                        <SidebarItem active={activeView === 'sctr'} onClick={() => handleNavClick('sctr')} icon={<ShieldCheck size={20} className="text-amber-400"/>} label="Trama SCTR" />
                    </div>
                </div>
            </div>

            {/* GRUPO 3 */}
            <div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="px-4 mb-3 mt-2">
                    <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 uppercase tracking-widest">Control Operativo</h3>
                </motion.div>
                <div className="space-y-1">
                    <div id="nav-biometria">
                        <SidebarItem active={activeView === 'biometria'} onClick={() => handleNavClick('biometria')} icon={<Fingerprint size={20} className="text-sky-400"/>} label="Biometría y Firmas" />
                    </div>
                </div>
            </div>

            {/* GRUPO 4 */}
            <div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="px-4 mb-3 mt-2">
                    <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 uppercase tracking-widest">Sistema</h3>
                </motion.div>
                <div className="space-y-1">
                    <SidebarItem active={activeView === 'profile'} onClick={() => handleNavClick('profile')} icon={<UserCog size={20}/>} label="Mi Perfil" />
                </div>
            </div>
        </nav>

        <AdminTour 
            changeView={(view) => setActiveView(view)} 
            openFirstDrawer={openFirstWorkerDrawerForTour}
            closeDrawer={closeDrawersForTour}
        />

        <div className="p-4 bg-slate-900/30 border-t border-slate-800/50">
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
                <span className="text-sm font-medium">Cerrar Sesión</span>
             </button>
        </div>
      </motion.aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] relative">
        
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-transparent hover:border-slate-200"
                >
                    <Menu size={22}/>
                </button>
                
                <div id="tour-welcome">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {activeView === 'dashboard' && 'Resumen General'}
                        {activeView === 'biometria' && 'Control Biométrico'}
                        {activeView === 'documentos' && 'Gestión Documental SSOMA'}
                        {activeView === 'upload_docs' && 'Subir Documentos a Obrero'}
                        {activeView === 'rrhh' && 'Gestión de Recursos Humanos'}
                        {activeView === 'vida_ley' && 'Trama Vida Ley'}
                        {activeView === 'sctr' && 'Trama SCTR'}
                        {activeView === 'cesados' && 'Historial de Cesados'}
                        {activeView === 'profile' && 'Configuración de Cuenta'}
                    </h2>
                    <p className="text-xs text-slate-400 hidden sm:block">Panel de administración centralizada</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                
                {/* ADMINS CONECTADOS */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 hidden md:inline">En línea:</span>
                    <div className="flex -space-x-2">
                        {onlineUsers.map((user: any, i) => (
                            <div key={i} className="relative group cursor-help">
                                <div 
                                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform hover:scale-110 hover:z-10"
                                    style={{ backgroundColor: user.color || '#3b82f6' }}
                                >
                                    {user.name ? user.name.charAt(0) : '?'}
                                </div>
                                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    {user.name || 'Admin'}
                                </div>
                            </div>
                        ))}
                        {onlineUsers.length === 0 && (
                             <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold animate-pulse">
                                ...
                             </div>
                        )}
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
                
                <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{userName}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">Administrador</p>
                      </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                        {userName.charAt(0)}
                    </div>
                </div>
            </div>
        </header>

        {/* --- CONTENEDOR SPLIT: PRINCIPAL + CENTRO DE COSTOS --- */}
        <div className="flex flex-1 overflow-hidden relative">
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                
                {activeView === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-7xl mx-auto">
                        
                        <div className="flex flex-wrap justify-end gap-3">
                            <Link href="/admin/ssoma/induccion">
                                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-all cursor-pointer border border-slate-700">
                                    <HardHat size={18}/> Gestion SSOMA
                                </div>
                            </Link>
                            
                            <button 
                                onClick={() => setShowBioImport(true)} 
                                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white border border-blue-500 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                            >
                                <ScanFace size={18}/> IMPORTAR FIRMAS/HUELLAS
                            </button>

                            <button 
                                id="tour-import"
                                onClick={() => setShowImport(true)} 
                                className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all"
                            >
                                <UploadCloud size={18}/> CARGA MASIVA DATA
                            </button>
                            
                            {/* --- BOTÓN NUEVO: CENTRO DE COSTO (SOLO EN DASHBOARD) --- */}
                            <button 
                                onClick={() => setShowCostCenter(!showCostCenter)} 
                                className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-xs font-bold shadow-sm transition-all ${showCostCenter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
                            >
                                <Building size={18}/> CENTRO DE COSTO
                            </button>
                        </div>

                        {/* ... Tarjetas de Estadísticas ... */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tour-stats">
                            <StatCard 
                                title="Total Personal" 
                                value={(workersData.length + adminsData.length).toString()} 
                                desc="Base de datos global" 
                                icon={<Users size={24} className="text-white"/>} 
                                bg="bg-gradient-to-br from-blue-500 to-blue-600"
                                delay={0.1} 
                            />
                            <div onClick={() => setShowAdminModal(true)} className="cursor-pointer">
                                <StatCard 
                                    title="Administradores" 
                                    value={adminsData.length.toString()} 
                                    desc="Ver lista de admins" 
                                    icon={<UserCog size={24} className="text-white"/>} 
                                    bg="bg-gradient-to-br from-indigo-500 to-purple-600"
                                    delay={0.2} 
                                />
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium mb-1">Estado del Sistema</p>
                                        {isSystemOnline ? (
                                            <h3 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                                                En Línea
                                            </h3>
                                        ) : (
                                            <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2 animate-pulse">
                                                <WifiOff size={20}/>
                                                Sin Conexión
                                            </h3>
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-2xl ${isSystemOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {isSystemOnline ? <Wifi size={24}/> : <Activity size={24}/>}
                                    </div>
                                </div>
                                <div className="mt-4 text-xs font-medium text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                                    {isSystemOnline ? "Sincronizado con servidor" : "Reconectando..."}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                                    <LayoutGrid size={20} className="text-blue-500"/> 
                                    Registro de Trabajadores
                                </h3>
                            </div>
                            
                            <AdminTable 
                                onOpenChat={(worker) => setChatWorker(worker)} 
                                refreshTrigger={refreshTrigger}
                                onNotifyChange={broadcastChange}
                            />
                        </div>
                    </motion.div>
                )}

                {/* --- VISTAS ESPECÍFICAS (VIDA LEY, SCTR, CESADOS, PROFILE) --- */}
                {activeView === 'vida_ley' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full pb-20"><VidaLeyManager /></motion.div>}
                {activeView === 'sctr' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full pb-20"><SctrManager onBack={() => setActiveView('dashboard')} /></motion.div>}
                {activeView === 'cesados' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full pb-20"><CesadosManager onBack={() => setActiveView('dashboard')} /></motion.div>}
                {activeView === 'profile' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto pb-20 mt-10"><AdminProfileSettings userEmail={userEmail} supabase={supabase} /></motion.div>}

                {/* --- SECCIÓN GRID/LISTA COMPARTIDA (BIOMETRIA/DOCS/RRHH/UPLOAD) --- */}
                {(activeView === 'biometria' || activeView === 'documentos' || activeView === 'rrhh' || activeView === 'upload_docs') && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col max-w-7xl mx-auto">
                        
                        {/* HEADER DE CONTROL */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
                             {/* ... botones de selección y orden ... */}
                            <div className="flex items-center gap-4 mr-4">
                                {(activeView === 'documentos' || activeView === 'rrhh') && (
                                    <>
                                        <button onClick={handleGridSelectAll} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                                            {selectedGridIds.length === filteredWorkers.length && filteredWorkers.length > 0 ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                                            {selectedGridIds.length > 0 ? `${selectedGridIds.length} Seleccionados` : 'Todos'}
                                        </button>
                                        <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                                            <ArrowUpDown size={16} /> {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="relative w-full md:w-96 group" id="tour-search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                                <input type="text" placeholder="Filtrar por DNI, Nombre o Apellido..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>

                        {/* BARRA MASIVA */}
                        <AnimatePresence>
                            {selectedGridIds.length > 0 && (activeView === 'documentos' || activeView === 'rrhh') && (
                                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 text-white p-3 px-6 rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-700">
                                    <span className="font-bold text-sm bg-slate-800 px-3 py-1 rounded-lg">{selectedGridIds.length} Obreros</span>
                                    <div className="h-6 w-px bg-slate-700"></div>
                                    <button onClick={handleOpenMassAction} className="flex items-center gap-2 font-bold text-sm hover:text-blue-300 transition-colors">
                                        <Send size={16}/> {activeView === 'documentos' ? 'Enviar Docs SSOMA' : 'Enviar Docs RRHH'}
                                    </button>
                                    <button onClick={() => setSelectedGridIds([])} className="p-1 hover:bg-slate-800 rounded-full transition-colors ml-2"><X size={16}/></button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* LISTA DE TRABAJADORES (DRAGGABLE) */}
                        {loadingData ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20"><Loader2 size={48} className="animate-spin mb-4 text-blue-500"/><p className="font-medium animate-pulse">Consultando trabajadores...</p></div>
                        ) : filteredWorkers.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl p-16 bg-slate-50/50"><div className="bg-white p-4 rounded-full shadow-sm mb-4"><Search size={32} className="text-slate-300"/></div><p className="font-bold text-slate-600 text-lg">No hay coincidencias</p></div>
                        ) : (
                            <>
                                {activeView === 'biometria' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20" id="tour-biometria-grid">
                                        {filteredWorkers.map((worker, index) => (
                                            <div 
                                                key={worker.id} 
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, worker)}
                                                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden cursor-move active:cursor-grabbing"
                                            >
                                                {/* Contenido Card (Igual que antes) */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transition-opacity opacity-0 group-hover:opacity-100"></div>
                                                <div className="flex items-start gap-4 mb-5 cursor-pointer" onClick={() => setSelectedWorkerBiometria(worker)}>
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xl border border-white shadow-inner transition-colors group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-600">{worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-slate-800 truncate text-base group-hover:text-blue-700 transition-colors uppercase">{worker.apellido_paterno}</h4>
                                                        <p className="text-sm text-slate-500 truncate mb-1">{worker.nombres}</p>
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">{worker.dni}</span>
                                                    </div>
                                                </div>
                                                {/* Iconos Firma/Huella */}
                                                <div className="grid grid-cols-2 gap-2 cursor-pointer" onClick={() => setSelectedWorkerBiometria(worker)}>
                                                    <div className={`py-2.5 rounded-xl text-[10px] font-bold text-center border flex flex-col items-center justify-center gap-1 transition-colors ${worker.firma_url ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><PenTool size={14} className={worker.firma_url ? "text-emerald-500" : "text-slate-300"}/> {worker.firma_url ? 'FIRMA OK' : 'SIN FIRMA'}</div>
                                                    <div className={`py-2.5 rounded-xl text-[10px] font-bold text-center border flex flex-col items-center justify-center gap-1 transition-colors ${worker.huella_url ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><Fingerprint size={14} className={worker.huella_url ? "text-emerald-500" : "text-slate-300"}/> {worker.huella_url ? 'HUELLA OK' : 'SIN HUELLA'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 pb-20" id="tour-docs-list">
                                        {filteredWorkers.map((worker, index) => {
                                            const isSelected = selectedGridIds.includes(worker.id);
                                            const isRRHH = activeView === 'rrhh';
                                            const isUpload = activeView === 'upload_docs';
                                            return (
                                                <div 
                                                    key={worker.id}
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, worker)}
                                                    className={`group flex items-center justify-between p-4 bg-white rounded-xl border transition-all hover:shadow-md cursor-move active:cursor-grabbing ${isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'}`}
                                                    onClick={() => { 
                                                        if (activeView === 'documentos') setSelectedWorkerDocs(worker); 
                                                        else if (activeView === 'rrhh') setSelectedWorkerRRHH(worker);
                                                        else if (activeView === 'upload_docs') setSelectedWorkerUpload(worker);
                                                    }}
                                                >
                                                    {/* ... Contenido de la fila ... */}
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        {(activeView !== 'upload_docs') && (
                                                            <div onClick={(e) => { e.stopPropagation(); handleGridSelect(worker.id); }} className="text-slate-300 hover:text-blue-600 transition-colors p-2 -ml-2">{isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</div>
                                                        )}
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${isRRHH ? 'bg-purple-50 text-purple-600 border-purple-100' : isUpload ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}</div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-baseline gap-2"><h4 className="font-bold text-slate-800 text-sm truncate uppercase group-hover:text-blue-700 transition-colors">{worker.apellido_paterno}, {worker.nombres}</h4><span className="text-xs text-slate-400 font-mono hidden sm:inline">{worker.dni}</span></div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5"><HardHat size={12}/><span className="truncate max-w-[150px]">{worker.cargo || 'Sin Cargo'}</span><span className="text-slate-300 mx-1">|</span><span>{worker.nombre_obra || 'Sin Obra'}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 shrink-0">
                                                        <button className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2 ${isRRHH ? 'bg-purple-50 text-purple-700 border-purple-100 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600' : isUpload ? 'bg-amber-50 text-amber-700 border-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500' : 'bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'}`}>
                                                            {isRRHH ? <Briefcase size={14}/> : isUpload ? <FolderUp size={14}/> : <FileText size={14}/>}
                                                            <span className="hidden sm:inline">{isRRHH ? 'Gestionar RRHH' : isUpload ? 'Subir Archivos' : 'Gestionar Docs'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

            </div>

            {/* --- PANEL LATERAL/INFERIOR DE CENTRO DE COSTOS (MEJORADO) --- */}
            <AnimatePresence>
                {showCostCenter && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }} 
                        animate={{ width: currentObra ? 850 : 400, opacity: 1 }} 
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col z-40 shrink-0 overflow-hidden"
                    >
                        <div className="flex h-full">
                            {/* COLUMNA IZQUIERDA: GESTIÓN DE OBRAS */}
                            <div className="w-[400px] flex flex-col h-full border-r border-slate-200 bg-white shrink-0">
                                {/* HEADER */}
                                <div className="p-6 bg-slate-900 border-b border-slate-800 text-white shrink-0">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Building size={20} className="text-indigo-400"/> Gestión de Obras
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Crea, selecciona y asigna personal.</p>
                                </div>
                                
                                {/* FORMULARIO */}
                                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
                                    <form onSubmit={handleCreateObra} className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-1">
                                                <input 
                                                    type="text" 
                                                    value={obraForm.numero} 
                                                    onChange={e => setObraForm({...obraForm, numero: e.target.value})}
                                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                                                    placeholder="N° Obra"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input 
                                                    type="text" 
                                                    value={obraForm.nombre} 
                                                    onChange={e => setObraForm({...obraForm, nombre: e.target.value})}
                                                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                                                    placeholder="Nombre de Obra"
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 transition-colors flex justify-center gap-2 items-center shadow-md active:scale-95">
                                            <PlusCircle size={14}/> CREAR NUEVA OBRA
                                        </button>
                                    </form>
                                </div>

                                {/* LISTA DE OBRAS */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Obras Registradas ({obrasList.length})</p>
                                    {obrasList.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                            <Layers size={24} className="mx-auto mb-2 opacity-50"/>
                                            <p className="text-xs">No hay obras registradas</p>
                                        </div>
                                    ) : (
                                        obrasList.map((obra) => (
                                            <div 
                                                key={obra.id} 
                                                onClick={() => setCurrentObra(obra)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-center justify-between group ${currentObra?.id === obra.id ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold text-sm truncate ${currentObra?.id === obra.id ? 'text-indigo-800' : 'text-slate-700'}`}>{obra.nombre}</h4>
                                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">#{obra.numero}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {/* INDICADOR DE SELECCIÓN */}
                                                    {currentObra?.id === obra.id && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                                                    
                                                    {/* BOTÓN DE ELIMINAR */}
                                                    <button 
                                                        onClick={(e) => handleDeleteObra(obra.id, obra.nombre, e)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Eliminar Obra"
                                                    >
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: DETALLE Y ZONA DE ARRASTRE (VISIBLE SOLO SI HAY OBRA) */}
                            {currentObra && (
                                <div className="flex-1 flex flex-col h-full bg-slate-50 min-w-[400px]">
                                    
                                    {/* HEADER DE LA OBRA ACTIVA */}
                                    <div className="p-6 border-b border-slate-200 bg-white shrink-0 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="bg-indigo-600 text-white p-2 rounded-lg"><Building size={20}/></div>
                                                <div>
                                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{currentObra.nombre}</h2>
                                                    <p className="text-xs text-slate-500 font-mono">#{currentObra.numero} • {workersInCurrentObra.length} Obreros</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setCurrentObra(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                            <Minimize2 size={18}/>
                                        </button>
                                    </div>

                                    {/* ZONA DE ARRASTRE GRANDE */}
                                    <div className="p-4 shrink-0 bg-white">
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDrop={handleDropOnObra}
                                            className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden group ${draggedWorker ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-300 bg-slate-50'}`}
                                        >
                                            <UploadCloud size={32} className={`mb-2 transition-colors ${draggedWorker ? 'text-indigo-600' : 'text-slate-400'}`}/>
                                            <p className={`text-sm font-bold ${draggedWorker ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                {draggedWorker ? '¡SUELTA EL OBRERO AQUÍ!' : 'Arrastra obreros a esta zona'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* LISTA DE OBREROS EN TIEMPO REAL */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Personal Asignado</p>
                                        {workersInCurrentObra.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                <Users size={40} className="mb-2"/>
                                                <p className="text-xs">Lista vacía</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {workersInCurrentObra.map(w => (
                                                    <div key={w.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100">
                                                            {w.nombres.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-800 text-xs truncate uppercase">{w.nombres} {w.apellido_paterno}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono">{w.dni}</p>
                                                        </div>
                                                        <div className="text-emerald-500">
                                                            <CheckCircle size={16}/>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* BOTÓN EXTRA (SI SE NECESITA) */}
                                    <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                                         <button 
                                            onClick={() => setShowObraDetails(true)} 
                                            className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            <Maximize2 size={14}/> PANTALLA COMPLETA
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>

        {/* --- MODAL PANTALLA COMPLETA: DETALLE DE OBRA --- */}
        <AnimatePresence>
            {showObraDetails && currentObra && (
                <ObraDetailsModal 
                    obra={currentObra} 
                    workers={workersInCurrentObra} 
                    onClose={() => setShowObraDetails(false)}
                />
            )}
        </AnimatePresence>

        {/* --- MODALES --- */}
        
        {/* MODAL LISTA DE ADMINISTRADORES */}
        <AnimatePresence>
            {showAdminModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-4" onClick={() => setShowAdminModal(false)}>
                    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                         <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50">
                            <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2"><UserCog size={20}/> Administradores</h3>
                            <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20}/></button>
                         </div>
                         <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                            {adminsData.map((admin) => (
                                <div key={admin.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">{admin.nombres.charAt(0)}</div>
                                    <div>
                                            <p className="font-bold text-slate-800 text-sm">{admin.nombres} {admin.apellido_paterno}</p>
                                            <p className="text-xs text-slate-500 font-mono">{admin.dni}</p>
                                    </div>
                                    <div className="ml-auto bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">ADMIN</div>
                                </div>
                            ))}
                         </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* MODAL ACCIONES MASIVAS */}
        <AnimatePresence>
            {showMassActionModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={() => setShowMassActionModal(false)}>
                    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Send className={massActionType === 'rrhh' ? 'text-purple-600' : 'text-blue-600'} size={20}/> 
                                Envío Masivo {massActionType.toUpperCase()}
                            </h3>
                            <button onClick={() => setShowMassActionModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">Selecciona los documentos para enviar/habilitar a los <b>{selectedGridIds.length} trabajadores</b> seleccionados.</p>
                            
                            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
                                {(massActionType === 'ssoma' ? DIGITAL_DOCS : RRHH_DOCS_CONFIG).map((doc) => (
                                    <label key={doc.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedMassDocs.includes(doc.id) ? (massActionType === 'rrhh' ? 'border-purple-500 bg-purple-50' : 'border-blue-500 bg-blue-50') : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedMassDocs.includes(doc.id) ? (massActionType === 'rrhh' ? 'bg-purple-600 border-purple-600' : 'bg-blue-600 border-blue-600') : 'bg-white border-slate-300'}`}>
                                                {selectedMassDocs.includes(doc.id) && <CheckSquare size={12} className="text-white"/>}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={selectedMassDocs.includes(doc.id)} onChange={() => handleToggleMassDoc(doc.id)}/>
                                            <span className="text-sm font-bold text-slate-700">{doc.label}</span>
                                    </label>
                                ))}
                            </div>

                            <button 
                                onClick={executeMassAction}
                                disabled={processingMass || selectedMassDocs.length === 0}
                                className={`w-full py-3.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${massActionType === 'rrhh' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {processingMass ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                                {processingMass ? 'Procesando...' : 'Confirmar Envío Masivo'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {selectedWorkerBiometria && (
                <BiometricModal worker={selectedWorkerBiometria} onClose={() => setSelectedWorkerBiometria(null)} onUpdate={() => fetchData()} />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {selectedWorkerDocs && (
                <AdminDocsDrawer worker={selectedWorkerDocs} onClose={() => setSelectedWorkerDocs(null)} onUpdate={() => fetchData()} />
            )}
        </AnimatePresence>

        {/* --- NUEVO DRAWER: CARGA DE DOCUMENTOS --- */}
        <AnimatePresence>
            {selectedWorkerUpload && (
                <AdminUploadDrawer 
                    worker={selectedWorkerUpload} 
                    onClose={() => setSelectedWorkerUpload(null)} 
                    onUpdate={() => fetchData()} 
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {selectedWorkerRRHH && (
                <AdminRRHHDrawer 
                    worker={selectedWorkerRRHH} 
                    onClose={() => setSelectedWorkerRRHH(null)} 
                    onUpdate={() => fetchData()} 
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showImport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200">
                         <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">Carga Masiva de Personal</h3>
                            <button onClick={() => setShowImport(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500"/></button>
                         </div>
                        <div className="p-8"><MassImport onComplete={() => setShowImport(false)} /></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showBioImport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200">
                         <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ScanFace className="text-blue-600"/> Importación de Firmas y Huellas</h3>
                            <button onClick={() => setShowBioImport(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500"/></button>
                         </div>
                        <div className="p-8">
                            <BiometricBatchUpload 
                                onComplete={() => { 
                                    fetchData(); 
                                    setRefreshTrigger(prev => prev + 1); 
                                    broadcastChange('actualizó', 'Biometría masiva importada') 
                                }} 
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {chatWorker && (
                <ChatSystem 
                    workerId={chatWorker.user_id} 
                    workerName={`${chatWorker.nombres} ${chatWorker.apellido_paterno}`}
                    currentUserId={userId}
                    isAdmin={true}
                    isOpen={!!chatWorker}
                    onClose={() => setChatWorker(null)}
                />
            )}
        </AnimatePresence>

      </main>
    </div>
  )
}

function SidebarItem({ active, onClick, icon, label }: any) {
    return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>{active && (<motion.div layoutId="active-bg" className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40" initial={false} transition={{type:'spring', stiffness: 500, damping: 30}} />)}<span className="relative z-10">{icon}</span><span className="relative z-10 tracking-wide">{label}</span>{!active && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0"/>}</button>
}
function StatCard({title, value, desc, icon, bg, delay}: any) {
    return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium mb-1">{title}</p><h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3></div><div className={`p-3 rounded-2xl shadow-lg shadow-blue-900/10 ${bg}`}>{icon}</div></div><div className="mt-4 pt-4 border-t border-slate-50"><div className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500"/> <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{desc}</span></div></div></motion.div>
}

// --- NUEVO COMPONENTE: MODAL DETALLE DE OBRA ---
function ObraDetailsModal({ obra, workers, onClose }: any) {
    const [filter, setFilter] = useState('')
    
    const filtered = workers.filter((w: any) => 
        w.nombres.toLowerCase().includes(filter.toLowerCase()) || 
        w.apellido_paterno.toLowerCase().includes(filter.toLowerCase()) ||
        w.dni.includes(filter)
    )

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20" onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Building size={24} className="text-indigo-400"/>
                            <h2 className="text-2xl font-bold">{obra.nombre}</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">OBRA #{obra.numero}</span>
                            <span>•</span>
                            <span>{workers.length} Trabajadores Asignados</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"><X size={20}/></button>
                </div>

                {/* CONTENIDO */}
                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                    {/* BARRA DE BUSQUEDA */}
                    <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Buscar en esta obra..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                <FileCheck size={16}/> Exportar Lista
                            </button>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Users size={48} className="mb-4 opacity-20"/>
                                <p className="font-bold">No se encontraron trabajadores</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map((w: any) => (
                                    <div key={w.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shrink-0">
                                            {w.nombres.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-800 text-sm truncate uppercase group-hover:text-indigo-600 transition-colors">{w.apellido_paterno}, {w.nombres}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5 mb-2">{w.dni}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 capitalize truncate max-w-[100px]">{w.cargo || 'Sin Cargo'}</span>
                                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-bold flex items-center gap-1"><CheckCircle size={10}/> Activo</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </motion.div>
        </motion.div>
    )
}

function AdminProfileSettings({ userEmail, supabase }: any) {
    const [email, setEmail] = useState(userEmail);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado para el modal de éxito
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [actionType, setActionType] = useState<'email' | 'password' | 'both'>('password');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return };
        if (password && password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return };
        
        setLoading(true);
        
        const updates: any = { email };
        if (password) updates.password = password;

        // Determinar tipo de acción para el mensaje
        if (email !== userEmail && password) setActionType('both');
        else if (email !== userEmail) setActionType('email');
        else setActionType('password');

        const { error } = await supabase.auth.updateUser(updates, { emailRedirectTo: `${window.location.origin}/dashboard` });
        
        setLoading(false);

        if (error) { 
            toast.error("Error al actualizar: " + error.message);
        } else {
            // En lugar de solo toast, abrimos el modal
            setShowSuccessModal(true);
            setPassword(''); 
            setConfirmPassword('');
        }
    }

    // Lógica para obtener el link del proveedor de correo
    const getMailProviderConfig = (emailStr: string) => {
        const domain = emailStr.split('@')[1] || '';
        
        if (domain.includes('gmail.com')) {
            return {
                name: 'Gmail',
                url: 'https://mail.google.com/mail/u/0/#inbox',
                color: 'bg-red-600 hover:bg-red-700',
                text: 'Abrir Gmail'
            };
        } else if (domain.includes('ruag.pe') || domain.includes('outlook') || domain.includes('hotmail')) {
            return {
                name: 'Outlook',
                url: 'https://outlook.office.com/mail/',
                color: 'bg-blue-600 hover:bg-blue-700',
                text: 'Abrir Outlook Corporativo'
            };
        } else {
            return {
                name: 'Bandeja de Entrada',
                url: 'mailto:', // Fallback genérico
                color: 'bg-slate-900 hover:bg-slate-800',
                text: 'Abrir Correo'
            };
        }
    };

    const mailConfig = getMailProviderConfig(email);

    return (
        <>
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 text-center bg-gradient-to-b from-white to-slate-50/50">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                        <UserCog size={36}/>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Cuenta de Administrador</h2>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Actualiza tus credenciales de acceso al sistema.</p>
                </div>
                
                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="admin@empresa.com"/>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Nueva Contraseña</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="••••••••"/>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Confirmar Contraseña</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Repite la contraseña"/>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                            {loading ? 'Actualizando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL DE REDIRECCIÓN A CORREO */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowSuccessModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }} 
                            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Mail size={32}/>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</h3>
                            
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                {actionType === 'email' || actionType === 'both' 
                                    ? "Hemos enviado un enlace de confirmación a tu nuevo correo. Debes aceptarlo para finalizar el cambio." 
                                    : "Tu contraseña ha sido actualizada. Te recomendamos revisar tu bandeja de entrada por seguridad."}
                            </p>

                            <div className="space-y-3">
                                <a 
                                    href={mailConfig.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`w-full py-3.5 ${mailConfig.color} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95`}
                                >
                                    <ExternalLink size={18}/>
                                    {mailConfig.text}
                                </a>

                                <button 
                                    onClick={() => setShowSuccessModal(false)} 
                                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Entendido, cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

function BiometricModal({ worker, onClose, onUpdate }: any) {
    const supabase = createClient(); const [tab, setTab] = useState<'firma' | 'huella'>('firma');
    const updateField = async (field: 'firma_url' | 'huella_url', value: string | null) => { try { const { error } = await supabase.from('fichas').update({ [field]: value }).eq('id', worker.id); if (error) throw error; if(value) toast.success("Guardado exitosamente"); else toast.success("Eliminado"); onUpdate(); if(value && field === 'firma_url') setTab('huella') } catch (e: any) { toast.error("Error: " + e.message) } }
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}><motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}><div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30">{worker.nombres.charAt(0)}</div><div><h3 className="font-bold text-slate-900 text-xl">{worker.nombres} {worker.apellido_paterno}</h3><div className="flex items-center gap-2 mt-1"><span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{worker.dni}</span><span className="text-xs text-slate-400">•</span><span className="text-xs text-slate-500 font-medium capitalize">{worker.cargo || 'Operario'}</span></div></div></div><button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"><X size={20}/></button></div><div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50 p-1 gap-1 mx-6 mt-4 rounded-xl"><button onClick={() => setTab('firma')} className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${tab === 'firma' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><PenTool size={16}/> Firma Digital</button><button onClick={() => setTab('huella')} className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${tab === 'huella' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><ScanLine size={16}/> Huella Dactilar</button></div><div className="flex-1 bg-slate-50 relative p-6 flex items-center justify-center overflow-hidden"><div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">{tab === 'firma' ? ( <BiometricSignature onSave={(data) => updateField('firma_url', data)} onClear={() => updateField('firma_url', null)} existingSignature={worker.firma_url} /> ) : ( <BiometricFingerprint onSave={(data) => updateField('huella_url', data)} onClear={() => updateField('huella_url', null)} existingFingerprint={worker.huella_url} /> )}</div></div></motion.div></motion.div>)
}

function AdminDocsDrawer({ worker, onClose, onUpdate }: any) {
    const supabase = createClient(); 
    const [docStates, setDocStates] = useState<any>(worker.doc_states || {});
    
    useEffect(() => { setDocStates(worker.doc_states || {}) }, [worker]);
    
    const updateDocState = async (docId: string, newState: any, msg: string) => { 
        const updatedDocStates = { ...docStates, [docId]: newState }; 
        setDocStates(updatedDocStates); 
        try { 
            const { error } = await supabase.from('fichas').update({ doc_states: updatedDocStates }).eq('id', worker.id); 
            if(error) throw error; 
            toast.success(msg); 
            onUpdate() 
        } catch (e) { 
            toast.error("Error al actualizar"); 
            setDocStates(worker.doc_states || {}) 
        } 
    }
    
    const toggleLock = (docId: string) => { 
        const currentState = docStates[docId] || {}; 
        const newStatus = currentState.status === 'unlocked' ? 'locked' : 'unlocked'; 
        updateDocState(docId, { ...currentState, status: newStatus }, newStatus === 'unlocked' ? "Documento habilitado" : "Documento bloqueado") 
    }
    
    const resetDoc = (docId: string) => { 
        if(!confirm("¿Borrar datos del obrero y bloquear?")) return; 
        updateDocState(docId, { status: 'locked', data: {}, completed_at: null }, "Documento reseteado") 
    }

    // LISTA DE DOCUMENTOS PARA DESCARGA
    const SSOMA_DOWNLOADS = [
        {
            id: 'risst_pdf_download',
            label: 'Reglamento Interno (RISST)',
            fileName: 'REGLAMENTO INTERNO DE SEGURIDAD.pdf',
            desc: 'Lectura obligatoria de seguridad.',
            icon: <FileText size={20}/>,
            styles: {
               bg: 'bg-indigo-50', border: 'border-indigo-100',
               iconBg: 'bg-indigo-100', iconText: 'text-indigo-600',
               title: 'text-indigo-900', desc: 'text-indigo-600/80',
               btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }
        },
        {
            id: 'calidad_pdf_download',
            label: 'Política de Calidad',
            fileName: 'POLITICA DE CALIDAD.pdf',
            desc: 'Estándares de calidad de la empresa.',
            icon: <Award size={20}/>,
            styles: {
               bg: 'bg-emerald-50', border: 'border-emerald-100',
               iconBg: 'bg-emerald-100', iconText: 'text-emerald-600',
               title: 'text-emerald-900', desc: 'text-emerald-600/80',
               btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }
        }
    ]

    const sendPdfToWorker = async (docConfig: any) => { 
        try { 
            const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', worker.id).single(); 
            const currentStates = currentFicha?.doc_states || {}; 
            
            const newStates = { 
                ...currentStates, 
                [docConfig.id]: { 
                    status: 'pending_download', 
                    sent_at: new Date().toISOString(), 
                    label: docConfig.label,
                    file: docConfig.fileName 
                } 
            }; 
            
            const { error } = await supabase.from('fichas').update({ doc_states: newStates }).eq('id', worker.id); 
            if (error) throw error; 
            toast.success(`PDF de ${docConfig.label} enviado.`) 
        } catch (error: any) { 
            toast.error("Error al enviar: " + error.message) 
        } 
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100" onClick={e => e.stopPropagation()}>
                
                <div id="drawer-header" className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl tracking-tight">SSOMA</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-slate-500 font-medium">{worker.nombres}</p>
                        </div>
                    </div>
                    <button id="drawer-close-btn" onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    
                    {/* SECCIÓN DE DESCARGAS */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3 pl-1">Documentos de Lectura</p>
                        <div className="space-y-4">
                            {SSOMA_DOWNLOADS.map((doc) => (
                                <div key={doc.id} className={`p-4 rounded-2xl border shadow-sm ${doc.styles.bg} ${doc.styles.border}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${doc.styles.iconBg} ${doc.styles.iconText}`}>
                                            {doc.icon}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-sm ${doc.styles.title}`}>{doc.label}</h4>
                                            <p className={`text-xs mt-1 leading-relaxed ${doc.styles.desc}`}>{doc.desc}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => sendPdfToWorker(doc)} 
                                        className={`mt-3 w-full py-2.5 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 ${doc.styles.btn}`}
                                    >
                                        <Send size={14}/> Enviar PDF al Obrero
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* SECCIÓN DOCUMENTOS DE FIRMA */}
                    <div id="drawer-info-section">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">REGISTROS DE FIRMA</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{DIGITAL_DOCS.length} Docs</span>
                        </div>
                        
                        <div className="space-y-3">
                            {DIGITAL_DOCS.map((doc) => { 
                                const status = docStates[doc.id]?.status || 'locked'; 
                                const isUnlocked = status === 'unlocked'; 
                                const isCompleted = status === 'completed'; 
                                
                                return (
                                    <div key={doc.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${isCompleted ? 'bg-emerald-50/50 border-emerald-200' : isUnlocked ? 'bg-white border-blue-200 shadow-md shadow-blue-100/50 ring-1 ring-blue-100' : 'bg-white border-slate-200 shadow-sm opacity-70 grayscale'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {isCompleted ? <CheckCircle size={20}/> : <FileText size={20}/>}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-800">{doc.label}</h4>
                                                    <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isUnlocked ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        <span style={{color: isCompleted ? '#059669' : isUnlocked ? '#2563EB' : '#94A3B8'}}>{isCompleted ? 'FIRMADO' : isUnlocked ? 'DISPONIBLE' : 'BLOQUEADO'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => resetDoc(doc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Reiniciar"><Trash2 size={16} /></button>
                                                <button onClick={() => toggleLock(doc.id)} className={`p-2 rounded-lg transition-all shadow-sm ${isUnlocked ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-purple-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={isUnlocked ? "Bloquear" : "Habilitar"}>{isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}</button>
                                            </div>
                                    </div>
                                ) 
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white">
                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20" onClick={onClose}>Cerrar Panel</button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// --- NUEVO COMPONENTE: DRAWER PARA SUBIR DOCUMENTOS (SSOMA) ---
function AdminUploadDrawer({ worker, onClose, onUpdate }: any) {
    const supabase = createClient()
    const [uploadStates, setUploadStates] = useState<any>(worker.uploads_state || {})
    const [uploadingId, setUploadingId] = useState<string | null>(null)

    useEffect(() => { setUploadStates(worker.uploads_state || {}) }, [worker])

    const handleFileUpload = async (e: any, docId: string, label: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            toast.error("Solo se permiten archivos PDF")
            return
        }

        setUploadingId(docId)

        try {
            const fileName = `${worker.dni}/${docId}_${Date.now()}.pdf`
            
            // 1. Subir al bucket (Asumiendo que existe un bucket 'worker_docs')
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('worker_docs') 
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('worker_docs').getPublicUrl(fileName)

            // 2. Actualizar estado en la base de datos
            const newUploadState = {
                ...uploadStates,
                [docId]: {
                    status: 'uploaded',
                    url: publicUrl,
                    uploaded_at: new Date().toISOString(),
                    name: file.name
                }
            }

            const { error: dbError } = await supabase
                .from('fichas')
                .update({ uploads_state: newUploadState })
                .eq('id', worker.id)

            if (dbError) throw dbError

            setUploadStates(newUploadState)
            toast.success(`Archivo para ${label} subido correctamente`)
            onUpdate()

        } catch (error: any) {
            console.error(error)
            toast.error("Error al subir archivo: " + error.message)
        } finally {
            setUploadingId(null)
        }
    }

    const deleteFile = async (docId: string) => {
        if(!confirm("¿Estás seguro de eliminar este archivo?")) return

        const newUploadState = { ...uploadStates }
        delete newUploadState[docId]

        try {
            const { error } = await supabase.from('fichas').update({ uploads_state: newUploadState }).eq('id', worker.id)
            if (error) throw error
            setUploadStates(newUploadState)
            toast.success("Archivo eliminado")
            onUpdate()
        } catch(e: any) {
            toast.error("Error al eliminar: " + e.message)
        }
    }

    // --- FUNCIÓN DE DESCARGA MASIVA ---
    const downloadAll = async () => {
        const files: any[] = Object.values(uploadStates).filter((f:any) => f.url);
        
        if (files.length === 0) {
            toast.info("No hay archivos para descargar");
            return;
        }

        toast.info(`Iniciando descarga de ${files.length} documentos...`);

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const file of files) {
            try {
                // Forzar descarga usando fetch para obtener el blob
                const response = await fetch(file.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = file.name || 'documento.pdf'; // Usar nombre original o default
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Limpiar URL object
                window.URL.revokeObjectURL(url);
                
                // Pequeña pausa entre descargas
                await delay(800); 
            } catch (e) {
                console.error("Error descargando archivo:", file.name, e);
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100" onClick={e => e.stopPropagation()}>
                
                <div className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl tracking-tight">Carga de Documentos</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <p className="text-xs text-slate-500 font-medium">Archivos para: {worker.nombres}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider pl-1">Listado de Documentos</p>
                        {/* Botón Descarga Masiva (Header interno) */}
                        {Object.keys(uploadStates).length > 0 && (
                            <button 
                                onClick={downloadAll}
                                className="text-[10px] flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                            >
                                <Download size={12}/> Descargar Todo
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {SSOMA_UPLOADS_CONFIG.map((doc) => {
                            const fileData = uploadStates[doc.id]
                            const isUploaded = !!fileData

                            return (
                                <div key={doc.id} className={`p-4 rounded-2xl border transition-all ${isUploaded ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isUploaded ? <CheckCircle size={18}/> : <FileText size={18}/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 line-clamp-1 w-48" title={doc.label}>{doc.label}</h4>
                                                <p className={`text-[10px] font-bold ${isUploaded ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {isUploaded ? 'ARCHIVO CARGADO' : 'PENDIENTE DE CARGA'}
                                                </p>
                                            </div>
                                        </div>
                                        {isUploaded && (
                                            <button onClick={() => deleteFile(doc.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>

                                    {isUploaded ? (
                                        <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                            <Paperclip size={14} className="text-emerald-500 shrink-0"/>
                                            <span className="text-xs text-emerald-700 truncate flex-1 font-medium">{fileData.name || 'documento.pdf'}</span>
                                            <a href={fileData.url} target="_blank" rel="noreferrer" className="p-1 bg-white rounded text-emerald-600 hover:text-emerald-800 shadow-sm border border-emerald-100">
                                                <ExternalLink size={12}/>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="mt-2">
                                            <label className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadingId === doc.id ? 'bg-slate-100 border-slate-300' : 'border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300'}`}>
                                                {uploadingId === doc.id ? (
                                                    <Loader2 size={16} className="animate-spin text-slate-500"/>
                                                ) : (
                                                    <UploadCloud size={16} className="text-amber-600"/>
                                                )}
                                                <span className="text-xs font-bold text-amber-700">{uploadingId === doc.id ? 'Subiendo...' : 'Subir PDF'}</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="application/pdf"
                                                    disabled={!!uploadingId}
                                                    onChange={(e) => handleFileUpload(e, doc.id, doc.label)}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white grid grid-cols-2 gap-3">
                    <button 
                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2" 
                        onClick={downloadAll}
                        disabled={Object.keys(uploadStates).length === 0}
                    >
                        <Download size={16}/> Descargar Todo
                    </button>
                    <button 
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20" 
                        onClick={onClose}
                    >
                        Finalizar
                    </button>
                </div>

            </motion.div>
        </motion.div>
    )
}

function AdminRRHHDrawer({ worker, onClose, onUpdate }: any) {
    const supabase = createClient()
    const [docStates, setDocStates] = useState<any>(worker.doc_states || {})

    useEffect(() => { setDocStates(worker.doc_states || {}) }, [worker])

    // Enviar PDFs
    const sendPdfToWorker = async (key: string, label: string) => {
        try {
            const { data: currentFicha } = await supabase.from('fichas').select('doc_states').eq('id', worker.id).single()
            const currentStates = currentFicha?.doc_states || {}
            
            let fileName = '';
            if (key === 'rit_pdf_download') fileName = 'REGLAMENTO INTERNO DE TRABAJO.pdf';
            else if (key === 'hostigamiento_pdf_download') fileName = 'POLITICA DE HOSTIGAMIENTO SEXUAL.pdf';
            else if (key === 'beneficiarios_pdf_download') fileName = 'DECLARACION DE BENEFICIARIOS_VIDA LEY_2019.pdf';
            else if (key === 'etica_pdf_download') fileName = 'CODIGO DE ETICA Y CONDUCTA.pdf'; 
            else if (key === 'antisoborno_pdf_download') fileName = 'POLITICA ANTISOBORNO Y ANTICORRUPCIÓN.pdf';

            const newStates = { 
                ...currentStates, 
                [key]: { 
                    status: 'pending_download', 
                    sent_at: new Date().toISOString(), 
                    label: label, 
                    file: fileName 
                } 
            }
            
            const { error } = await supabase.from('fichas').update({ doc_states: newStates }).eq('id', worker.id)
            if (error) throw error
            toast.success(`${label} enviado a ${worker.nombres}`)
        } catch (error: any) {
            toast.error("Error al enviar PDF: " + error.message)
        }
    }

    // Actualizar estados para Cargos
    const updateDocState = async (docId: string, newState: any, msg: string) => {
        const updatedDocStates = { ...docStates, [docId]: newState }
        setDocStates(updatedDocStates) 

        try {
            const { error } = await supabase.from('fichas').update({ doc_states: updatedDocStates }).eq('id', worker.id)
            if(error) throw error
            toast.success(msg)
            onUpdate()
        } catch (e) {
            toast.error("Error al actualizar")
            setDocStates(worker.doc_states || {}) 
        }
    }

    const toggleLock = (docId: string) => {
        const currentState = docStates[docId] || {}
        const newStatus = currentState.status === 'unlocked' ? 'locked' : 'unlocked'
        updateDocState(docId, { ...currentState, status: newStatus }, newStatus === 'unlocked' ? "Documento habilitado" : "Documento bloqueado")
    }

    const resetDoc = (docId: string) => {
        if(!confirm("¿Borrar datos del obrero y bloquear?")) return
        updateDocState(docId, { status: 'locked', data: {}, completed_at: null }, "Documento reseteado")
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100" onClick={e => e.stopPropagation()}>
                
                <div className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900 text-xl tracking-tight">Recursos Humanos</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <p className="text-xs text-slate-500 font-medium">{worker.nombres}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    
                    {/* SECCIÓN ENVÍO DE PDFS */}
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Envío de Documentos (Lectura)</p>
                        
                        {/* RIT */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FileBadge size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Reglamento Interno (RIT)</h4>
                                    <p className="text-xs text-slate-500">Lectura obligatoria</p>
                                </div>
                            </div>
                            <button onClick={() => sendPdfToWorker('rit_pdf_download', 'Reglamento Interno de Trabajo')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Send size={14}/> Enviar RIT</button>
                        </div>

                        {/* POLÍTICA HOSTIGAMIENTO */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><ShieldCheck size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Política Hostigamiento</h4>
                                    <p className="text-xs text-slate-500">Prevención y sanción</p>
                                </div>
                            </div>
                            <button onClick={() => sendPdfToWorker('hostigamiento_pdf_download', 'Política de Hostigamiento Sexual')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Send size={14}/> Enviar Política</button>
                        </div>

                        {/* DECLARACIÓN BENEFICIARIOS */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><HeartHandshake size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Declaración Beneficiarios</h4>
                                    <p className="text-xs text-slate-500">Vida Ley D. LEG. 688</p>
                                </div>
                            </div>
                            <button onClick={() => sendPdfToWorker('beneficiarios_pdf_download', 'Declaración de Beneficiarios Vida Ley')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Send size={14}/> Enviar Declaración</button>
                        </div>

                        {/* ÉTICA */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><BookOpen size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Código de Ética y Conducta</h4>
                                    <p className="text-xs text-slate-500">Normas de comportamiento</p>
                                </div>
                            </div>
                            <button onClick={() => sendPdfToWorker('etica_pdf_download', 'Código de Ética y Conducta')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Send size={14}/> Enviar Código</button>
                        </div>

                        {/* ANTISOBORNO */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><ShieldAlert size={20}/></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Política Antisoborno</h4>
                                    <p className="text-xs text-slate-500">Prevención de corrupción</p>
                                </div>
                            </div>
                            <button onClick={() => sendPdfToWorker('antisoborno_pdf_download', 'Política Antisoborno')} className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Send size={14}/> Enviar Política</button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* SECCIÓN CARGOS (FIRMA DIGITAL) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Cargos y Confirmaciones</p>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{RRHH_DOCS.length} Docs</span>
                        </div>
                        
                        <div className="space-y-3">
                            {RRHH_DOCS.map((doc) => {
                                const status = docStates[doc.id]?.status || 'locked'
                                const isUnlocked = status === 'unlocked'
                                const isCompleted = status === 'completed'

                                return (
                                    <div key={doc.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${isCompleted ? 'bg-emerald-50/50 border-emerald-200' : isUnlocked ? 'bg-white border-purple-200 shadow-md shadow-purple-100/50 ring-1 ring-purple-100' : 'bg-white border-slate-200 shadow-sm opacity-70 grayscale'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isUnlocked ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>{isCompleted ? <CheckCircle size={20}/> : <FileText size={20}/>}</div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 w-40" title={doc.label}>{doc.label}</h4>
                                                    <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isUnlocked ? 'bg-purple-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        <span style={{color: isCompleted ? '#059669' : isUnlocked ? '#9333ea' : '#94A3B8'}}>{isCompleted ? 'FIRMADO' : isUnlocked ? 'PENDIENTE' : 'BLOQUEADO'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => resetDoc(doc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Reiniciar"><Trash2 size={16} /></button>
                                                <button onClick={() => toggleLock(doc.id)} className={`p-2 rounded-lg transition-all shadow-sm ${isUnlocked ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={isUnlocked ? "Bloquear" : "Habilitar"}>{isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}</button>
                                            </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-200 bg-white">
                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20" onClick={onClose}>Cerrar Panel</button>
                </div>
            </motion.div>
        </motion.div>
    )
}