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
                className="fixed bottom-6 right-6 w-16 h-16 bg-white rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center z-50 border-2 border-white ring-1 ring-slate-200/70"
            >
                {/* Halo animado */}
                <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/30"
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
                            className="absolute -top-2.5 -right-2.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md"
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
        ? "fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] border-l border-slate-200 flex flex-col"
        : "fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 border border-slate-200 flex flex-col overflow-hidden"

    return (
        <AnimatePresence>
            {!isMinimized && (
                <>
                    {isAdmin && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-slate-900/20 z-[65] backdrop-blur-sm" />}
                    
                    <motion.div 
                        initial={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={isAdmin ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isAdmin ? { x: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={containerStyle}
                    >
                        {/* HEADER */}
                        <div className={`p-4 flex justify-between items-center shrink-0 ${isAdmin ? 'bg-white border-b border-slate-100' : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-white/10 text-white'}`}>
                                    {isAdmin ? workerName.charAt(0) : <ShieldCheck size={20}/>}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm leading-tight ${isAdmin ? 'text-slate-800' : 'text-white'}`}>
                                        {isAdmin ? workerName : 'Soporte SSOMA'}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                        <p className={`text-xs ${isAdmin ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {isConnected ? 'En línea' : 'Conectando...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => isAdmin ? onClose() : setIsMinimized(true)} 
                                className={`p-2 rounded-full transition-colors ${isAdmin ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/20 text-white/80'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* MESSAGES LIST */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 scroll-smooth" ref={scrollRef}>
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs mt-10 space-y-2">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300"><MessageSquare size={24}/></div>
                                    <p>No hay mensajes.<br/>Escribe para iniciar la conversación.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div 
                                                className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm relative group transition-all ${
                                                    isMe 
                                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' 
                                                        : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-none'
                                                }`}
                                            >
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <span className={`text-[10px] block mt-1 text-right opacity-70 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
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
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* INPUT FOOTER */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0 items-end">
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
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none max-h-24 scrollbar-hide"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || !isConnected} 
                                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20 h-[46px] w-[46px] flex items-center justify-center"
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