import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 })

  // ACTUALIZACIÓN: Guardamos la fecha de confirmación en la columna nueva
  const { error } = await supabase
    .from('fichas')
    .update({ 
      email_confirmed_at: new Date().toISOString(), // <--- ESTO ES LO NUEVO
      // Opcional: Si quieres que esto también valide la ficha completa, descomenta:
      // estado: 'completado' 
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(`
    <html>
      <head>
        <title>Confirmación Recibida</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h1 { color: #166534; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 60px;">✅</div>
          <h1>¡Recepción Confirmada!</h1>
          <p>El sistema ha registrado que recibiste tu documentación correctamente.</p>
          <p style="color: #64748b; margin-top: 20px; font-size: 12px;">Ya puedes cerrar esta ventana.</p>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}