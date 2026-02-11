import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Evitamos que Vercel guarde caché, para que siempre procese el envío
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CONFIGURACIÓN DEL ROBOT DE CORREO
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
  // Decodificamos el email para evitar errores con @
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Enlace inválido' }, { status: 400 })

  let emailStatus = 'pending';

  try {
    // 1. ACTUALIZAR BASE DE DATOS (Check Verde en tu panel)
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 2. OBTENER DATOS DEL OBRERO
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 3. ENVIAR CORREO DE RESPALDO AL ADMIN (PRUEBA LEGAL)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        console.log(`Enviando correo a ${adminEmail} usando ${process.env.SMTP_USER}`);
        
        await transporter.sendMail({
          // CRÍTICO: Usamos el usuario real de las credenciales para que NO falle
          from: `"Sistema RUAG" <${process.env.SMTP_USER}>`, 
          to: adminEmail,
          subject: `✅ RECEPCIÓN CONFIRMADA: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; max-width: 600px;">
              <h2 style="color: #15803d; margin-top: 0;">Constancia de Recepción</h2>
              <p style="color: #374151;">Se certifica que el colaborador:</p>
              <h3 style="color: #111827;">${workerName}</h3>
              <p style="color: #374151;">Ha confirmado digitalmente la recepción de sus documentos laborales.</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; margin: 20px 0; border-left: 4px solid #16a34a;">
                <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fecha}</p>
                <p style="margin: 5px 0;"><strong>Estado:</strong> ✅ Confirmado por el usuario</p>
              </div>
              
              <p style="font-size: 11px; color: #9ca3af; margin-top: 20px;">
                Este correo sirve como constancia de la acción realizada en el sistema.
              </p>
            </div>
          `
        })
        emailStatus = 'success';
        console.log("✅ Correo enviado exitosamente");
      } catch (mailError) {
        console.error("❌ Fallo el envío de correo:", mailError);
        emailStatus = 'failed';
      }
    }

    // 4. MOSTRAR PANTALLA AL OBRERO (Corregida: Dice "Recepción", no "Firma")
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación Exitosa</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; width: 100%; max-width: 380px; padding: 40px 30px; border-radius: 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); text-align: center; }
          .icon-circle { width: 80px; height: 80px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 40px; font-weight: bold; }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 24px; letter-spacing: -0.5px; }
          p { color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 600; margin-top: 10px; }
          .success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .warning { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
          .footer { margin-top: 40px; font-size: 11px; color: #cbd5e1; font-weight: 600; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-circle">✓</div>
          
          <h1>¡Recepción Confirmada!</h1>
          <p>Hola <strong>${workerName}</strong>,<br>hemos registrado correctamente que recibiste tus documentos.</p>
          
          ${emailStatus === 'success' 
            ? `<div class="badge success">📧 CONSTANCIA ENVIADA A OFICINA</div>` 
            : `<div class="badge warning">⚠️ REGISTRO GUARDADO (Correo pendiente)</div>`
          }
          
          <div class="footer">PUEDES CERRAR ESTA VENTANA</div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}