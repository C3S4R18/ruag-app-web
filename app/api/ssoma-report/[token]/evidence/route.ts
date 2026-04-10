import { NextResponse } from 'next/server'

import { EVIDENCE_CATEGORY_KEYS } from '@/types/ssoma-report'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

const allowedEvidenceCategories = new Set(EVIDENCE_CATEGORY_KEYS)

function sanitizePathSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function resolveToken(params: Promise<{ token: string }>) {
  const resolved = await params
  return resolved.token
}

async function ensureReportExists(token: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ssoma_reportes_estadisticos')
    .select('id')
    .eq('public_token', token)
    .single()

  if (error || !data) {
    throw new Error('El reporte SSOMA no existe.')
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = createAdminClient()
    const token = await resolveToken(params)
    await ensureReportExists(token)

    const formData = await request.formData()
    const file = formData.get('file')
    const weekKey = String(formData.get('weekKey') || '').trim()
    const category = String(formData.get('category') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Debes adjuntar un archivo valido.' }, { status: 400 })
    }

    if (!weekKey) {
      return NextResponse.json({ error: 'Falta identificar la semana del adjunto.' }, { status: 400 })
    }

    if (!allowedEvidenceCategories.has(category as (typeof EVIDENCE_CATEGORY_KEYS)[number])) {
      return NextResponse.json({ error: 'Categoria de adjunto no valida.' }, { status: 400 })
    }

    const contentType = file.type || 'application/octet-stream'
    if (!(contentType === 'application/pdf' || contentType.startsWith('image/'))) {
      return NextResponse.json({ error: 'Solo se permiten PDF o imagenes.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const safeWeekKey = sanitizePathSegment(weekKey)
    const safeFileName = sanitizePathSegment(file.name || `${category}-${timestamp}`)
    const storagePath = `ssoma-reportes/${token}/${safeWeekKey}/${category}/${timestamp}-${safeFileName}`

    const { error: uploadError } = await supabase.storage.from('documentos').upload(storagePath, file, {
      cacheControl: '3600',
      contentType,
      upsert: true,
    })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('documentos').getPublicUrl(storagePath)

    return NextResponse.json({
      id: crypto.randomUUID(),
      name: file.name,
      url: publicUrl,
      path: storagePath,
      contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      category,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo subir el adjunto SSOMA.' },
      { status: 500 }
    )
  }
}
