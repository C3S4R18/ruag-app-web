import type { MetadataRoute } from 'next'

/** Permite instalar la web como app (iPhone: Compartir → Agregar a inicio). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RUAG Digital',
    short_name: 'RUAG',
    description: 'Portal del trabajador RUAG',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
