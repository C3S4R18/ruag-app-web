'use client'

import AppIcon from './AppIcon'

/**
 * Ícono del panel admin. Antes mostraba GIFs animados; ahora dibuja un
 * ícono vectorial elegido por el nombre del archivo (ver AppIcon.tsx), así
 * todas las llamadas existentes siguen igual.
 *
 * Variantes:
 *  - `bare`    → sólo el ícono; toma el color del texto que lo rodea.
 *  - `sidebar` / `button` → bandeja blanca con borde sutil.
 */
export type AdminGifVariant = 'sidebar' | 'button' | 'bare'

interface AdminGifIconProps {
  /** Nombre del archivo que antes se usaba, p.ej. "centro-de-costo.gif" */
  name?: string
  /** Antes alternaba varios GIFs; ahora se muestra el primero */
  names?: string[]
  /** Ya no se usa; se conserva para no romper llamadas */
  folder?: string
  /** Ya no se usa; se conserva para no romper llamadas */
  intervalMs?: number
  /** Tamaño de la caja en px (el trazo ocupa ~62 %) */
  size?: number
  variant?: AdminGifVariant
  /** Tamaño del contenedor en px (default size + 12 para sidebar/button) */
  containerSize?: number
  className?: string
}

export default function AdminGifIcon({
  name,
  names,
  size = 22,
  variant = 'bare',
  containerSize,
  className = '',
}: AdminGifIconProps) {
  const archivo = names?.[0] ?? name
  if (!archivo) return null

  const icono = <AppIcon name={archivo} size={Math.round(size * 0.62)} />

  if (variant === 'bare') {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {icono}
      </span>
    )
  }

  const box = containerSize ?? size + 12
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[10px] bg-white text-slate-800 ring-1 ring-slate-200 ${className}`}
      style={{ width: box, height: box }}
    >
      {icono}
    </span>
  )
}

/** Antes contenía un filtro SVG chromakey; se conserva no-op para no romper imports. */
export function AdminGifFilters() {
  return null
}
