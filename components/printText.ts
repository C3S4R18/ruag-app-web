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
