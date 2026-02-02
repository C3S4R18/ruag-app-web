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

export async function POST(request: Request) {
  try {
    const { employees } = await request.json()
    const results = { success: 0, errors: 0, updated: 0, details: [] as any[] }

    for (const emp of employees) {
      const documentNumber = emp.dni.trim()
      // Generamos el correo "falso" por defecto
      const generatedEmail = `${documentNumber}@ruag.sistema` 
      const password = documentNumber 

      let userId = null;
      let finalEmailToUse = generatedEmail; // Por defecto usaremos el generado
      let isExistingUser = false;

      // 1. ESTRATEGIA DE BÚSQUEDA
      // Buscamos si ya tiene perfil. Si existe, intentamos obtener su email REAL de la tabla fichas o profiles
      // para no sobrescribirlo con el falso.
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('dni', documentNumber)
        .single()

      if (existingProfile) {
        userId = existingProfile.id
        isExistingUser = true;
        
        // OPCIONAL: Si quieres asegurarte de usar el correo que YA tiene en la tabla fichas:
        const { data: existingFicha } = await supabaseAdmin
            .from('fichas')
            .select('correo')
            .eq('user_id', userId)
            .single()
            
        if (existingFicha && existingFicha.correo) {
            finalEmailToUse = existingFicha.correo; // Mantenemos su correo actual (sea real o falso)
        }

      } else {
        // --- USUARIO NUEVO ---
        // Si no tiene perfil, intentamos crearlo en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: generatedEmail,
          password: password,
          email_confirm: true,
          user_metadata: { full_name: emp.nombres }
        })

        if (!authError && authData.user) {
          userId = authData.user.id
        } else if (authError?.message?.includes('already registered')) {
          // Si existe en Auth pero no en Profiles (Caso raro/recuperación)
          // En este caso, no podemos recuperar el email real fácilmente sin el ID, 
          // así que usaremos el generado, pero marcaremos el error si no podemos proceder.
          results.errors++
          results.details.push({ dni: documentNumber, error: "Usuario existe en Auth sin Perfil. Requiere revisión manual." })
          continue
        } else {
          results.errors++
          results.details.push({ dni: documentNumber, error: authError?.message })
          continue
        }
      }

      // 2. ACTUALIZAR / CREAR PERFIL
      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          dni: documentNumber,
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          telefono: emp.celular,
          role: 'obrero'
        })

        // 3. ACTUALIZAR / CREAR FICHA
        // Aquí preparamos el objeto para upsert
        const fichaData: any = {
          user_id: userId,
          estado: 'completado',
          
          // Datos personales
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          dni: documentNumber,
          fecha_nacimiento: emp.fecha_nacimiento,
          celular: emp.celular,
          estado_civil: emp.estado_civil,
          
          // Ubicación
          direccion: emp.direccion,
          distrito: emp.distrito,
          provincia: emp.provincia,
          departamento: emp.departamento,
          
          // Laboral
          nombre_obra: emp.nombre_obra, 
          fecha_ingreso: emp.fecha_ingreso,
          cargo: emp.cargo,
          
          // Financiero
          banco: emp.banco,
          numero_cuenta: emp.numero_cuenta,
          cci: emp.cci,
          
          // Salud
          sistema_pension: emp.sistema_pension,
          afp_nombre: emp.afp_nombre,
          cuspp: emp.cuspp,
          
          updated_at: new Date().toISOString()
        }

        // CORRECCIÓN CRÍTICA:
        // Solo actualizamos el campo 'correo' si es un usuario NUEVO.
        // Si es antiguo, NO enviamos el campo 'correo' en el upsert para que la base de datos mantenga el valor actual.
        // O si preferimos, usamos el 'finalEmailToUse' que recuperamos arriba.
        if (!isExistingUser) {
            fichaData.correo = generatedEmail;
        } else {
            // Si ya existe, nos aseguramos de que el upsert NO toque el correo,
            // O forzamos el correo que recuperamos de la base de datos (finalEmailToUse)
            fichaData.correo = finalEmailToUse; 
        }

        const { error: fichaError } = await supabaseAdmin.from('fichas').upsert(
            fichaData, 
            { onConflict: 'user_id' }
        )

        if (fichaError) {
            console.error("Error ficha:", fichaError)
            results.errors++
        } else {
            results.success++
        }
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error("Critical Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}