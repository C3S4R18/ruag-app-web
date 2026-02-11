import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración SMTP para Outlook / Office 365
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Outlook usa STARTTLS (secure: false) en el puerto 587
  auth: {
    user: process.env.SMTP_USER, // katherine@ruag.pe
    pass: process.env.SMTP_PASS, // Su contraseña real
  },
  tls: {
    ciphers: 'SSLv3' // Ayuda con compatibilidad en algunos servidores
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') 
  const docType = searchParams.get('doc') || 'Documento'
  
  // Recibimos el correo del admin que generó el link (Neyra, Juan, etc.)
  const adminEmail = searchParams.get('admin_email') 

  if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 })

  try {
    // 1. Obtener datos del trabajador
    const { data: worker, error: fetchError } = await supabase
      .from('fichas')
      .select('nombres, apellido_paterno, email_confirmed_at')
      .eq('id', id)
      .single()

    if (fetchError || !worker) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
    }

    const workerName = `${worker.nombres} ${worker.apellido_paterno}`
    const fechaConfirmacion = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 2. Solo actuamos si NO ha confirmado antes (para no duplicar correos)
    if (!worker.email_confirmed_at) {
      
      // A. Actualizar Base de Datos (Pone el icono VERDE en tu panel)
      const { error: updateError } = await supabase
        .from('fichas')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      // B. ENVIAR CORREO AL ADMIN (Si tenemos su email)
      // El correo sale DE: katherine@ruag.pe (SMTP_USER)
      // El correo va PARA: adminEmail (ej. neyra@ruag.pe)
      if (adminEmail) {
        try {
          await transporter.sendMail({
            from: `"Sistema RUAG" <${process.env.SMTP_USER}>`, 
            to: adminEmail, 
            subject: `✅ Confirmación Recibida - ${workerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #15803d; margin-top: 0;">Confirmación de Recepción</h2>
                <p style="color: #374151;">El trabajador <strong>${workerName}</strong> ha confirmado la recepción de sus documentos.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li><strong>Documento:</strong> ${docType}</li>
                    <li><strong>Fecha y Hora:</strong> ${fechaConfirmacion}</li>
                    <li><strong>Estado:</strong> Confirmado en sistema</li>
                  </ul>
                </div>

                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                  Este es un mensaje automático enviado por el Sistema de Gestión RUAG.
                </p>
              </div>
            `
          })
          console.log(`Notificación enviada exitosamente a ${adminEmail}`)
        } catch (mailError) {
          console.error("Error enviando correo al admin:", mailError)
        }
      }
    }

    // 3. Respuesta visual para el Obrero (Lo que él ve al dar clic)
    return new NextResponse(`
      <html>
        <head>
          <title>Confirmación Exitosa</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #f0fdf4; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; width: 90%; max-width: 400px; }
            h1 { color: #166534; font-size: 24px; margin-bottom: 10px; }
            p { color: #475569; line-height: 1.5; }
            .icon { font-size: 48px; margin-bottom: 20px; display: block; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="icon">✅</span>
            <h1>¡Recepción Confirmada!</h1>
            <p><strong>${workerName}</strong>,</p>
            <p>Hemos registrado correctamente tu confirmación a las ${fechaConfirmacion.split(' ')[1]}.</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Sistema de Gestión RUAG</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (error: any) {
    console.error("Error general:", error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}