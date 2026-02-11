import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. CONFIGURACIÓN DEL ROBOT DE CORREO
// Usamos las credenciales "largas" para la autenticación real con Microsoft
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, 
  auth: { 
    user: process.env.SMTP_USER, // katherinetomaylla@ruagsrl.onmicrosoft.com
    pass: process.env.SMTP_PASS  // Kt2026//
  },
  tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
})

// ----------------------------------------------------------------------
// 1. GET: Se ejecuta cuando el obrero abre el enlace
// ----------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 })

  // A. Marcar en BD (Pone el icono VERDE en tu panel)
  await supabase.from('fichas').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id)
  
  // B. Obtener datos para mostrar en la pantalla
  const { data } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
  const workerName = data ? `${data.nombres} ${data.apellido_paterno}` : 'Colaborador'

  // C. Retornar la Pantalla Moderna HTML con Animaciones
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recepción Confirmada | RUAG</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        /* ESTILOS MODERNOS */
        :root { --primary: #2563eb; --primary-dark: #1d4ed8; --success: #16a34a; --bg: #f3f4f6; --text: #1f2937; }
        body { margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; background-color: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; color: var(--text); }
        
        .card { 
          background: white; width: 90%; max-width: 420px; padding: 48px 32px; 
          border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); 
          text-align: center; border: 1px solid #e5e7eb;
          opacity: 0; transform: translateY(20px);
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .icon-box { 
          width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; 
          transform: scale(0);
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards;
        }
        .icon-check { color: #15803d; font-size: 40px; line-height: 1; }

        h1 { margin: 0 0 12px; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #111827; }
        p { color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 8px; }
        .highlight { color: #111827; font-weight: 600; }

        .divider { height: 1px; background: #e5e7eb; margin: 32px 0; width: 100%; }

        /* BOTÓN MODERNO */
        .btn { 
          display: flex; align-items: center; justify-content: center; width: 100%; 
          padding: 16px; border-radius: 16px; border: none; 
          background: var(--primary); color: white; font-size: 15px; font-weight: 600; 
          cursor: pointer; transition: all 0.2s ease; 
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          text-decoration: none;
        }
        .btn:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { background: #9ca3af; cursor: not-allowed; transform: none; box-shadow: none; }

        .status-msg { margin-top: 16px; font-size: 13px; font-weight: 500; min-height: 20px; transition: color 0.3s; }
        .brand { font-size: 11px; color: #9ca3af; margin-top: 32px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }

        /* ANIMACIONES */
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { to { transform: scale(1); } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-box">
          <div class="icon-check">✓</div>
        </div>
        
        <h1>¡Recepción Confirmada!</h1>
        <p>Hola <span class="highlight">${workerName}</span>,</p>
        <p>Hemos registrado correctamente tu confirmación.</p>
        
        <div class="divider"></div>
        
        <p style="font-size: 13px; margin-bottom: 20px; color: #4b5563;">
          Por favor, presiona el botón para notificar a la oficina:
        </p>
        
        <button id="notifyBtn" class="btn" onclick="triggerNotification()">
          NOTIFICAR A ADMINISTRACIÓN
        </button>
        
        <div id="status" class="status-msg"></div>

        <div class="brand">RUAG System &bull; RRHH/SSOMA</div>
      </div>

      <script>
        async function triggerNotification() {
          const btn = document.getElementById('notifyBtn');
          const status = document.getElementById('status');
          
          // Estado de carga
          btn.disabled = true;
          btn.innerText = "Enviando aviso...";
          status.innerText = "";
          
          try {
            // Hacemos la petición POST al mismo endpoint
            const res = await fetch(window.location.href, { method: 'POST' });
            
            if(res.ok) { 
               // ÉXITO
               btn.style.background = '#16a34a'; // Verde
               btn.innerText = "✅ AVISO ENVIADO"; 
               status.style.color = '#16a34a';
               status.innerText = "La administración ha sido notificada exitosamente."; 
            } else { 
               throw new Error(); 
            }
          } catch(e) { 
             // ERROR
             btn.style.background = '#dc2626'; // Rojo
             btn.innerText = "⚠️ Error de conexión"; 
             status.style.color = '#dc2626';
             status.innerText = "No se pudo enviar el correo, pero tu registro ya está guardado."; 
             
             // Permitir reintentar después de 3 seg
             setTimeout(() => {
                btn.disabled = false;
                btn.style.background = '#2563eb';
                btn.innerText = "Reintentar Notificación";
             }, 3000);
          }
        }
      </script>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// ----------------------------------------------------------------------
// 2. POST: Se ejecuta cuando presionan el botón "NOTIFICAR"
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adminEmail = searchParams.get('admin_email') 

  if (!adminEmail) return NextResponse.json({ error: 'Falta admin' }, { status: 400 })

  const { data } = await supabase.from('fichas').select('nombres, apellido_paterno').eq('id', id).single()
  const name = data ? `${data.nombres} ${data.apellido_paterno}` : 'Colaborador'
  const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

  try {
    await transporter.sendMail({
      // CORRECCIÓN CRÍTICA:
      // El "From" debe coincidir con el usuario autenticado (process.env.SMTP_USER).
      // Si usas otro correo, Microsoft lo bloquea (Error 500).
      from: `"Sistema RUAG" <${process.env.SMTP_USER}>`, 
      to: adminEmail,
      subject: `✅ Confirmación Recibida - ${name}`,
      text: `El trabajador ${name} confirmó la recepción el ${fecha}.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; max-width: 600px;">
          <h2 style="color: #15803d; margin-top: 0; font-size: 20px;">Confirmación de Recepción</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            El colaborador <strong>${name}</strong> ha confirmado digitalmente la recepción de sus documentos.
          </p>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin-bottom: 8px;"><strong>Fecha:</strong> ${fecha}</li>
              <li><strong>Estado:</strong> ✅ Confirmado en sistema</li>
            </ul>
          </div>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            Enviado automáticamente por RUAG System.
          </p>
        </div>
      `
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error SMTP POST:", error)
    return NextResponse.json({ error: 'Fallo envio' }, { status: 500 })
  }
}