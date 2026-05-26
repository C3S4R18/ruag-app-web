'use client'

import { CSSProperties, useEffect, useRef } from 'react'

type LottieJsonIconProps = {
  src: string
  size?: number
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: CSSProperties
  title?: string
}

const loadLottieWeb = () => {
  if (typeof window === 'undefined') return Promise.resolve()

  const win = window as typeof window & {
    lottie?: {
      loadAnimation: (options: {
        container: Element
        renderer: 'svg'
        loop: boolean
        autoplay: boolean
        path: string
        rendererSettings?: Record<string, unknown>
      }) => { destroy: () => void }
    }
    __ruagLottiePromise?: Promise<void>
  }

  if (win.lottie) return Promise.resolve()
  if (win.__ruagLottiePromise) return win.__ruagLottiePromise

  win.__ruagLottiePromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ruag-lottie-web]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar lottie-web')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js'
    script.async = true
    script.dataset.ruagLottieWeb = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar lottie-web'))
    document.head.appendChild(script)
  })

  return win.__ruagLottiePromise
}

export default function LottieJsonIcon({
  src,
  size = 24,
  loop = true,
  autoplay = true,
  className = '',
  style,
  title,
}: LottieJsonIconProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let animation: { destroy: () => void } | null = null

    loadLottieWeb()
      .then(() => {
        if (cancelled || !containerRef.current) return

        const win = window as typeof window & {
          lottie?: {
            loadAnimation: (options: {
              container: Element
              renderer: 'svg'
              loop: boolean
              autoplay: boolean
              path: string
              rendererSettings?: Record<string, unknown>
            }) => { destroy: () => void }
          }
        }

        if (!win.lottie) return

        containerRef.current.innerHTML = ''
        animation = win.lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          path: src,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
          },
        })
      })
      .catch(() => {
        if (containerRef.current) containerRef.current.innerHTML = ''
      })

    return () => {
      cancelled = true
      animation?.destroy()
    }
  }, [src, loop, autoplay])

  return (
    <span
      ref={containerRef}
      aria-label={title}
      title={title}
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flex: '0 0 auto',
        ...style,
      }}
    />
  )
}
