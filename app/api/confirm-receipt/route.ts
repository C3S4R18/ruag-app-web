import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- CONFIGURACIÓN HÍBRIDA (SEGURIDAD + RESPALDO) ---
// Si las variables fallan, usa los textos fijos como paracaídas.
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'ruag.pe',
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || 'ruagsrl@ruag.pe',
  pass: process.env.SMTP_PASS || 'Rg2022//@@'
}

const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: true, // true para puerto 465
  auth: { 
    user: SMTP_CONFIG.user, 
    pass: SMTP_CONFIG.pass 
  },
  tls: { rejectUnauthorized: false },
  // Tiempos de espera extendidos
  connectionTimeout: 20000, 
  greetingTimeout: 20000
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 })

  let emailStatus = 'pending';
  let debugError = '';

  try {
    // 1. ACTUALIZAR BASE DE DATOS
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. OBTENER DATOS
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    
    const fecha = new Date().toLocaleString('es-PE', { 
      timeZone: 'America/Lima',
      dateStyle: 'long',
      timeStyle: 'short'
    })

    // 3. ENVIAR CORREO (USANDO LA CONFIG HÍBRIDA)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); 

        await transporter.sendMail({
          from: `"Notificaciones RUAG" <${SMTP_CONFIG.user}>`, 
          to: adminEmail, 
          subject: `✅ Constancia de Recepción - ${workerName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #15803d; padding: 30px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">CONSTANCIA DE RECEPCIÓN</h1>
                  <p style="color: #dcfce7; margin: 5px 0 0 0; font-size: 14px;">Confirmación Digital</p>
                </div>
                <div style="padding: 40px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    El sistema ha registrado exitosamente la confirmación del colaborador:
                  </p>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 25px; background-color: #f9fafb; border-radius: 8px;">
                    <tr>
                      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; width: 140px;">COLABORADOR</td>
                      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${workerName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">FECHA</td>
                      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #111827;">${fecha}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; color: #6b7280; font-weight: 600;">ESTADO</td>
                      <td style="padding: 15px;"><span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700;">CONFIRMADO</span></td>
                    </tr>
                  </table>
                  <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">Sistema Automático RUAG</p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 11px; color: #6b7280;">&copy; ${new Date().getFullYear()} RUAG S.R.L.</p>
                </div>
              </div>
            </body>
            </html>
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
        debugError = 'Correo admin no especificado';
    }

    // 4. PANTALLA WEB (TU DISEÑO NUEVO)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: rgba(255, 255, 255, 0.95); width: 100%; max-width: 420px; padding: 50px 30px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(22, 163, 74, 0.15); text-align: center; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          .icon-container { width: 90px; height: 90px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; box-shadow: 0 15px 30px rgba(22, 163, 74, 0.3); }
          .check-svg { width: 45px; height: 45px; stroke: white; stroke-width: 3.5; fill: none; }
          .pill { padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;}
          .pill-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .pill-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<div class="icon-container"><svg class="check-svg" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
               <h1 style="color:#14532d; margin-bottom:10px;">¡Registro Exitoso!</h1>
               <p style="color:#64748b; margin-bottom:30px;">Gracias <strong>${workerName}</strong>.</p>
               <div class="pill pill-success"><span>✨ Oficina Notificada</span></div>` 
            : `<div class="icon-container" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"><span style="color:white; font-size:40px; font-weight:bold;">!</span></div>
               <h1 style="color:#78350f; margin-bottom:10px;">Registro Guardado</h1>
               <p style="color:#64748b; margin-bottom:30px;">(Error técnico en correo de respaldo)</p>
               <div class="pill pill-error"><span>⚠️ ${debugError.substring(0, 40)}...</span></div>`
          }
          <br>
          <button onclick="window.close()" style="background:none; border:none; color:#94a3b8; cursor:pointer; text-decoration:underline;">Cerrar ventana</button>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}