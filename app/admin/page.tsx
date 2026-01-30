'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 
import AdminTable from '@/components/AdminTable' 
import MassImport from '@/components/MassImport' 

// IMPORTS
import BiometricSignature from '@/components/ssoma/BiometricSignature'
import BiometricFingerprint from '@/components/ssoma/BiometricFingerprint'

import { 
  LayoutGrid, Users, FileCheck, LogOut, ShieldCheck, 
  Search, TrendingUp, Activity, HardHat, UploadCloud, X,
  LayoutDashboard, Fingerprint, Menu, PenTool, ScanLine, CheckCircle, Loader2, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  const [activeView, setActiveView] = useState<'dashboard' | 'biometria'>('dashboard')
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [showImport, setShowImport] = useState(false)

  // Datos Biometría
  const [biometricData, setBiometricData] = useState<any[]>([])
  const [loadingBiometria, setLoadingBiometria] = useState(false)
  const [biometricSearch, setBiometricSearch] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<any>(null)

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
  }, [])

  // FETCH DATOS
  const fetchBiometricData = async () => {
      setLoadingBiometria(true)
      const { data, error } = await supabase
        .from('fichas')
        .select('id, nombres, apellido_paterno, dni, firma_url, huella_url, estado')
        .order('updated_at', { ascending: false })
      
      if(error) {
          console.error("Error fetching biometria:", JSON.stringify(error))
          toast.error("Error al cargar trabajadores")
      }
      if(data) setBiometricData(data)
      setLoadingBiometria(false)
  }

  // RECARGAR AL CAMBIAR VISTA
  useEffect(() => {
      if(activeView === 'biometria') fetchBiometricData()
  }, [activeView])

  const filteredBiometric = biometricData.filter(worker => 
      (worker.nombres || '').toLowerCase().includes(biometricSearch.toLowerCase()) || 
      (worker.apellido_paterno || '').toLowerCase().includes(biometricSearch.toLowerCase()) || 
      (worker.dni || '').includes(biometricSearch)
  )

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-slate-900 text-white flex flex-col h-full shrink-0 relative z-40 border-r border-slate-800"
      >
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50"><ShieldCheck size={20} className="text-white" /></div>
            <div className="whitespace-nowrap overflow-hidden"><h1 className="font-bold text-lg tracking-tight">RUAG <span className="text-blue-500">Admin</span></h1></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Panel General" />
            <SidebarItem active={activeView === 'biometria'} onClick={() => setActiveView('biometria')} icon={<Fingerprint size={20}/>} label="Biometría y Firmas" />
        </nav>
        <div className="p-4 border-t border-slate-800">
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"><LogOut size={20} /><span className="text-sm font-medium">Cerrar Sesión</span></button>
        </div>
      </motion.aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F1F5F9] relative transition-all">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Menu size={20}/></button>
                <h2 className="text-lg font-bold text-slate-700">{activeView === 'dashboard' ? 'Resumen General' : 'Gestión Biométrica'}</h2>
            </div>
            <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block"><p className="text-sm font-bold text-slate-800">{userName}</p><p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">● Admin</p></div>
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold border border-blue-200">{userName.charAt(0)}</div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {/* VISTA DASHBOARD */}
            {activeView === 'dashboard' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
                    <div className="flex justify-end gap-3">
                        <Link href="/admin/ssoma/induccion"><div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"><HardHat size={16}/> KIOSCO SSOMA</div></Link>
                        <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:text-blue-600 hover:border-blue-300 transition-all"><UploadCloud size={16}/> CARGA MASIVA</button>
                    </div>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Personal" value={biometricData.length.toString()} desc="Base de datos" icon={<Users size={24} className="text-blue-600"/>} color="blue" delay={0.1} />
                        <StatCard title="Firmas Capturadas" value={biometricData.filter(x=>x.firma_url).length.toString()} desc="Documentos firmados" icon={<PenTool size={24} className="text-indigo-600"/>} color="indigo" delay={0.2} />
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                            <div className="relative z-10"><div className="flex items-center gap-2 mb-2 opacity-80"><Activity size={18}/> <span className="text-xs font-bold uppercase">Estado Sistema</span></div><h3 className="text-2xl font-bold">En Línea</h3><p className="text-sm opacity-90 mt-1">Sincronización automática activa.</p></div>
                            <Activity className="absolute bottom-[-20px] right-[-20px] text-white/10" size={120}/>
                        </div>
                    </div>
                    {/* TU TABLA ORIGINAL INTEGRADA */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-3"><LayoutGrid size={20} className="text-slate-400"/> Registro de Trabajadores</h3></div>
                        <AdminTable />
                    </div>
                </motion.div>
            )}

            {/* VISTA BIOMETRÍA */}
            {activeView === 'biometria' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={18}/>
                            <input type="text" placeholder="Buscar por DNI o Nombre..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" value={biometricSearch} onChange={e => setBiometricSearch(e.target.value)}/>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Mostrando <span className="text-slate-900 font-bold">{filteredBiometric.length}</span> trabajadores</div>
                    </div>

                    {loadingBiometria ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><Loader2 size={40} className="animate-spin mb-4 text-blue-500"/><p>Cargando padrón...</p></div>
                    ) : filteredBiometric.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl p-10"><AlertCircle size={40} className="mb-4 text-slate-300"/><p className="font-bold text-slate-600">No se encontraron trabajadores</p></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredBiometric.map((worker) => (
                                <div key={worker.id} onClick={() => setSelectedWorker(worker)} className={`bg-white rounded-2xl p-5 border shadow-sm cursor-pointer transition-all group relative overflow-hidden hover:shadow-md hover:scale-[1.02] ${worker.firma_url && worker.huella_url ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                                    <div className="absolute top-4 right-4">{(worker.firma_url && worker.huella_url) ? <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><CheckCircle size={16}/></div> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>}</div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">{worker.nombres?.charAt(0)}{worker.apellido_paterno?.charAt(0)}</div>
                                        <div className="min-w-0"><h4 className="font-bold text-slate-800 truncate">{worker.apellido_paterno}</h4><p className="text-xs text-slate-500 truncate">{worker.nombres}</p><p className="text-[10px] font-mono text-blue-500 mt-0.5">{worker.dni}</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className={`flex-1 py-2 rounded-lg text-[10px] font-bold text-center border flex items-center justify-center gap-1 ${worker.firma_url ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><PenTool size={12}/> {worker.firma_url ? 'LISTO' : 'FALTA'}</div>
                                        <div className={`flex-1 py-2 rounded-lg text-[10px] font-bold text-center border flex items-center justify-center gap-1 ${worker.huella_url ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><Fingerprint size={12}/> {worker.huella_url ? 'LISTO' : 'FALTA'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>

        {/* MODAL BIOMETRICO INTELIGENTE */}
        <AnimatePresence>
            {selectedWorker && (
                <BiometricModal 
                    worker={selectedWorker} 
                    onClose={() => setSelectedWorker(null)} 
                    onUpdate={() => { 
                        fetchBiometricData(); // RECARGA DATOS PARA "AUTOCOMPLETAR" EL ESTADO
                    }}
                />
            )}
        </AnimatePresence>
        
        {/* MODAL IMPORTACION */}
        <AnimatePresence>
            {showImport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
                         <button onClick={() => setShowImport(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                        <div className="p-8"><MassImport onComplete={() => setShowImport(false)} /></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </main>
    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function SidebarItem({ active, onClick, icon, label }: any) {
    return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{icon}<span className="whitespace-nowrap">{label}</span></button>
}
function StatCard({title, value, desc, icon, color, delay}: any) {
    return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full relative overflow-hidden`}><div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-50 rounded-bl-full -mr-4 -mt-4`}></div><div className="relative z-10 flex flex-col h-full justify-between"><div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center mb-4`}>{icon}</div><div><h3 className="text-2xl font-bold text-slate-900">{value}</h3><p className="text-slate-500 text-sm font-medium">{title}</p><div className="mt-2 text-xs font-bold text-slate-400 flex items-center gap-1"><TrendingUp size={12}/> {desc}</div></div></div></motion.div>
}

// --- MODAL BIOMETRICO CON LOGICA ACTUALIZADA ---
function BiometricModal({ worker, onClose, onUpdate }: any) {
    const supabase = createClient()
    const [tab, setTab] = useState<'firma' | 'huella'>('firma')

    // --- ACTUALIZAR CAMPO (GUARDAR) ---
    const updateField = async (field: 'firma_url' | 'huella_url', value: string | null) => {
        try {
            const { error } = await supabase.from('fichas').update({ [field]: value }).eq('id', worker.id)
            if (error) throw error
            
            if(value) toast.success(`${field === 'firma_url' ? 'Firma' : 'Huella'} guardada exitosamente`)
            else toast.success(`${field === 'firma_url' ? 'Firma' : 'Huella'} eliminada`)
            
            // Actualizar vista padre (Autocompletado visual)
            onUpdate() 
            
            // Si guardó firma, pasar a huella automaticamente
            if(value && field === 'firma_url') setTab('huella')
            
        } catch (e: any) { toast.error("Error: " + e.message) }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">{worker.nombres.charAt(0)}{worker.apellido_paterno.charAt(0)}</div>
                        <div><h3 className="font-bold text-slate-800 text-lg">{worker.nombres} {worker.apellido_paterno}</h3><p className="text-sm text-slate-500">DNI: {worker.dni}</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                <div className="flex border-b border-slate-100 shrink-0">
                    <button onClick={() => setTab('firma')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${tab === 'firma' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><PenTool size={18}/> Firma Digital</button>
                    <button onClick={() => setTab('huella')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${tab === 'huella' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><ScanLine size={18}/> Huella Dactilar</button>
                </div>
                <div className="flex-1 bg-slate-50 relative p-6 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                        {tab === 'firma' ? ( 
                            <BiometricSignature 
                                onSave={(data) => updateField('firma_url', data)} 
                                onClear={() => updateField('firma_url', null)}
                                existingSignature={worker.firma_url} 
                            /> 
                        ) : ( 
                            <BiometricFingerprint 
                                onSave={(data) => updateField('huella_url', data)} 
                                onClear={() => updateField('huella_url', null)}
                                existingFingerprint={worker.huella_url} 
                            /> 
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}