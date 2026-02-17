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
      
      // 1. CREDENCIALES DE ACCESO (LOGIN) - Lógica Original
      // Esto es SOLO para que puedan entrar al sistema
      const authEmail = `${documentNumber}@ruag.sistema` 
      const password = documentNumber 

      // 2. CORREO DE CONTACTO (PARA LA FICHA DE DATOS)
      // Usamos el correo real extraído del IDE. Si no hay, null.
      const contactEmail = emp.correo_contacto && emp.correo_contacto.includes('@') 
                           ? emp.correo_contacto 
                           : null;

      let userId = null;
      let isExistingUser = false;
      let currentRole = 'obrero'; 

      // --- BUSCAR SI YA EXISTE (EVITA DUPLICADOS) ---
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('dni', documentNumber)
        .single()

      if (existingProfile) {
        // YA EXISTE: Usamos su ID y respetamos su rol
        userId = existingProfile.id
        isExistingUser = true;
        if (existingProfile.role) currentRole = existingProfile.role;
      } else {
        // NUEVO: Creamos el usuario en Auth (Supabase Auth)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: authEmail, 
          password: password,
          email_confirm: true,
          user_metadata: { full_name: emp.nombres }
        })

        if (!authError && authData.user) {
          userId = authData.user.id
        } else if (authError?.message?.includes('already registered')) {
           results.errors++
           continue
        } else {
           results.errors++
           continue
        }
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