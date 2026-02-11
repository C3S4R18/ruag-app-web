import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración SMTP Segura (Usando tus variables de entorno)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, 
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, 
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  },
  tls: { rejectUnauthorized: false },
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
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno, dni').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const workerDni = worker?.dni || '---'
    
    // Formato de fecha profesional: "11 de Febrero, 2026 - 10:30 AM"
    const fecha = new Date().toLocaleString('es-PE', { 
      timeZone: 'America/Lima',
      dateStyle: 'long',
      timeStyle: 'short'
    })

    // 3. ENVIAR CORREO (DISEÑO CORPORATIVO)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); 

        await transporter.sendMail({
          from: `"Notificaciones RUAG" <${process.env.SMTP_USER}>`, 
          to: adminEmail, 
          subject: `✅ Constancia de Recepción - ${workerName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                
                <div style="background-color: #15803d; padding: 30px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">CONSTANCIA DE RECEPCIÓN</h1>
                  <p style="color: #dcfce7; margin: 5px 0 0 0; font-size: 14px;">Confirmación Digital de Documentos</p>
                </div>

                <div style="padding: 40px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    El sistema ha registrado exitosamente la confirmación del colaborador. A continuación se detallan los datos de la transacción digital:
                  </p>

                  <table style="width: 100%; border-collapse: collapse; margin-top: 25px; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; font-weight: 600; width: 140px;">COLABORADOR</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600;">${workerName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; font-weight: 600;">FECHA Y HORA</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${fecha}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; font-weight: 600;">ESTADO</td>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                        <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700;">CONFIRMADO</span>
                      </td>
                    </tr>
                     <tr>
                      <td style="padding: 15px 20px; color: #6b7280; font-size: 13px; font-weight: 600;">PLATAFORMA</td>
                      <td style="padding: 15px 20px; color: #111827; font-size: 14px;">Web App RUAG</td>
                    </tr>
                  </table>

                  <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
                    Este es un correo automático generado por el sistema de gestión documental RUAG.
                  </p>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 11px; color: #6b7280;">&copy; ${new Date().getFullYear()} RUAG S.R.L. - Todos los derechos reservados.</p>
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
        debugError = 'Correo de administrador no especificado.';
    }

    // 4. PANTALLA WEB (DISEÑO MODERNO Y ANIMADO)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
        
        <style>
          :root { --primary: #16a34a; --bg: #f0fdf4; --card: #ffffff; --text: #1e293b; }
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
          
          /* Animación de entrada de la tarjeta */
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(40px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          
          /* Animación del Check */
          @keyframes drawCheck {
            0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
            100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
          }
          @keyframes scaleCheck {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }

          .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            width: 100%; max-width: 420px;
            padding: 50px 30px;
            border-radius: 32px;
            box-shadow: 0 25px 50px -12px rgba(22, 163, 74, 0.15), 0 0 0 1px rgba(255,255,255,0.5);
            text-align: center;
            animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            position: relative;
          }

          /* Círculo del icono */
          .icon-container {
            width: 90px; height: 90px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 30px;
            box-shadow: 0 15px 30px rgba(22, 163, 74, 0.3);
            animation: scaleCheck 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s backwards;
          }

          /* SVG del Check */
          .check-svg { width: 45px; height: 45px; stroke: white; stroke-width: 3.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
          .check-path { stroke-dasharray: 100; stroke-dashoffset: 0; animation: drawCheck 0.8s ease-out 0.5s backwards; }

          h1 { color: #14532d; margin: 0 0 12px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          p { color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 35px; font-weight: 300; }
          strong { color: #0f172a; font-weight: 600; }

          /* Estados (Pills) */
          .status-container { display: flex; justify-content: center; gap: 10px; margin-bottom: 40px; }
          .pill { padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; }
          
          .pill-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1); }
          .pill-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1); }

          .btn-close {
            background: transparent; border: none; color: #94a3b8;
            font-size: 13px; font-weight: 500; cursor: pointer;
            transition: color 0.2s; font-family: inherit;
            margin-top: 10px;
          }
          .btn-close:hover { color: #64748b; text-decoration: underline; }

        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `
              <div class="icon-container">
                <svg class="check-svg" viewBox="0 0 24 24"><path class="check-path" d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h1>¡Registro Exitoso!</h1>
              <p>Gracias <strong>${workerName}</strong>.<br>Hemos confirmado la recepción de tus documentos correctamente.</p>
              
              <div class="status-container">
                <div class="pill pill-success">
                  <span>✨ Oficina Notificada</span>
                </div>
              </div>
            ` 
            : `
              <div class="icon-container" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 15px 30px rgba(245, 158, 11, 0.3);">
                <span style="color:white; font-size:40px; font-weight:bold;">!</span>
              </div>
              <h1 style="color: #78350f;">Registro Guardado</h1>
              <p>Tu firma se guardó, pero hubo un problema técnico enviando el correo de respaldo.</p>
              
              <div class="status-container">
                 <div class="pill pill-error">
                  <span>⚠️ Error de Envío: ${debugError.substring(0, 30)}...</span>
                </div>
              </div>
            `
          }
          
          <button class="btn-close" onclick="window.close()">Cerrar esta ventana</button>
          <div style="margin-top: 20px; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">Powered by RUAG System</div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}