import type { CSSProperties } from 'react'
import AppIcon from './AppIcon'

type LottieJsonIconProps = {
  src: string
  size?: number
  /** Ya no se usan: se conservan para no romper llamadas. */
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: CSSProperties
  title?: string
}

/**
 * Antes reproducía una animación Lottie (cargando lottie-web desde un CDN).
 * Ahora dibuja el ícono vectorial que corresponde a ese archivo.
 */
export default function LottieJsonIcon({ src, size = 24, className = '', style, title }: LottieJsonIconProps) {
  return (
    <span
      aria-label={title}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <AppIcon name={src} size={Math.round(size * 0.66)} />
    </span>
  )
}
