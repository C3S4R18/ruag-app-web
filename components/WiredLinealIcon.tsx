'use client'

import Image from 'next/image'
import { motion, type TargetAndTransition } from 'framer-motion'

const ICON_PATHS = {
  dashboard: '/lordicons/wired-lineal/dashboard-grid-list.svg',
  rrhh: '/lordicons/wired-lineal/briefcase.svg',
  vidaLey: '/lordicons/wired-lineal/documents.svg',
  cesados: '/lordicons/wired-lineal/avatar-minus.svg',
  documentos: '/lordicons/wired-lineal/rules.svg',
  reporte: '/lordicons/wired-lineal/report-refresh.svg',
  upload: '/lordicons/wired-lineal/upload.svg',
  sctr: '/lordicons/wired-lineal/shield.svg',
  biometria: '/lordicons/wired-lineal/fingerprint.svg',
  profile: '/lordicons/wired-lineal/shield-user.svg',
  center: '/lordicons/wired-lineal/documents.svg',
  signature: '/lordicons/wired-lineal/document-sign.svg',
  fingerprint: '/lordicons/wired-lineal/fingerprint.svg',
  chat: '/lordicons/wired-lineal/chat.svg',
  eye: '/lordicons/wired-lineal/eye.svg',
  edit: '/lordicons/wired-lineal/edit.svg',
  download: '/lordicons/wired-lineal/download.svg',
} as const

type IconName = keyof typeof ICON_PATHS
type Variant = 'sidebar' | 'button' | 'chip'

const variants: Record<Variant, { hover: TargetAndTransition; tap: TargetAndTransition }> = {
  sidebar: {
    hover: { y: -1, scale: 1.1, rotate: -4 },
    tap: { scale: 0.95, rotate: 2 },
  },
  button: {
    hover: { y: -1, scale: 1.08, rotate: -6 },
    tap: { scale: 0.94, rotate: 3 },
  },
  chip: {
    hover: { y: -1, scale: 1.06 },
    tap: { scale: 0.96 },
  },
}

export default function WiredLinealIcon({
  name,
  size = 18,
  className = '',
  variant = 'button',
}: {
  name: IconName
  size?: number
  className?: string
  variant?: Variant
}) {
  const motionPreset = variants[variant]

  return (
    <motion.span
      whileHover={motionPreset.hover}
      whileTap={motionPreset.tap}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={ICON_PATHS[name]}
        alt=""
        width={size}
        height={size}
        className="select-none"
        draggable={false}
      />
    </motion.span>
  )
}
