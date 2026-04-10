import { NextResponse } from 'next/server'

import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

async function resolveToken(params: Promise<{ token: string }>) {
  const resolved = await params
  return resolved.token
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = createAdminClient()
    const token = await resolveToken(params)

    const { data, error } = await supabase
      .from('ssoma_reportes_estadisticos')
      .select('*')
      .eq('public_token', token)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo obtener el reporte SSOMA.' },
      { status: 404 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = createAdminClient()
    const token = await resolveToken(params)
    const body = await request.json()
    const allowedStatuses = new Set(['draft', 'in_review', 'approved', 'rejected'])

    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.obra_proyecto !== undefined) updates.obra_proyecto = body.obra_proyecto
    if (body.empresa !== undefined) updates.empresa = body.empresa
    if (body.mes_label !== undefined) updates.mes_label = body.mes_label
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to
    if (body.assigned_email !== undefined) updates.assigned_email = body.assigned_email
    if (body.respondent_name !== undefined) updates.respondent_name = body.respondent_name
    if (body.respondent_email !== undefined) updates.respondent_email = body.respondent_email
    if (body.reviewed_by !== undefined) updates.reviewed_by = body.reviewed_by
    if (body.review_notes !== undefined) updates.review_notes = body.review_notes
    if (body.data !== undefined) updates.data = body.data
    if (body.status !== undefined) {
      if (!allowedStatuses.has(body.status)) {
        return NextResponse.json({ error: 'Estado de reporte no valido.' }, { status: 400 })
      }

      updates.status = body.status
    }

    if (body.status === 'in_review') {
      updates.submitted_at = new Date().toISOString()
    }

    if (body.status === 'approved' || body.status === 'rejected') {
      updates.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('ssoma_reportes_estadisticos')
      .update(updates)
      .eq('public_token', token)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo actualizar el reporte SSOMA.' },
      { status: 500 }
    )
  }
}
