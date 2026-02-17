import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// CLIENTE ADMIN (Necesario para gestión de usuarios)
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
      
      // Credenciales de ACCESO (Login) - Se mantiene tu lógica original
      const authEmail = `${documentNumber}@ruag.sistema` 
      const password = documentNumber 

      // Correo de CONTACTO (Para la ficha)
      // Si el archivo trajo un correo real, lo usamos. Si no, usamos el generado.
      const contactEmail = emp.correo_contacto && emp.correo_contacto.includes('@') 
                           ? emp.correo_contacto 
                           : authEmail;

      let userId = null;
      let isExistingUser = false;
      let currentRole = 'obrero'; 

      // 1. BUSCAR SI YA EXISTE (Evitar duplicados)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('dni', documentNumber)
        .single()

      if (existingProfile) {
        // USUARIO EXISTENTE: Solo actualizaremos datos
        userId = existingProfile.id
        isExistingUser = true;
        if (existingProfile.role) currentRole = existingProfile.role; // Preservar rol
      } else {
        // USUARIO NUEVO: Crear cuenta de acceso
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: authEmail, // Login siempre con DNI@ruag.sistema
          password: password,
          email_confirm: true,
          user_metadata: { full_name: emp.nombres }
        })

        if (!authError && authData.user) {
          userId = authData.user.id
        } else if (authError?.message?.includes('already registered')) {
           // Caso raro de desincronización
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
          role: currentRole 
        })

        // 3. PREPARAR DATOS DE LA FICHA
        const rawFichaData: any = {
          user_id: userId,
          // Solo marcamos completado si es nuevo para no alterar estados de flujo existentes
          estado: isExistingUser ? undefined : 'completado',
          
          // Datos personales
          nombres: emp.nombres,
          apellido_paterno: emp.apellido_paterno,
          apellido_materno: emp.apellido_materno,
          dni: documentNumber,
          fecha_nacimiento: emp.fecha_nacimiento,
          celular: emp.celular,
          estado_civil: emp.estado_civil,
          correo: contactEmail, // Aquí va el correo real si vino del IDE
          
          // Ubicación (Viene del DIR)
          direccion: emp.direccion,
          distrito: emp.distrito,
          provincia: emp.provincia,
          departamento: emp.departamento,
          
          // Laboral (Viene del TRA - Sin establecimiento)
          fecha_ingreso: emp.fecha_ingreso,
          cargo: emp.cargo,
          // nombre_obra: NO TOCAMOS ESTO DESDE AQUÍ PARA EVITAR ERRORES DE DIRECCIÓN
          
          // Financiero (Viene del TRA)
          banco: emp.banco,
          numero_cuenta: emp.numero_cuenta,
          cci: emp.cci,
          
          // Salud (Viene del SSA)
          sistema_pension: emp.sistema_pension,
          afp_nombre: emp.afp_nombre,
          cuspp: emp.cuspp,
          
          updated_at: new Date().toISOString()
        }

        // --- FILTRO DE LIMPIEZA ---
        // Elimina campos vacíos para no borrar datos que ya existan en la BD
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