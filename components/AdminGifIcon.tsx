/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * GIF icon para el panel admin. Soporta:
 *  - Un solo GIF (prop `name`)
 *  - Múltiples GIFs alternantes (prop `names`) — rota cada `intervalMs`
 *
 * Quita el fondo blanco del GIF con un SVG filter `feColorMatrix`
 * que mapea luminancia → alpha (blanco → transparente). Funciona sobre
 * CUALQUIER color de fondo (cream, white, mint, charcoal, dark slate).
 *
 * Variantes:
 *  - `bare`    → sin contenedor, sólo el GIF tal cual (con su fondo
 *                blanco original — colócalo sobre superficies blancas).
 *  - `sidebar` → pill blanca opcional (sólo si te gusta el efecto "iOS").
 *  - `button`  → bandeja blanca con borde sutil.
 */
export type AdminGifVariant = 'sidebar' | 'button' | 'bare'

interface AdminGifIconProps {
  /** Nombre del archivo dentro de la carpeta `folder` (default /admin/) */
  name?: string
  /** Array de nombres para alternar */
  names?: string[]
  /** Carpeta dentro de /public/ donde está el GIF (default "admin") */
  folder?: string
  /** Intervalo entre cambios cuando hay `names` */
  intervalMs?: number
  /** Tamaño del icono en px (default 22) */
  size?: number
  /** Variante visual */
  variant?: AdminGifVariant
  /** Tamaño del contenedor en px (default size + 12 para sidebar/button) */
  containerSize?: number
  /** Class extra para el contenedor */
  className?: string
}

const CHROMAKEY_FILTER_ID = 'ruag-chromakey'

export default function AdminGifIcon({
  name,
  names,
  folder = 'admin',
  intervalMs = 2800,
  size = 22,
  variant = 'bare',
  containerSize,
  className = '',
}: AdminGifIconProps) {
  const sources = names && names.length > 0 ? names : name ? [name] : []
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (sources.length < 2) return
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % sources.length)
    }, intervalMs)
    return () => clearInterval(t)
  }, [sources.length, intervalMs])

  if (sources.length === 0) return null
  const current = sources[idx]
  const src = `/${folder}/${current}`

  const box = containerSize ?? size + 12

  const containerClass =
    variant === 'sidebar'
      ? 'bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.25)] ring-1 ring-white/70'
      : variant === 'button'
        ? 'bg-white rounded-[10px] ring-1 ring-slate-200'
        : ''

  // Cuando hay varios GIFs alternantes, hacemos crossfade entre frames
  // para que el cambio no sea brusco. Para un solo GIF, render directo.
  const hasMultiple = sources.length > 1

  const inner = hasMultiple ? (
    <AnimatePresence mode="sync">
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-contain"
        />
      </motion.div>
    </AnimatePresence>
  ) : (
    <Image
      src={src}
      alt=""
      fill
      unoptimized
      sizes={`${size}px`}
      className="object-contain"
    />
  )

  if (variant === 'bare') {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {inner}
      </div>
    )
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden ${containerClass} ${className}`}
      style={{ width: box, height: box }}
    >
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {inner}
      </div>
    </div>
  )
}

/**
 * Antes contenía un filtro SVG chromakey, ahora se conserva como
 * componente no-op para no romper imports. Devuelve null.
 */
export function AdminGifFilters() {
  return null
}
