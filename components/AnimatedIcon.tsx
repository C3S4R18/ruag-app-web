'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { CSSProperties } from 'react'

export const ANIMATED_ICONS = {
  misRegistros: '/icons/mis-registros.gif',
  archivosSsoma: '/icons/archivos-ssoma.gif',
  miPerfil: '/icons/mi-perfil.gif',
  chat: '/icons/chat.gif',
  actualizarFicha: '/icons/actualizar-ficha.gif',
  // Secciones del wizard de la ficha
  personal: '/icons/personal.gif',
  datosBancarios: '/icons/datos-bancarios.gif',
  familia: '/icons/familia.gif',
  esposa: '/icons/esposa.gif',
  hijos: '/icons/hijos.gif',
  laboral: '/icons/laboral.gif',
  formacionAcademica: '/icons/formacion-academica.gif',
  docs: '/icons/docs.gif',
  firma: '/icons/firma.gif',
  check: '/icons/check.gif',
  contactoEmergencia: '/icons/contacto-emergencia.gif',
} as const

export type AnimatedIconKey = keyof typeof ANIMATED_ICONS

type AnimatedIconProps = {
  name: AnimatedIconKey
  size?: number
  className?: string
  style?: CSSProperties
  alt?: string
  /** Adds a soft animated halo behind the icon. */
  glow?: boolean
  /** Wraps the icon with a circular gradient background. */
  surface?: 'none' | 'soft' | 'gradient'
  /** Subtle bounce on mount. */
  bounceOnMount?: boolean
  /**
   * Si true (default), aplica `mix-blend-mode: multiply` al GIF para que el
   * fondo blanco del archivo se mezcle con el fondo del contenedor y no se
   * vea el "cuadrado blanco" alrededor del icono. Pon `false` cuando lo uses
   * sobre fondos oscuros donde quieras que el blanco siga visible.
   */
  blend?: boolean
}

const SURFACES: Record<NonNullable<AnimatedIconProps['surface']>, string> = {
  none: '',
  soft: 'bg-stone-50 ring-1 ring-stone-100',
  gradient: 'bg-gradient-to-br from-red-50 via-white to-stone-100 ring-1 ring-red-100/70 shadow-sm',
}

export default function AnimatedIcon({
  name,
  size = 28,
  className = '',
  style,
  alt,
  glow = false,
  surface = 'none',
  bounceOnMount = true,
  blend = true,
}: AnimatedIconProps) {
  const src = ANIMATED_ICONS[name]
  const padding = surface === 'none' ? 0 : Math.round(size * 0.18)
  const box = size + padding * 2

  return (
    <motion.span
      initial={bounceOnMount ? { scale: 0.5, rotate: -10, opacity: 0 } : false}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 16 }}
      whileHover={{ scale: 1.08, rotate: 0 }}
      whileTap={{ scale: 0.92 }}
      className={`relative inline-flex items-center justify-center rounded-xl ${SURFACES[surface]} ${className}`}
      style={{ width: box, height: box, ...style }}
    >
      {glow && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-xl bg-red-400/30 blur-md"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <Image
        src={src}
        alt={alt ?? name}
        width={size}
        height={size}
        unoptimized
        priority
        className="relative z-[1] select-none pointer-events-none"
        draggable={false}
        style={blend ? { mixBlendMode: 'multiply' } : undefined}
      />
    </motion.span>
  )
}
