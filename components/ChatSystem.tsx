'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Send, X, MessageSquare, Loader2, ShieldCheck,
    Mic, Square, Paperclip, Camera, Video, Trash2, Play, Pause,
    Briefcase, HardHat, Reply, Maximize2,
} from 'lucide-react'
import AnimatedIcon from '@/components/AnimatedIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export type ChatChannel = 'rrhh' | 'ssoma'

interface ChatSystemProps {
    workerId: string
    workerName: string
    currentUserId: string
    isAdmin: boolean
    isOpen: boolean
    onClose: () => void
    /** Canal inicial. Si el admin abre desde una notificación, viene fijado. */
    initialChannel?: ChatChannel
}

type PreviewMedia = {
    type: 'image' | 'video'
    url: string
    mime?: string
}

const REPLY_PREFIX = '[[reply|'

function messageLabel(message: any) {
    if (message?.media_type === 'audio') return 'Nota de voz'
    if (message?.media_type === 'video') return 'Video'
    if (message?.media_type === 'image') return 'Imagen'
    return String(message?.content || '').replace(/\n/g, ' ').slice(0, 90) || 'Mensaje'
}

function encodeReplyContent(content: string, replyTo: any | null) {
    if (!replyTo) return content
    const safePreview = messageLabel(replyTo).replace(/\]\]/g, '').replace(/\|/g, '/')
    return `${REPLY_PREFIX}${replyTo.id}|${safePreview}]]\n${content}`
}

function parseReplyContent(content: string) {
    if (!content?.startsWith(REPLY_PREFIX)) return { reply: null as null | { id: string; preview: string }, body: content || '' }
    const end = content.indexOf(']]')
    if (end === -1) return { reply: null, body: content || '' }
    const meta = content.slice(REPLY_PREFIX.length, end).split('|')
    return {
        reply: { id: meta[0] || '', preview: meta.slice(1).join('|') || 'Mensaje' },
        body: content.slice(end + 2).replace(/^\n/, ''),
    }
}

