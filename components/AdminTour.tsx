'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { PlayCircle, LifeBuoy } from 'lucide-react'
import confetti from 'canvas-confetti'

interface AdminTourProps {
  changeView: (view: 'dashboard' | 'biometria' | 'documentos' | 'profile') => void;
  openFirstDrawer: () => void;
  closeDrawer: () => void;
}

export default function AdminTour({ changeView, openFirstDrawer, closeDrawer }: AdminTourProps) {
  const driverObj = useRef<any>(null)

  const launchConfetti = () => {
    const end = Date.now() + 2000;
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      nextBtnText: 'Siguiente ➜',
      prevBtnText: 'Atrás',
      doneBtnText: '¡Terminar!',
      
      steps: [
        // --- FASE 1: DASHBOARD (Elementos visibles al inicio) ---
        { 
          element: '#tour-welcome', 
          popover: { 
            title: '👋 Panel de Control', 
            description: 'Bienvenido. Vamos a revisar las funciones principales del sistema.', 
            side: 'bottom', 
            align: 'start' 
          } 
        },
        { 
          element: '#tour-stats', 
          popover: { 
            title: '📊 Estadísticas', 
            description: 'Aquí tiene un resumen rápido de su personal y el estado de firmas de documentos.', 
            side: 'bottom' 
          } 
        },
        { 
          element: '#tour-import', 
          popover: { 
            title: '☁️ Carga Masiva', 
            description: 'Use este botón para subir múltiples trabajadores desde un archivo Excel o TXT.', 
            side: 'bottom' 
          } 
        },
        { 
          element: '#tour-notifications', 
          popover: { 
            title: '🔔 Notificaciones', 
            description: '¡Importante! Aquí le llegarán avisos cuando un obrero firme un documento o envíe un mensaje.', 
            side: 'left', 
            align: 'start' 
          } 
        },
        { 
          element: '#tour-search', 
          popover: { 
            title: '🔍 Buscador', 
            description: 'Encuentre rápidamente a cualquier trabajador por su DNI, Nombre o Apellido.', 
            side: 'bottom' 
          } 
        },
        { 
          element: '#tour-filters', 
          popover: { 
            title: '🗂️ Filtros', 
            description: 'Filtre la lista por Obra específica o Estado (Pendiente/Completado).', 
            side: 'left' 
          } 
        },
        
        // --- FASE 2: CAMBIO DE PANTALLA A DOCUMENTOS ---
        { 
          element: '#nav-documentos', 
          popover: { 
            title: '📂 Gestión Documental', 
            description: 'Ahora vamos a ver cómo gestionar los documentos. El sistema cambiará de pantalla automáticamente...', 
            side: 'right',
            onNextClick: () => {
                changeView('documentos'); // 1. Cambiamos de vista
                // 2. Damos tiempo a que React renderice la nueva cuadrícula
                setTimeout(() => {
                    driverObj.current.moveNext();
                }, 800); 
            }
          } 
        },

        // --- FASE 3: EN LA PANTALLA DE DOCUMENTOS ---
        { 
          element: '#tour-worker-card', // Este ID está en la tarjeta del trabajador en page.tsx
          popover: { 
            title: '👤 Tarjeta del Trabajador', 
            description: 'En esta vista, cada trabajador es una tarjeta. Vamos a abrir una para ver sus detalles...', 
            side: 'right', 
            align: 'center',
            onNextClick: () => {
                openFirstDrawer(); // 3. Simulamos el click para abrir el drawer
                setTimeout(() => {
                    driverObj.current.moveNext();
                }, 1000); // Esperamos la animación del drawer
            }
          } 
        },

        // --- FASE 4: DENTRO DEL DRAWER (PANEL LATERAL) ---
        { 
          element: '#drawer-risst-btn', 
          popover: { 
            title: '📜 Enviar RISST', 
            description: 'Presione aquí para enviar el reglamento al obrero inmediatamente.', 
            side: 'top', 
            align: 'center' 
          } 
        },
        { 
          element: '#drawer-info-section', 
          popover: { 
            title: '✏️ Datos Personales', 
            description: 'Aquí puede activar y bloquear los documentos del trabajador..', 
            side: 'top' 
          } 
        },
        { 
          element: '#drawer-close-btn', 
          popover: { 
            title: '❌ Cerrar Panel', 
            description: 'Cerramos el panel para terminar la revisión.', 
            side: 'left',
            onNextClick: () => {
                closeDrawer(); // 4. Cerramos el drawer
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll arriba
                    driverObj.current.moveNext();
                }, 800);
            }
          } 
        },
        
        // --- FINAL ---
        { 
          // Eliminamos 'side' para que se centre automáticamente
          popover: { 
            title: '✅ ¡Listo!', 
            description: 'Ya conoce el sistema completo. Puede volver a ver este tour cuando quiera.', 
            align: 'center' 
          } 
        }
      ],
      onDestroyStarted: () => {
        if(!driverObj.current.hasNextStep() || driverObj.current.isLastStep()) {
             launchConfetti();
             changeView('dashboard'); // Volvemos a casa al terminar
        }
        driverObj.current.destroy();
      },
    })
  }, [changeView, openFirstDrawer, closeDrawer])

  const startTour = () => {
    changeView('dashboard'); // Asegurar inicio en dashboard
    setTimeout(() => {
        window.scrollTo(0,0);
        driverObj.current.drive();
    }, 500);
  }

  // --- NUEVO DISEÑO: INTEGRADO EN EL SIDEBAR ---
  return (
    <div className="px-4 mt-auto mb-4 w-full">
        <button 
            onClick={startTour}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/40 transition-all group border border-white/10 hover:scale-[1.02] active:scale-95"
        >
            <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                <LifeBuoy size={20} className="text-white" />
            </div>
            <div className="text-left leading-tight">
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider opacity-80">Ayuda</p>
                <p className="text-sm font-bold text-white">Capacitación</p>
            </div>
        </button>
    </div>
  )
}