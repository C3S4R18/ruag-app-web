import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuración del Robot de Correo (Katherine)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Outlook requiere false en puerto 587
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
})

// ----------------------------------------------------------------------
// 1. GET: Se carga cuando el obrero hace clic en el enlace
// ----------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'Enlace inválido' }, { status: 400 })

  // A. Actualizar Base de Datos (Esto pone el icono VERDE en tu panel)
  await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
  
  // B. Obtener datos para mostrar en la pantalla
  const { data: worker } = await supabase.from('fichas').select('nombres, apellido_paterno, dni').eq('id', id).single()
  const workerName = worker ? `${worker.nombres} ${worker.apellido_paterno}` : 'Colaborador'

  // C. Retornar la Pantalla Moderna HTML
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recepción Confirmada | RUAG</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        /* ESTILOS Y ANIMACIONES */
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; color: #1f2937; }
        
        .card { background: white; width: 100%; max-width: 420px; padding: 40px 30px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); text-align: center; border: 1px solid #e5e7eb; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .icon-box { position: relative; width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; animation: scaleIn 0.5s ease-out 0.3s both; }
        .icon-check { color: #166534; font-size: 40px; font-weight: bold; line-height: 1; }
        
        h1 { color: #111827; margin: 0 0 12px; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
        .worker-name { font-weight: 700; color: #1f2937; }
        
        .divider { height: 1px; background: #f3f4f6; margin: 24px 0; }
        
        /* BOTÓN DE NOTIFICACIÓN */
        .btn-notify { 
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 12px; 
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; 
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); 
          text-decoration: none;
        }
        .btn-notify:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3); }
        .btn-notify:active { transform: translateY(0); }
        .btn-notify:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .status-msg { margin-top: 15px; font-size: 13px; font-weight: 500; min-height: 20px; }
        .brand { font-size: 11px; color: #9ca3af; margin-top: 32px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-box">
          <div class="icon-check">✓</div>
        </div>
        
        <h1>¡Recepción Confirmada!</h1>
        <p>Hola <span class="worker-name">${workerName}</span>,<br>hemos registrado correctamente que recibiste tus documentos.</p>
        
        <div class="divider"></div>
        
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
          Para finalizar, por favor notifica a la oficina presionando el botón:
        </p>
        
        <button id="notifyBtn" class="btn-notify" onclick="sendNotification()">
          <span>📢 NOTIFICAR A ADMINISTRACIÓN</span>
        </button>
        
        <div id="statusMsg" class="status-msg"></div>

        <div class="brand">RUAG System &bull; RRHH/SSOMA</div>
      </div>

      <script>
        async function sendNotification() {
          const btn = document.getElementById('notifyBtn');
          const msg = document.getElementById('statusMsg');
          
          // Efecto de carga
          btn.disabled = true;
          btn.innerHTML = '<span>⏳ Enviando aviso...</span>';
          msg.style.color = '#6b7280';
          msg.innerText = '';

          try {
            // Hacemos una petición POST a este mismo archivo para enviar el correo real
            const res = await fetch(window.location.href, { method: 'POST' });
            
            if (res.ok) {
              btn.style.background = '#059669'; // Verde éxito
              btn.innerHTML = '<span>✅ AVISO ENVIADO</span>';
              msg.style.color = '#059669';
              msg.innerText = "La administración ha sido notificada exitosamente.";
            } else {
              throw new Error('Error del servidor');
            }
          } catch (e) {
            btn.style.background = '#dc2626'; // Rojo error
            btn.innerHTML = '<span>⚠️ Error de conexión</span>';
            btn.disabled = false; // Permitir reintentar
            msg.style.color = '#dc2626';
            msg.innerText = "No se pudo enviar el correo. Intenta de nuevo.";
          }
        }
      </script>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// ----------------------------------------------------------------------
// 2. POST: Se ejecuta cuando presionan el botón azul en la pantalla
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = searchParams.get('admin_email') // El admin al que le llegará el aviso

  if (!adminEmail) return NextResponse.json({ error: 'No se especificó admin' }, { status: 400 })

  try {
    // Buscar nombre del obrero
    const { data } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
    const name = data ? `${data.nombres} ${data.apellido_paterno}` : 'Un colaborador'
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

    // Enviar correo REAL usando la cuenta de Katherine
    await transporter.sendMail({
      from: `"Sistema RUAG" <${process.env.SMTP_USER}>`,
      to: adminEmail, // Le llega al Admin que creó el link
      subject: `✅ Confirmación Recibida: ${name}`,
      text: `El trabajador ${name} confirmó la recepción el ${fecha}.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #166534; margin-top:0;">Confirmación de Recepción</h2>
          <p style="color: #374151; font-size: 16px;">
            El colaborador <strong>${name}</strong> ha confirmado la recepción de sus documentos laborales.
          </p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li><strong>Fecha:</strong> ${fecha}</li>
              <li><strong>Estado:</strong> Confirmado en sistema</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">Sistema Automático RUAG</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error enviando email POST:", error)
    return NextResponse.json({ error: 'Fallo al enviar correo' }, { status: 500 })
  }
}