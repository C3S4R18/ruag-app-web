'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 
import AdminTable from '@/components/AdminTable' 
import MassImport from '@/components/MassImport' 

// IMPORTS
import BiometricSignature from '@/components/ssoma/BiometricSignature'
import BiometricFingerprint from '@/components/ssoma/BiometricFingerprint'

import { 
  LayoutGrid, Users, LogOut, ShieldCheck, 
  Search, TrendingUp, Activity, HardHat, UploadCloud, X,
  LayoutDashboard, Fingerprint, Menu, PenTool, CheckCircle, Loader2, AlertCircle,
  FileText, Lock, Unlock, ScanLine, Trash2, ChevronLeft, ChevronRight, Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const DIGITAL_DOCS = [
    { id: 'risst', label: 'Cargo RISST' },
    { id: 'capacitacion', label: 'Registro Capacitación' },
    { id: 'induccion', label: 'Inducción Hombre Nuevo' },
    { id: 'epp', label: 'Entrega de EPPs' },
    { id: 'acta_derecho', label: 'Acta Derecho a Saber' },
    { id: 'iperc', label: 'Entrega IPERC' },
]

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  const [activeView, setActiveView] = useState<'dashboard' | 'biometria' | 'documentos'>('dashboard')
  
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const [showImport, setShowImport] = useState(false)

  // Datos
  const [workersData, setWorkersData] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Selección
  const [selectedWorkerBiometria, setSelectedWorkerBiometria] = useState<any>(null)
  const [selectedWorkerDocs, setSelectedWorkerDocs] = useState<any>(null)

  const workersDataRef = useRef(workersData)
  const selectedWorkerDocsRef = useRef(selectedWorkerDocs)

  useEffect(() => { workersDataRef.current = workersData }, [workersData])
  useEffect(() => { selectedWorkerDocsRef.current = selectedWorkerDocs }, [selectedWorkerDocs])

  const playAdminSound = () => {
      const isAudioEnabled = localStorage.getItem('admin_audio_enabled') === 'true'
      if (isAudioEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(e => console.log("Audio admin bloqueado:", e))
      }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('role, nombres').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard') } 
      else { setIsAdmin(true); setUserName(profile.nombres.split(' ')[0]) }
      setLoading(false)
    }
    checkUser()

    const handleResize = () => {
        const mobile = window.innerWidth < 1024
        setIsMobile(mobile)
        if (mobile) setSidebarOpen(false)
        else setSidebarOpen(true)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchData = async () => {
      if (workersData.length === 0) setLoadingData(true)
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if(error) toast.error("Error al cargar datos")
      if(data) setWorkersData(data)
      setLoadingData(false)
  }

  useEffect(() => {
      fetchData()

      const channel = supabase.channel('admin-docs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas' }, (payload: any) => {
            const newRow = payload.new
            const oldData = workersDataRef.current
            const oldRow = oldData.find(w => w.id === newRow.id)

            if (oldRow) {
                const newDocs = newRow.doc_states || {}
                const oldDocs = oldRow.doc_states || {}

                let hasNewCompletion = false
                Object.keys(newDocs).forEach(key => {
                    if (newDocs[key]?.status === 'completed' && oldDocs[key]?.status !== 'completed') {
                        hasNewCompletion = true
                    }
                })

                if (hasNewCompletion) {
                    playAdminSound()
                    toast.success(`✅ ${newRow.nombres} ha completado un documento.`)
                }

                setWorkersData(prev => prev.map(w => w.id === newRow.id ? newRow : w))
                
                if (selectedWorkerDocsRef.current && selectedWorkerDocsRef.current.id === newRow.id) {
                    setSelectedWorkerDocs(newRow)
                }
            }
        }).subscribe()

      return () => { supabase.removeChannel(channel) }
  }, []) 

  const filteredWorkers = workersData.filter(worker => 
      (worker.nombres || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (worker.apellido_paterno || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (worker.dni || '').includes(searchQuery)
  )

  const handleNavClick = (view: any) => {
      setActiveView(view)
      if (isMobile) setSidebarOpen(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
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

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-2">
            <SidebarItem active={activeView === 'dashboard'} onClick={() => handleNavClick('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard General" />
            
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestión Operativa</div>
            <SidebarItem active={activeView === 'biometria'} onClick={() => handleNavClick('biometria')} icon={<Fingerprint size={20}/>} label="Biometría y Firmas" />
            <SidebarItem active={activeView === 'documentos'} onClick={() => handleNavClick('documentos')} icon={<FileText size={20}/>} label="Documentación SSOMA" />
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
                <span className="text-sm font-medium">Cerrar Sesión</span>
             </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] relative">
        
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)} 
                    className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors border border-transparent hover:border-slate-200"
                >
                    <Menu size={22}/>
                </button>
                
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {activeView === 'dashboard' && 'Resumen General'}
                        {activeView === 'biometria' && 'Control Biométrico'}
                        {activeView === 'documentos' && 'Gestión Documental'}
                    </h2>
                    <p className="text-xs text-slate-400 hidden sm:block">Panel de administración centralizada</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-600">Sincronización activa</span>
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

        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
            
            {activeView === 'dashboard' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-7xl mx-auto">
                    
                    <div className="flex flex-wrap justify-end gap-3">
                        <Link href="/admin/ssoma/induccion">
                            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-all cursor-pointer border border-slate-700">
                                <HardHat size={18}/> MODO KIOSCO SSOMA
                            </div>
                        </Link>
                        <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all">
                            <UploadCloud size={18}/> CARGA MASIVA
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Total Personal" 
                            value={workersData.length.toString()} 
                            desc="Base de datos global" 
                            icon={<Users size={24} className="text-white"/>} 
                            bg="bg-gradient-to-br from-blue-500 to-blue-600"
                            delay={0.1} 
                        />
                        <StatCard 
                            title="Docs Firmados" 
                            value={workersData.reduce((acc, curr) => acc + (curr.doc_states ? Object.values(curr.doc_states).filter((d:any)=>d.status==='completed').length : 0), 0).toString()} 
                            desc="Total verificados" 
                            icon={<FileText size={24} className="text-white"/>} 
                            bg="bg-gradient-to-br from-indigo-500 to-purple-600"
                            delay={0.2} 
                        />
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium mb-1">Estado del Sistema</p>
                                    <h3 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                                        En Línea
                                    </h3>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Activity size={24}/>
                                </div>
                            </div>
                            <div className="mt-4 text-xs font-medium text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                                Sincronizando con base de datos central
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
                        <AdminTable />
                    </div>
                </motion.div>
            )}

            {(activeView === 'biometria' || activeView === 'documentos') && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col max-w-7xl mx-auto">
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                            <input 
                                type="text" 
                                placeholder="Filtrar por DNI, Nombre o Apellido..." 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-medium" 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <Users size={16} className="text-slate-400"/>
                            <span>Total filtrado: <span className="text-slate-900 font-bold">{filteredWorkers.length}</span></span>
                        </div>
                    </div>

                    {loadingData ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                            <Loader2 size={48} className="animate-spin mb-4 text-blue-500"/>
                            <p className="font-medium animate-pulse">Consultando trabajadores...</p>
                        </div>
                    ) : filteredWorkers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl p-16 bg-slate-50/50">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Search size={32} className="text-slate-300"/>
                            </div>
                            <p className="font-bold text-slate-600 text-lg">No hay coincidencias</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
                            {filteredWorkers.map((worker) => (
                                <div 
                                    key={worker.id} 
                                    onClick={() => activeView === 'biometria' ? setSelectedWorkerBiometria(worker) : setSelectedWorkerDocs(worker)} 
                                    className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xl border border-white shadow-inner group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-600 transition-colors">
                                            {worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-800 truncate text-base group-hover:text-blue-700 transition-colors uppercase">{worker.apellido_paterno}</h4>
                                            <p className="text-sm text-slate-500 truncate mb-1">{worker.nombres}</p>
                                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                                {worker.dni}
                                            </span>
                                        </div>
                                    </div>

                                    {activeView === 'biometria' ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`py-2.5 rounded-xl text-[10px] font-bold text-center border flex flex-col items-center justify-center gap-1 transition-colors ${worker.firma_url ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                <PenTool size={14} className={worker.firma_url ? "text-emerald-500" : "text-slate-300"}/> 
                                                {worker.firma_url ? 'FIRMA OK' : 'SIN FIRMA'}
                                            </div>
                                            <div className={`py-2.5 rounded-xl text-[10px] font-bold text-center border flex flex-col items-center justify-center gap-1 transition-colors ${worker.huella_url ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                <Fingerprint size={14} className={worker.huella_url ? "text-emerald-500" : "text-slate-300"}/> 
                                                {worker.huella_url ? 'HUELLA OK' : 'SIN HUELLA'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <button className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all flex items-center justify-center gap-2">
                                                <FileText size={14}/> Gestionar Documentos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>

        <AnimatePresence>
            {selectedWorkerBiometria && (
                <BiometricModal 
                    worker={selectedWorkerBiometria} 
                    onClose={() => setSelectedWorkerBiometria(null)} 
                    onUpdate={() => fetchData()}
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {selectedWorkerDocs && (
                <AdminDocsDrawer 
                    worker={selectedWorkerDocs} 
                    onClose={() => setSelectedWorkerDocs(null)} 
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

      </main>
    </div>
  )
}

function SidebarItem({ active, onClick, icon, label }: any) {
    return (
        <button 
            onClick={onClick} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
            {active && (
                <motion.div layoutId="active-bg" className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40" initial={false} transition={{type:'spring', stiffness: 500, damping: 30}} />
            )}
            <span className="relative z-10">{icon}</span>
            <span className="relative z-10 tracking-wide">{label}</span>
            {!active && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0"/>}
        </button>
    )
}

function StatCard({title, value, desc, icon, bg, delay}: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay }} 
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-2xl shadow-lg shadow-blue-900/10 ${bg}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-500"/> 
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{desc}</span>
                </div>
            </div>
        </motion.div>
    )
}

function BiometricModal({ worker, onClose, onUpdate }: any) {
    const supabase = createClient()
    const [tab, setTab] = useState<'firma' | 'huella'>('firma')

    const updateField = async (field: 'firma_url' | 'huella_url', value: string | null) => {
        try {
            const { error } = await supabase.from('fichas').update({ [field]: value }).eq('id', worker.id)
            if (error) throw error
            if(value) toast.success("Guardado exitosamente")
            else toast.success("Eliminado")
            onUpdate() 
            if(value && field === 'firma_url') setTab('huella')
        } catch (e: any) { toast.error("Error: " + e.message) }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30">
                            {worker.nombres.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-xl uppercase">{worker.nombres} {worker.apellido_paterno}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{worker.dni}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500 font-medium capitalize">{worker.cargo || 'Operario'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50 p-1 gap-1 mx-6 mt-4 rounded-xl">
                    <button onClick={() => setTab('firma')} className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${tab === 'firma' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><PenTool size={16}/> Firma Digital</button>
                    <button onClick={() => setTab('huella')} className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${tab === 'huella' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><ScanLine size={16}/> Huella Dactilar</button>
                </div>

                <div className="flex-1 bg-slate-50 relative p-6 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                        {tab === 'firma' ? ( <BiometricSignature onSave={(data) => updateField('firma_url', data)} onClear={() => updateField('firma_url', null)} existingSignature={worker.firma_url} /> ) : ( <BiometricFingerprint onSave={(data) => updateField('huella_url', data)} onClear={() => updateField('huella_url', null)} existingFingerprint={worker.huella_url} /> )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function AdminDocsDrawer({ worker, onClose, onUpdate }: any) {
    const supabase = createClient()
    const [docStates, setDocStates] = useState<any>(worker.doc_states || {})

    useEffect(() => {
        setDocStates(worker.doc_states || {})
    }, [worker])

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
                        <h2 className="font-bold text-slate-900 text-xl tracking-tight">Documentación</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-slate-500 font-medium uppercase">{worker.nombres}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Estado de Documentos</p>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{DIGITAL_DOCS.length} Documentos</span>
                    </div>
                    
                    {DIGITAL_DOCS.map((doc) => {
                        const status = docStates[doc.id]?.status || 'locked'
                        const isUnlocked = status === 'unlocked'
                        const isCompleted = status === 'completed'

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
                                            <span style={{color: isCompleted ? '#059669' : isUnlocked ? '#2563EB' : '#94A3B8'}}>
                                                {isCompleted ? 'FIRMADO' : isUnlocked ? 'DISPONIBLE' : 'BLOQUEADO'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => resetDoc(doc.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Reiniciar"><Trash2 size={16} /></button>
                                    <button 
                                        onClick={() => toggleLock(doc.id)} 
                                        className={`p-2 rounded-lg transition-all shadow-sm ${isUnlocked ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`} 
                                        title={isUnlocked ? "Bloquear" : "Habilitar"}
                                    >
                                        {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="p-6 border-t border-slate-200 bg-white">
                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20" onClick={onClose}>
                        Cerrar Panel
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}