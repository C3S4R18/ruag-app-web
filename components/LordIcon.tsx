'use client'

import { CSSProperties, createElement, useEffect } from 'react'

export const LORDICON_SOURCES = {
  sidebar: {
    dashboard: 'https://media.lordicon.com/assets/icons/main/lordicon.json',
    rrhh: 'https://media.lordicon.com/assets/icons/editor/copy.json',
    vidaLey: 'https://media.lordicon.com/assets/icons/blocks/cover-code.json',
    cesados: 'https://media.lordicon.com/assets/icons/blocks/dots-circle-right.json',
    documentos: 'https://media.lordicon.com/assets/icons/blocks/message-info.json',
    reporte: 'https://media.lordicon.com/assets/icons/editor/update.json',
    upload: 'https://media.lordicon.com/assets/icons/blocks/button-arrow-right.json',
    sctr: 'https://media.lordicon.com/assets/icons/main/arrow-down.json',
    biometria: 'https://media.lordicon.com/assets/icons/main/mobile-menu.json',
    profile: 'https://media.lordicon.com/assets/icons/editor/flag.json',
    center: 'https://media.lordicon.com/assets/icons/blocks/cover-code.json',
  },
  table: {
    signature: 'https://media.lordicon.com/assets/icons/editor/update.json',
    fingerprint: 'https://media.lordicon.com/assets/icons/main/lordicon.json',
    chat: 'https://media.lordicon.com/assets/icons/blocks/message-info.json',
    view: 'https://media.lordicon.com/assets/icons/blocks/dots-circle-right.json',
    edit: 'https://media.lordicon.com/assets/icons/editor/copy.json',
    download: 'https://media.lordicon.com/assets/icons/blocks/button-arrow-right.json',
  },
} as const

type LordIconProps = {
  src: string
  size?: number
  trigger?: 'in' | 'click' | 'hover' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'sequence'
  stroke?: 'light' | 'regular' | 'bold'
  className?: string
  style?: CSSProperties
  title?: string
  loading?: 'lazy' | 'interaction' | 'delay'
  target?: string
  fallbackSrc?: string
}

const toFallbackSvg = (src: string) => {
  if (src.endsWith('.json')) return src.replace(/\.json$/i, '.svg')
  return src
}

export default function LordIcon({
  src,
  size = 20,
  trigger = 'hover',
  stroke = 'regular',
  className = '',
  style,
  title,
  loading = 'interaction',
  target,
  fallbackSrc: fallbackOverride,
}: LordIconProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.customElements.get('lord-icon')) return
    if (document.querySelector('script[data-ruag-lordicon]')) return

    const script = document.createElement('script')
    script.src = 'https://cdn.lordicon.com/lordicon.js'
    script.async = true
    script.dataset.ruagLordicon = 'true'
    document.head.appendChild(script)
  }, [])

  const fallbackSrc = fallbackOverride || toFallbackSvg(src)

  return createElement(
    'lord-icon',
    {
      src,
      trigger,
      stroke,
      loading,
      target,
      className: `current-color ${className}`.trim(),
      title,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        color: 'currentColor',
        ...style,
      },
    },
    createElement('img', {
      alt: title || '',
      src: fallbackSrc,
      style: { width: `${size}px`, height: `${size}px` },
    })
  )
}
