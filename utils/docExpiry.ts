/* ──────────────────────────────────────────────────────────────────────
 *  Utilidades de vigencia de documentos (RETCC + Antecedentes)
 *  Compartido entre el portal del obrero y el dashboard admin.
 * ──────────────────────────────────────────────────────────────────── */

export type ExpiryLevel = 'sin_fecha' | 'vigente' | 'por_vencer' | 'vencido'

export interface ExpiryInfo {
    level: ExpiryLevel
    days: number | null          // días hasta vencer (negativo si ya venció)
    date: string | null          // fecha de caducidad ISO
    label: string                // texto corto para UI
    detail: string               // texto más largo
}

// Umbral (días) para empezar a avisar "por vencer".
export const EXPIRY_THRESHOLDS = {
    retcc: 30,          // RETCC: avisa 30 días antes
    antecedentes: 15,   // Antecedentes (vigencia 3 meses): avisa 15 días antes
    dni: 60,            // DNI: avisa 60 días antes (renovación toma tiempo)
    examen_medico: 30,  // Examen médico ocupacional (vigencia ~1 año): avisa 30 días antes
} as const

export type DocKind = keyof typeof EXPIRY_THRESHOLDS

const DOC_TITLES: Record<DocKind, string> = {
    retcc: 'Carnet RETCC',
    antecedentes: 'Antecedentes',
    dni: 'DNI',
    examen_medico: 'Examen Médico',
}

/**
 * Parsea una fecha como fecha de calendario LOCAL (sin desfase de zona horaria).
 * `new Date("2026-11-25")` se interpreta como medianoche UTC y, al mostrarse en
 * husos negativos (p. ej. Perú UTC-5), retrocede un día. Aquí evitamos ese salto.
 */
function parseLocalDate(iso: string): Date {
    const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) {
        const [, y, mo, d] = m
        return new Date(Number(y), Number(mo) - 1, Number(d))
    }
    return new Date(iso)
}

function startOfToday(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

function diffDays(target: Date): number {
    const today = startOfToday()
    const t = new Date(target)
    t.setHours(0, 0, 0, 0)
    return Math.round((t.getTime() - today.getTime()) / 86_400_000)
}

/** Convierte días en un texto humano: "3 meses", "12 días", etc. */
export function humanizeDays(days: number): string {
    const abs = Math.abs(days)
    if (abs >= 60) return `${Math.round(abs / 30)} meses`
    if (abs >= 30) {
        const months = Math.floor(abs / 30)
        const rest = abs % 30
        return rest > 0 ? `${months} mes${months > 1 ? 'es' : ''} y ${rest} d.` : `${months} mes${months > 1 ? 'es' : ''}`
    }
    return `${abs} día${abs === 1 ? '' : 's'}`
}

/** Calcula el estado de vigencia de un documento dado su fecha de caducidad ISO. */
export function getExpiryInfo(caducidadIso: string | null | undefined, kind: DocKind): ExpiryInfo {
    const title = DOC_TITLES[kind]
    if (!caducidadIso) {
        return {
            level: 'sin_fecha',
            days: null,
            date: null,
            label: 'Sin fecha',
            detail: `${title}: aún sin fecha de vencimiento detectada.`,
        }
    }
    const date = parseLocalDate(caducidadIso)
    if (isNaN(date.getTime())) {
        return { level: 'sin_fecha', days: null, date: null, label: 'Sin fecha', detail: `${title}: fecha no válida.` }
    }
    const days = diffDays(date)
    const threshold = EXPIRY_THRESHOLDS[kind]

    if (days < 0) {
        return {
            level: 'vencido',
            days,
            date: caducidadIso,
            label: `Vencido hace ${humanizeDays(days)}`,
            detail: `${title} venció el ${formatDate(caducidadIso)}. Debe renovarse.`,
        }
    }
    if (days <= threshold) {
        return {
            level: 'por_vencer',
            days,
            date: caducidadIso,
            label: days === 0 ? 'Vence hoy' : `Vence en ${humanizeDays(days)}`,
            detail: `${title} vence el ${formatDate(caducidadIso)} (${humanizeDays(days)}). Conviene renovarlo pronto.`,
        }
    }
    return {
        level: 'vigente',
        days,
        date: caducidadIso,
        label: `Vigente`,
        detail: `${title} vigente hasta el ${formatDate(caducidadIso)}.`,
    }
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    const d = parseLocalDate(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Dispara la extracción IA y devuelve las fechas. No lanza si falla. */
export async function extractDocDates(
    imageUrl: string,
    docType: DocKind,
): Promise<{ fecha_emision: string | null; fecha_caducidad: string | null; fecha_inscripcion: string | null } | null> {
    try {
        const res = await fetch('/api/extract-doc-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, docType }),
        })
        const json = await res.json()
        if (!json?.ok) return null
        return {
            fecha_emision: json.fecha_emision ?? null,
            fecha_caducidad: json.fecha_caducidad ?? null,
            fecha_inscripcion: json.fecha_inscripcion ?? null,
        }
    } catch {
        return null
    }
}
