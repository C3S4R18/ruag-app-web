import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- TUS CREDENCIALES EXACTAS ---
const EMAIL_USER = 'katherine@ruag.pe';
const EMAIL_PASS = 'Kt2022//@@'; 

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  auth: { 
    user: EMAIL_USER, 
    pass: EMAIL_PASS 
  },
  tls: { 
    ciphers: 'SSLv3',
    rejectUnauthorized: false 
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  // AQUÍ RECIBE EL CORREO AL QUE SE LE VA A RESPONDER (cesarneyra18@...)
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let debugError = '';

  try {
    // 1. MARCAR EN BASE DE DATOS (Check Verde)
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. OBTENER DATOS DEL OBRERO
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 3. ENVIAR CORREO DE RESPUESTA A TI
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.sendMail({
          from: `Sistema RUAG <${EMAIL_USER}>`, 
          to: adminEmail, // LE LLEGA A: cesarneyra18@hotmail.com (o el que pongas)
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
              <h2 style="color: #166534;">¡Recepción Confirmada!</h2>
              <p>El sistema ha registrado que <strong>${workerName}</strong> recibió sus documentos.</p>
              <div style="background:#f0fdf4; padding:15px; margin:15px 0; border-radius:5px;">
                 <strong>Fecha:</strong> ${fecha}<br>
                 <strong>Estado:</strong> ✅ Validado en Base de Datos
              </div>
              <p style="font-size:12px; color:#777;">Enviado automáticamente vía RUAG System</p>
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
        debugError = 'No se indicó a quién responder el correo (admin_email vacío).';
    }

    // 4. PANTALLA
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin:0; }
          .card { background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; width:90%; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .icon { font-size: 50px; color: #22c55e; margin-bottom: 20px; display: block; }
          h1 { color: #1f2937; margin: 0 0 10px; }
          .badge-success { background: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 15px; border: 1px solid #86efac; }
          .badge-error { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 10px; font-size: 11px; margin-top: 15px; text-align: left; word-break: break-word; border: 1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<span class="icon">✅</span>
               <h1>¡Todo Listo!</h1>
               <p>Hola <strong>${workerName}</strong>, se ha confirmado tu recepción.</p>
               <div class="badge-success">📨 OFICINA NOTIFICADA A: ${adminEmail}</div>`
            : `<span class="icon">⚠️</span>
               <h1>Registrado</h1>
               <p>Se guardó en el sistema, pero el correo falló.</p>
               <div class="badge-error"><strong>Error Técnico:</strong> ${debugError}</div>`
          }
          <p style="margin-top: 30px; font-size: 12px; color: #999;">PUEDES CERRAR ESTA VENTANA</p>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}