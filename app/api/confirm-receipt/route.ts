import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CONFIGURACIÓN DEL ROBOT DE CORREO
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Outlook requiere false para puerto 587
  auth: { 
    user: process.env.SMTP_USER, // katherinetomaylla@ruagsrl.onmicrosoft.com
    pass: process.env.SMTP_PASS  // Kt2026//
  },
  tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = searchParams.get('admin_email') // El correo del Admin (Neyra, etc.)
  
  if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 })

  let emailStatus = 'no_sent';

  try {
    // 1. ACTUALIZAR BASE DE DATOS (Icono Verde)
    // Lo hacemos primero para asegurar que el registro quede guardado sí o sí
    const { error: dbError } = await supabase
        .from('fichas')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('id', id)

    if (dbError) throw new Error('Error DB: ' + dbError.message);

    // 2. OBTENER DATOS DEL TRABAJADOR
    const { data: worker } = await supabase
        .from('fichas')
        .select('nombres, apellido_paterno')
        .eq('id', id)
        .single()
    
    const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador';
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    // 3. ENVIAR CORREO AUTOMÁTICAMENTE (Lado del Servidor)
    // No esperamos a que el usuario presione nada. Lo hacemos aquí mismo.
    if (adminEmail) {
        try {
            await transporter.sendMail({
                // OJO: El 'from' DEBE ser idéntico al usuario de credenciales para evitar Error 500
                from: process.env.SMTP_USER, 
                to: adminEmail,
                subject: `✅ Confirmación Recibida: ${workerName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #15803d; margin-top: 0;">Confirmación Automática</h2>
                    <p style="color: #374151;">El colaborador <strong>${workerName}</strong> ha confirmado la recepción de documentos.</p>
                    <ul style="color: #4b5563;">
                        <li><strong>Fecha:</strong> ${fecha}</li>
                        <li><strong>Estado:</strong> ✅ Confirmado en sistema</li>
                    </ul>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">RUAG System</p>
                  </div>
                `
            });
            emailStatus = 'success';
            console.log("✅ Correo enviado a " + adminEmail);
        } catch (mailError: any) {
            console.error("❌ Fallo SMTP:", mailError);
            emailStatus = 'failed';
        }
    }

    // 4. MOSTRAR PANTALLA DE ÉXITO AL OBRERO
    // Le mostramos un mensaje diferente dependiendo si el correo salió o no
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación | RUAG</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; width: 100%; max-width: 400px; padding: 40px 30px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
          .icon { font-size: 50px; color: #16a34a; margin-bottom: 20px; display: block; animation: pop 0.5s ease; }
          h1 { color: #111827; margin: 0 0 10px; font-size: 24px; font-weight: 800; }
          p { color: #4b5563; font-size: 15px; line-height: 1.5; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 15px; }
          .error-badge { background: #fee2e2; color: #991b1b; }
          @keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="icon">✅</span>
          <h1>¡Todo Listo!</h1>
          <p>Hola <strong>${workerName}</strong>, hemos registrado tu firma correctamente.</p>
          <p>Ya puedes cerrar esta ventana.</p>
          
          ${emailStatus === 'success' 
            ? '<div class="badge">OFICINA NOTIFICADA CORRECTAMENTE</div>' 
            : '<div class="badge error-badge">REGISTRO GUARDADO (Sin notificación email)</div>'}
            
          <p style="margin-top: 30px; font-size: 11px; color: #ccc;">RUAG SYSTEM</p>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error: any) {
    console.error("Error General:", error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}