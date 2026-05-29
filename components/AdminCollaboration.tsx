'use client'

/**
 * Colaboración en tiempo real tipo Google Sheets para el panel admin.
 *
 *  - Cursores en vivo de los otros admins con su nombre/color/foto.
 *  - Indicador "X está viendo este trabajador" (vía `setViewing(workerId)`),
 *    que cualquier componente puede consumir con `useCollabPeers()`.
 *  - Throttle a ~16Hz al mover el mouse + heartbeat cada 2.5s.
 *  - Limpia peers que no actualizaron en 4s (otro admin se fue / perdió red).
 *
 *  Se monta una sola vez al nivel raíz del panel admin (`app/admin/page.tsx`)
 *  envolviendo todo el contenido. El overlay de cursores se renderiza dentro.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import AdminGifIcon from '@/components/AdminGifIcon'

export type CollabPeer = {
    userId: string
    name: string
    color: string
    photo: string | null
    x: number
    y: number
    viewingWorkerId: string | null
    editingFieldKey: string | null   // formato "workerId:fieldName"
    updatedAt: number
}

export type ChatMsg = {
    id: string
    userId: string
    name: string
    color: string
    photo: string | null
    text: string
    ts: number
}

type CollabContextValue = {
    peers: CollabPeer[]
    setViewing: (workerId: string | null) => void
    setEditingField: (workerId: string | null, fieldName: string | null) => void
    myColor: string
    me: { id: string; name: string; photo: string | null } | null
    messages: ChatMsg[]
    sendChat: (text: string) => void
}

const CollabContext = createContext<CollabContextValue>({
    peers: [],
    setViewing: () => {},
    setEditingField: () => {},
    myColor: '#3b82f6',
    me: null,
    messages: [],
    sendChat: () => {},
})

export function useCollab() {
    return useContext(CollabContext)
}

/** Hook conveniente para sólo leer los peers (otros admins conectados). */
export function useCollabPeers() {
    return useContext(CollabContext).peers
}

