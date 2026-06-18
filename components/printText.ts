export function toPrintUppercase(value?: string | null) {
  return (value || '').trim().toUpperCase()
}

export function buildWorkerFullNameUpper(ficha: any) {
  return [ficha?.nombres, ficha?.apellido_paterno, ficha?.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toUpperCase()
}

export function buildWorkerLastNamesFirstUpper(ficha: any) {
  return [ficha?.apellido_paterno, ficha?.apellido_materno, ficha?.nombres]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toUpperCase()
}

export function getPrintObra(ficha: any, fallback = 'OBRA CENTRAL') {
  return toPrintUppercase(ficha?.nombre_obra) || fallback
}

/**
 * Fecha en que el trabajador FIRMÓ (no la de hoy). Prioriza firma_fecha,
 * luego ssoma_updated_at, luego updated_at. Devuelve dd/mm/yyyy.
 * Si no hay ninguna, cae a hoy como último recurso.
 */
export function getSignatureDate(ficha: any): string {
  const raw = ficha?.firma_fecha || ficha?.ssoma_updated_at || ficha?.updated_at
  const d = raw ? new Date(raw) : new Date()
  if (isNaN(d.getTime())) return formatDmy(new Date())
  return formatDmy(d)
}

function formatDmy(d: Date): string {
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
