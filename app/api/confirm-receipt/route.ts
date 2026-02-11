import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Cliente de Supabase con permisos de Admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración de transporte (Robot de envíos)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Office 365 usa STARTTLS (false en puerto 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Ayuda a evitar errores de certificados estrictos
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') 
  const docType = searchParams.get('doc') || 'Documento Laboral'
  const adminEmail = searchParams.get('admin_email') // El correo al que avisaremos

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
    
    // Obtener fecha en formato Perú
    const fechaObj = new Date();
    const fechaPeru = fechaObj.toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'full', timeStyle: 'medium' });
    const fechaISO = fechaObj.toISOString();

    // 2. Solo actuamos si NO ha confirmado antes (o si quieres permitir re-confirmaciones, quita el if)
    if (!worker.email_confirmed_at) {
      
      // A. Actualizar Base de Datos
      const { error: updateError } = await supabase
        .from('fichas')
        .update({ email_confirmed_at: fechaISO })
        .eq('id', id)

      if (updateError) throw updateError

      // B. ENVIAR CORREO DE RESPALDO AL ADMIN
      if (adminEmail) {
        console.log(`Intentando enviar correo a: ${adminEmail} desde ${process.env.SMTP_USER}...`);
        
        try {
          await transporter.sendMail({
            from: `"Sistema RUAG" <${process.env.SMTP_USER}>`, 
            to: adminEmail, 
            subject: `✅ Confirmación: ${workerName}`,
            text: `El trabajador ${workerName} confirmó la recepción el ${fechaPeru}.`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb;">
                  
                  <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">SISTEMA RUAG</h1>
                  </div>

                  <div style="padding: 32px;">
                    <h2 style="color: #166534; margin-top: 0; font-size: 22px;">Confirmación de Recepción</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                      El sistema ha registrado exitosamente la confirmación digital del siguiente colaborador:
                    </p>

                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Colaborador:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${workerName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Documento:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${docType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${fechaPeru}</td>
                        </tr>
                      </table>
                    </div>

                    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 30px;">
                      Este es un mensaje automático de respaldo. No es necesario responder.
                    </p>
                  </div>
                </div>
              </div>
            `
          })
          console.log("✅ Correo enviado correctamente al admin.");
        } catch (mailError: any) {
          console.error("❌ ERROR CRÍTICO ENVIANDO CORREO:", mailError);
          // Importante: No detenemos el proceso si falla el correo, para que al obrero le salga confirmado igual.
        }
      } else {
        console.log("⚠️ No se proporcionó 'admin_email' en la URL, no se envió notificación.");
      }
    }

    // 3. PANTALLA DE ÉXITO MODERNA (HTML MEJORADO)
    // El 'charset=utf-8' en el header soluciona los símbolos raros
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa | RUAG</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: #1f2937;
          }
          .card {
            background: white;
            padding: 48px 32px;
            border-radius: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            text-align: center;
            max-width: 420px;
            width: 100%;
            border: 1px solid #e5e7eb;
          }
          .icon-container {
            width: 80px;
            height: 80px;
            background-color: #dcfce7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
          }
          .icon {
            color: #166534;
            font-size: 40px;
          }
          h1 {
            color: #111827;
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
          }
          p {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          .highlight {
            color: #166534;
            font-weight: 600;
            background-color: #f0fdf4;
            padding: 2px 8px;
            border-radius: 6px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
            color: #9ca3af;
            font-weight: 500;
          }
          .brand {
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-container">
            <span class="icon">✓</span>
          </div>
          <h1>¡Recepción Confirmada!</h1>
          
          <p>Hola, <strong>${workerName}</strong></p>
          <p>Hemos registrado correctamente tu confirmación en nuestro sistema.</p>
          <p>Fecha: <span class="highlight">${fechaPeru}</span></p>

          <div class="footer">
            <span class="brand">RUAG</span> &bull; SISTEMA INTEGRADO DE GESTIÓN
          </div>
        </div>
      </body>
      </html>
    `, { 
      status: 200, 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8' // <--- ESTO ARREGLA LOS SÍMBOLOS RAROS
      } 
    })

  } catch (error: any) {
    console.error("Error general:", error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}