/** Hook para anunciar "estoy viendo a este trabajador". Limpia al desmontar. */
export function useViewingWorker(workerId: string | null | undefined) {
    const { setViewing } = useCollab()
    useEffect(() => {
        setViewing(workerId || null)
        return () => setViewing(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerId])
}

/** Devuelve el otro admin (si lo hay) que está editando ese campo justo ahora. */
export function useEditingFieldPeer(workerId: string | null | undefined, fieldName: string | null | undefined): CollabPeer | null {
    const { peers } = useCollab()
    if (!workerId || !fieldName) return null
    const key = `${workerId}:${fieldName}`
    return peers.find(p => p.editingFieldKey === key) || null
}

// Paleta estable y agradable (alta legibilidad sobre fondos claros).
const COLLAB_PALETTE = [
    '#2563eb', // blue-600
    '#db2777', // pink-600
    '#10b981', // emerald-500
    '#f97316', // orange-500
    '#9333ea', // purple-600
    '#0ea5e9', // sky-500
    '#dc2626', // red-600
    '#0891b2', // cyan-600
    '#65a30d', // lime-600
    '#c026d3', // fuchsia-600
]

function colorForUser(userId: string): string {
    let h = 0
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0
    return COLLAB_PALETTE[h % COLLAB_PALETTE.length]
}

export default function AdminCollaboration({
    currentUser,
    children,
}: {
    currentUser: { id: string; name: string; photo: string | null } | null
    children?: React.ReactNode
}) {
    const supabase = createClient()
    const [peersMap, setPeersMap] = useState<Map<string, CollabPeer>>(new Map())
    const [messages, setMessages] = useState<ChatMsg[]>([])
    const channelRef = useRef<any>(null)
    const viewingRef = useRef<string | null>(null)
    const editingFieldRef = useRef<string | null>(null)
    const mouseRef = useRef({ x: -100, y: -100, in: false })
    const lastSentRef = useRef(0)
    const myColor = currentUser ? colorForUser(currentUser.id) : '#3b82f6'

    const sendNow = useCallback(() => {
        if (!channelRef.current || !currentUser) return
        channelRef.current.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
                userId: currentUser.id,
                name: currentUser.name,
                color: myColor,
                photo: currentUser.photo,
                x: mouseRef.current.x,
                y: mouseRef.current.y,
                inWindow: mouseRef.current.in,
                viewingWorkerId: viewingRef.current,
                editingFieldKey: editingFieldRef.current,
            },
        })
    }, [currentUser, myColor])

    const setViewing = useCallback((workerId: string | null) => {
        if (viewingRef.current === workerId) return
        viewingRef.current = workerId
        sendNow()
    }, [sendNow])

    const setEditingField = useCallback((workerId: string | null, fieldName: string | null) => {
        const next = workerId && fieldName ? `${workerId}:${fieldName}` : null
        if (editingFieldRef.current === next) return
        editingFieldRef.current = next
        sendNow()
    }, [sendNow])

    const sendChat = useCallback(async (text: string) => {
        const t = text.trim()
        if (!t || !currentUser) return
        // Optimistic UI: insertamos un mensaje temporal con id local; cuando
        // realtime nos devuelva el INSERT con el id real, deduplicamos.
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const optimistic: ChatMsg = {
            id: tempId,
            userId: currentUser.id,
            name: currentUser.name,
            color: myColor,
            photo: currentUser.photo,
            text: t,
            ts: Date.now(),
        }
        setMessages(prev => [...prev, optimistic].slice(-200))
        const { data, error } = await supabase.from('admin_messages').insert({
            user_id: currentUser.id,
            name: currentUser.name,
            photo_url: currentUser.photo,
            color: myColor,
            text: t,
        }).select().single()
        if (error) {
            // Rollback del optimistic + aviso simple en consola.
            setMessages(prev => prev.filter(m => m.id !== tempId))
            console.warn('No se pudo guardar el mensaje admin:', error.message)
            return
        }
        if (data) {
            // Reemplazamos el optimistic por el guardado (id real).
            setMessages(prev => {
                const exists = prev.some(m => m.id === data.id)
                const without = prev.filter(m => m.id !== tempId && m.id !== data.id)
                const real: ChatMsg = {
                    id: data.id,
                    userId: data.user_id,
                    name: data.name,
                    color: data.color || colorForUser(data.user_id),
                    photo: data.photo_url || null,
                    text: data.text,
                    ts: new Date(data.created_at).getTime(),
                }
                return exists ? prev.filter(m => m.id !== tempId) : [...without, real].slice(-200)
            })
        }
    }, [currentUser, myColor, supabase])

    useEffect(() => {
        if (!currentUser) return
        const channel = supabase.channel('admin-collab', {
            config: { broadcast: { self: false } },
        })
        channelRef.current = channel

        channel.on('broadcast', { event: 'cursor' }, ({ payload }: any) => {
            if (!payload || payload.userId === currentUser.id) return
            setPeersMap(prev => {
                const next = new Map(prev)
                next.set(payload.userId, {
                    userId: payload.userId,
                    name: payload.name || 'Admin',
                    color: payload.color || colorForUser(payload.userId),
                    photo: payload.photo || null,
                    x: Number(payload.x) || 0,
                    y: Number(payload.y) || 0,
                    viewingWorkerId: payload.viewingWorkerId || null,
                    editingFieldKey: payload.editingFieldKey || null,
                    updatedAt: Date.now(),
                })
                return next
            })
        })

        channel.on('broadcast', { event: 'leave' }, ({ payload }: any) => {
            if (!payload?.userId || payload.userId === currentUser.id) return
            setPeersMap(prev => {
                const next = new Map(prev)
                next.delete(payload.userId)
                return next
            })
        })

        // Chat persistente: escuchamos INSERTs nuevos en admin_messages.
        channel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'admin_messages' },
            ({ new: row }: any) => {
                if (!row?.id) return
                setMessages(prev => {
                    if (prev.some(m => m.id === row.id)) return prev
                    const msg: ChatMsg = {
                        id: row.id,
                        userId: row.user_id,
                        name: row.name,
                        color: row.color || colorForUser(row.user_id),
                        photo: row.photo_url || null,
                        text: row.text,
                        ts: new Date(row.created_at).getTime(),
                    }
                    return [...prev, msg].slice(-200)
                })
            },
        )

        // Eliminación opcional (si algún admin borra su propio mensaje).
        channel.on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'admin_messages' },
            ({ old: row }: any) => {
                if (!row?.id) return
                setMessages(prev => prev.filter(m => m.id !== row.id))
            },
        )

        channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
                // Anuncio inicial.
                sendNow()
            }
        })

        // Cargar últimos 100 mensajes guardados al abrir el panel.
        ;(async () => {
            const { data, error } = await supabase
                .from('admin_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)
            if (error) {
                console.warn('No se pudo cargar el historial del chat admin:', error.message)
                return
            }
            if (!data) return
            const rows = [...data].reverse().map((row: any): ChatMsg => ({
                id: row.id,
                userId: row.user_id,
                name: row.name,
                color: row.color || colorForUser(row.user_id),
                photo: row.photo_url || null,
                text: row.text,
                ts: new Date(row.created_at).getTime(),
            }))
            setMessages(prev => {
                // Fusiona historial con mensajes ya recibidos, dedupea por id.
                const map = new Map<string, ChatMsg>()
                for (const m of rows) map.set(m.id, m)
                for (const m of prev) if (!map.has(m.id)) map.set(m.id, m)
                return Array.from(map.values()).sort((a, b) => a.ts - b.ts).slice(-200)
            })
        })()

        const onMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, in: true }
            const now = Date.now()
            if (now - lastSentRef.current < 60) return // ~16Hz
            lastSentRef.current = now
            sendNow()
        }
        const onLeave = () => {
            mouseRef.current.in = false
            sendNow()
        }
        const onEnter = () => {
            mouseRef.current.in = true
            sendNow()
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseleave', onLeave)
        document.addEventListener('mouseleave', onLeave)
        document.addEventListener('mouseenter', onEnter)

        const cleanup = setInterval(() => {
            setPeersMap(prev => {
                const now = Date.now()
                let changed = false
                const next = new Map(prev)
                for (const [k, v] of next.entries()) {
                    if (now - v.updatedAt > 4500) { next.delete(k); changed = true }
                }
                return changed ? next : prev
            })
        }, 2000)

        const heartbeat = setInterval(() => sendNow(), 2500)

        // Aviso de despedida al cerrar pestaña.
        const onBeforeUnload = () => {
            try {
                channel.send({
                    type: 'broadcast',
                    event: 'leave',
                    payload: { userId: currentUser.id },
                })
            } catch { /* noop */ }
        }
        window.addEventListener('beforeunload', onBeforeUnload)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseleave', onLeave)
            document.removeEventListener('mouseleave', onLeave)
            document.removeEventListener('mouseenter', onEnter)
            window.removeEventListener('beforeunload', onBeforeUnload)
            clearInterval(cleanup)
            clearInterval(heartbeat)
            onBeforeUnload()
            supabase.removeChannel(channel)
            channelRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id])

    const peers = Array.from(peersMap.values())
    const me = currentUser

    return (
        <CollabContext.Provider value={{ peers, setViewing, setEditingField, myColor, me, messages, sendChat }}>
            {children}
            {/* CHAT FLOTANTE ADMIN ↔ ADMIN */}
            {currentUser && <AdminChatPanel/>}

            {/* OVERLAY DE CURSORES — fixed, no captura clicks */}
            <div className="pointer-events-none fixed inset-0 z-[2000] overflow-hidden">
                <AnimatePresence>
                    {peers.filter(p => p.x > 0 && p.y > 0).map(p => (
                        <motion.div
                            key={p.userId}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                            exit={{ opacity: 0, scale: 0.4 }}
                            transition={{
                                type: 'spring',
                                stiffness: 650,
                                damping: 38,
                                mass: 0.35,
                                opacity: { duration: 0.15 },
                                scale: { duration: 0.15 },
                            }}
                            style={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
                        >
                            {/* Flecha del cursor */}
                            <svg
                                width="20" height="22" viewBox="0 0 20 22"
                                fill="none"
                                style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}
                            >
                                <path
                                    d="M2.5 1.5L17 12.5L10.4 13.4L7.8 19.7L2.5 1.5Z"
                                    fill={p.color}
                                    stroke="white"
                                    strokeWidth="1.4"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {/* Etiqueta con el nombre */}
                            <div
                                className="absolute left-5 top-5 inline-flex items-center gap-2 text-[11px] font-bold leading-none text-white pl-1 pr-3 py-1 rounded-full whitespace-nowrap shadow-md"
                                style={{ backgroundColor: p.color }}
                            >
                                {p.photo ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={p.photo} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/70 shrink-0"/>
                                ) : (
                                    <span className="w-5 h-5 rounded-full bg-white/30 ring-1 ring-white/70 flex items-center justify-center text-[9px] font-black shrink-0">
                                        {p.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <span className="pr-0.5">{p.name}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </CollabContext.Provider>
    )
}

/* ───────────────────────────────────────────────────────────────────────
 *  Chat flotante admin ↔ admin (efímero — mensajes sólo mientras viven
 *  los paneles abiertos, como el chat lateral de Google Sheets/Docs).
 * ─────────────────────────────────────────────────────────────────── */
function AdminChatPanel() {
    const { messages, sendChat, me, peers } = useCollab()
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState('')
    const [lastReadTs, setLastReadTs] = useState<number>(() => Date.now())
    const scrollRef = useRef<HTMLDivElement>(null)

    const incoming = useMemo(() => messages.filter(m => m.userId !== me?.id), [messages, me?.id])
    const unread = incoming.filter(m => m.ts > lastReadTs).length

    useEffect(() => {
        if (!open) return
        setLastReadTs(Date.now())
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        })
    }, [open, messages.length])

    const onSend = () => {
        const t = draft.trim()
        if (!t) return
        sendChat(t)
        setDraft('')
    }

    return (
        <div className="fixed bottom-6 right-6 z-[1500] pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-end gap-3">
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="w-[360px] max-w-[92vw] h-[460px] bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200 flex flex-col overflow-hidden"
                        >
                            {/* HEADER */}
                            <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                                    <div>
                                        <p className="text-sm font-extrabold leading-none">Chat de admins</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{peers.length === 0 ? 'Solo tú estás conectado' : `${peers.length} ${peers.length === 1 ? 'otro admin' : 'otros admins'} en línea`}</p>
                                    </div>
                                </div>
                                <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-white/10 text-slate-300" aria-label="Cerrar chat">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                            {/* MENSAJES */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/60 p-3 space-y-2">
                                {messages.length === 0 && (
                                    <div className="text-center text-slate-400 text-xs mt-14 px-4">
                                        <p className="font-bold text-slate-500">Sin mensajes todavía</p>
                                        <p className="mt-1 leading-relaxed">Habla con los demás admins en vivo. Los mensajes son efímeros — viven mientras los paneles estén abiertos.</p>
                                    </div>
                                )}
                                {messages.map(m => {
                                    const mine = m.userId === me?.id
                                    return (
                                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[78%] flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!mine && (
                                                    m.photo ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={m.photo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0"/>
                                                    ) : (
                                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0).toUpperCase()}</span>
                                                    )
                                                )}
                                                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-snug ${mine ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'}`}>
                                                    {!mine && <p className="text-[10px] font-bold mb-0.5" style={{ color: m.color }}>{m.name}</p>}
                                                    <p className="break-words whitespace-pre-wrap">{m.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {/* INPUT */}
                            <div className="border-t border-slate-200 p-2.5 bg-white flex items-center gap-2">
                                <input
                                    type="text"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
                                    placeholder="Escribe un mensaje…"
                                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 outline-none"
                                />
                                <button onClick={onSend} disabled={!draft.trim()} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40 transition-opacity">
                                    Enviar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setOpen(v => !v)}
                    className="relative w-14 h-14 rounded-full bg-slate-900 shadow-xl shadow-slate-900/30 flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-transform"
                    title="Chat de admins"
                    aria-label="Abrir chat de admins"
                >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-inner">
                        <AdminGifIcon name="chat-de-admins.gif" size={30} variant="bare"/>
                    </span>
                    {!open && unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse z-10">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                    {!open && unread === 0 && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white z-10"/>
                    )}
                </button>
            </div>
        </div>
    )
}
