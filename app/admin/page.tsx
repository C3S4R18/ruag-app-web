'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import AdminTable from '@/components/AdminTable' 
import MassImport from '@/components/MassImport' // <--- IMPORTAR
import { 
  LayoutGrid, Users, FileCheck, LogOut, Bell, 
  Search, TrendingUp, Activity, ShieldCheck, ChevronDown, UploadCloud, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false) // <--- ESTADO DEL IMPORTADOR

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nombres')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard') 
      } else {
        setIsAdmin(true)
        setUserName(profile.nombres.split(' ')[0]) 
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full"
        />
    </div>
  )

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 relative">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">RUAG <span className="text-slate-400 font-medium">Panel</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{userName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                    {userName.charAt(0)}
                </div>
                <button 
                    onClick={async () => { await supabase.auth.signOut(); router.push('/') }} 
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
             <p className="text-slate-500 mt-1">Gestión de personal y documentación.</p>
          </motion.div>
          <div className="flex gap-3">
             <button 
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-1"
             >
                <UploadCloud size={18}/> Importar Masivo
             </button>
          </div>
        </div>

        {/* MODAL IMPORTADOR */}
        <AnimatePresence>
            {showImport && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Carga Masiva de Empleados</h3>
                            <button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={18}/></button>
                        </div>
                        <div className="p-6">
                            <MassImport onComplete={() => setShowImport(false)} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Personal Total" value="Gestionar" desc="Base de datos activa" icon={<Users size={20} className="text-blue-600"/>} delay={0.1} />
            <StatCard title="Fichas Completadas" value="Revisar" desc="Documentación lista" icon={<FileCheck size={20} className="text-emerald-600"/>} delay={0.2} />
            <StatCard title="Actividad Reciente" value="En Vivo" desc="Sincronización Realtime" icon={<Activity size={20} className="text-indigo-600"/>} delay={0.3} />
        </div>

        {/* TABLE */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
        >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <LayoutGrid size={18} className="text-slate-400"/>
                    Base de Datos
                </h3>
            </div>
            <AdminTable />
        </motion.div>

      </main>
    </div>
  )
}

function StatCard({title, value, desc, icon, delay}: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-default"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100">
                    {icon}
                </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                <TrendingUp size={12}/> {desc}
            </div>
        </motion.div>
    )
}