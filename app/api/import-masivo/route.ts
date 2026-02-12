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
      const generatedEmail = `${documentNumber}@ruag.sistema` 
      const password = documentNumber 

      let userId = null;
      let finalEmailToUse = generatedEmail; 
      let isExistingUser = false;
      
      // VARIABLE PARA GUARDAR EL ROL ACTUAL (IMPORTANTE PARA NO BORRAR ADMINS)
      let currentRole = 'obrero'; 

      // 1. ESTRATEGIA DE BÚSQUEDA
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role') // <--- AQUI: TRAEMOS TAMBIÉN EL ROL
        .eq('dni', documentNumber)
        .single()

      if (existingProfile) {
        userId = existingProfile.id
        isExistingUser = true;
        
        // SI YA EXISTE, PRESERVAMOS SU ROL (Si es admin, se queda admin)
        if (existingProfile.role) {
            currentRole = existingProfile.role;
        }

        // Recuperar email real si existe en ficha
        const { data: existingFicha } = await supabaseAdmin
            .from('fichas')
            .select('correo')
            .eq('user_id', userId)
            .single()
            
        if (existingFicha && existingFicha.correo) {
            finalEmailToUse = existingFicha.correo; 
        }

      } else {
        // --- USUARIO NUEVO ---
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: generatedEmail,
          password: password,
          email_confirm: true,
          user_metadata: { full_name: emp.nombres }
        })

        if (!authError && authData.user) {
          userId = authData.user.id
          // Si es nuevo, el rol se queda en 'obrero' (por defecto)
        } else if (authError?.message?.includes('already registered')) {
           // Caso raro: Existe en Auth pero no en Profile. 
           // Intentaremos arreglarlo, pero marcamos error por seguridad.
           results.errors++
           continue
        } else {
           results.errors++
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
          role: currentRole // <--- AQUI ESTÁ LA CORRECCIÓN: Usamos el rol preservado
        })

        // 3. ACTUALIZAR / CREAR FICHA
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

        if (!isExistingUser) {
            fichaData.correo = generatedEmail;
        } else {
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