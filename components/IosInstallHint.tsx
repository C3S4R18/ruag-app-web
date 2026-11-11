'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Share, SquarePlus, X } from 'lucide-react'

const CLAVE = 'ruag-ios-install-hint'
const DIAS_ENTRE_AVISOS = 14

/**
 * En iPhone no hay app nativa: la web se instala desde Safari con
 * "Agregar a inicio". Este aviso enseña cómo hacerlo, sólo en iOS, sólo si
 * aún no está instalada, y no vuelve a salir en 14 días si lo cierran.
 * El panel admin no lo muestra.
 */
export default function IosInstallHint() {
    const pathname = usePathname() || '/'
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (pathname.startsWith('/admin') || pathname.startsWith('/ssoma')) return
        const ua = navigator.userAgent
        const esIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        const instalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
        if (!esIos || instalada) return
        try {
            const ultimo = Number(localStorage.getItem(CLAVE) || 0)
            if (Date.now() - ultimo < DIAS_ENTRE_AVISOS * 86_400_000) return
        } catch { /* sin almacenamiento: mostrar igual */ }
        const t = setTimeout(() => setVisible(true), 1200)
        return () => clearTimeout(t)
    }, [pathname])

    const cerrar = () => {
        setVisible(false)
        try { localStorage.setItem(CLAVE, String(Date.now())) } catch { /* ignore */ }
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    role="dialog"
                    aria-label="Instalar RUAG en tu iPhone"
                    initial={{ y: 140, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 140, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-md rounded-3xl bg-white p-4 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-200"
                >
                    <div className="flex items-start gap-3">
                        <img src="/pwa/icon-192.png" alt="" className="h-12 w-12 rounded-xl ring-1 ring-stone-200" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-extrabold tracking-tight text-stone-900">Instala RUAG en tu iPhone</p>
                            <p className="mt-0.5 text-[13px] text-stone-500">Ábrela como app, a pantalla completa.</p>
                        </div>
                        <button onClick={cerrar} aria-label="Cerrar" className="-mr-1 -mt-1 rounded-full p-2 text-stone-400 hover:bg-stone-100">
                            <X size={18} />
                        </button>
                    </div>

                    <ol className="mt-4 space-y-2.5 text-[13px] text-stone-700">
                        <li className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-black text-stone-900">1</span>
                            <span className="flex flex-wrap items-center gap-1">Toca <Share size={16} className="text-blue-500" /> <b>Compartir</b> en Safari</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-black text-stone-900">2</span>
                            <span className="flex flex-wrap items-center gap-1">Elige <SquarePlus size={16} className="text-stone-900" /> <b>Agregar a inicio</b></span>
                        </li>
                    </ol>

                    <button
                        onClick={cerrar}
                        className="mt-4 h-11 w-full rounded-2xl bg-stone-900 text-sm font-bold text-white active:scale-[0.98] transition-transform"
                    >
                        Entendido
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
