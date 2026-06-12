'use client'

import type { ImgHTMLAttributes } from 'react'

type NormalizedSignatureImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
}

/**
 * Renderiza la firma sin procesarla. Antes hacíamos auto-crop por bbox de
 * píxeles visibles, pero fallaba con firmas chicas o anti-aliased agresivo
 * (bbox colapsada a 1-5px → imagen mostrada como punto). El frontend móvil
 * y el portal del obrero ya renderizan la firma directamente sin issues, así
 * que el admin hace lo mismo. Si en el futuro queremos recortar, hacerlo en
 * el servidor al subir (no en cliente con canvas + CORS).
 */
export default function NormalizedSignatureImage({
  src,
  alt,
  style,
  className,
  ...rest
}: NormalizedSignatureImageProps) {
  return <img src={src} alt={alt} style={style} className={className} {...rest} />
}
