'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send, X, MessageSquare, Loader2, ShieldCheck } from 'lucide-react'
import AnimatedIcon from '@/components/AnimatedIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ChatSystemProps {
    workerId: string;       
    workerName: string;     
    currentUserId: string;  
    isAdmin: boolean;       
    isOpen: boolean;        
    onClose: () => void;    
}

export default function ChatSystem({ workerId, workerName, currentUserId, isAdmin, isOpen, onClose }: ChatSystemProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [isMinimized, setIsMinimized] = useState(!isOpen)
    const [isTyping, setIsTyping] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    
    // NUEVO: Estado para contar mensajes no leídos
    const [unreadCount, setUnreadCount] = useState(0)
    
    const scrollRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<any>(null)
    const channelRef = useRef<any>(null)

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

        // 1. Cargar Historial
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
    }, [workerId, currentUserId, isMinimized]) // Agregamos isMinimized a dependencias para el contador

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

    // --- ENVIAR MENSAJE ---
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim()) return

        const msgContent = newMessage
        setNewMessage('') 

        const { error } = await supabase.from('messages').insert({
            content: msgContent,
            worker_id: workerId,
            sender_id: currentUserId,
            is_admin: isAdmin,
            created_at: new Date().toISOString()
        })

        if (error) {
            toast.error("Error de conexión")
            setNewMessage(msgContent)
        }
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
                className="fixed bottom-6 right-6 w-16 h-16 bg-white/85 backdrop-blur-xl rounded-full shadow-2xl shadow-red-900/30 flex items-center justify-center z-50 border-2 border-white ring-1 ring-red-200/70"
            >
                {/* Halo animado */}
                <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/40 to-red-700/40"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
                {/* Halo extra cuando hay no leídos */}
                {unreadCount > 0 && (
                    <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-2 ring-red-400/60"
                        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                )}

                <div className="relative">
                    <AnimatedIcon name="chat" size={36} bounceOnMount={false} />

                    {/* INDICADOR DE CONEXIÓN */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-400' : 'bg-amber-400'}`}></span>

                    {/* CONTADOR DE MENSAJES NO LEÍDOS */}
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2.5 -right-2.5 bg-gradient-to-br from-red-600 to-red-900 text-white text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md ring-1 ring-red-300"
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
        ? "fixed inset-y-0 right-0 w-full max-w-md bg-white/85 backdrop-blur-xl shadow-2xl z-[70] border-l border-white/60 ring-1 ring-stone-900/5 flex flex-col"
        : "fixed bottom-24 right-6 w-80 md:w-96 h-[520px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-900/20 z-50 border border-white/60 ring-1 ring-stone-900/5 flex flex-col overflow-hidden"

    return (
        <AnimatePresence>
            {!isMinimized && (
                <>
                    {isAdmin && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-stone-900/30 z-[65] backdrop-blur-sm" />}

                    <motion.div
                        initial={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={isAdmin ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={containerStyle}
                    >
                        {/* HEADER GLASS CRIMSON */}
                        <div className="relative overflow-hidden p-4 flex justify-between items-center shrink-0 text-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-zinc-900 -z-10"/>
                            <motion.div
                                aria-hidden
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none"
                            />
                            <div className="relative flex items-center gap-3 z-10">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black bg-white/95 text-red-700 shadow-md ring-1 ring-white/40">
                                    {isAdmin ? workerName.charAt(0) : <ShieldCheck size={20}/>}
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/55">00 — {isAdmin ? 'Trabajador' : 'Soporte'}</span>
                                    <h3 className="font-black text-base tracking-tight text-white leading-tight">
                                        {isAdmin ? workerName : 'Administrador'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-red-300 animate-pulse' : 'bg-amber-300'}`}></span>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                                            {isConnected ? 'En línea' : 'Conectando…'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => isAdmin ? onClose() : setIsMinimized(true)}
                                className="relative z-10 p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 text-white/85 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* MESSAGES LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-gradient-to-br from-stone-50 via-stone-50/80 to-red-50/40" ref={scrollRef}>
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-700"/></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-stone-400 text-xs mt-10 space-y-3 py-6">
                                    <div className="w-14 h-14 bg-white/70 backdrop-blur ring-1 ring-stone-200/60 border border-white/60 rounded-2xl flex items-center justify-center mx-auto text-red-700 shadow-md shadow-red-900/10">
                                        <MessageSquare size={24}/>
                                    </div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em]">SIN MENSAJES</p>
                                    <p className="text-stone-500 max-w-[200px] mx-auto leading-relaxed">Escribe al administrador para iniciar la conversación.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-[9px] font-bold uppercase tracking-[0.18em] mb-1 px-1 ${isMe ? 'text-red-700' : 'text-stone-500'}`}>
                                                {isMe ? 'Tú' : 'Administrador'}
                                            </span>
                                            <div
                                                className={`max-w-[85%] px-4 py-2.5 text-sm relative group transition-all ${
                                                    isMe
                                                        ? 'bg-gradient-to-br from-red-700 to-red-900 text-white rounded-2xl rounded-br-md shadow-md shadow-red-500/20 ring-1 ring-white/20'
                                                        : 'bg-white/85 backdrop-blur ring-1 ring-stone-200/70 text-stone-800 border border-white/60 rounded-2xl rounded-bl-md shadow-sm'
                                                }`}
                                            >
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <span className={`text-[10px] block mt-1 text-right opacity-70 ${isMe ? 'text-red-100' : 'text-stone-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}

                            {/* BUBBLE INDICATOR (Escribiendo...) */}
                            {isTyping && (
                                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-start">
                                    <div className="bg-white/85 backdrop-blur border border-white/60 ring-1 ring-stone-200/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* INPUT FOOTER */}
                        <form onSubmit={handleSend} className="p-3 bg-white/70 backdrop-blur-xl border-t border-white/60 flex gap-2 shrink-0 items-end">
                            <textarea
                                rows={1}
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-white/70 backdrop-blur border border-white/60 ring-1 ring-stone-200/60 text-stone-800 text-sm rounded-xl px-4 py-3 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-red-200/50 focus:border-red-400 focus:bg-white transition-all resize-none max-h-24 scrollbar-hide"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !isConnected}
                                className="bg-gradient-to-br from-red-600 to-red-900 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/30 ring-1 ring-white/40 h-[46px] w-[46px] flex items-center justify-center active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}