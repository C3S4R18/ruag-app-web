import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración SMTP para Office 365
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  },
  tls: { 
    ciphers: 'SSLv3',
    rejectUnauthorized: false 
  },
  debug: true, // Activar logs detallados
  logger: true 
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let errorMessage = '';

  try {
    // 1. Base de datos
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. Datos obrero
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 3. Envío de Correo
    if (adminEmail && adminEmail.includes('@')) {
      try {
        // Verificar conexión antes de enviar
        await transporter.verify();

        await transporter.sendMail({
          from: process.env.SMTP_USER, // Remitente (Katherine)
          to: adminEmail, // Destinatario (Tú/Admin)
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
              <h2 style="color: #166534;">Recepción Confirmada</h2>
              <p>El colaborador <strong>${workerName}</strong> confirmó la recepción.</p>
              <p>Fecha: ${fecha}</p>
            </div>
          `
        })
        emailStatus = 'success';
      } catch (err: any) {
        console.error("Fallo SMTP:", err);
        emailStatus = 'failed';
        // Capturamos el mensaje exacto del error para mostrarlo
        errorMessage = err.message || JSON.stringify(err);
      }
    } else {
        emailStatus = 'failed';
        errorMessage = 'No se encontró el correo del admin en el link.';
    }

    // 4. Pantalla
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estado de Confirmación</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 450px; padding: 40px 30px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .icon { font-size: 50px; display: block; margin-bottom: 20px; }
          .success { color: #16a34a; }
          .error { color: #dc2626; }
          .error-box { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 10px; font-size: 11px; text-align: left; margin-top: 20px; word-break: break-all; font-family: monospace; border: 1px solid #fecaca; }
          h1 { margin: 0 0 10px; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<span class="icon">✅</span>
               <h1 class="success">¡Todo Listo!</h1>
               <p>La notificación fue enviada exitosamente a: <strong>${adminEmail}</strong></p>`
            : `<span class="icon">⚠️</span>
               <h1 class="error">Registro Guardado</h1>
               <p>Tu firma se guardó en el sistema, pero no se pudo enviar el correo de aviso.</p>
               <div class="error-box">
                 <strong>ERROR TÉCNICO (Mandar captura al programador):</strong><br><br>
                 ${errorMessage}
               </div>`
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