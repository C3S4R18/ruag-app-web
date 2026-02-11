import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración segura leyendo desde Vercel
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Lee 'ruag.pe'
  port: Number(process.env.SMTP_PORT) || 465, // Lee '465'
  secure: true, // true para puerto 465
  auth: { 
    user: process.env.SMTP_USER, // Lee tu correo
    pass: process.env.SMTP_PASS  // Lee tu contraseña oculta
  },
  tls: { 
    rejectUnauthorized: false // Importante para certificados compartidos
  },
  // Tiempos de espera para evitar errores de conexión
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 20000
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let debugError = '';

  try {
    // 1. CONFIRMAR EN BASE DE DATOS
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. OBTENER DATOS
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 3. ENVIAR CORREO (SEGURO)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); 

        await transporter.sendMail({
          from: `"Sistema RUAG" <${process.env.SMTP_USER}>`, 
          to: adminEmail, 
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
              <h2 style="color: #166534; margin-top: 0;">Recepción Confirmada</h2>
              <p>El colaborador <strong>${workerName}</strong> ha confirmado la recepción de sus documentos.</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <ul style="margin: 0; padding-left: 20px; color: #166534;">
                  <li><strong>Fecha:</strong> ${fecha}</li>
                  <li><strong>Estado:</strong> ✅ Confirmado</li>
                </ul>
              </div>
              <p style="font-size: 12px; color: #888; margin-top: 20px;">Enviado desde Webmail RUAG</p>
            </div>
          `
        })
        emailStatus = 'success';
      } catch (err: any) {
        console.error("Error SMTP:", err);
        emailStatus = 'failed';
        debugError = err.message;
      }
    } else {
        emailStatus = 'failed';
        debugError = 'No se encontró el correo de destino.';
    }

    // 4. PANTALLA FINAL
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 380px; padding: 50px 30px; border-radius: 30px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); text-align: center; }
          .icon { font-size: 50px; display: block; margin-bottom: 20px; }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 26px; }
          .badge-success { background: #dcfce7; color: #15803d; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 15px; border: 1px solid #86efac; }
          .badge-error { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 10px; font-size: 11px; margin-top: 15px; border: 1px solid #fecaca; text-align: left; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<span class="icon">✅</span><h1>¡Todo Listo!</h1><p>Notificación enviada a: ${adminEmail}</p><div class="badge-success">PROCESO COMPLETADO</div>`
            : `<span class="icon">⚠️</span><h1>Registrado</h1><p>Error al enviar correo.</p><div class="badge-error"><strong>Error:</strong> ${debugError}</div>`
          }
          <div style="margin-top: 30px; font-size: 11px; color: #cbd5e1; font-weight: bold;">PUEDES CERRAR ESTA VENTANA</div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}