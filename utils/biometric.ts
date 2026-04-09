type WorkerWithBiometrics = {
  firma_url?: string | null
  url_firma?: string | null
  huella_url?: string | null
}

export function getSignatureUrl(worker?: WorkerWithBiometrics | null) {
  return worker?.firma_url || worker?.url_firma || null
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
