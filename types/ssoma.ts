export interface Cargo {
  id: string
  nombre: string
  descripcion?: string
}

export interface Epp {
  id: string
  nombre: string
  tipo: 'Básico' | 'Específico' | 'Ropa'
  norma_tecnica?: string
}

export interface Riesgo {
  id: string
  peligro: string
  riesgo: string
  medida_control: string
}

export interface SsomaRecord {
  id: string
  ficha_id: string
  cargo_actual: string
  fecha_induccion: string
  check_induccion: boolean
  check_epps: boolean
  check_iperc: boolean
  estado: 'en_proceso' | 'finalizado'
}