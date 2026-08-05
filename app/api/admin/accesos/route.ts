import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cifrarPassword, descifrarPassword, credencialesDisponibles } from '@/utils/credenciales'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/** Correos falsos del importador T-REGISTRO: no existe bandeja real. */
const FAKE_EMAIL_DOMAIN = '@ruag.sistema'

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

/** Verifica que quien llama tenga sesión válida y role = 'admin'. */
async function requireAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'No autenticado', status: 401 as const }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  const user = data?.user
  if (error || !user) return { error: 'Sesión inválida', status: 401 as const }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, nombres, apellido_paterno')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return { error: 'Solo administradores', status: 403 as const }

  const nombre = [profile?.nombres, profile?.apellido_paterno].filter(Boolean).join(' ') || user.email || 'Admin'
  return { user, nombre }
}

/**
 * Guarda cifrada la contraseña que acaba de fijar el admin, para poder
 * mostrársela después sin tener que restablecerla otra vez.
 * Si no hay CREDENTIALS_SECRET configurado, no guarda nada y sigue de largo.
 */
async function guardarCredencial(
  userId: string,
  password: string,
  email: string | null,
  adminId: string,
  adminNombre: string,
) {
  const cifrado = cifrarPassword(password)
  if (!cifrado) return

  await supabaseAdmin.from('credenciales_admin').upsert({
    user_id: userId,
    iv: cifrado.iv,
    tag: cifrado.tag,
    secreto: cifrado.secreto,
    email,
    creada_por: adminId,
    creada_por_nombre: adminNombre,
    fijada_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

/** Contraseña temporal legible: fácil de dictar por teléfono, sin caracteres ambiguos. */
function generateTempPassword(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sin I ni O
  const numeros = '23456789'                // sin 0 ni 1
  let out = 'Ruag'
  for (let i = 0; i < 3; i++) out += letras[Math.floor(Math.random() * letras.length)]
  for (let i = 0; i < 3; i++) out += numeros[Math.floor(Math.random() * numeros.length)]
  return out
}

/**
 * GET — directorio de accesos.
 * Cruza auth.users (correo, confirmación, último ingreso) con profiles.
 * NUNCA devuelve contraseñas: Supabase sólo guarda el hash bcrypt y no
 * existe forma de leer la original. Para eso está el POST de reset.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    // auth.admin.listUsers pagina; recorremos hasta agotar.
    const usuarios: any[] = []
    const perPage = 200
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      usuarios.push(...(data?.users || []))
      if (!data?.users?.length || data.users.length < perPage) break
    }

    const { data: perfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, nombres, apellido_paterno, apellido_materno, dni, role, tipo_personal')

    const porId = new Map((perfiles || []).map(p => [p.id, p]))

    const { data: fichas } = await supabaseAdmin
      .from('fichas')
      .select('user_id, estado, es_cesado, nombre_obra')

    const fichaPorUser = new Map((fichas || []).map(f => [f.user_id, f]))

    // Qué cuentas tienen contraseña guardada por el admin (sólo el hecho,
    // nunca el valor: para verlo hay que pedir action:'reveal').
    const { data: credenciales } = await supabaseAdmin
      .from('credenciales_admin')
      .select('user_id, fijada_at')
    const credPorUser = new Map((credenciales || []).map(c => [c.user_id, c]))

    const filas = usuarios.map(u => {
      const p: any = porId.get(u.id)
      const f: any = fichaPorUser.get(u.id)
      const email = (u.email || '').toLowerCase()
      return {
        id: u.id,
        email,
        correo_real: !!email && !email.endsWith(FAKE_EMAIL_DOMAIN),
        nombre: [p?.nombres, p?.apellido_paterno, p?.apellido_materno].filter(Boolean).join(' ') || '—',
        dni: p?.dni || '',
        role: p?.role || 'obrero',
        tipo_personal: p?.tipo_personal || 'obrero',
        confirmado: !!u.email_confirmed_at,
        ultimo_acceso: u.last_sign_in_at || null,
        creado: u.created_at || null,
        tiene_ficha: !!f,
        estado_ficha: f?.estado || null,
        es_cesado: !!f?.es_cesado,
        obra: f?.nombre_obra || null,
        tiene_credencial: credPorUser.has(u.id),
      }
    })

    filas.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return NextResponse.json({ usuarios: filas })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al listar accesos' }, { status: 500 })
  }
}

/**
 * POST — acciones sobre un acceso.
 *   { action: 'reset', userId, password? }  → asigna contraseña nueva y la devuelve UNA vez
 *   { action: 'confirm', userId }           → marca el correo como confirmado
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || '')
  const userId = String(body?.userId || '')

  /**
   * Alta de cuenta hecha por el administrador. Crea el usuario ya confirmado
   * (no espera correo de verificación), su profile y su ficha base, y devuelve
   * las credenciales UNA vez para que el admin se las pase al trabajador.
   */
  if (action === 'create') {
    const nombres = String(body?.nombres || '').trim()
    const apPaterno = String(body?.apellido_paterno || '').trim()
    const apMaterno = String(body?.apellido_materno || '').trim()
    const dni = String(body?.dni || '').trim().toUpperCase()
    const telefono = String(body?.telefono || '').trim()
    const tipoPersonal = String(body?.tipo_personal || 'obrero')
    const tipoDocumento = String(body?.tipo_documento || 'DNI').toUpperCase() === 'CE' ? 'CE' : 'DNI'
    const emailInput = String(body?.email || '').trim().toLowerCase()
    const passInput = body?.password ? String(body.password) : ''

    if (!nombres || !apPaterno) {
      return NextResponse.json({ error: 'Nombres y apellido paterno son obligatorios' }, { status: 400 })
    }
    // Mismas reglas que usan la app Android y el portal del obrero.
    if (tipoDocumento === 'DNI' && !/^\d{8,12}$/.test(dni)) {
      return NextResponse.json({ error: 'El DNI debe tener entre 8 y 12 dígitos' }, { status: 400 })
    }
    if (tipoDocumento === 'CE' && (dni.length < 6 || !/^[A-Z0-9]+$/.test(dni))) {
      return NextResponse.json({
        error: 'El Carnet de Extranjería debe tener al menos 6 caracteres (letras o números)',
      }, { status: 400 })
    }
    if (emailInput && !isValidEmail(emailInput)) {
      return NextResponse.json({ error: 'El correo no tiene un formato válido' }, { status: 400 })
    }
    if (passInput && passInput.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    if (!['obrero', 'staff', 'arug', 'cg'].includes(tipoPersonal)) {
      return NextResponse.json({ error: 'Tipo de personal inválido' }, { status: 400 })
    }

    // El DNI es único en profiles: avisamos antes de crear nada en auth.
    const { data: dniExistente } = await supabaseAdmin
      .from('profiles').select('id').eq('dni', dni).maybeSingle()
    if (dniExistente) {
      return NextResponse.json({ error: 'Ese DNI ya tiene una cuenta registrada' }, { status: 409 })
    }

    // Sin correo real usamos la convención del importador: {dni}@ruag.sistema
    const email = emailInput || `${dni}${FAKE_EMAIL_DOMAIN}`
    const password = passInput || generateTempPassword()
    const fullName = [nombres, apPaterno, apMaterno].filter(Boolean).join(' ')

    try {
      const { data: creado, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombres, apellido_paterno: apPaterno, apellido_materno: apMaterno,
          full_name: fullName, dni, telefono, role: 'obrero',
        },
      })
      if (createErr) throw createErr

      const nuevoId = creado?.user?.id
      if (!nuevoId) throw new Error('No se recibió el id del usuario creado')

      // profiles primero: fichas.user_id apunta a profiles(id).
      // El trigger handle_new_user ya pudo crear la fila; upsert la completa.
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: nuevoId,
        nombres, apellido_paterno: apPaterno, apellido_materno: apMaterno,
        dni, telefono, role: 'obrero', tipo_personal: tipoPersonal,
      }, { onConflict: 'id' })
      if (profErr) throw profErr

      const fichaBase: Record<string, any> = {
        user_id: nuevoId,
        dni, nombres, apellido_paterno: apPaterno, apellido_materno: apMaterno,
        celular: telefono, correo: email, tipo_personal: tipoPersonal,
      }

      let { error: fichaErr } = await supabaseAdmin
        .from('fichas')
        .upsert({ ...fichaBase, tipo_documento: tipoDocumento }, { onConflict: 'user_id' })

      // Si aún no se corrió la migración de tipo_documento, guardamos sin esa
      // columna en vez de dejar la cuenta a medias.
      if (fichaErr && /tipo_documento/i.test(fichaErr.message)) {
        const retry = await supabaseAdmin
          .from('fichas')
          .upsert(fichaBase, { onConflict: 'user_id' })
        fichaErr = retry.error
      }
      if (fichaErr) throw fichaErr

      await guardarCredencial(nuevoId, password, email, guard.user.id, guard.nombre)

      return NextResponse.json({
        ok: true,
        email,
        password,
        nombre: fullName,
        correo_real: !email.endsWith(FAKE_EMAIL_DOMAIN),
        guardada: credencialesDisponibles(),
      })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        return NextResponse.json({ error: 'Ese correo ya tiene una cuenta registrada' }, { status: 409 })
      }
      return NextResponse.json({ error: msg || 'No se pudo crear la cuenta' }, { status: 500 })
    }
  }

  if (!userId) return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 })

  try {
    if (action === 'reset') {
      const manual = body?.password ? String(body.password) : ''
      if (manual && manual.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      const password = manual || generateTempPassword()

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (error) throw error

      const email = data?.user?.email || null
      await guardarCredencial(userId, password, email, guard.user.id, guard.nombre)

      return NextResponse.json({
        ok: true,
        password,
        email,
        guardada: credencialesDisponibles(),
      })
    }

    /**
     * Muestra de nuevo la contraseña que fijó el admin.
     * Avisa si el trabajador la cambió después por su cuenta: en ese caso la
     * guardada ya no sirve y hay que generar una nueva.
     */
    if (action === 'reveal') {
      if (!credencialesDisponibles()) {
        return NextResponse.json({
          error: 'Falta configurar CREDENTIALS_SECRET en el servidor.',
        }, { status: 503 })
      }

      const { data: fila } = await supabaseAdmin
        .from('credenciales_admin')
        .select('iv, tag, secreto, email, creada_por_nombre, fijada_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (!fila) {
        return NextResponse.json({
          error: 'No hay contraseña guardada para esta cuenta. Genera una nueva.',
          code: 'sin_credencial',
        }, { status: 404 })
      }

      const password = descifrarPassword(fila)
      if (!password) {
        return NextResponse.json({
          error: 'No se pudo descifrar: la llave CREDENTIALS_SECRET cambió desde que se guardó.',
        }, { status: 500 })
      }

      // Si auth.users se actualizó después de que el admin la fijó, lo más
      // probable es que el trabajador la haya cambiado desde la app.
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      const actualizado = authUser?.user?.updated_at ? new Date(authUser.user.updated_at) : null
      const fijada = new Date(fila.fijada_at)
      const posibleCambio = !!actualizado && actualizado.getTime() - fijada.getTime() > 60_000

      return NextResponse.json({
        ok: true,
        password,
        email: authUser?.user?.email || fila.email,
        fijada_at: fila.fijada_at,
        creada_por_nombre: fila.creada_por_nombre,
        posible_cambio: posibleCambio,
      })
    }

    /**
     * Edita el acceso: cambia el correo, la contraseña, o ambos.
     * A diferencia de 'reset', aquí el admin decide el valor exacto.
     */
    if (action === 'update') {
      const nuevoEmail = String(body?.email || '').trim().toLowerCase()
      const nuevaPass = body?.password ? String(body.password) : ''

      if (!nuevoEmail && !nuevaPass) {
        return NextResponse.json({ error: 'No hay nada que cambiar' }, { status: 400 })
      }
      if (nuevoEmail && !isValidEmail(nuevoEmail)) {
        return NextResponse.json({ error: 'El correo no tiene un formato válido' }, { status: 400 })
      }
      if (nuevaPass && nuevaPass.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }

      const cambios: Record<string, any> = { email_confirm: true }
      if (nuevoEmail) cambios.email = nuevoEmail
      if (nuevaPass) cambios.password = nuevaPass

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, cambios)
      if (error) {
        const msg = String(error.message || '')
        if (/already/i.test(msg)) {
          return NextResponse.json({ error: 'Ese correo ya está en uso por otra cuenta' }, { status: 409 })
        }
        throw error
      }

      const emailFinal = data?.user?.email || nuevoEmail || null

      // La ficha guarda su propia copia del correo: la mantenemos alineada.
      if (nuevoEmail) {
        await supabaseAdmin.from('fichas').update({ correo: nuevoEmail }).eq('user_id', userId)
        await supabaseAdmin.from('credenciales_admin').update({ email: nuevoEmail }).eq('user_id', userId)
      }

      if (nuevaPass) {
        await guardarCredencial(userId, nuevaPass, emailFinal, guard.user.id, guard.nombre)
      }

      return NextResponse.json({
        ok: true,
        email: emailFinal,
        password: nuevaPass || null,
        guardada: !!nuevaPass && credencialesDisponibles(),
      })
    }

    if (action === 'confirm') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    /**
     * Borrado DEFINITIVO de una cuenta (para registros de prueba o gente
     * ajena a la empresa). Es irreversible: elimina el usuario de auth.
     *
     * Salvaguardas:
     *   - Nunca se puede borrar la propia cuenta del admin que llama.
     *   - Nunca se puede borrar a otro admin.
     *   - Si tiene ficha, se exige force=true y la ficha se copia a la
     *     papelera antes de irse (el trabajador se pierde, la data no).
     */
    if (action === 'delete') {
      if (userId === guard.user.id) {
        return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
      }

      const { data: perfil } = await supabaseAdmin
        .from('profiles')
        .select('role, nombres, apellido_paterno, apellido_materno, dni')
        .eq('id', userId)
        .maybeSingle()

      if (perfil?.role === 'admin') {
        return NextResponse.json({
          error: 'Esa cuenta es de un administrador. Quítale el rol admin antes de eliminarla.',
        }, { status: 403 })
      }

      const { data: fichas } = await supabaseAdmin
        .from('fichas')
        .select('*')
        .eq('user_id', userId)

      const force = body?.force === true

      if (fichas?.length && !force) {
        return NextResponse.json({
          error: 'Esta cuenta tiene una ficha con datos del trabajador.',
          code: 'tiene_ficha',
          ficha: {
            estado: fichas[0].estado,
            nombre: [fichas[0].nombres, fichas[0].apellido_paterno].filter(Boolean).join(' '),
          },
        }, { status: 409 })
      }

      // Copia de las fichas a la papelera antes de borrarlas.
      if (fichas?.length) {
        const { error: papErr } = await supabaseAdmin.from('fichas_papelera').insert(
          fichas.map((f: any) => ({
            ficha_id: f.id,
            user_id: f.user_id,
            dni: f.dni,
            nombre_completo: [f.nombres, f.apellido_paterno, f.apellido_materno].filter(Boolean).join(' '),
            snapshot: f,
            eliminado_por: guard.user.id,
            eliminado_por_nombre: guard.nombre,
            motivo: 'Cuenta eliminada definitivamente desde Accesos',
          }))
        )
        if (papErr) {
          return NextResponse.json({
            error: 'No se pudo respaldar la ficha en la papelera: ' + papErr.message,
          }, { status: 500 })
        }
        const { error: delFichaErr } = await supabaseAdmin.from('fichas').delete().eq('user_id', userId)
        if (delFichaErr) throw delFichaErr
      }

      // Orden explícito: ficha → credencial → profile → auth. Así no
      // dependemos de que las llaves foráneas tengan ON DELETE CASCADE.
      await supabaseAdmin.from('credenciales_admin').delete().eq('user_id', userId)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)

      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (delErr) throw delErr

      return NextResponse.json({
        ok: true,
        fichas_respaldadas: fichas?.length || 0,
      })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo completar la acción' }, { status: 500 })
  }
}
