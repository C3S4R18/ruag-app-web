import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// Dominio de los correos FALSOS generados por el importador T-REGISTRO
// ({dni}@ruag.sistema). Sólo desde uno de estos se permite cambiar el
// correo SIN verificación (porque el correo del sistema no existe y nunca
// podría confirmarse). Un correo real conserva el flujo verificado normal.
const FAKE_EMAIL_DOMAIN = '@ruag.sistema'

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verifica el JWT del obrero → obtiene su usuario.
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const newEmail = String(body?.newEmail || '').trim().toLowerCase()
    const password = body?.password ? String(body.password) : undefined

    if (!isValidEmail(newEmail)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const currentEmail = (user.email || '').toLowerCase()

    // Sólo se salta la verificación cuando el correo ACTUAL es del sistema.
    const isSystemEmail = currentEmail.endsWith(FAKE_EMAIL_DOMAIN)
    if (!isSystemEmail) {
      return NextResponse.json({
        error: 'Tu correo ya es real. Cámbialo con verificación desde el flujo normal.',
        code: 'not_system_email',
      }, { status: 403 })
    }

    // Evita chocar con otro usuario que ya tenga ese correo real.
    if (newEmail !== currentEmail) {
      const { data: dupe } = await supabaseAdmin
        .from('fichas')
        .select('user_id')
        .eq('correo', newEmail)
        .neq('user_id', user.id)
        .maybeSingle()
      if (dupe) {
        return NextResponse.json({ error: 'Ese correo ya está registrado por otro trabajador.' }, { status: 409 })
      }
    }

    // Cambio SIN verificación: email_confirm marca el correo como confirmado.
    const updates: any = { email: newEmail, email_confirm: true }
    if (password) updates.password = password

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, updates)
    if (updErr) {
      return NextResponse.json({ error: updErr.message || 'No se pudo actualizar el correo' }, { status: 500 })
    }

    // Refleja el correo real en la ficha del trabajador.
    await supabaseAdmin.from('fichas').update({ correo: newEmail }).eq('user_id', user.id)

    return NextResponse.json({ ok: true, email: newEmail })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