function formatDuration(ms?: number | null) {
    if (!ms || ms <= 0) return ''
    const total = Math.max(1, Math.round(ms / 1000))
    const minutes = Math.floor(total / 60)
    const seconds = String(total % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
}

function ChatGifIcon({ src, alt, size = 'md' }: { src: string; alt: string; size?: 'sm' | 'md' | 'lg' }) {
    const boxSize = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'
    const imageSize = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'

    return (
        <span className={`${boxSize} inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm ring-1 ring-white/80`}>
            <img src={src} alt={alt} className={`${imageSize} object-contain mix-blend-multiply`} draggable={false} />
        </span>
    )
}

export default function ChatSystem({ workerId, workerName, currentUserId, isAdmin, isOpen, onClose, initialChannel = 'rrhh' }: ChatSystemProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [isMinimized, setIsMinimized] = useState(!isOpen)
    const [isTyping, setIsTyping] = useState(false)
    const [isConnected, setIsConnected] = useState(false)

    // Canal activo (rrhh | ssoma). Workers eligen; admins ven el que abren.
    const [activeChannel, setActiveChannel] = useState<ChatChannel>(initialChannel)

    // Contador de mensajes no leídos
    const [unreadCount, setUnreadCount] = useState(0)

    // Estados de media / adjuntos
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const [recording, setRecording] = useState(false)
    const [recordSeconds, setRecordSeconds] = useState(0)
    const [sendingMedia, setSendingMedia] = useState(false)
    const [replyTo, setReplyTo] = useState<any | null>(null)
    const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<any>(null)
    const channelRef = useRef<any>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const recordedChunksRef = useRef<Blob[]>([])
    const recordStartRef = useRef<number>(0)
    const recordTimerRef = useRef<any>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    // Sincronizar apertura (Admin)
    useEffect(() => {
        if (isAdmin) setIsMinimized(!isOpen)
    }, [isOpen, isAdmin])

    // Al abrir el chat, reiniciamos el contador de no leídos
    useEffect(() => {
        if (!isMinimized) {
            setUnreadCount(0)
            scrollToBottom()
        }
    }, [isMinimized])

    // --- SONIDO ---
    const playIncomingSound = () => {
        // Usamos el sonido de chat específico si existe, si no el general
        const audio = new Audio('/notificationMSM.mp3') 
        audio.volume = 0.6
        audio.play().catch(e => console.log("Audio bloqueado"))
    }

    // --- LOGICA PRINCIPAL ---
    useEffect(() => {
        if (!workerId || !currentUserId) return

        // 1. Cargar Historial — TODOS los canales del worker; filtramos en UI.
        const fetchMessages = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('worker_id', workerId)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)
                scrollToBottom()
            }
            setLoading(false)
        }
        fetchMessages()

        // 2. Conexión Realtime
        const channelName = `chat_room_${workerId}`
        
        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false }, 
                presence: { key: currentUserId },
            },
        })

        channel
            // A) Escuchar NUEVOS MENSAJES
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `worker_id=eq.${workerId}` 
            }, (payload) => {
                const newMsg = payload.new
                
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev
                    return [...prev, newMsg]
                })
                
                // Si el mensaje es del OTRO usuario
                if (newMsg.sender_id !== currentUserId) {
                    playIncomingSound()
                    setIsTyping(false)
                    
                    // Si el chat está cerrado (minimizado), incrementamos el contador
                    if (isMinimized) {
                        setUnreadCount(prev => prev + 1)
                        toast.info(`Nuevo mensaje de ${isAdmin ? workerName : 'Soporte'}`)
                    } else {
                        scrollToBottom()
                    }
                } else {
                    scrollToBottom()
                }
            })
            // B) Escuchar EVENTO "ESCRIBIENDO"
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.sender_id !== currentUserId) {
                    setIsTyping(true)
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
                    // Solo hacemos scroll si está abierto
                    if (!isMinimized) scrollToBottom()
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                    channelRef.current = channel
                }
            })

        return () => {
            supabase.removeChannel(channel)
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        }
    }, [workerId, currentUserId, isMinimized]) // Agregue un isMinimized a dependencias para el contador

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }, 100)
    }

    // --- ENVIAR MENSAJE DE TEXTO ---
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim()) return

        const originalContent = newMessage
        const msgContent = encodeReplyContent(originalContent, replyTo)
        setNewMessage('')
        setReplyTo(null)

        const { error } = await supabase.from('messages').insert({
            content: msgContent,
            worker_id: workerId,
            sender_id: currentUserId,
            is_admin: isAdmin,
            channel: activeChannel,
            sender_role: isAdmin ? 'admin' : 'worker',
            created_at: new Date().toISOString(),
        })

        if (error) {
            toast.error("Error de conexión")
            setNewMessage(originalContent)
        }
    }

    // --- ENVIAR MEDIA (audio | image | video) ---
    const uploadAndSendMedia = async (
        blob: Blob,
        mediaType: 'audio' | 'image' | 'video',
        mime: string,
        durationMs?: number,
    ) => {
        try {
            setSendingMedia(true)
            const ext = mime.split('/')[1]?.split(';')[0] || (mediaType === 'audio' ? 'webm' : 'bin')
            const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
                ? (crypto as any).randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`
            const path = `${currentUserId}/${id}.${ext}`

            const { error: upErr } = await supabase.storage
                .from('chat-media')
                .upload(path, blob, { contentType: mime, upsert: false })
            if (upErr) throw upErr

            const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(path)
            const mediaUrl = pub.publicUrl

            const captions: Record<typeof mediaType, string> = {
                audio: '🎤 Nota de voz',
                image: '📷 Imagen',
                video: '🎥 Video',
            }

            const { error: insErr } = await supabase.from('messages').insert({
                content: encodeReplyContent(captions[mediaType], replyTo),
                worker_id: workerId,
                sender_id: currentUserId,
                is_admin: isAdmin,
                channel: activeChannel,
                sender_role: isAdmin ? 'admin' : 'worker',
                media_url: mediaUrl,
                media_type: mediaType,
                media_mime: mime,
                media_duration_ms: durationMs ?? null,
                created_at: new Date().toISOString(),
            })
            if (insErr) throw insErr
            setReplyTo(null)
        } catch (err: any) {
            toast.error('No se pudo enviar', { description: err?.message ?? '' })
        } finally {
            setSendingMedia(false)
        }
    }

    // --- GRABACIÓN DE AUDIO ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm'
            const mr = new MediaRecorder(stream, { mimeType: mime })
            mediaRecorderRef.current = mr
            recordedChunksRef.current = []
            mr.ondataavailable = (ev) => {
                if (ev.data.size > 0) recordedChunksRef.current.push(ev.data)
            }
            mr.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop())
                const blob = new Blob(recordedChunksRef.current, { type: mime })
                const duration = Date.now() - recordStartRef.current
                await uploadAndSendMedia(blob, 'audio', mime, duration)
            }
            mr.start()
            recordStartRef.current = Date.now()
            setRecording(true)
            setRecordSeconds(0)
            recordTimerRef.current = setInterval(() => {
                setRecordSeconds((s) => s + 1)
            }, 1000)
        } catch (e: any) {
            toast.error('No se pudo acceder al micrófono', { description: e?.message ?? '' })
        }
    }

    const stopRecording = (cancel = false) => {
        if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        if (mediaRecorderRef.current && recording) {
            if (cancel) {
                mediaRecorderRef.current.onstop = () => {
                    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
                }
            }
            mediaRecorderRef.current.stop()
        }
        setRecording(false)
        setRecordSeconds(0)
    }

    const handleImageFile = (file: File) => {
        uploadAndSendMedia(file, 'image', file.type || 'image/jpeg')
    }
    const handleVideoFile = (file: File) => {
        uploadAndSendMedia(file, 'video', file.type || 'video/mp4')
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value)
        
        if (isConnected && channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { sender_id: currentUserId }
            }).catch((err: any) => console.log("Error broadcast", err))
        }
    }

    // --- RENDERIZADO ---

    // 1. MODO MINIMIZADO (SOLO OBRERO - BOTÓN FLOTANTE)
    if (isMinimized && !isAdmin) {
        return (
            <motion.button
                initial={{ scale: 0, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-[#0B1220] rounded-full shadow-2xl shadow-slate-900/30 flex items-center justify-center z-50 border border-white/10"
            >
                {/* Halo animado */}
                <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-emerald-400/30"
                    animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                />
                {/* Halo extra cuando hay no leídos */}
                {unreadCount > 0 && (
                    <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-2 ring-emerald-400/60"
                        animate={{ scale: [1, 1.35], opacity: [0.75, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                )}

                <div className="relative">
                    <AnimatedIcon name="chat" size={36} bounceOnMount={false} />

                    {/* INDICADOR DE CONEXIÓN */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B1220] ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-amber-400'}`}></span>

                    {/* CONTADOR DE MENSAJES NO LEÍDOS */}
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#0B1220] shadow-md"
                        >
                            {unreadCount > 9 ? '+9' : unreadCount}
                        </motion.div>
                    )}
                </div>
            </motion.button>
        )
    }

    if (isMinimized && isAdmin) return null

    // Estilos dinámicos según quién lo ve
    const containerStyle = isAdmin
        ? "fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-[0_-12px_60px_rgba(15,23,42,0.18)] z-[70] border-l border-slate-200/80 flex flex-col"
        : "fixed bottom-24 right-6 w-80 md:w-96 h-[520px] bg-white rounded-3xl shadow-2xl shadow-slate-900/15 z-50 border border-slate-200/70 flex flex-col overflow-hidden"

    return (
        <AnimatePresence>
            {!isMinimized && (
                <>
                    {isAdmin && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-slate-900/40 z-[65] backdrop-blur-sm" />}

                    <motion.div
                        initial={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={isAdmin ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={containerStyle}
                    >
                        {/* HEADER · charcoal minimalista + tabs de canal */}
                        <div className="relative overflow-hidden shrink-0 text-white border-b border-slate-800/50">
                            <div className="absolute inset-0 bg-[#0B1220] -z-10"/>
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0.3, 0.15] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
                            />
                            <div className="relative px-5 py-3.5 flex justify-between items-center">
                                <div className="flex items-center gap-3 z-10 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black bg-white/10 text-emerald-300 border border-white/15 backdrop-blur-sm">
                                            {isAdmin ? workerName.charAt(0) : <ShieldCheck size={16}/>}
                                        </div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#0B1220] ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-amber-400'}`}></span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                                            {isAdmin ? 'Trabajador' : `Canal · ${activeChannel === 'rrhh' ? 'RRHH' : 'SSOMA'}`}
                                        </span>
                                        <h3 className="font-black text-[14px] tracking-tight text-white leading-tight truncate uppercase">
                                            {isAdmin ? workerName : (activeChannel === 'rrhh' ? 'RR.HH.' : 'SSOMA · Seguridad')}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => isAdmin ? onClose() : setIsMinimized(true)}
                                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* TABS de canal — segmented control */}
                            <div className="relative px-3 pb-3">
                                <div className="relative flex p-1 rounded-2xl bg-white/[0.05] border border-white/10">
                                    <motion.div
                                        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-emerald-500/90 shadow-[0_4px_18px_rgba(16,185,129,0.4)]"
                                        animate={{ x: activeChannel === 'rrhh' ? 0 : '100%' }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                    />
                                    <button
                                        onClick={() => setActiveChannel('rrhh')}
                                        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors ${activeChannel === 'rrhh' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        <Briefcase size={12}/> RR.HH.
                                    </button>
                                    <button
                                        onClick={() => setActiveChannel('ssoma')}
                                        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors ${activeChannel === 'ssoma' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        <HardHat size={12}/> SSOMA
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MESSAGES LIST — filtrada por canal activo */}
                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2.5 scroll-smooth bg-slate-50/60" ref={scrollRef}>
                            {(() => {
                                const channelMsgs = messages.filter((m: any) => {
                                    const ch = m.channel || 'general'
                                    // 'general' (legado) lo mostramos como RRHH para no perder historial
                                    if (activeChannel === 'rrhh') return ch === 'rrhh' || ch === 'general'
                                    return ch === 'ssoma'
                                })

                                if (loading) {
                                    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600"/></div>
                                }
                                if (channelMsgs.length === 0) {
                                    return (
                                        <div className="text-center text-slate-400 text-xs mt-10 space-y-3 py-6">
                                            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                                                <MessageSquare size={22}/>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em]">SIN MENSAJES EN {activeChannel === 'rrhh' ? 'RRHH' : 'SSOMA'}</p>
                                            <p className="text-slate-500 max-w-[220px] mx-auto leading-relaxed">Escribe un mensaje, envía un audio o adjunta una foto.</p>
                                        </div>
                                    )
                                }
                                return channelMsgs.map((msg: any, idx: number) => {
                                    const isMe = msg.sender_id === currentUserId
                                    const prevMsg = idx > 0 ? channelMsgs[idx - 1] : null
                                    const samePrev = prevMsg && prevMsg.sender_id === msg.sender_id
                                    const parsed = parseReplyContent(msg.content)
                                    const body = parsed.body
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 86 }}
                                            dragElastic={0.22}
                                            onDragEnd={(_, info) => {
                                                if (info.offset.x > 58) setReplyTo(msg)
                                            }}
                                            className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} ${samePrev ? '!mt-0.5' : 'mt-2'}`}
                                        >
                                            {!samePrev && (
                                                <span className={`text-[9px] font-bold uppercase tracking-[0.18em] mb-1 px-1 ${isMe ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                    {isMe ? 'Tú' : (isAdmin ? workerName.split(' ')[0] : 'Administrador')}
                                                </span>
                                            )}
                                            <div className="relative flex max-w-[88%] items-center gap-2">
                                                <div className={`absolute ${isMe ? '-left-9' : '-right-9'} opacity-0 transition-opacity group-hover:opacity-100 text-emerald-600`}>
                                                    <Reply size={18} />
                                                </div>
                                            <div
                                                className={`relative transition-all overflow-hidden backdrop-blur ${
                                                    isMe
                                                        ? `bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-[24px] rounded-br-md`
                                                        : `bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-[24px] rounded-bl-md`
                                                }`}
                                            >
                                                {parsed.reply && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setReplyTo(msg)}
                                                        className={`mx-3.5 mt-3 block w-[calc(100%-1.75rem)] rounded-2xl border-l-4 px-3 py-2 text-left ${
                                                            isMe
                                                                ? 'border-white/80 bg-white/15 text-emerald-50'
                                                                : 'border-emerald-500 bg-emerald-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <span className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Respuesta</span>
                                                        <span className="line-clamp-2 text-xs font-semibold opacity-90">{parsed.reply.preview}</span>
                                                    </button>
                                                )}
                                                {msg.media_type === 'image' && msg.media_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewMedia({ type: 'image', url: msg.media_url, mime: msg.media_mime })}
                                                        className="relative block overflow-hidden"
                                                    >
                                                        <img src={msg.media_url} alt="" className="max-w-full max-h-[280px] min-w-[190px] object-cover" />
                                                        <span className="absolute right-2 top-2 rounded-full bg-slate-950/70 p-2 text-white backdrop-blur">
                                                            <Maximize2 size={14}/>
                                                        </span>
                                                    </button>
                                                )}
                                                {msg.media_type === 'video' && msg.media_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewMedia({ type: 'video', url: msg.media_url, mime: msg.media_mime })}
                                                        className={`relative flex min-h-[180px] min-w-[230px] items-center justify-center overflow-hidden ${isMe ? 'bg-emerald-950/25' : 'bg-slate-100'}`}
                                                    >
                                                        <video className="absolute inset-0 h-full w-full object-cover opacity-80" muted playsInline>
                                                            <source src={msg.media_url} type={msg.media_mime || 'video/mp4'} />
                                                        </video>
                                                        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-xl backdrop-blur">
                                                            <Play size={22}/>
                                                        </span>
                                                    </button>
                                                )}
                                                {msg.media_type === 'audio' && msg.media_url && (
                                                    <div className={`min-w-[245px] px-3.5 py-3 ${isMe ? 'bg-emerald-600/10' : 'bg-white'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isMe ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                <Mic size={18}/>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-black">Nota de voz</span>
                                                                    <span className={`text-[10px] font-bold ${isMe ? 'text-emerald-50/80' : 'text-slate-400'}`}>{formatDuration(msg.media_duration_ms)}</span>
                                                                </div>
                                                                <audio controls preload="metadata" src={msg.media_url} className="h-8 w-full max-w-[190px] accent-emerald-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {(!msg.media_type || msg.media_type === 'image' || msg.media_type === 'video') && body && (
                                                    <div className="px-3.5 py-2 text-[13.5px] leading-snug">
                                                        <p className="whitespace-pre-wrap break-words">{body}</p>
                                                    </div>
                                                )}
                                                <div className={`flex items-center justify-end gap-1.5 px-3.5 pb-1.5 ${msg.media_type === 'audio' ? 'pt-1' : ''}`}>
                                                    <span className={`text-[10px] opacity-70 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        </motion.div>
                                    )
                                })
                            })()}

                            {/* BUBBLE INDICATOR (Escribiendo...) */}
                            {isTyping && (
                                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-start mt-2">
                                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* INPUT FOOTER */}
                        <form onSubmit={handleSend} className="relative p-3 bg-white border-t border-slate-200/80 shrink-0">
                            {/* Inputs ocultos para gallery/camera/video */}
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value='' }}/>
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value='' }}/>
                            <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.target.value='' }}/>

                            <AnimatePresence>
                                {replyTo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="mb-2 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2"
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                                            <Reply size={16}/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Respondiendo</p>
                                            <p className="truncate text-xs font-semibold text-slate-700">{messageLabel(replyTo)}</p>
                                        </div>
                                        <button type="button" onClick={() => setReplyTo(null)} className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                                            <X size={15}/>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Menú de adjuntos (popover) */}
                            <AnimatePresence>
                                {showAttachMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute bottom-[60px] left-3 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/20 p-2 grid grid-cols-3 gap-1 w-[220px]"
                                    >
                                        <button type="button" onClick={() => { setShowAttachMenu(false); imageInputRef.current?.click() }} className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition hover:bg-emerald-50 active:scale-95">
                                            <ChatGifIcon src="/icons/galeria.gif" alt="Galería" size="sm" />
                                            <span className="text-[10px] font-bold text-slate-700">Galería</span>
                                        </button>
                                        <button type="button" onClick={() => { setShowAttachMenu(false); cameraInputRef.current?.click() }} className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition hover:bg-emerald-50 active:scale-95">
                                            <ChatGifIcon src="/icons/camara.gif" alt="Cámara" size="sm" />
                                            <span className="text-[10px] font-bold text-slate-700">Cámara</span>
                                        </button>
                                        <button type="button" onClick={() => { setShowAttachMenu(false); videoInputRef.current?.click() }} className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition hover:bg-emerald-50 active:scale-95">
                                            <ChatGifIcon src="/icons/video.gif" alt="Video" size="sm" />
                                            <span className="text-[10px] font-bold text-slate-700">Video</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Estado de grabación */}
                            {recording ? (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => stopRecording(true)} className="h-[46px] w-[46px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition">
                                        <Trash2 size={16}/>
                                    </button>
                                    <div className="flex-1 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 h-[46px]">
                                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"/>
                                        <span className="text-[12px] font-bold text-rose-700 tracking-wider">GRABANDO · {String(Math.floor(recordSeconds/60)).padStart(2,'0')}:{String(recordSeconds%60).padStart(2,'0')}</span>
                                        <div className="flex-1 flex items-end gap-0.5 h-6">
                                            {[1,2,3,4,5,6,7,8].map(i => (
                                                <motion.span key={i} className="w-1 bg-rose-400 rounded-full"
                                                    animate={{ height: ['25%','100%','25%'] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => stopRecording(false)} className="h-[46px] w-[46px] flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition active:scale-95">
                                        <Send size={16}/>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-end">
                                    <button type="button" onClick={() => setShowAttachMenu((v) => !v)} disabled={sendingMedia}
                                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-40">
                                        {sendingMedia ? <Loader2 size={16} className="animate-spin"/> : <ChatGifIcon src="/icons/adjuntar.gif" alt="Adjuntar" size="sm" />}
                                    </button>
                                    <textarea
                                        rows={1}
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSend()
                                            }
                                        }}
                                        placeholder={`Mensaje a ${activeChannel === 'rrhh' ? 'RRHH' : 'SSOMA'}…`}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-[13.5px] rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all resize-none max-h-24 scrollbar-hide"
                                    />
                                    {newMessage.trim() ? (
                                        <button
                                            type="submit"
                                            disabled={!isConnected}
                                            className="bg-[#0B1220] text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all h-[46px] w-[46px] flex items-center justify-center active:scale-95 group shrink-0"
                                        >
                                            <Send size={16} className="text-emerald-300 group-hover:translate-x-0.5 transition-transform"/>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white p-1 text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:shadow-md active:scale-95"
                                            title="Grabar audio"
                                        >
                                            <ChatGifIcon src="/icons/grabar-audio.gif" alt="Micrófono" size="sm" />
                                        </button>
                                    )}
                                </div>
                            )}
                            {/* Botón oculto requerido por la firma del form (no se muestra) */}
                            <button type="submit" className="hidden" aria-hidden>
                            </button>
                        </form>
                    </motion.div>

                    <AnimatePresence>
                        {previewMedia && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
                                onClick={() => setPreviewMedia(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.94, y: 18 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.96, y: 12 }}
                                    className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] bg-slate-950 shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMedia(null)}
                                        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur hover:bg-white"
                                    >
                                        <X size={18}/>
                                    </button>
                                    {previewMedia.type === 'image' ? (
                                        <img src={previewMedia.url} alt="Vista previa" className="max-h-[88vh] w-full object-contain" />
                                    ) : (
                                        <video controls autoPlay className="max-h-[88vh] w-full bg-black">
                                            <source src={previewMedia.url} type={previewMedia.mime || 'video/mp4'} />
                                        </video>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    )
}
