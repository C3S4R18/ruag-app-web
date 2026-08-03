'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LifeBuoy, ArrowUpRight, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import LottieJsonIcon from './LottieJsonIcon'

export const SUPPORT_PWA_URL = 'https://support-dev-two.vercel.app/'

/**
 * Ítem de soporte para el sidebar del panel admin.
 * Respeta el estado colapsado del <aside> (grupo `aside`) igual que SidebarItem.
 */
export function SupportSidebarItem() {
    const [hovered, setHovered] = useState(false)

    return (
        <motion.a
            href={SUPPORT_PWA_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Soporte técnico"
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileTap={{ scale: 0.97 }}
            className="relative w-full flex items-center gap-3 pl-1.5 pr-3 py-2 rounded-2xl text-[13px] font-semibold overflow-hidden group text-slate-600 hover:text-slate-900 transition-colors duration-200 group-data-[collapsed=true]/aside:justify-center group-data-[collapsed=true]/aside:px-0"
        >
            {/* Fondo degradado que aparece al hover */}
            <motion.span
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-transparent border border-sky-100"
                initial={false}
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
            />

            {/* Icono animado SupportDev (Lottie) */}
            <motion.span
                className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center"
                animate={{ scale: hovered ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 16 }}
            >
                <LottieJsonIcon src="/admin/supportdev.json" size={30} loop title="Soporte técnico" />
            </motion.span>

            <span className="relative z-10 tracking-wide truncate group-data-[collapsed=true]/aside:hidden">
                Soporte
            </span>

            <motion.span
                className="relative z-10 ml-auto text-sky-500 group-data-[collapsed=true]/aside:hidden"
                animate={{ x: hovered ? 2 : 0, y: hovered ? -2 : 0, opacity: hovered ? 1 : 0.45 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
                <ArrowUpRight size={14} strokeWidth={3} />
            </motion.span>
        </motion.a>
    )
}

type SupportButtonProps = {
    /** 'admin' = azul corporativo · 'worker' = esmeralda del portal obrero */
    variant?: 'admin' | 'worker'
    /** Desplaza el botón hacia arriba si hay otra burbuja flotante abajo */
    offsetBottom?: number
}

/**
 * Botón flotante de SOPORTE — abre la PWA de SupportDev en una pestaña nueva.
 * Mismo destino que el botón nativo de la app Android cuando SupportDev
 * no está instalada.
 */
export default function SupportButton({ variant = 'admin', offsetBottom = 24 }: SupportButtonProps) {
    const [hovered, setHovered] = useState(false)

    const theme = variant === 'worker'
        ? {
            gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
            ring: 'rgba(16,185,129,0.45)',
            glow: 'shadow-emerald-600/40',
        }
        : {
            gradient: 'from-sky-500 via-blue-600 to-indigo-700',
            ring: 'rgba(59,130,246,0.45)',
            glow: 'shadow-blue-600/40',
        }

    return (
        <div
            className="fixed right-6 z-[60] print:hidden"
            style={{ bottom: offsetBottom }}
        >
            {/* Etiqueta que se despliega al pasar el mouse */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 12, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 12, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute right-full bottom-1 mr-3 w-max max-w-[15rem] rounded-2xl bg-slate-900/95 backdrop-blur-xl px-4 py-3 text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10"
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquarePlus size={14} className="text-emerald-300 shrink-0" />
                            <span className="text-[13px] font-extrabold tracking-tight">Soporte técnico</span>
                        </div>
                        <p className="mt-1 text-[11px] font-medium leading-snug text-slate-300">
                            Reporta una falla, pide una mejora o sigue tu ticket.
                        </p>
                        <span className="absolute top-1/2 -right-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900/95" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.a
                href={SUPPORT_PWA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir soporte técnico"
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.92 }}
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-xl ${theme.glow} ring-1 ring-white/25 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60`}
            >
                {/* Anillo que pulsa */}
                <motion.span
                    className="absolute inset-0 rounded-2xl"
                    animate={{ boxShadow: [`0 0 0 0px ${theme.ring}`, `0 0 0 12px rgba(0,0,0,0)`] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />

                {/* Brillo que barre en diagonal */}
                <motion.span
                    className="pointer-events-none absolute -inset-y-8 w-10 bg-white/25 blur-md"
                    style={{ rotate: 18 }}
                    animate={{ x: ['-140%', '260%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.1 }}
                />

                {/* Salvavidas girando lento, se acelera en hover */}
                <motion.span
                    className="relative"
                    animate={{ rotate: hovered ? 360 : 0 }}
                    transition={hovered
                        ? { duration: 2.4, repeat: Infinity, ease: 'linear' }
                        : { type: 'spring', stiffness: 200, damping: 20 }}
                >
                    <LifeBuoy size={24} strokeWidth={2.3} />
                </motion.span>

                {/* Indicador de enlace externo */}
                <motion.span
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900 shadow-md"
                    animate={{ y: hovered ? -2 : 0, x: hovered ? 2 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                >
                    <ArrowUpRight size={12} strokeWidth={3} />
                </motion.span>
            </motion.a>
        </div>
    )
}
