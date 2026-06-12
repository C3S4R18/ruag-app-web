'use client'

import { useEffect, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

type NormalizedSignatureImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
}

function isVisibleSignaturePixel(r: number, g: number, b: number, a: number) {
  // Threshold bajo: pen strokes anti-aliased tienen alpha 4-255. 18 era muy duro.
  if (a < 6) return false

  const brightness = (r + g + b) / 3
  const isNearWhite = brightness > 240 && a > 200

  return !isNearWhite
}

export default function NormalizedSignatureImage({
  src,
  alt,
  style,
  className,
  ...rest
}: NormalizedSignatureImageProps) {
  const [processedSrc, setProcessedSrc] = useState(src)

  useEffect(() => {
    if (!src) {
      setProcessedSrc(src)
      return
    }

    let cancelled = false
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    image.onload = () => {
      if (cancelled) return

      try {
        const width = image.naturalWidth || image.width
        const height = image.naturalHeight || image.height

        if (!width || !height) {
          setProcessedSrc(src)
          return
        }

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })

        if (!sourceCtx) {
          setProcessedSrc(src)
          return
        }

        sourceCtx.drawImage(image, 0, 0)
        const pixels = sourceCtx.getImageData(0, 0, width, height).data

        let left = width
        let top = height
        let right = -1
        let bottom = -1

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4
            const r = pixels[index]
            const g = pixels[index + 1]
            const b = pixels[index + 2]
            const a = pixels[index + 3]

            if (!isVisibleSignaturePixel(r, g, b, a)) continue

            if (x < left) left = x
            if (x > right) right = x
            if (y < top) top = y
            if (y > bottom) bottom = y
          }
        }

        if (right < left || bottom < top) {
          setProcessedSrc(src)
          return
        }

        // Si bbox colapsada (<20px), no recortes — algo salio mal con threshold.
        // Renderiza original para no mostrar punto microscopico estirado.
        const bboxW = right - left
        const bboxH = bottom - top
        if (bboxW < 20 || bboxH < 20) {
          setProcessedSrc(src)
          return
        }

        const padding = Math.max(8, Math.round(Math.max(width, height) * 0.03))
        const cropLeft = Math.max(0, left - padding)
        const cropTop = Math.max(0, top - padding)
        const cropRight = Math.min(width, right + padding)
        const cropBottom = Math.min(height, bottom + padding)
        const cropWidth = Math.max(1, cropRight - cropLeft)
        const cropHeight = Math.max(1, cropBottom - cropTop)

        const outputCanvas = document.createElement('canvas')
        outputCanvas.width = cropWidth
        outputCanvas.height = cropHeight
        const outputCtx = outputCanvas.getContext('2d')

        if (!outputCtx) {
          setProcessedSrc(src)
          return
        }

        outputCtx.drawImage(
          image,
          cropLeft,
          cropTop,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        )

        const croppedUrl = outputCanvas.toDataURL('image/png')
        setProcessedSrc(croppedUrl || src)
      } catch {
        setProcessedSrc(src)
      }
    }

    image.onerror = () => {
      if (!cancelled) setProcessedSrc(src)
    }

    image.src = src

    return () => {
      cancelled = true
    }
  }, [src])

  return <img src={processedSrc || src} alt={alt} style={style} className={className} {...rest} />
}
