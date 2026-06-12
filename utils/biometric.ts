type WorkerWithBiometrics = {
  firma_url?: string | null
  url_firma?: string | null
  huella_url?: string | null
}

/**
 * Devuelve la URL de la firma. Prioriza HTTPS (Storage) sobre data URLs
 * porque hay fichas viejas con data URLs corruptos (PNG 3x4 px = punto)
 * en `firma_url` mientras que `url_firma` tiene el archivo real.
 */
export function getSignatureUrl(worker?: WorkerWithBiometrics | null) {
  const a = worker?.firma_url || null
  const b = worker?.url_firma || null
  const isHttp = (s: string | null) => !!s && /^https?:\/\//i.test(s)
  // Si una es HTTP(S) y la otra es data:, prefiere HTTP.
  if (isHttp(b) && !isHttp(a)) return b
  if (isHttp(a) && !isHttp(b)) return a
  return a || b
}

export function normalizeBiometricFields<T extends WorkerWithBiometrics>(worker: T): T & {
  firma_url: string | null
  url_firma: string | null
  huella_url: string | null
} {
  const signature = getSignatureUrl(worker)

  return {
    ...worker,
    firma_url: signature,
    url_firma: signature,
    huella_url: worker.huella_url || null,
  }
}

export function buildBiometricUpdate(
  field: 'firma_url' | 'huella_url',
  value: string | null
) {
  if (field === 'firma_url') {
    return {
      firma_url: value,
      url_firma: value,
    }
  }

  return {
    huella_url: value,
  }
}
