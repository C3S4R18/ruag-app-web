import { NextResponse } from 'next/server'

import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ssoma_reportes_estadisticos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo listar los reportes SSOMA.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const publicToken = crypto.randomUUID().replace(/-/g, '')

    const insertPayload = {
      public_token: publicToken,
      title: body.title || `Reporte Estadistico SSOMA ${body.mes_label || ''}`.trim(),
      obra_proyecto: body.obra_proyecto || body.data?.obraProyecto || null,
      empresa: body.empresa || body.data?.empresa || null,
      mes_label: body.mes_label || body.data?.monthLabel || null,
      assigned_to: body.assigned_to || null,
      assigned_email: body.assigned_email || null,
      respondent_name: body.respondent_name || null,
      respondent_email: body.respondent_email || null,
      status: body.status || 'draft',
      created_by: body.created_by || null,
      data: body.data || {},
    }

    const { data, error } = await supabase
      .from('ssoma_reportes_estadisticos')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo crear el reporte SSOMA.' },
      { status: 500 }
    )
  }
}
