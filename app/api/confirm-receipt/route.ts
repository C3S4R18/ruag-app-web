import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Esto asegura que el link siempre se procese en vivo (sin caché)
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. CONFIGURACIÓN DEL CORREO
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
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  // Recuperamos tu correo para responderte ahí
  const adminEmail = decodeURIComponent(searchParams.get('admin_email') || '')

  if (!id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })

  // CORRECCIÓN AQUÍ: Declaramos la variable con el nombre correcto
  let emailStatus = 'pending';

  try {
    // A. ACTUALIZAR BASE DE DATOS (Check Verde en tu panel)
    await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
    
    // B. OBTENER DATOS DEL OBRERO
    const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // C. RESPONDERTE EL CORREO A TI (AUTOMÁTICAMENTE)
    if (adminEmail && adminEmail.includes('@')) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER, 
          to: adminEmail, // Aquí es donde te llega la "respuesta"
          subject: `✅ Confirmación: ${workerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #15803d; margin-top: 0;">Recepción Confirmada</h2>
              <p style="color: #333;">El colaborador <strong>${workerName}</strong> ha confirmado la recepción de documentos.</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <ul style="margin: 0; padding-left: 20px; color: #166534;">
                  <li><strong>Fecha:</strong> ${fecha}</li>
                  <li><strong>Estado:</strong> ✅ Confirmado</li>
                </ul>
              </div>
              <p style="font-size: 12px; color: #888;">Notificación automática del Sistema RUAG.</p>
            </div>
          `
        })
        emailStatus = 'success';
      } catch (error) {
        console.error("Error enviando email:", error);
        emailStatus = 'error';
      }
    }

    // D. MOSTRAR PANTALLA MODERNA
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
            background: white; width: 100%; max-width: 380px; 
            padding: 50px 30px; border-radius: 30px; 
            box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.15); 
            text-align: center; 
            animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .icon-circle { 
            width: 80px; height: 80px; background: #22c55e; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;
            color: white; font-size: 40px; font-weight: bold;
            box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s backwards;
          }
          h1 { color: #14532d; margin: 0 0 10px; font-size: 26px; letter-spacing: -0.5px; }
          p { color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 25px; }
          
          .status-pill {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 600;
            background: #dcfce7; color: #15803d; border: 1px solid #86efac;
          }
          .status-error {
            background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
          }

          .footer { margin-top: 40px; color: #9ca3af; font-size: 11px; font-weight: 600; letter-spacing: 1px; }

          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-circle">✓</div>
          <h1>¡Confirmado!</h1>
          <p>Hola <strong>${workerName}</strong>,<br>hemos registrado la recepción de tus documentos correctamente.</p>
          
          ${emailStatus === 'success' 
            ? `<div class="status-pill">
                 <span>📨 OFICINA NOTIFICADA</span>
               </div>`
            : `<div class="status-pill status-error">
                 <span>⚠️ REGISTRADO (Error de correo)</span>
               </div>`
          }
          
          <div class="footer">PUEDES CERRAR ESTA VENTANA</div>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    console.error("Error Fatal:", error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}