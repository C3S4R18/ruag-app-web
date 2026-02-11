import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- CONFIGURACIÓN HÍBRIDA ---
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'ruag.pe',
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || 'ruagsrl@ruag.pe',
  pass: process.env.SMTP_PASS || 'Rg2022//@@'
}

const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: true, 
  auth: { 
    user: SMTP_CONFIG.user, 
    pass: SMTP_CONFIG.pass 
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 20000, 
  greetingTimeout: 20000
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  // Recuperamos el correo destino
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let debugError = '';

  try {
    // 1. BASE DE DATOS
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. DATOS OBRERO
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' })

    // 3. ENVIAR CORREO
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); 

        await transporter.sendMail({
          from: `"Notificaciones RUAG" <${SMTP_CONFIG.user}>`, 
          to: adminEmail, 
          subject: `✅ Constancia - ${workerName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #16a34a;">Recepción Confirmada</h2>
              <p>El colaborador <strong>${workerName}</strong> confirmó sus documentos.</p>
              <p>Fecha: ${fecha}</p>
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
        debugError = 'No hay correo destino en el Link';
    }

    // 4. PANTALLA (CON EL "ACUSETE")
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 420px; padding: 40px; border-radius: 30px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .pill { background: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 15px; border: 1px solid #86efac; }
          .email-info { margin-top: 20px; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<h1 style="color:#16a34a; margin:0 0 10px;">¡Enviado!</h1>
               <p>Registro exitoso.</p>
               <div class="pill">✅ Correo Enviado</div>
               
               <div class="email-info">
                 <strong>Destino:</strong> ${adminEmail}<br>
                 (Revisa Spam si no llega)
               </div>`
            
            : `<h1 style="color:#b91c1c;">Error</h1>
               <p>Falló el envío.</p>
               <div style="color:red; font-size:11px; margin-top:10px;">${debugError}</div>`
          }
          <br><button onclick="window.close()" style="border:none; background:none; color:#999; cursor:pointer;">Cerrar</button>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}