import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ── Mapa de plantillas + campos ────────────────────────────────────
// Coordenadas en puntos PDF (origen ABAJO-IZQUIERDA). y = altura - distancia_desde_arriba.
// Cada doc define su archivo y los campos a dibujar.
type FieldType = 'text' | 'signature' | 'fingerprint'
type Field = {
  key: string            // qué dato pintar
  x: number
  y: number              // desde ABAJO
  size?: number
  bold?: boolean
  maxW?: number
  align?: 'left' | 'center'
  type?: FieldType
}
type DocDef = { file: string; w: number; h: number; fields: Field[] }

const DOCS: Record<string, DocDef> = {
  // CARGO RISST — A4 596x842
  risst: {
    file: 'risst.pdf', w: 596, h: 842,
    fields: [
      { key: 'lugar',   x: 190, y: 528, size: 10, bold: true },
      { key: 'fecha',   x: 470, y: 528, size: 10, bold: true },
      { key: 'nombre',  x: 95,  y: 297, size: 11, bold: true },
      { key: 'dni',     x: 95,  y: 253, size: 11, bold: true },
      { key: 'firma',   x: 150, y: 192, type: 'signature', maxW: 180, size: 42 },
      { key: 'huella',  x: 360, y: 100, type: 'fingerprint', maxW: 80, size: 88 },
    ],
  },
}

function dmy(raw?: string | null): string {
  const d = raw ? new Date(raw) : new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function fullName(f: any): string {
  return [f?.nombres, f?.apellido_paterno, f?.apellido_materno].filter(Boolean).join(' ').trim().toUpperCase()
}

async function imgBytes(url?: string | null): Promise<{ bytes: Uint8Array; png: boolean } | null> {
  if (!url) return null
  try {
    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1] || ''
      const bin = Buffer.from(base64, 'base64')
      return { bytes: new Uint8Array(bin), png: url.includes('image/png') || !url.includes('image/jpeg') }
    }
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    const png = url.toLowerCase().includes('.png') || (res.headers.get('content-type') || '').includes('png')
    return { bytes: buf, png }
  } catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    const docType = req.nextUrl.searchParams.get('doc') || ''
    const id = req.nextUrl.searchParams.get('id') || ''
    const def = DOCS[docType]
    if (!def) return NextResponse.json({ error: 'docType inválido o no implementado aún' }, { status: 400 })
    if (!id) return NextResponse.json({ error: 'falta id' }, { status: 400 })

    const { data: ficha } = await supabaseAdmin.from('fichas').select('*').eq('id', id).maybeSingle()
    if (!ficha) return NextResponse.json({ error: 'ficha no encontrada' }, { status: 404 })

    const values: Record<string, string> = {
      nombre: fullName(ficha),
      dni: ficha.dni || '',
      lugar: (ficha.nombre_obra || 'OFICINA CENTRAL').toUpperCase(),
      fecha: dmy(ficha.firma_fecha || ficha.ssoma_updated_at || ficha.updated_at),
      cargo: (ficha.cargo || '').toUpperCase(),
      obra: (ficha.nombre_obra || '').toUpperCase(),
    }
    const firmaUrl = ficha.firma_url || ficha.url_firma
    const huellaUrl = ficha.huella_url || ficha.url_huella

    const tplPath = path.join(process.cwd(), 'public', 'doc-templates', def.file)
    const tplBytes = await fs.readFile(tplPath)
    const pdf = await PDFDocument.load(tplBytes)
    const page = pdf.getPages()[0]
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    for (const fld of def.fields) {
      if (fld.type === 'signature' || fld.type === 'fingerprint') {
        const src = fld.type === 'signature' ? firmaUrl : huellaUrl
        const img = await imgBytes(src)
        if (!img) continue
        try {
          const embedded = img.png ? await pdf.embedPng(img.bytes) : await pdf.embedJpg(img.bytes)
          const maxW = fld.maxW || 120
          const maxH = fld.size || 50
          const scale = Math.min(maxW / embedded.width, maxH / embedded.height)
          const w = embedded.width * scale
          const h = embedded.height * scale
          page.drawImage(embedded, { x: fld.x, y: fld.y, width: w, height: h })
        } catch { /* img no embebible */ }
        continue
      }
      const text = values[fld.key] || ''
      if (!text) continue
      const f = fld.bold ? fontBold : font
      const size = fld.size || 10
      let x = fld.x
      if (fld.align === 'center' && fld.maxW) {
        const tw = f.widthOfTextAtSize(text, size)
        x = fld.x + (fld.maxW - tw) / 2
      }
      page.drawText(text, { x, y: fld.y, size, font: f, color: rgb(0, 0, 0) })
    }

    const out = await pdf.save()
    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${docType}_${ficha.dni || id}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
