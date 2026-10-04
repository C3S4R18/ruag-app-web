'use client'

import { useEffect, useState } from 'react'
import { isHalloween } from '@/utils/season'

/**
 * `true` durante octubre. Se calcula en el cliente (después del primer
 * render) para que el HTML del servidor y el del navegador coincidan y
 * React no se queje de hidratación.
 */
export function useIsHalloween(): boolean {
    const [on, setOn] = useState(false)
    useEffect(() => { setOn(isHalloween()) }, [])
    return on
}

/** Calabaza sonriente con brillo titilante. Hace de logo en octubre. */
export function PumpkinIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className={className}
            aria-label="Calabaza de Halloween"
        >
            <defs>
                <radialGradient id="ruag-pumpkin-glow" cx="50%" cy="58%" r="55%">
                    <stop offset="0%" stopColor="#FFB155" stopOpacity="0.55">
                        <animate attributeName="stop-opacity" values="0.55;0.25;0.55" dur="1.6s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#FFB155" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="ruag-pumpkin-body" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8A2E" />
                    <stop offset="100%" stopColor="#E2590A" />
                </linearGradient>
            </defs>
            <circle cx="32" cy="37" r="30" fill="url(#ruag-pumpkin-glow)" />
            <path d="M33 13c0-4 2-7 6-8" stroke="#4B7A2B" strokeWidth="4" strokeLinecap="round" fill="none" />
            <ellipse cx="32" cy="37" rx="25" ry="21" fill="url(#ruag-pumpkin-body)" />
            <ellipse cx="32" cy="37" rx="12" ry="21" fill="#C2470A" opacity="0.35" />
            <g fill="#17101F">
                <path d="M19 31 L27 38 L16 38 Z" />
                <path d="M45 31 L48 38 L37 38 Z" />
                <path d="M17 43 L22 48 L26 43 L30 48 L34 43 L38 48 L42 43 L47 46 L41 52 L23 52 Z" />
            </g>
        </svg>
    )
}
