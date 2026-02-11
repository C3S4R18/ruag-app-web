import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  let emailStatus = 'pending';
  let debugError = '';

  try {
    // 1. VERIFICACIÓN DE CREDENCIALES (El detector de tu error actual)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error(`ERROR CRÍTICO: Vercel no tiene las credenciales. 
        Usuario: ${process.env.SMTP_USER ? 'OK' : 'FALTA'} | 
        Contraseña: ${process.env.SMTP_PASS ? 'OK' : 'FALTA'}`);
    }

    // 2. CONFIGURAR TRANSPORTE (Ahora sabemos que los datos existen)
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
      tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
    })

    // 3. BASE DE DATOS
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // 4. OBTENER DATOS
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // 5. ENVÍO DE CORREO AUTOMÁTICO
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.verify(); // Prueba de conexión

        await transporter.sendMail({
          from: process.env.SMTP_USER, 
          to: adminEmail,
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
              <h2 style="color: #166534; margin-top:0;">Recepción Confirmada</h2>
              <p>El colaborador <strong>${workerName}</strong> ha confirmado la recepción.</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <hr>
              <p style="font-size: 12px; color: #888;">Sistema RUAG</p>
            </div>
          `
        })
        emailStatus = 'success';
      } catch (err: any) {
        console.error("Fallo SMTP:", err);
        emailStatus = 'failed';
        debugError = err.message || 'Error desconocido al enviar';
      }
    } else {
        emailStatus = 'failed';
        debugError = 'No se encontró el correo de destino en el enlace.';
    }

    // 6. PANTALLA FINAL
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estado</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; width: 100%; max-width: 420px; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .icon { font-size: 50px; display: block; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; font-size: 24px; color: #1f2937; }
          .error-box { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; font-size: 11px; text-align: left; margin-top: 20px; border: 1px solid #fecaca; word-break: break-word; font-family: monospace; }
          .success-badge { background: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 13px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="card">
          ${emailStatus === 'success' 
            ? `<span class="icon">✅</span>
               <h1>¡Todo Listo!</h1>
               <p>Registro guardado y correo enviado a: <strong>${adminEmail}</strong></p>
               <div class="success-badge">PROCESO COMPLETADO</div>`
            : `<span class="icon">⚠️</span>
               <h1>Registro Guardado</h1>
               <p>Se guardó en la base de datos, pero falló el correo.</p>
               <div class="error-box">
                 <strong>DIAGNÓSTICO:</strong><br>${debugError}
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