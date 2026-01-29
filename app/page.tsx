'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldCheck, User, Mail, Phone, Lock, ArrowRight, Building2, CreditCard } from 'lucide-react'

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // --- LOGIN HÍBRIDO ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const inputUser = formData.get('identifier') as string
    const password = formData.get('password') as string
    
    // Lógica inteligente: Si no tiene @ es DNI
    let emailFinal = inputUser.trim()
    if (!inputUser.includes('@')) {
        emailFinal = `${inputUser}@ruag.sistema`
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailFinal,
      password: password,
    })

    if (error) {
      toast.error("Credenciales incorrectas", { description: "Verifica tu DNI/Correo o contraseña." })
      setLoading(false)
    } else {
      const { data: profile } = await supabase.from('profiles').select('role, nombres').eq('id', data.user.id).single()
      toast.success(`Bienvenido, ${profile?.nombres?.split(' ')[0] || 'Usuario'}`)
      
      if (profile?.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    }
  }

  // --- REGISTRO COMPLETO ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const dni = formData.get('dni') as string
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string
    const password = formData.get('password') as string
    const nombres = formData.get('nombres') as string
    const apPaterno = formData.get('apPaterno') as string
    const apMaterno = formData.get('apMaterno') as string
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: `${nombres} ${apPaterno}` } }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          nombres, apellido_paterno: apPaterno, apellido_materno: apMaterno,
          dni, telefono, role: 'obrero'
        })

        if (profileError) toast.error(profileError.message)
        else {
            toast.success("Cuenta creada exitosamente", { description: "Ahora puedes iniciar sesión." })
            setView('login')
        }
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA (BRANDING & VISUALS) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Fondo Animado Abstracto */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
                    <ShieldCheck className="text-blue-400" size={28} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wider">RUAG <span className="text-blue-500">SYSTEM</span></h1>
            </div>
            
            <div className="space-y-6 max-w-md">
                <h2 className="text-5xl font-bold text-white leading-tight">
                    Gestión de Personal <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Inteligente.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Plataforma centralizada para el control de ingresos, documentación y validación de trabajadores en obra.
                </p>
            </div>
        </div>

        <div className="relative z-10 flex gap-8 text-slate-500 text-sm font-medium">
            <div className="flex items-center gap-2"><Building2 size={16}/> Control de Obra</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16}/> Validación Legal</div>
        </div>
      </motion.div>

      {/* SECCIÓN DERECHA (FORMULARIO) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50/50">
        <div className="w-full max-w-md">
            
            {/* Header Móvil (Solo visible en pantallas pequeñas) */}
            <div className="lg:hidden flex justify-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-2 rounded-lg"><ShieldCheck className="text-white" size={24} /></div>
                    <span className="text-xl font-bold text-slate-900">RUAG SYSTEM</span>
                </div>
            </div>

            {/* Switcher Tabs */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 flex relative">
                <motion.div 
                    layout 
                    className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-slate-900 rounded-xl top-1 left-1 shadow-md z-0"
                    animate={{ x: view === 'login' ? 0 : '100%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button 
                    onClick={() => setView('login')} 
                    className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors ${view === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Ingresar
                </button>
                <button 
                    onClick={() => setView('register')} 
                    className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors ${view === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Registrarme
                </button>
            </div>

            <AnimatePresence mode="wait">
                
                {/* --- FORM LOGIN --- */}
                {view === 'login' ? (
                    <motion.div 
                        key="login"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900">¡Hola de nuevo! 👋</h3>
                            <p className="text-slate-500 mt-2">Ingresa tu DNI o Correo para continuar.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <InputGroup icon={<User size={18}/>} name="identifier" placeholder="DNI o Correo Electrónico" required />
                            <InputGroup icon={<Lock size={18}/>} name="password" type="password" placeholder="Contraseña" required />
                            
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">¿Problemas para ingresar?</a>
                            </div>

                            <Button loading={loading} text="Iniciar Sesión" />
                        </form>
                    </motion.div>
                ) : (
                    
                    /* --- FORM REGISTRO --- */
                    <motion.div 
                        key="register"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Crear Cuenta 🚀</h3>
                            <p className="text-slate-500 mt-2">Regístrate para llenar tu ficha de ingreso.</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup icon={<CreditCard size={18}/>} name="dni" placeholder="DNI" maxLength={12} required />
                                <InputGroup icon={<Phone size={18}/>} name="telefono" placeholder="Celular" type="tel" maxLength={9} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup name="apPaterno" placeholder="Ap. Paterno" required />
                                <InputGroup name="apMaterno" placeholder="Ap. Materno" required />
                            </div>
                            
                            <InputGroup name="nombres" placeholder="Nombres Completos" required />
                            <InputGroup icon={<Mail size={18}/>} name="email" type="email" placeholder="Correo Electrónico" required />
                            <InputGroup icon={<Lock size={18}/>} name="password" type="password" placeholder="Crear Contraseña" required />

                            <div className="pt-2">
                                <Button loading={loading} text="Registrar Cuenta" />
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-8 text-center">
                <p className="text-xs text-slate-400">© 2026 RUAG S.R.LTDA - Todos los derechos reservados.</p>
            </div>
        </div>
      </div>
    </div>
  )
}

// --- Componentes Reutilizables de Diseño ---

function InputGroup({ icon, name, type = "text", placeholder, required, maxLength }: any) {
    return (
        <div className="relative group">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    {icon}
                </div>
            )}
            <input 
                name={name} 
                type={type} 
                required={required}
                maxLength={maxLength}
                placeholder={placeholder}
                className={`w-full bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm ${icon ? 'pl-11 pr-4' : 'px-4'}`}
            />
        </div>
    )
}

function Button({ loading, text }: any) {
    return (
        <button 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
        >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <>{text} <ArrowRight size={18}/></>}
        </button>
    )
}