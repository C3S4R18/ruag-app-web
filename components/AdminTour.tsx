'use client'

import { useEffect, useRef } from 'react'
import { driver, DriveStep, Side } from 'driver.js'
import 'driver.js/dist/driver.css'
import { Map } from 'lucide-react'
import confetti from 'canvas-confetti'

interface AdminTourProps {
  changeView: (view: 'dashboard' | 'biometria' | 'documentos' | 'rrhh' | 'vida_ley' | 'cesados' | 'profile') => void;
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

  // DEFINIMOS LOS PASOS CON EL TIPO CORRECTO PARA EVITAR EL ERROR DE TS
  const tourSteps: DriveStep[] = [
    // --- FASE 1: DASHBOARD ---
    { 
      element: '#tour-welcome', 
      popover: { 
        title: '👋 Bienvenido al Sistema RUAG', 
        description: 'Este es el centro de comando. Desde aquí administraremos todo el ciclo de vida del personal.', 
        side: 'bottom' as Side, 
        align: 'start' 
      } 
    },
    { 
      element: '#tour-stats', 
      popover: { 
        title: '📊 Indicadores Clave', 
        description: 'Resumen en tiempo real. Puede ver el total de personal, administradores activos y el estado de la conexión.', 
        side: 'bottom' as Side
      } 
    },
    // IMPORTANTE: Estos elementos viven dentro de la tabla del Dashboard.
    // Debemos mostrarlos ANTES de cambiar de vista.
    { 
      element: '#tour-search', 
      popover: { 
        title: '🔍 Buscador', 
        description: 'Filtre rápidamente por DNI, Nombre o Apellido en tiempo real.', 
        side: 'bottom' as Side
      } 
    },
    { 
      element: '#tour-filters', 
      popover: { 
        title: '🗂️ Filtros', 
        description: 'Filtre la lista por Obra específica o Estado (Pendiente/Completado).', 
        side: 'left' as Side
      } 
    },
    { 
      element: '#tour-notifications', 
      popover: { 
        title: '🔔 Centro de Notificaciones', 
        description: 'Aquí verá alertas cuando un obrero firme un documento o le envíe un mensaje por el chat.', 
        side: 'left' as Side,
        align: 'start'
      } 
    },
    { 
      element: '#tour-audio', 
      popover: { 
        title: '🔊 Sonidos del Sistema', 
        description: 'El sistema emite sonidos al recibir firmas. Puede activar o silenciar esos avisos aquí.', 
        side: 'left' as Side
      } 
    },
    { 
      element: '#tour-import', 
      popover: { 
        title: '☁️ Importación Masiva', 
        description: '¿Tiene un Excel con muchos obreros? Use este botón para subirlos todos de una sola vez.', 
        side: 'bottom' as Side
      } 
    },

    // --- FASE 2: BIOMETRÍA ---
    { 
      element: '#nav-biometria', 
      popover: { 
        title: 'b1. Módulo de Biometría', 
        description: 'Vamos a revisar las firmas y huellas. Cambiando de pantalla...', 
        side: 'right' as Side,
        onNextClick: () => {
            changeView('biometria');
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },
    { 
      element: '#tour-biometria-grid', 
      popover: { 
        title: '📸 Vista de Tarjetas', 
        description: 'Aquí visualiza rápidamente quién tiene firma (Lápiz) y quién tiene huella (Huella). Verde significa OK.', 
        side: 'top' as Side
      } 
    },
    { 
      element: '#tour-worker-card', 
      popover: { 
        title: '👤 Detalle del Trabajador', 
        description: 'Haga clic en cualquier tarjeta para abrir el panel de captura biométrica. Vamos a simularlo.', 
        side: 'right' as Side,
        onNextClick: () => {
            openFirstDrawer(); // Abre modal biometría
            setTimeout(() => driverObj.current.moveNext(), 1000); 
        }
      } 
    },
    { 
      // Sin elemento específico, aparece centrado
      popover: { 
        title: '✍️ Panel de Captura', 
        description: 'Aquí puede subir la firma o huella, o capturarla en el momento. Cierre este panel para continuar.', 
        onNextClick: () => {
            closeDrawer();
            setTimeout(() => driverObj.current.moveNext(), 600); 
        }
      } 
    },

    // --- FASE 3: DOCUMENTOS SSOMA ---
    { 
      element: '#nav-documentos', 
      popover: { 
        title: 'b2. Gestión SSOMA', 
        description: 'El núcleo de seguridad. Vamos a gestionar los documentos normativos.', 
        side: 'right' as Side,
        onNextClick: () => {
            changeView('documentos');
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },
    { 
      element: '#tour-docs-list', 
      popover: { 
        title: '📋 Tabla de Registros', 
        description: 'Cada fila es un trabajador. Use el ✅ Checkbox de la izquierda para seleccionar varios y hacer acciones masivas.', 
        side: 'top' as Side
      } 
    },
    { 
      element: '#tour-docs-list', 
      popover: { 
        title: '📂 Expediente Digital', 
        description: 'Vamos a abrir el expediente de un trabajador para ver sus documentos individuales.', 
        side: 'top' as Side,
        onNextClick: () => {
            openFirstDrawer(); // Abre Drawer SSOMA
            setTimeout(() => driverObj.current.moveNext(), 1000); 
        }
      } 
    },
    // DENTRO DEL DRAWER SSOMA
    { 
      element: '#drawer-header', 
      popover: { 
        title: '👤 Datos del Obrero', 
        description: 'Aquí ve el resumen del trabajador. Puede editar sus datos personales si es necesario.', 
        side: 'bottom' as Side
      } 
    },
    { 
      element: '#drawer-info-section', 
      popover: { 
        title: '🔒 Control de Documentos', 
        description: 'Estos son los registros (RISST, IPERC). Si están en AZUL, el obrero puede firmar. Si están en GRIS, están bloqueados.', 
        side: 'top' as Side
      } 
    },
    { 
      element: '#drawer-close-btn', 
      popover: { 
        title: '❌ Cerrar Expediente', 
        description: 'Cerramos para continuar al módulo de Recursos Humanos.', 
        side: 'left' as Side,
        onNextClick: () => {
            closeDrawer();
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },

    // --- FASE 4: RRHH ---
    { 
      element: '#nav-rrhh', 
      popover: { 
        title: 'b3. Recursos Humanos', 
        description: 'Gestión de contratos, RIT y documentos laborales.', 
        side: 'right' as Side,
        onNextClick: () => {
            changeView('rrhh');
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },
    { 
      element: '#tour-docs-list', 
      popover: { 
        title: '👔 Gestión RRHH', 
        description: 'Funciona igual que SSOMA, pero enfocado en documentos laborales. Abrimos detalle...', 
        side: 'top' as Side,
        onNextClick: () => {
            openFirstDrawer(); // Abre Drawer RRHH
            setTimeout(() => driverObj.current.moveNext(), 1000); 
        }
      } 
    },
    { 
      element: '#drawer-info-section', 
      popover: { 
        title: '📄 Documentos Laborales', 
        description: 'Desde aquí envía el RIT, Políticas de Hostigamiento y Contratos para firma digital.', 
        side: 'top' as Side
      } 
    },
    { 
      element: '#drawer-close-btn', 
      popover: { 
        title: 'Siguiente Módulo', 
        description: 'Cerramos y vamos a los módulos especiales.', 
        side: 'left' as Side,
        onNextClick: () => {
            closeDrawer();
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },

    // --- FASE 5: VIDA LEY Y CESADOS ---
    { 
      element: '#nav-vida_ley', 
      popover: { 
        title: 'b4. Trama Vida Ley', 
        description: 'Aquí gestiona la nómina para el seguro Vida Ley en formato Excel editable.', 
        side: 'right' as Side,
        onNextClick: () => {
            changeView('vida_ley');
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },
    { 
      // Sin elemento, centrado
      popover: { 
        title: '📊 Excel Integrado', 
        description: 'Esta vista permite editar masivamente los datos para exportarlos a la aseguradora.', 
      } 
    },
    { 
      element: '#nav-cesados', 
      popover: { 
        title: 'b5. Historial de Bajas', 
        description: 'Histórico de personal que ya no labora en la empresa.', 
        side: 'right' as Side,
        onNextClick: () => {
            changeView('cesados');
            setTimeout(() => driverObj.current.moveNext(), 800); 
        }
      } 
    },
    { 
      // Sin elemento, centrado
      popover: { 
        title: '🗄️ Archivo Muerto', 
        description: 'Aquí descansan los registros inactivos. Puede restaurarlos si un obrero reingresa.', 
        onNextClick: () => {
            // FIN DEL TOUR: Volvemos al Dashboard
            changeView('dashboard');
            setTimeout(() => driverObj.current.moveNext(), 800);
        }
      } 
    },

    // --- FINAL ---
    { 
      popover: { 
        title: '🎉 ¡Capacitación Completada!', 
        description: 'Ahora es un experto en el sistema RUAG. ¡Éxito en su gestión!', 
        align: 'center' 
      } 
    }
  ];

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.85)', 
      popoverClass: 'driverjs-theme', 
      nextBtnText: 'Siguiente ➜',
      prevBtnText: 'Atrás',
      doneBtnText: '¡Finalizar!',
      steps: tourSteps,
      onDestroyStarted: () => {
        if(!driverObj.current.hasNextStep() || driverObj.current.isLastStep()) {
             launchConfetti();
             changeView('dashboard'); 
        }
        driverObj.current.destroy();
      },
    })
  }, [changeView, openFirstDrawer, closeDrawer])

  const startTour = () => {
    changeView('dashboard'); 
    setTimeout(() => {
        window.scrollTo(0,0);
        driverObj.current.drive();
    }, 500);
  }

  return (
    <div className="px-4 mt-auto mb-4 w-full">
        <button 
            onClick={startTour}
            // COLOR CAMBIADO A GRIS OSCURO AZULADO (Menos brillante)
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50 shadow-lg transition-all group active:scale-95"
        >
            <div className="p-1.5 bg-slate-700/50 rounded-lg group-hover:bg-slate-600 transition-colors">
                <Map size={18} className="text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left leading-tight">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-400 transition-colors">Modo Guiado</p>
                <p className="text-sm font-bold">Capacitación</p>
            </div>
        </button>
    </div>
  )
}