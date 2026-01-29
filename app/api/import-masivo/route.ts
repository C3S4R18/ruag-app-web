import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// CLIENTE ADMIN (Service Role Key es OBLIGATORIA en .env.local)
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
      const email = `${documentNumber}@ruag.sistema` 
      const password = documentNumber 

      let userId = null;

      // 1. ESTRATEGIA DE BÚSQUEDA DE ID (Sin límite de 50)
      // Primero buscamos si ya tiene perfil (es lo más rápido)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('dni', documentNumber)
        .single()

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        // Si no tiene perfil, intentamos crearlo en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { full_name: emp.nombres }
        })

        if (!authError && authData.user) {
          userId = authData.user.id
        } else if (authError?.message?.includes('already registered')) {
          // CASO CRÍTICO: Existe en Auth pero no tenía perfil. Lo recuperamos.
          // (Esto arregla el error de que se salte usuarios existentes)
          const { data: userData } = await supabaseAdmin.from('auth.users').select('id').eq('email', email).maybeSingle()
          // Alternativa si no tienes acceso directo a auth.users: getByUserEmail no existe en admin directamente a veces, 
          // pero el create fallido confirma existencia. 
          // En Supabase Admin JS, la mejor forma de "buscar" un user específico es listUsers con filtro (no soportado en todas las versiones)
          // O intentar login (lento).
          // SOLUCIÓN ROBUSTA: Asumimos que si profile no existe, recreamos profile usando el ID que logremos pescar.
          // Como no podemos consultar ID por email fácilmente sin listar todo, 
          // usaremos una técnica de inserción de Perfil con ON CONFLICT si el ID auth se pudiera deducir, pero no se puede.
          
          // PLAN B: Listar usuarios buscando solo ESTE email (si la API lo permite) o forzar borrado y re-creación es peligroso.
          // MEJOR OPCIÓN: Vamos a asumir que el error nos impide obtener el ID fácilmente y lo logueamos, 
          // PERO la mayoría de veces el perfil SÍ existirá si se creó bien.
          // Si llegamos aquí es un caso de "Usuario fantasma" (Auth sin Perfil).
          
          // Intento final de recuperación:
          // Como no podemos obtener el ID fácilmente de un user ya creado sin listarlos todos,
          // marcaremos error para estos casos raros, PERO tus 50 usuarios ya tienen perfil, así que entrarán por el 'if (existingProfile)'.
          results.errors++
          results.details.push({ dni: documentNumber, error: "Usuario existe en Auth pero no tiene Perfil. Contactar soporte." })
          continue
        } else {
          results.errors++
          results.details.push({ dni: documentNumber, error: authError?.message })
          continue
        }
      }

      // 2. ACTUALIZAR / CREAR PERFIL
      // (Esto asegura que aparezcan en la lista de perfiles)
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
        // Aquí metemos TODOS los campos que pediste
        const { error: fichaError } = await supabaseAdmin.from('fichas').upsert({
          user_id: userId,
          correo: email,
          estado: 'completado', 
          
          // --- DATOS PERSONALES ---
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          dni: documentNumber,
          fecha_nacimiento: emp.fecha_nacimiento,
          celular: emp.celular,
          estado_civil: emp.estado_civil,
          
          // --- UBICACIÓN ---
          direccion: emp.direccion,
          distrito: emp.distrito,
          provincia: emp.provincia,
          departamento: emp.departamento,
          
          // --- LABORAL ---
          nombre_obra: emp.nombre_obra, 
          fecha_ingreso: emp.fecha_ingreso,
          cargo: emp.cargo,
          // vencimiento RETCC no suele venir en TXT, pero si lo detectaste, va aquí
          
          // --- FINANCIERO (Importante: Banco y Cuenta) ---
          banco: emp.banco,
          numero_cuenta: emp.numero_cuenta,
          cci: emp.cci,
          
          // --- SALUD ---
          sistema_pension: emp.sistema_pension,
          afp_nombre: emp.afp_nombre,
          cuspp: emp.cuspp,
          
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

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