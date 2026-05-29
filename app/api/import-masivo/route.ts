import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// CLIENTE ADMIN
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Pre-carga TODOS los usuarios de auth en un solo mapa email→id, así evitamos
// la trampa "already registered" cuando hay imports parciales previos.
async function buildAuthEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let page = 1
  const perPage = 1000
  // Pagina hasta agotar (Supabase admin.listUsers no soporta filter por email).
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) break
    for (const u of data.users) {
      if (u.email) map.set(u.email.toLowerCase(), u.id)
    }
    if (data.users.length < perPage) break
    page += 1
    if (page > 50) break // tope defensivo (50k usuarios)
  }
  return map
}

export async function POST(request: Request) {
  try {
    const { employees } = await request.json()
    const results = { success: 0, errors: 0, updated: 0, failures: [] as { dni: string; nombre: string; razon: string }[] }

    // Pre-carga de usuarios auth — evita N llamadas y la trampa de duplicados.
    const authMap = await buildAuthEmailMap()

    for (const emp of employees) {
      const documentNumber = String(emp.dni || '').trim()
      const displayName = `${emp.apellido_paterno || ''} ${emp.apellido_materno || ''} ${emp.nombres || ''}`.trim() || documentNumber

      if (!documentNumber) {
        results.errors++
        results.failures.push({ dni: '?', nombre: displayName, razon: 'Sin DNI' })
        continue
      }

      const authEmail = `${documentNumber}@ruag.sistema`
      const password = documentNumber
      const contactEmail = emp.correo_contacto && emp.correo_contacto.includes('@')
                           ? emp.correo_contacto
                           : null

      let userId: string | null = null
      let isExistingUser = false
      let currentRole = 'obrero'

      // 1) ¿Ya existe el usuario en Auth? (lookup local, instantáneo)
      const cachedAuthId = authMap.get(authEmail.toLowerCase())
      if (cachedAuthId) {
        userId = cachedAuthId
        isExistingUser = true
      } else {
        // 2) También revisamos `profiles` por DNI (por si el usuario tiene
        //    otro email distinto al sintético — registros previos manuales).
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, role')
          .eq('dni', documentNumber)
          .maybeSingle()

        if (existingProfile) {
          userId = existingProfile.id
          isExistingUser = true
          if (existingProfile.role) currentRole = existingProfile.role
        } else {
          // 3) Nuevo: creamos el usuario en Auth.
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: emp.nombres },
          })
          if (!authError && authData.user) {
            userId = authData.user.id
            authMap.set(authEmail.toLowerCase(), userId)
          } else {
            // No se pudo crear y tampoco existía localmente — registra y sigue.
            results.errors++
            results.failures.push({
              dni: documentNumber,
              nombre: displayName,
              razon: authError?.message || 'No se pudo crear el usuario',
            })
            continue
          }
        }
      }

      // Si llegamos aquí ya tenemos userId. Volvemos a leer el rol del profile
      // (por si el usuario auth ya existía pero no había profile linkeado).
      if (isExistingUser && currentRole === 'obrero') {
        const { data: profById } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()
        if (profById?.role) currentRole = profById.role
      }

      // --- ACTUALIZAR PERFIL (Siempre se actualiza para asegurar datos frescos) ---
      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          dni: documentNumber,
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          telefono: emp.celular,
          role: currentRole 
        })

        // --- PREPARAR DATOS DE LA FICHA ---
        // Aquí NO incluimos 'nombre_obra' para que nunca lo toque.
        const rawFichaData: any = {
          user_id: userId,
          
          // Solo marcamos completado si es nuevo. Si ya existe, no tocamos el estado.
          estado: isExistingUser ? undefined : 'completado',
          
          // Datos personales (IDE)
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          dni: documentNumber,
          fecha_nacimiento: emp.fecha_nacimiento,
          celular: emp.celular,
          estado_civil: emp.estado_civil,
          
          // Guardamos el correo real en la ficha (si vino en el archivo)
          correo: contactEmail, 
          
          // Ubicación (DIR) - "Que jale todo"
          direccion: emp.direccion,
          distrito: emp.distrito,
          provincia: emp.provincia,
          departamento: emp.departamento,
          
          // Laboral (TRA) - "Todo MENOS establecimiento"
          fecha_ingreso: emp.fecha_ingreso,
          cargo: emp.cargo,
          // nombre_obra: <--- ELIMINADO INTENCIONALMENTE
          
          // Financiero (TRA)
          banco: emp.banco,
          numero_cuenta: emp.numero_cuenta,
          cci: emp.cci,
          
          // Salud (SSA) - "Que coja todo"
          sistema_pension: emp.sistema_pension,
          afp_nombre: emp.afp_nombre,
          cuspp: emp.cuspp,
          
          updated_at: new Date().toISOString()
        }

        // --- FILTRO DE LIMPIEZA ---
        // Esto elimina cualquier campo que venga null, undefined o vacío "" del objeto.
        // Resultado: Si el archivo TXT no tiene el dato, NO BORRA el dato que ya tienes en BD.
        const cleanFichaData = Object.fromEntries(
            Object.entries(rawFichaData).filter(([_, v]) => v != null && v !== '')
        );

        const { error: fichaError } = await supabaseAdmin.from('fichas').upsert(
            cleanFichaData, 
            { onConflict: 'user_id' }
        )

        if (fichaError) {
            console.error("Error ficha:", fichaError)
            results.errors++
            results.failures.push({
                dni: documentNumber,
                nombre: displayName,
                razon: `Ficha: ${fichaError.message}`,
            })
        } else {
            if (isExistingUser) results.updated++
            else results.success++
        }
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error("Critical Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}