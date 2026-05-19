'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

type ViewMode = 'login' | 'register'

type LoginState = {
  identifier: string
  password: string
}

type RegisterState = {
  dni: string
  telefono: string
  nombres: string
  apPaterno: string
  apMaterno: string
  email: string
  password: string
}

const initialRegisterState: RegisterState = {
  dni: '',
  telefono: '',
  nombres: '',
  apPaterno: '',
  apMaterno: '',
  email: '',
  password: '',
}

export default function AuthPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [view, setView] = useState<ViewMode>('login')
  const [loading, setLoading] = useState(false)
  const [login, setLogin] = useState<LoginState>({ identifier: '', password: '' })
  const [register, setRegister] = useState<RegisterState>(initialRegisterState)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const candidates = await resolveLoginCandidates(supabase, login.identifier)
      let lastError: string | null = null
      let loggedUserId: string | null = null

      for (const emailCandidate of candidates) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password: login.password,
        })

        if (!error && data.user) {
          loggedUserId = data.user.id
          lastError = null
          break
        }

        lastError = error?.message ?? 'No se pudo iniciar sesión.'
      }

      if (!loggedUserId) {
        toast.error('No se pudo iniciar sesión', {
          description: mapLoginError(lastError),
        })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nombres')
        .eq('id', loggedUserId)
        .single()

      toast.success(`Bienvenido, ${profile?.nombres?.split(' ')[0] || 'Usuario'}`)

      if (profile?.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const normalizedDni = register.dni.trim()
      const normalizedTelefono = register.telefono.trim()
      const normalizedNombres = register.nombres.trim()
      const normalizedApPaterno = register.apPaterno.trim()
      const normalizedApMaterno = register.apMaterno.trim()
      const normalizedEmail = register.email.trim().toLowerCase()

      if (
        normalizedDni.length < 8 ||
        normalizedNombres.length === 0 ||
        normalizedEmail.length === 0 ||
        register.password.length < 6
      ) {
        toast.error('Faltan datos', {
          description: 'Completa los obligatorios. El DNI debe tener al menos 8 dígitos y la contraseña 6 caracteres.',
        })
        return
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('dni', normalizedDni)
        .maybeSingle()

      if (existingProfile) {
        toast.error('DNI ya registrado', {
          description: 'Ese DNI ya tiene una cuenta creada.',
        })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: register.password,
        options: {
          data: {
            full_name: [normalizedNombres, normalizedApPaterno, normalizedApMaterno].filter(Boolean).join(' '),
            dni: normalizedDni,
            telefono: normalizedTelefono,
          },
        },
      })

      if (error) {
        toast.error('No se pudo crear la cuenta', {
          description: mapRegisterError(error.message),
        })
        return
      }

      if (data.user) {
        const profilePayload = {
          id: data.user.id,
          nombres: normalizedNombres,
          apellido_paterno: normalizedApPaterno,
          apellido_materno: normalizedApMaterno,
          dni: normalizedDni,
          telefono: normalizedTelefono,
          role: 'obrero',
        }

        const fichaPayload = {
          user_id: data.user.id,
          nombres: normalizedNombres,
          apellido_paterno: normalizedApPaterno,
          apellido_materno: normalizedApMaterno,
          dni: normalizedDni,
          celular: normalizedTelefono,
          correo: normalizedEmail,
        }

        const { error: profileError } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' })
        if (profileError) {
          toast.error('No se pudo guardar el perfil', { description: profileError.message })
          return
        }

        const { error: fichaError } = await supabase.from('fichas').upsert(fichaPayload, { onConflict: 'user_id' })
        if (fichaError) {
          toast.error('No se pudo guardar la ficha base', { description: fichaError.message })
          return
        }
      }

      setLogin({
        identifier: normalizedEmail,
        password: register.password,
      })
      setRegister(initialRegisterState)
      setView('login')

      toast.success('Cuenta creada', {
        description: 'Ya dejé tu correo y contraseña cargados para el primer ingreso.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_52%,#ffffff_100%)] lg:grid lg:h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:overflow-hidden">

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  PANEL IZQUIERDO — sólo desktop. Full-bleed, editorial.   ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <aside className="relative hidden h-full overflow-hidden bg-[radial-gradient(circle_at_18%_12%,_rgba(56,114,255,0.55),_transparent_55%),radial-gradient(circle_at_85%_88%,_rgba(14,165,233,0.35),_transparent_50%),linear-gradient(160deg,#0b1430_0%,#101b38_45%,#0a1228_100%)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Pattern grid sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-32 h-[420px] w-[420px] rounded-full bg-blue-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-[360px] w-[360px] rounded-full bg-cyan-300/15 blur-3xl" />

        {/* TOP — brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm">
            <ShieldCheck className="text-blue-200" size={24} />
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.28em] text-blue-200">RUAG DIGITAL</div>
            <div className="text-xs text-white/55">Portal del trabajador · Edición 2026</div>
          </div>
        </div>

        {/* MIDDLE — claim editorial */}
        <div className="relative z-10 flex max-w-[640px] flex-col gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            Acceso del obrero
          </div>

          <h1 className="text-[2.6rem] font-black leading-[1.02] tracking-tight xl:text-[3.4rem]">
            Tu ficha, tu SSOMA,
            <br />
            <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-white bg-clip-text italic text-transparent">
              en un solo acceso.
            </span>
          </h1>

          <p className="max-w-[480px] text-[15px] leading-7 text-white/70 xl:text-base xl:leading-8">
            Completa tu ficha, revisa tus documentos SSOMA y chatea con el
            administrador desde el mismo portal. Sin papeles, sin idas y vueltas.
          </p>

          {/* Feature list */}
          <div className="mt-2 grid max-w-[540px] gap-3">
            <FeatureRow asset="/icons/dni-registro.gif" title="Registro por DNI" description="Crea tu cuenta en segundos con tu documento." />
            <FeatureRow asset="/icons/check.gif" title="Documentos SSOMA visibles" description="Tu ficha, tus videos y certificados siempre a mano." />
            <FeatureRow asset="/icons/chat.gif" title="Chat con el administrador" description="Resuelve dudas y envía pendientes en tiempo real." />
          </div>
        </div>

        {/* BOTTOM — métricas + footer */}
        <div className="relative z-10 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3 border-y border-white/10 py-5">
            <MetricCell value="100%" label="Digital" />
            <MetricCell value="24/7" label="Disponible" />
            <MetricCell value="0" label="Papeles" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/50">
            <span>© 2026 RUAG S.R. LTDA</span>
            <span className="font-mono uppercase tracking-[0.2em]">v 1.0 · Lima · PE</span>
          </div>
        </div>
      </aside>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  PANEL DERECHO — formulario (también es el único en cel)  ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-10 xl:px-14">
        {/* Decorativos sólo desktop derecha */}
        <div aria-hidden className="pointer-events-none absolute right-[-8rem] top-[-4rem] hidden h-72 w-72 rounded-full bg-blue-200/40 blur-3xl lg:block" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] hidden h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl lg:block" />

        <div className="relative z-10 w-full min-w-0 max-w-[460px] lg:max-w-[580px] xl:max-w-[640px]">
            {/* Brand chip — sólo móvil, encima del form */}
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#101b38] shadow-[0_12px_28px_rgba(16,27,56,0.18)]">
                <ShieldCheck className="text-blue-200" size={20} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">RUAG DIGITAL</div>
                <div className="text-[11px] text-slate-500">Portal del trabajador</div>
              </div>
            </div>
            <div className="mb-5 rounded-[22px] border border-white/80 bg-white/80 p-1 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:mb-6">
              <div className="relative flex">
                <motion.div
                  className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[18px] bg-[#101b38]"
                  animate={{ x: view === 'login' ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
                <button
                  onClick={() => setView('login')}
                  className={`relative z-10 flex-1 rounded-[18px] px-4 py-3 text-sm font-bold transition-colors lg:py-3.5 lg:text-[15px] ${view === 'login' ? 'text-white' : 'text-slate-500'}`}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setView('register')}
                  className={`relative z-10 flex-1 rounded-[18px] px-4 py-3 text-sm font-bold transition-colors lg:py-3.5 lg:text-[15px] ${view === 'register' ? 'text-white' : 'text-slate-500'}`}
                >
                  Crear cuenta
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24 }}
                  className="rounded-[26px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_64px_rgba(15,23,42,0.10)] backdrop-blur-sm lg:rounded-[30px] lg:p-8 xl:p-9"
                >
                  <div className="mb-5 flex items-start justify-between gap-4 lg:mb-7">
                    <div>
                      <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 lg:text-[11px]">
                        Portal obrero
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 lg:text-[2rem] xl:text-[2.25rem]">Iniciar sesión</h2>
                      <p className="mt-1.5 text-[13px] leading-5 text-slate-500 lg:mt-2 lg:text-[14.5px] lg:leading-6">
                        Ingresa con tu DNI o correo y continúa con tu ficha.
                      </p>
                    </div>
                    <div className="lg:hidden">
                      <GifBadge src="/icons/correo-sesion.gif" alt="Correo sesión" size={64} />
                    </div>
                    <div className="hidden lg:block">
                      <GifBadge src="/icons/correo-sesion.gif" alt="Correo sesión" size={84} />
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3 lg:space-y-4">
                    <AuthField
                      asset="/icons/correo-sesion.gif"
                      name="identifier"
                      value={login.identifier}
                      onChange={(value) => setLogin((prev) => ({ ...prev, identifier: value }))}
                      placeholder="DNI o correo electrónico"
                      autoComplete="username"
                    />
                    <AuthField
                      asset="/icons/contrasena.gif"
                      name="password"
                      value={login.password}
                      onChange={(value) => setLogin((prev) => ({ ...prev, password: value }))}
                      placeholder="Contraseña"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="text-slate-400 transition hover:text-slate-700"
                        >
                          {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                        onClick={() => toast.message('Habla con el administrador para recuperar el acceso.')}
                      >
                        Problemas para ingresar
                      </button>
                    </div>

                    <SubmitButton loading={loading} text="Entrar al portal" />
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24 }}
                  className="rounded-[26px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_64px_rgba(15,23,42,0.10)] backdrop-blur-sm lg:rounded-[30px] lg:p-8 xl:p-9"
                >
                  <div className="mb-4 flex items-start justify-between gap-4 lg:mb-6">
                    <div>
                      <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 lg:text-[11px]">
                        Nuevo acceso
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 lg:text-[2rem] xl:text-[2.25rem]">Crear cuenta</h2>
                      <p className="mt-1.5 text-[13px] leading-5 text-slate-500 lg:mt-2 lg:text-[14.5px] lg:leading-6">
                        Tu cuenta quedará enlazada a tu ficha de trabajador.
                      </p>
                    </div>
                    <div className="lg:hidden">
                      <GifBadge src="/icons/crea-tu-cuenta.gif" alt="Crear cuenta" size={64} />
                    </div>
                    <div className="hidden lg:block">
                      <GifBadge src="/icons/crea-tu-cuenta.gif" alt="Crear cuenta" size={84} />
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3 lg:space-y-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <AuthField
                        asset="/icons/dni-registro.gif"
                        name="dni"
                        value={register.dni}
                        onChange={(value) => setRegister((prev) => ({ ...prev, dni: value.replace(/\D/g, '').slice(0, 12) }))}
                        placeholder="DNI"
                        autoComplete="off"
                      />
                      <AuthField
                        asset="/icons/telefono-registro.gif"
                        name="telefono"
                        value={register.telefono}
                        onChange={(value) => setRegister((prev) => ({ ...prev, telefono: value.replace(/\D/g, '').slice(0, 9) }))}
                        placeholder="Celular"
                        autoComplete="tel"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <AuthField
                        asset="/icons/apellido-paterno.gif"
                        name="apPaterno"
                        value={register.apPaterno}
                        onChange={(value) => setRegister((prev) => ({ ...prev, apPaterno: value }))}
                        placeholder="Apellido paterno"
                        autoComplete="family-name"
                      />
                      <AuthField
                        asset="/icons/apellido-materno.gif"
                        name="apMaterno"
                        value={register.apMaterno}
                        onChange={(value) => setRegister((prev) => ({ ...prev, apMaterno: value }))}
                        placeholder="Apellido materno"
                        autoComplete="additional-name"
                      />
                    </div>

                    <AuthField
                      asset="/icons/personal.gif"
                      name="nombres"
                      value={register.nombres}
                      onChange={(value) => setRegister((prev) => ({ ...prev, nombres: value }))}
                      placeholder="Nombres completos"
                      autoComplete="name"
                    />
                    <AuthField
                      asset="/icons/correo-sesion.gif"
                      name="email"
                      value={register.email}
                      onChange={(value) => setRegister((prev) => ({ ...prev, email: value }))}
                      placeholder="Correo electrónico"
                      type="email"
                      autoComplete="email"
                    />
                    <AuthField
                      asset="/icons/contrasena.gif"
                      name="password"
                      value={register.password}
                      onChange={(value) => setRegister((prev) => ({ ...prev, password: value }))}
                      placeholder="Crear contraseña"
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="text-slate-400 transition hover:text-slate-700"
                        >
                          {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <SubmitButton loading={loading} text="Registrar cuenta" />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 text-center text-[11px] text-slate-400 lg:hidden">© 2026 RUAG S.R. LTDA</div>
          </div>
        </section>
    </div>
  )
}

async function resolveLoginCandidates(supabase: ReturnType<typeof createClient>, identifier: string) {
  const cleanIdentifier = identifier.trim()
  if (!cleanIdentifier) return []

  if (cleanIdentifier.includes('@')) {
    return [cleanIdentifier.toLowerCase()]
  }

  const candidates: string[] = []

  try {
    const { data } = await supabase
      .from('fichas')
      .select('correo')
      .eq('dni', cleanIdentifier)
      .maybeSingle()

    const correo = data?.correo?.trim()?.toLowerCase()
    if (correo && correo.includes('@')) candidates.push(correo)
  } catch {}

  candidates.push(`${cleanIdentifier}@ruag.sistema`)
  return [...new Set(candidates)]
}

function mapLoginError(message: string | null) {
  const raw = message ?? ''
  if (/invalid login/i.test(raw) || /invalid login credentials/i.test(raw)) {
    return 'Verifica tu DNI o correo y la contraseña.'
  }
  if (/email not confirmed/i.test(raw)) {
    return 'Tu correo aún no está confirmado.'
  }
  if (!raw) return 'Intenta nuevamente.'
  return raw
}

function mapRegisterError(message: string | null) {
  const raw = message ?? ''
  if (/already registered/i.test(raw)) {
    return 'Ese correo ya tiene una cuenta creada.'
  }
  if (/duplicate key/i.test(raw) && /dni/i.test(raw)) {
    return 'Ese DNI ya está registrado.'
  }
  if (!raw) return 'Intenta nuevamente.'
  return raw
}

function GifBadge({ src, alt, size = 72 }: { src: string; alt: string; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-contain"
        style={{ mixBlendMode: 'multiply', filter: 'contrast(1.02) saturate(1.03)' }}
      />
    </div>
  )
}

function FeatureRow({
  asset,
  title,
  description,
}: {
  asset: string
  title: string
  description: string
}) {
  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm transition hover:bg-white/[0.07]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <GifBadge src={asset} alt={title} size={32} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[14px] font-bold leading-tight text-white">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-white/60">{description}</div>
      </div>
      <ArrowRight size={16} className="mt-2 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-blue-200" />
    </div>
  )
}

function MetricCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
    </div>
  )
}

function AuthField({
  asset,
  value,
  onChange,
  placeholder,
  name,
  type = 'text',
  autoComplete,
  trailing,
}: {
  asset: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  name: string
  type?: string
  autoComplete?: string
  trailing?: ReactNode
}) {
  return (
    <div className="group flex items-center gap-2.5 rounded-[16px] border border-slate-200/90 bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] lg:gap-3 lg:rounded-[18px] lg:px-4 lg:py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 lg:h-10 lg:w-10 lg:rounded-2xl">
        <GifBadge src={asset} alt={placeholder} size={22} />
      </div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-9 w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 lg:h-11 lg:text-[15px]"
      />
      {trailing}
    </div>
  )
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
  return (
    <button
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#101b38] text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#16244a] disabled:cursor-not-allowed disabled:opacity-70 lg:mt-2 lg:h-[52px] lg:rounded-[18px] lg:text-[15px]"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          <span>{text}</span>
          <ArrowRight size={17} />
        </>
      )}
    </button>
  )
}
