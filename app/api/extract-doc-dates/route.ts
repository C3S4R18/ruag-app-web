import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const GEMINI_MODEL = 'gemini-2.5-flash'

type DocType = 'retcc' | 'antecedentes' | 'dni'

function buildPrompt(docType: DocType): string {
    if (docType === 'dni') {
        return `Eres un extractor de datos de documentos peruanos. La imagen/PDF es un "DNI" (Documento Nacional de Identidad) peruano, frontal y/o reverso.
Extrae EXCLUSIVAMENTE la fecha de caducidad del documento.

Fuentes para obtener la fecha de caducidad (en orden de prioridad):
1. La ZONA DE LECTURA MECÁNICA (MRZ): son las 3 líneas de caracteres con "<<<" en la parte inferior del DNI. En la SEGUNDA línea de la MRZ el patrón es: 6 dígitos de fecha de nacimiento (YYMMDD) + 1 dígito verificador + sexo (M o F) + 6 dígitos de FECHA DE CADUCIDAD (YYMMDD) + 1 dígito verificador + "PER". Ejemplo: "0309183M2811257PER" → tras el sexo "M" vienen "281125" = año 2028, mes 11, día 25 → caducidad 2028-11-25. La MRZ es la fuente MÁS CONFIABLE; úsala aunque la fecha impresa esté borrosa, tapada por un sello o poco legible.
2. La fecha impresa rotulada como "Fecha de Caducidad", "Fecha de Vencimiento", "Caducidad" o "Válido hasta".

Cruza ambas fuentes; si difieren, confía en la MRZ. Para el año YY de la MRZ asume el siglo 20YY (p. ej. 28 → 2028).
Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"fecha_caducidad":"YYYY-MM-DD"}
Convierte cualquier formato de fecha (dd/mm/yyyy, "19 06 2026", "Junio 19, 2026", YYMMDD, etc.) a ISO YYYY-MM-DD.
Si la fecha de caducidad no se ve o no existe en ninguna fuente, usa null en ese campo.`
    }
    if (docType === 'retcc') {
        return `Eres un extractor de datos de documentos peruanos. La imagen es un "Carnet RETCC" (Registro Nacional de Trabajadores de Construcción Civil).
Extrae EXCLUSIVAMENTE estas fechas que aparecen impresas en el documento:
- "Fecha de Inscripción"
- "Fecha de Caducidad" (la más importante)
Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"fecha_inscripcion":"YYYY-MM-DD","fecha_caducidad":"YYYY-MM-DD"}
Convierte cualquier formato de fecha (dd/mm/yyyy, "Junio 19, 2026", etc.) a ISO YYYY-MM-DD.
Si una fecha no se ve o no existe, usa null en ese campo.`
    }
    // antecedentes
    return `Eres un extractor de datos de documentos peruanos. La imagen es un "Certificado de Antecedentes" / "Certiadulto" / certificado único laboral.
Extrae EXCLUSIVAMENTE estas fechas impresas:
- "Fecha de emisión"
- "Fecha de caducidad" (la más importante; suele tener vigencia de 3 meses)
Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"fecha_emision":"YYYY-MM-DD","fecha_caducidad":"YYYY-MM-DD"}
Convierte cualquier formato de fecha (dd/mm/yyyy, "Marzo 19, 2026 09:34", etc.) a ISO YYYY-MM-DD.
Si una fecha no se ve o no existe, usa null en ese campo.`
}

/** Descarga la imagen y la convierte a base64 + mime. */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mime: string }> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status})`)
    const mime = res.headers.get('content-type') || 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    return { data: buf.toString('base64'), mime }
}

/** Saca el primer objeto JSON de un string (por si el modelo mete texto extra). */
function parseJsonLoose(text: string): any {
    try {
        return JSON.parse(text)
    } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
            try { return JSON.parse(match[0]) } catch { /* noop */ }
        }
    }
    return {}
}

/** Normaliza cualquier fecha a ISO YYYY-MM-DD o null. */
function toIso(value: any): string | null {
    if (!value || typeof value !== 'string') return null
    const v = value.trim()
    if (!v || v.toLowerCase() === 'null') return null
    // Ya viene ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
    // dd/mm/yyyy o dd-mm-yyyy
    const m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
    if (m) {
        const [, d, mo, y] = m
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    const parsed = new Date(v)
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10)
    }
    return null
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { ok: false, error: 'Falta GEMINI_API_KEY en el servidor.' },
                { status: 500 },
            )
        }

        const { imageUrl, docType } = (await req.json()) as { imageUrl?: string; docType?: DocType }
        if (!imageUrl || (docType !== 'retcc' && docType !== 'antecedentes' && docType !== 'dni')) {
            return NextResponse.json(
                { ok: false, error: 'Parámetros inválidos (imageUrl, docType).' },
                { status: 400 },
            )
        }

        const { data, mime } = await fetchImageAsBase64(imageUrl)

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: buildPrompt(docType) },
                                { inline_data: { mime_type: mime, data } },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: 'application/json',
                    },
                }),
            },
        )

        if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            return NextResponse.json(
                { ok: false, error: `Gemini error ${geminiRes.status}`, detail: errText },
                { status: 502 },
            )
        }

        const json = await geminiRes.json()
        const text: string =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const parsed = parseJsonLoose(text)

        const result = {
            ok: true,
            docType,
            fecha_emision: toIso(parsed.fecha_emision),
            fecha_caducidad: toIso(parsed.fecha_caducidad),
            fecha_inscripcion: toIso(parsed.fecha_inscripcion),
            raw: parsed,
            extracted_at: new Date().toISOString(),
        }

        return NextResponse.json(result)
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message ?? 'Error desconocido' },
            { status: 500 },
        )
    }
}
