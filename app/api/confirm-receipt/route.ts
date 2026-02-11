import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- CREDENCIALES DIRECTAS (WEBMAIL) ---
const EMAIL_USER = 'ruagsrl@ruag.pe';
const EMAIL_PASS = 'Rg2022//@@'; 

// CAMBIO: Probamos con el dominio principal directamente
const EMAIL_HOST = 'ruag.pe'; 

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 465, // Puerto seguro SSL (Estándar en cPanel)
  secure: true, 
  auth: { 
    user: EMAIL_USER, 
    pass: EMAIL_PASS 
  },
  tls: { 
    rejectUnauthorized: false 
  },
  // Tiempos de espera extendidos para Vercel
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
    // 1. DATABASE
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. DATOS
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 3. ENVÍO
    if (adminEmail && adminEmail.includes('@')) {
      try {
        console.log(`Conectando a ${EMAIL_HOST}...`);
        await transporter.verify(); 

        await transporter.sendMail({
          from: `"Sistema RUAG" <${EMAIL_USER}>`, 
          to: adminEmail, 
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
              <h2 style="color: #166534;">Recepción Confirmada</h2>
              <p>El colaborador <strong>${workerName}</strong> ha confirmado la recepción.</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <hr>
              <p style="font-size: 12px; color: #888;">Sistema RUAG</p>
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

    // 4. PANTALLA
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estado</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 380px; padding: 50px 30px; border-radius: 30px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); text-align: center; }
          .icon { font-size: 50px; display: block; margin-bottom: 20px; }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 26px; }
          .badge-error { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 10px; font-size: 11px; margin-top: 15px; border: 1px solid #fecaca; text-align: left; word-break: break-all;}
          .badge-success { background: #dcfce7; color: #15803d; padding: 10px; border-radius: 50px; font-weight: bold; font-size: 13px; margin-top: 15px; border: 1px solid #86efac; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<span class="icon">✅</span><h1>¡Todo Listo!</h1><p>Correo enviado a ${adminEmail}</p><div class="badge-success">ÉXITO</div>`
            : `<span class="icon">⚠️</span><h1>Registrado</h1><p>Fallo al enviar correo.</p><div class="badge-error"><strong>Error:</strong> ${debugError}</div>`
          }
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}