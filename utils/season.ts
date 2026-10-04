/**
 * Temporadas visuales — la identidad cambia sola según el mes.
 *
 *   Octubre → Halloween
 *   El resto → diseño normal
 *
 * Nadie tiene que acordarse de revertirlo: el 1 de noviembre la web
 * vuelve sola al diseño de siempre porque se calcula por fecha.
 */
export type Season = 'normal' | 'halloween'

export function getSeason(date: Date = new Date()): Season {
  return date.getMonth() === 9 ? 'halloween' : 'normal' // getMonth: 0 = enero
}

export function isHalloween(date: Date = new Date()): boolean {
  return getSeason(date) === 'halloween'
}
