import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic' // IMPORTANTE: Evita que Vercel cachee la respuesta

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CONFIGURACIÓN EXACTA PARA OFFICE 365
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  auth: { 
    user: process.env.SMTP_USER, // katherinetomaylla@ruagsrl.onmicrosoft.com
    pass: process.env.SMTP_PASS  // Kt2026//
  },
  tls: { 
    ciphers: 'SSLv3',
    rejectUnauthorized: false 
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  // Decodificamos el correo por si tiene caracteres especiales
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '') 

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let adminMessage = '';

  try {
    // 1. ACTUALIZAR BASE DE DATOS (Check Verde)
    const { error: dbError } = await supabase
      .from('fichas')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('id', id)

    if (dbError) throw new Error('Error al guardar en base de datos');

    // 2. OBTENER DATOS DEL OBRERO
    const { data: worker } = await supabase
      .from('fichas')
      .select('nombres, apellido_paterno')
      .eq('id', id)
      .single()
    
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador';
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    // 3. ENVIAR EL CORREO AL ADMIN (LADO DEL SERVIDOR)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        console.log(`📨 Intentando enviar correo a: ${adminEmail} desde ${process.env.SMTP_USER}`);
        
        await transporter.sendMail({
          // CRÍTICO: El 'from' DEBE ser EXACTAMENTE igual al usuario de la credencial
          // No pongas "katherine@ruag.pe" aquí o fallará el error 500
          from: process.env.SMTP_USER, 
          to: adminEmail,
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #166534; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Recepción Confirmada</h2>
              </div>
              <div style="padding: 20px; background-color: #ffffff;">
                <p style="color: #333; font-size: 16px;">Hola,</p>
                <p style="color: #333; font-size: 16px;">El colaborador <strong>${workerName}</strong> ha confirmado la recepción de sus documentos.</p>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0;">
                  <ul style="margin: 0; padding-left: 20px; color: #166534;">
                    <li style="margin-bottom: 5px;"><strong>Fecha:</strong> ${fecha}</li>
                    <li><strong>Estado:</strong> ✅ Confirmado y Registrado</li>
                  </ul>
                </div>
                <p style="font-size: 12px; color: #888; margin-top: 20px;">Sistema Automático RUAG</p>
              </div>
            </div>
          `
        });
        console.log("✅ Correo enviado con éxito");
        emailStatus = 'success';
      } catch (mailError: any) {
        console.error("❌ Error SMTP:", mailError);
        emailStatus = 'failed';
        adminMessage = mailError.message; // Guardamos el error para verlo si queremos
      }
    } else {
        console.log("⚠️ No hay correo de admin para notificar");
    }

    // 4. RESPUESTA VISUAL AL OBRERO (HTML MODERNO)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; 
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            display: flex; align-items: center; justify-content: center; min-height: 100vh;
          }
          .card { 
            background: white; width: 100%; max-width: 400px; 
            padding: 50px 30px; border-radius: 30px; 
            box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.15); 
            text-align: center; position: relative; overflow: hidden;
            animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .icon-circle { 
            width: 90px; height: 90px; background: #22c55e; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;
            box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s backwards;
          }
          .icon-check { color: white; font-size: 45px; font-weight: bold; }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 28px; letter-spacing: -0.5px; }
          p { color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
          
          .status-pill {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 8px 16px; border-radius: 50px; font-size: 13px; font-weight: 600;
          }
          .status-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .status-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-circle">
            <div class="icon-check">✓</div>
          </div>
          <h1>¡Todo Listo!</h1>
          <p>Hola <strong>${workerName}</strong>,<br>hemos registrado tu firma correctamente.</p>
          
          ${emailStatus === 'success' 
            ? `<div class="status-pill status-success">
                 <span>📩 Oficina Notificada Exitosamente</span>
               </div>`
            : `<div class="status-pill status-error">
                 <span>⚠️ Registro guardado (Alerta de correo pendiente)</span>
               </div>`
          }
          
          <div style="margin-top: 40px; color: #9ca3af; font-size: 12px; font-weight: 600; letter-spacing: 1px;">
            PUEDES CERRAR ESTA VENTANA
          </div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    console.error("Error Crítico:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}