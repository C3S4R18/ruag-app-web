'use client'

import FichaForm from '@/components/FichaForm'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User, Calendar, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      // Obtener nombre para el saludo
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombres')
        .eq('id', user.id)
        .single()
      
      if (profile) setUserName(profile.nombres.split(' ')[0]) // Solo el primer nombre
    }
    getUserData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
            <span className="font-bold text-xl tracking-tight text-blue-900">RUAG <span className="text-slate-400 font-normal text-sm">| Portal</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <Calendar size={14} />
              <span className="capitalize">{today}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 font-medium hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* ZONA DE BIENVENIDA */}
      <div className="bg-blue-900 text-white py-12 px-4 mb-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hola, {userName || 'Trabajador'} 👋</h1>
          <p className="text-blue-200 text-lg max-w-2xl">
            Bienvenido al sistema de gestión. Por favor, completa tu ficha de datos personales para regularizar tu ingreso a obra.
          </p>
          
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm bg-blue-800/50 px-4 py-2 rounded-lg border border-blue-700/50">
              <ShieldCheck size={16} className="text-green-400"/>
              <span>Plataforma Segura</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-blue-800/50 px-4 py-2 rounded-lg border border-blue-700/50">
              <User size={16} className="text-blue-300"/>
              <span>Perfil Verificado</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="container mx-auto px-4 pb-20 -mt-10">
        <FichaForm />
      </div>
      
    </div>
  )
}