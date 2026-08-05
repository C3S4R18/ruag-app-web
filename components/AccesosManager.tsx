'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Loader2, KeyRound, ShieldCheck, MailWarning, Copy, Check,
    RotateCcw, Trash2, Users, Archive, AlertTriangle, X, Clock, CircleUser, UserPlus, Eye,
} from 'lucide-react'

type Acceso = {
    id: string
    email: string
    correo_real: boolean
    nombre: string
    dni: string
    role: string
    tipo_personal: string
    confirmado: boolean
    ultimo_acceso: string | null
    creado: string | null
    tiene_ficha: boolean
    estado_ficha: string | null
    es_cesado: boolean
    obra: string | null
    tiene_credencial: boolean
}

type CredencialVista = {
    nombre: string
    email: string
    password: string
    /** true = quedó guardada y se puede volver a consultar con el ojo. */
    guardada?: boolean
    /** true = auth cambió después de fijarla; el trabajador pudo cambiarla. */
    posibleCambio?: boolean
    fijadaAt?: string
}

/** Destinos posibles al crear una cuenta — mismos cuatro del sidebar. */
const DESTINOS = [
    { id: 'obrero', sigla: 'OB', label: 'Obrero', nota: 'Documentos obligatorios',
      chip: 'from-slate-700 to-slate-900', border: 'border-slate-900', bg: 'bg-slate-50', text: 'text-slate-900' },
    { id: 'staff', sigla: 'ST', label: 'Staff', nota: 'Documentos libres',
      chip: 'from-violet-500 to-violet-700', border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
    { id: 'arug', sigla: 'AR', label: 'ARUG', nota: 'Documentos libres',
      chip: 'from-cyan-500 to-teal-600', border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { id: 'cg', sigla: 'CG', label: 'CG', nota: 'Documentos libres',
      chip: 'from-fuchsia-500 to-purple-600', border: 'border-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
] as const

const fecha = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AccesosManager() {
    const supabase = createClient()
    const [tab, setTab] = useState<'accesos' | 'papelera'>('accesos')

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* HERO */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl p-6 shadow-lg shadow-slate-900/20 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                    <KeyRound size={26} className="text-emerald-300" />
                </div>
                <div>
                    <h2 className="text-2xl font-black leading-tight">Accesos y Recuperación</h2>
                    <p className="text-slate-300 text-sm mt-1 max-w-3xl">
                        Consulta con qué correo se registró cada trabajador, genera una contraseña nueva
                        cuando la olvide, y recupera fichas borradas por error.
                    </p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
                {([
                    { id: 'accesos', label: 'Directorio de accesos', icon: <Users size={16} /> },
                    { id: 'papelera', label: 'Papelera de fichas', icon: <Archive size={16} /> },
                ] as const).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                            tab === t.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab === t.id && (
                            <motion.div
                                layoutId="accesos-tab"
                                className="absolute inset-0 bg-slate-100 border border-slate-200 rounded-xl"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">{t.icon}{t.label}</span>
                    </button>
                ))}
            </div>

            {tab === 'accesos' ? <DirectorioAccesos supabase={supabase} /> : <PapeleraFichas supabase={supabase} />}
        </div>
    )
}

/* ────────────────────────────────────────────────────────────────────────
 *  DIRECTORIO DE ACCESOS
 * ──────────────────────────────────────────────────────────────────────── */

function DirectorioAccesos({ supabase }: { supabase: any }) {
    const [usuarios, setUsuarios] = useState<Acceso[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [soloProblemas, setSoloProblemas] = useState(false)
    const [reseteando, setReseteando] = useState<string | null>(null)
    const [credencial, setCredencial] = useState<CredencialVista | null>(null)
    const [seleccion, setSeleccion] = useState<string[]>([])
    const [porEliminar, setPorEliminar] = useState<Acceso[] | null>(null)
    const [eliminando, setEliminando] = useState(false)
    const [creando, setCreando] = useState(false)
    const [revelando, setRevelando] = useState<string | null>(null)

    const authHeader = async () => {
        const { data } = await supabase.auth.getSession()
        return { Authorization: `Bearer ${data?.session?.access_token || ''}` }
    }

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/accesos', { headers: await authHeader() })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error al cargar')
            setUsuarios(json.usuarios || [])
        } catch (e: any) {
            toast.error(e.message || 'No se pudo cargar el directorio')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const filtrados = useMemo(() => {
        const s = search.toLowerCase().trim()
        return usuarios.filter(u => {
            if (soloProblemas && u.confirmado && u.tiene_ficha) return false
            if (!s) return true
            return u.nombre.toLowerCase().includes(s) || u.email.includes(s) || u.dni.includes(s)
        })
    }, [usuarios, search, soloProblemas])

    const resetear = async (u: Acceso) => {
        if (!confirm(`¿Generar una contraseña nueva para ${u.nombre}?\n\nLa anterior dejará de funcionar de inmediato.`)) return
        setReseteando(u.id)
        try {
            const res = await fetch('/api/admin/accesos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
                body: JSON.stringify({ action: 'reset', userId: u.id }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error')
            setCredencial({
                nombre: u.nombre,
                email: json.email || u.email,
                password: json.password,
                guardada: json.guardada,
            })
            setUsuarios(prev => prev.map(x => x.id === u.id
                ? { ...x, confirmado: true, tiene_credencial: !!json.guardada }
                : x))
        } catch (e: any) {
            toast.error(e.message || 'No se pudo restablecer')
        } finally {
            setReseteando(null)
        }
    }

    const verGuardada = async (u: Acceso) => {
        setRevelando(u.id)
        try {
            const res = await fetch('/api/admin/accesos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
                body: JSON.stringify({ action: 'reveal', userId: u.id }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error')
            setCredencial({
                nombre: u.nombre,
                email: json.email || u.email,
                password: json.password,
                guardada: true,
                posibleCambio: json.posible_cambio,
                fijadaAt: json.fijada_at,
            })
        } catch (e: any) {
            toast.error(e.message || 'No se pudo mostrar la contraseña')
        } finally {
            setRevelando(null)
        }
    }

    const eliminarCuentas = async (cuentas: Acceso[], force: boolean) => {
        setEliminando(true)
        const okIds: string[] = []
        const bloqueadas: string[] = []
        try {
            for (const c of cuentas) {
                const res = await fetch('/api/admin/accesos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
                    body: JSON.stringify({ action: 'delete', userId: c.id, force }),
                })
                const json = await res.json()
                if (res.ok) okIds.push(c.id)
                else if (json?.code === 'tiene_ficha') bloqueadas.push(c.nombre)
                else toast.error(`${c.nombre}: ${json?.error || 'error'}`)
            }

            if (okIds.length) {
                setUsuarios(prev => prev.filter(u => !okIds.includes(u.id)))
                setSeleccion(prev => prev.filter(id => !okIds.includes(id)))
                toast.success(`${okIds.length} cuenta(s) eliminada(s) definitivamente`)
            }
            if (bloqueadas.length) {
                toast.warning(
                    `${bloqueadas.length} cuenta(s) tienen ficha con datos. Vuelve a intentar marcando "eliminar también su ficha".`
                )
            }
        } finally {
            setEliminando(false)
            setPorEliminar(null)
        }
    }

    const toggle = (id: string) =>
        setSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const seleccionados = usuarios.filter(u => seleccion.includes(u.id))

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <AnimatePresence>
                {seleccion.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-900 text-white overflow-hidden"
                    >
                        <div className="px-5 py-3 flex items-center gap-3">
                            <span className="text-sm font-bold">{seleccion.length} seleccionada(s)</span>
                            <button
                                onClick={() => setSeleccion([])}
                                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Limpiar
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={() => setPorEliminar(seleccionados)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg font-bold text-xs transition-colors"
                            >
                                <Trash2 size={13} /> Eliminar definitivamente
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, DNI o correo..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCreando(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-emerald-600/25"
                    >
                        <UserPlus size={15} /> Crear cuenta
                    </button>
                    <button
                        onClick={() => setSoloProblemas(v => !v)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            soloProblemas
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                        Solo con problemas
                    </button>
                    <span className="text-xs font-bold text-slate-400">{filtrados.length} cuentas</span>
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin" size={26} />
                    <span className="text-sm font-bold">Cargando accesos...</span>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-sm font-bold">Sin resultados</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-100">
                            <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                                <th className="px-5 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-slate-900 cursor-pointer"
                                        checked={filtrados.length > 0 && filtrados.every(u => seleccion.includes(u.id))}
                                        onChange={e => {
                                            const ids = filtrados.filter(u => u.role !== 'admin').map(u => u.id)
                                            setSeleccion(e.target.checked
                                                ? Array.from(new Set([...seleccion, ...ids]))
                                                : seleccion.filter(id => !ids.includes(id)))
                                        }}
                                    />
                                </th>
                                <th className="text-left font-bold px-5 py-3">Trabajador</th>
                                <th className="text-left font-bold px-5 py-3">Correo de acceso</th>
                                <th className="text-left font-bold px-5 py-3">Último ingreso</th>
                                <th className="text-left font-bold px-5 py-3">Estado</th>
                                <th className="text-right font-bold px-5 py-3">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtrados.map(u => (
                                <tr key={u.id} className={`transition-colors ${seleccion.includes(u.id) ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-slate-900 cursor-pointer disabled:opacity-30"
                                            checked={seleccion.includes(u.id)}
                                            disabled={u.role === 'admin'}
                                            title={u.role === 'admin' ? 'Los administradores no se pueden eliminar aquí' : undefined}
                                            onChange={() => toggle(u.id)}
                                        />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800 leading-tight">{u.nombre}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {u.dni || 'sin DNI'}
                                            </span>
                                            {u.role === 'admin' && (
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">ADMIN</span>
                                            )}
                                            {u.es_cesado && (
                                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">CESADO</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-slate-700 break-all">{u.email || '—'}</div>
                                        {!u.correo_real && (
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-600">
                                                <MailWarning size={12} /> Correo del sistema (no recibe mensajes)
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                                            <Clock size={12} className="text-slate-400" />
                                            {fecha(u.ultimo_acceso)}
                                        </div>
                                        {!u.ultimo_acceso && (
                                            <span className="text-[11px] text-slate-400">Nunca ha entrado</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col gap-1">
                                            {u.confirmado ? (
                                                <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    <ShieldCheck size={11} /> Confirmado
                                                </span>
                                            ) : (
                                                <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                                    <AlertTriangle size={11} /> Sin confirmar
                                                </span>
                                            )}
                                            {!u.tiene_ficha && (
                                                <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                                                    <CircleUser size={11} /> Sin ficha
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {u.tiene_credencial && (
                                                <button
                                                    onClick={() => verGuardada(u)}
                                                    disabled={revelando === u.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                                                    title="Ver la contraseña que fijaste"
                                                >
                                                    {revelando === u.id
                                                        ? <Loader2 size={13} className="animate-spin" />
                                                        : <Eye size={13} />}
                                                    Ver clave
                                                </button>
                                            )}
                                            <button
                                                onClick={() => resetear(u)}
                                                disabled={reseteando === u.id}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                                                title="Genera una contraseña nueva y la muestra una sola vez"
                                            >
                                                {reseteando === u.id
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : <KeyRound size={13} />}
                                                Nueva contraseña
                                            </button>
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => setPorEliminar([u])}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Eliminar cuenta definitivamente"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {credencial && (
                    <CredencialModal data={credencial} onClose={() => setCredencial(null)} />
                )}
                {creando && (
                    <CrearCuentaModal
                        authHeader={authHeader}
                        onClose={() => setCreando(false)}
                        onCreada={(cred) => {
                            setCreando(false)
                            setCredencial(cred)
                            cargar()
                        }}
                    />
                )}
                {porEliminar && (
                    <EliminarCuentasModal
                        cuentas={porEliminar}
                        procesando={eliminando}
                        onCancel={() => setPorEliminar(null)}
                        onConfirm={(force) => eliminarCuentas(porEliminar, force)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/** Modal que muestra la credencial recién generada. Se ve una sola vez. */
function CredencialModal({
    data, onClose,
}: { data: CredencialVista; onClose: () => void }) {
    const [copiado, setCopiado] = useState(false)

    const texto = `Hola ${data.nombre}, este es tu acceso a RUAG Digital:\n\nUsuario: ${data.email}\nContraseña: ${data.password}\n\nCámbiala apenas ingreses.`

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2200)
        } catch {
            toast.error('No se pudo copiar')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-300 uppercase">Contraseña generada</p>
                        <h3 className="text-xl font-black mt-1">{data.nombre}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</p>
                            <p className="font-mono font-bold text-slate-800 break-all">{data.email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraseña</p>
                            <p className="font-mono font-black text-2xl text-slate-900 tracking-wide">{data.password}</p>
                        </div>
                    </div>

                    {data.posibleCambio ? (
                        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <b>Puede estar desactualizada.</b> La cuenta se modificó después de que fijaste
                                esta contraseña — probablemente el trabajador la cambió desde la app.
                                Si no le funciona, genera una nueva.
                            </span>
                        </div>
                    ) : data.guardada ? (
                        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Queda guardada y cifrada. Puedes volver a verla cuando quieras con el botón
                                <b> Ver clave</b>, sin tener que restablecerla otra vez.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Anótala ahora: falta configurar <code className="font-mono">CREDENTIALS_SECRET</code> en
                                el servidor, así que esta vez no quedó guardada.
                            </span>
                        </div>
                    )}

                    <button
                        onClick={copiar}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        {copiado ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar mensaje para WhatsApp</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

/** Alta de cuenta desde el panel: el admin la crea y pasa las credenciales. */
function CrearCuentaModal({
    authHeader, onClose, onCreada,
}: {
    authHeader: () => Promise<Record<string, string>>
    onClose: () => void
    onCreada: (cred: { nombre: string; email: string; password: string }) => void
}) {
    const [form, setForm] = useState({
        nombres: '', apellido_paterno: '', apellido_materno: '',
        dni: '', telefono: '', email: '', password: '',
        tipo_personal: 'obrero', tipo_documento: 'DNI',
    })
    const esCE = form.tipo_documento === 'CE'
    const [guardando, setGuardando] = useState(false)

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

    const crear = async () => {
        setGuardando(true)
        try {
            const res = await fetch('/api/admin/accesos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
                body: JSON.stringify({ action: 'create', ...form }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'No se pudo crear')
            toast.success('Cuenta creada')
            onCreada({ nombre: json.nombre, email: json.email, password: json.password })
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setGuardando(false)
        }
    }

    const campo = (k: string, label: string, extra?: { placeholder?: string; soloDigitos?: number; type?: string }) => (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <input
                value={(form as any)[k]}
                type={extra?.type || 'text'}
                placeholder={extra?.placeholder}
                onChange={e => set(k, extra?.soloDigitos
                    ? e.target.value.replace(/\D/g, '').slice(0, extra.soloDigitos)
                    : e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors"
            />
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
                className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
                <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-start justify-between shrink-0">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-100 uppercase">Alta manual</p>
                        <h3 className="text-xl font-black mt-1">Crear cuenta de trabajador</h3>
                        <p className="text-emerald-100 text-xs mt-1">
                            Queda confirmada al instante. Al terminar verás las credenciales para pasárselas.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* DOCUMENTO DE IDENTIDAD */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento de identidad</label>
                        <div className="mt-1.5 flex gap-2">
                            {(['DNI', 'CE'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => { set('tipo_documento', t); set('dni', '') }}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                        form.tipo_documento === t
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    {t === 'DNI' ? 'DNI' : 'Carnet de Extranjería'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {esCE ? 'N° Carnet de Extranjería *' : 'DNI *'}
                            </label>
                            <input
                                value={form.dni}
                                placeholder={esCE ? 'Mín. 6 caracteres' : '12345678'}
                                onChange={e => set('dni', esCE
                                    ? e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20)
                                    : e.target.value.replace(/\D/g, '').slice(0, 12))}
                                className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-slate-400 transition-colors"
                            />
                        </div>
                        {campo('telefono', 'Celular', { soloDigitos: 9, placeholder: '9XXXXXXXX' })}
                        {campo('nombres', 'Nombres *')}
                        {campo('apellido_paterno', 'Apellido paterno *')}
                        {campo('apellido_materno', 'Apellido materno')}
                    </div>

                    {/* DESTINO / TIPO DE PERSONAL */}
                    <div className="border-t border-slate-100 pt-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            ¿A qué pantalla va?
                        </label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DESTINOS.map(d => {
                                const activo = form.tipo_personal === d.id
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => set('tipo_personal', d.id)}
                                        className={`relative rounded-2xl border-2 p-3 text-left transition-all ${
                                            activo ? `${d.border} ${d.bg}` : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${d.chip}`}>
                                            {d.sigla}
                                        </div>
                                        <div className={`mt-2 text-[13px] font-black leading-none ${activo ? d.text : 'text-slate-700'}`}>
                                            {d.label}
                                        </div>
                                        <div className="mt-1 text-[10px] font-semibold text-slate-400 leading-tight">
                                            {d.nota}
                                        </div>
                                        {activo && (
                                            <Check size={14} className={`absolute top-2.5 right-2.5 ${d.text}`} strokeWidth={3} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                            Define en qué pantalla del panel aparece y si su ficha exigirá documentos.
                            Se puede cambiar después con los botones "A STAFF / A ARUG / A CG".
                        </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                        {campo('email', 'Correo (opcional)', { placeholder: 'Si lo dejas vacío se usa DNI@ruag.sistema', type: 'email' })}
                        {campo('password', 'Contraseña (opcional)', { placeholder: 'Si lo dejas vacío se genera una' })}
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Sin correo real el trabajador entra con su DNI, igual que los importados del T-REGISTRO.
                            Podrá cambiarlo después desde la app.
                        </p>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={guardando}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={crear}
                        disabled={guardando}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {guardando ? <><Loader2 size={15} className="animate-spin" /> Creando...</> : <><UserPlus size={15} /> Crear cuenta</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

/** Confirmación de borrado definitivo: hay que escribir ELIMINAR a mano. */
function EliminarCuentasModal({
    cuentas, procesando, onCancel, onConfirm,
}: {
    cuentas: Acceso[]
    procesando: boolean
    onCancel: () => void
    onConfirm: (force: boolean) => void
}) {
    const [texto, setTexto] = useState('')
    const [force, setForce] = useState(false)
    const conFicha = cuentas.filter(c => c.tiene_ficha)
    const listo = texto.trim().toUpperCase() === 'ELIMINAR'

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
                <div className="p-6 bg-rose-600 text-white flex items-start gap-3">
                    <AlertTriangle size={26} className="shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-xl font-black leading-tight">Eliminar definitivamente</h3>
                        <p className="text-rose-100 text-sm mt-1">
                            {cuentas.length === 1 ? 'Esta cuenta' : `Estas ${cuentas.length} cuentas`} se borrarán
                            de la base de autenticación. No hay forma de deshacerlo.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                        {cuentas.map(c => (
                            <div key={c.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{c.nombre}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{c.email}</div>
                                </div>
                                {c.tiene_ficha && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                                        CON FICHA
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {conFicha.length > 0 && (
                        <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={force}
                                onChange={e => setForce(e.target.checked)}
                                className="w-4 h-4 accent-amber-600 mt-0.5"
                            />
                            <span className="text-xs text-amber-900">
                                <b>{conFicha.length} tiene(n) ficha con datos del trabajador.</b> Marca esta casilla
                                para eliminarla(s) también. La ficha se copia a la Papelera antes de borrarse.
                            </span>
                        </label>
                    )}

                    <div>
                        <p className="text-xs font-bold text-slate-600 mb-2">
                            Escribe <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">ELIMINAR</span> para confirmar
                        </p>
                        <input
                            value={texto}
                            onChange={e => setTexto(e.target.value)}
                            placeholder="ELIMINAR"
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-rose-500 transition-colors"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={procesando}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(force)}
                            disabled={!listo || procesando}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {procesando ? <><Loader2 size={15} className="animate-spin" /> Eliminando...</> : <>Eliminar para siempre</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ────────────────────────────────────────────────────────────────────────
 *  PAPELERA DE FICHAS
 * ──────────────────────────────────────────────────────────────────────── */

function PapeleraFichas({ supabase }: { supabase: any }) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [restaurando, setRestaurando] = useState<string | null>(null)

    const cargar = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fichas_papelera')
            .select('*')
            .is('restaurado_at', null)
            .order('created_at', { ascending: false })

        if (error) toast.error('No se pudo cargar la papelera')
        else setItems(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const restaurar = async (item: any) => {
        setRestaurando(item.id)
        try {
            // La copia guarda la fila completa: se reinserta tal cual estaba.
            const { error: insErr } = await supabase.from('fichas').insert(item.snapshot)
            if (insErr) throw insErr

            const { error: updErr } = await supabase
                .from('fichas_papelera')
                .update({ restaurado_at: new Date().toISOString() })
                .eq('id', item.id)
            if (updErr) throw updErr

            setItems(prev => prev.filter(i => i.id !== item.id))
            toast.success(`${item.nombre_completo || 'Ficha'} restaurada`)
        } catch (e: any) {
            toast.error(e.message?.includes('duplicate')
                ? 'Esa ficha ya existe otra vez en el sistema.'
                : 'No se pudo restaurar: ' + e.message)
        } finally {
            setRestaurando(null)
        }
    }

    const purgar = async (item: any) => {
        if (!confirm('⚠️ Borrar definitivamente de la papelera. Esto sí es irreversible. ¿Continuar?')) return
        const { error } = await supabase.from('fichas_papelera').delete().eq('id', item.id)
        if (error) return toast.error('No se pudo borrar')
        setItems(prev => prev.filter(i => i.id !== item.id))
        toast.success('Eliminado de la papelera')
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Archive size={18} className="text-slate-400" /> Fichas eliminadas
                </h3>
                <span className="text-xs font-bold text-slate-400">{items.length} recuperables</span>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin" size={26} />
                    <span className="text-sm font-bold">Cargando papelera...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="p-16 text-center">
                    <Archive size={32} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 text-sm font-bold mt-3">La papelera está vacía</p>
                    <p className="text-slate-400 text-xs mt-1">Las fichas que borres desde el Dashboard aparecerán aquí.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {items.map(item => (
                        <div key={item.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                                <Trash2 size={17} className="text-rose-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800">{item.nombre_completo || 'Sin nombre'}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                    <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">{item.dni || 'sin DNI'}</span>
                                    <span>Eliminada el {fecha(item.created_at)}</span>
                                    {item.eliminado_por_nombre && <span>· por {item.eliminado_por_nombre}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => restaurar(item)}
                                disabled={restaurando === item.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                            >
                                {restaurando === item.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <RotateCcw size={13} />}
                                Restaurar
                            </button>
                            <button
                                onClick={() => purgar(item)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Borrar definitivamente"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
