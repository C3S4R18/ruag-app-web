import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- CREDENCIALES DE WEBMAIL (CPANEL) ---
const EMAIL_USER = 'ruagsrl@ruag.pe';
const EMAIL_PASS = 'Rg2022//@@'; 
const EMAIL_HOST = 'mail.ruag.pe'; // Servidor estándar de cPanel

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 465, // Puerto seguro SSL para cPanel
  secure: true, 
  auth: { 
    user: EMAIL_USER, 
    pass: EMAIL_PASS 
  },
  // Esto ayuda si el certificado SSL del hosting es antiguo
  tls: { 
    rejectUnauthorized: false 
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  // Aquí llega el correo tuyo (cesarneyra18@...) para recibir la respuesta
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

    // 3. ENVIAR CORREO (AUTOMÁTICO)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); // Verificar conexión con cPanel

        await transporter.sendMail({
          from: `"Sistema RUAG" <${EMAIL_USER}>`, 
          to: adminEmail, // Se envía a: cesarneyra18@hotmail.com
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #166534; margin-top: 0;">Recepción Confirmada</h2>
              <p style="color: #333;">El colaborador <strong>${workerName}</strong> ha confirmado la recepción de sus documentos.</p>
              
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
        debugError = 'No se encontró el correo de destino en el enlace.';
    }

    // 4. PANTALLA
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 380px; padding: 50px 30px; border-radius: 30px; box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.15); text-align: center; }
          .icon-circle { width: 80px; height: 80px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; color: white; font-size: 40px; font-weight: bold; }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 26px; }
          p { color: #4b5563; font-size: 15px; margin-bottom: 25px; }
          .badge-success { background: #dcfce7; color: #15803d; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block; border: 1px solid #86efac; }
          .badge-error { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 10px; font-size: 11px; margin-top: 15px; border: 1px solid #fecaca; text-align: left; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<div class="icon-circle">✓</div>
               <h1>¡Todo Listo!</h1>
               <p>Hola <strong>${workerName}</strong>, se ha confirmado tu recepción.</p>
               <div class="badge-success">📨 OFICINA NOTIFICADA</div>`
            : `<div style="font-size: 50px; margin-bottom: 20px;">⚠️</div>
               <h1>Registrado</h1>
               <p>Guardado en sistema, pero el correo falló.</p>
               <div class="badge-error"><strong>Error Técnico:</strong> ${debugError}</div>`
          }
          <div style="margin-top: 40px; font-size: 11px; color: #cbd5e1; font-weight: bold;">PUEDES CERRAR ESTA VENTANA</div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}