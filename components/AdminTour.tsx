'use client'

import { useEffect, useRef } from 'react'
import { driver, type Alignment, type DriveStep, type Side } from 'driver.js'
import 'driver.js/dist/driver.css'
import { Compass, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface AdminTourProps {
  changeView: (view: 'dashboard' | 'biometria' | 'documentos' | 'rrhh' | 'vida_ley' | 'cesados' | 'profile') => void
  openFirstDrawer: () => void
  closeDrawer: () => void
}

function getScrollableAncestors(element: HTMLElement) {
  const ancestors: HTMLElement[] = []
  let current = element.parentElement

  while (current) {
    const styles = window.getComputedStyle(current)
    const overflowY = styles.overflowY
    const overflowX = styles.overflowX
    const canScroll =
      /(auto|scroll|overlay)/.test(`${overflowY} ${overflowX}`) &&
      (current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth)

    if (canScroll) {
      ancestors.push(current)
    }

    current = current.parentElement
  }

  return ancestors
}

function scrollElementIntoView(element?: Element) {
  if (!element || !(element instanceof HTMLElement)) return

  requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })

    for (const container of getScrollableAncestors(element)) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const targetTop =
        elementRect.top -
        containerRect.top +
        container.scrollTop -
        container.clientHeight / 2 +
        elementRect.height / 2

      container.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth'
      })
    }
  })
}

export default function AdminTour({ changeView, openFirstDrawer, closeDrawer }: AdminTourProps) {
  const driverObj = useRef<any>(null)

  const launchConfetti = () => {
    const end = Date.now() + 1800

    ;(function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  const goToViewStep = (
    view: 'dashboard' | 'biometria' | 'documentos' | 'rrhh' | 'vida_ley' | 'cesados' | 'profile',
    delay = 850
  ) => ({
    onNextClick: () => {
      changeView(view)
      setTimeout(() => driverObj.current?.moveNext(), delay)
    }
  })

  const openDrawerStep = (delay = 950) => ({
    onNextClick: () => {
      openFirstDrawer()
      setTimeout(() => driverObj.current?.moveNext(), delay)
    }
  })

  const closeDrawerStep = (delay = 700) => ({
    onNextClick: () => {
      closeDrawer()
      setTimeout(() => driverObj.current?.moveNext(), delay)
    }
  })

  const attachAutoScroll = (step: DriveStep): DriveStep => ({
    ...step,
    onHighlightStarted: (element, currentStep, opts) => {
      step.onHighlightStarted?.(element, currentStep, opts)
      scrollElementIntoView(element)
    },
    onHighlighted: (element, currentStep, opts) => {
      step.onHighlighted?.(element, currentStep, opts)
      scrollElementIntoView(element)
    }
  })

  const baseTourSteps: DriveStep[] = [
    {
      element: '#tour-welcome',
      popover: {
        title: 'Panel principal',
        description: 'Este es el centro operativo. Desde aqui controlas personal, estados de ficha, alertas y accesos a los modulos principales.',
        side: 'bottom' as Side,
        align: 'start' as Alignment
      }
    },
    {
      element: '#tour-stats',
      popover: {
        title: 'Indicadores rapidos',
        description: 'Te sirven para leer el estado general del sistema en segundos: cantidad de personal, administradores y conexion activa.',
        side: 'bottom' as Side
      }
    },
    {
      element: '#tour-search',
      popover: {
        title: 'Buscador',
        description: 'Usalo cuando necesites ubicar a un trabajador por nombre, apellido o DNI sin recorrer toda la tabla.',
        side: 'bottom' as Side
      }
    },
    {
      element: '#tour-filters',
      popover: {
        title: 'Filtros',
        description: 'Permiten separar por obra o por estado para enfocarte solo en pendientes, completados o grupos especificos.',
        side: 'left' as Side
      }
    },
    {
      element: '#tour-notifications',
      popover: {
        title: 'Notificaciones',
        description: 'Aqui llegan firmas nuevas, mensajes, cambios de ficha y eventos que requieren seguimiento del admin.',
        side: 'left' as Side,
        align: 'start' as Alignment
      }
    },
    {
      element: '#tour-audio',
      popover: {
        title: 'Audio del sistema',
        description: 'Activalo si quieres escuchar alertas en tiempo real cuando entren firmas, mensajes o cambios importantes.',
        side: 'left' as Side
      }
    },
    {
      element: '#tour-import',
      popover: {
        title: 'Importacion masiva',
        description: 'Sirve para registrar varios trabajadores de una sola vez y ahorrar carga manual.',
        side: 'bottom' as Side
      }
    },
    {
      element: '#nav-biometria',
      popover: {
        title: 'Modulo de biometria',
        description: 'Aqui revisas firma digital y huella. Entra cuando necesites completar o corregir evidencia biometrica.',
        side: 'right' as Side,
        ...goToViewStep('biometria')
      }
    },
    {
      element: '#tour-biometria-grid',
      popover: {
        title: 'Tarjetas de biometria',
        description: 'Cada tarjeta resume si el trabajador tiene firma y huella. Verde significa completo; gris indica faltantes.',
        side: 'top' as Side
      }
    },
    {
      element: '#tour-worker-card',
      popover: {
        title: 'Detalle biometrico',
        description: 'Al tocar una tarjeta abres el panel del trabajador para registrar, reemplazar o eliminar firma y huella.',
        side: 'right' as Side,
        ...openDrawerStep()
      }
    },
    {
      popover: {
        title: 'Panel de captura',
        description: 'Dentro del panel puedes guardar firma, subir huella y comprobar que todo se vea correctamente antes de salir.',
        ...closeDrawerStep()
      }
    },
    {
      element: '#nav-documentos',
      popover: {
        title: 'Gestion SSOMA',
        description: 'Este modulo sirve para habilitar, bloquear, imprimir y revisar documentos de seguridad y salud ocupacional.',
        side: 'right' as Side,
        ...goToViewStep('documentos')
      }
    },
    {
      element: '#tour-docs-list',
      popover: {
        title: 'Tabla operativa',
        description: 'Cada fila es un trabajador. Desde aqui seleccionas personal, imprimes documentos y abres expedientes individuales.',
        side: 'top' as Side
      }
    },
    {
      element: '#tour-docs-list',
      popover: {
        title: 'Expediente digital',
        description: 'Abrimos un expediente para revisar datos, adjuntos, firma y acciones de validacion desde un solo lugar.',
        side: 'top' as Side,
        ...openDrawerStep()
      }
    },
    {
      element: '#drawer-header',
      popover: {
        title: 'Cabecera del trabajador',
        description: 'Confirma aqui que estas revisando a la persona correcta antes de editar, validar o imprimir.',
        side: 'bottom' as Side
      }
    },
    {
      element: '#drawer-info-section',
      popover: {
        title: 'Contenido del expediente',
        description: 'Aqui revisas datos personales, documentos adjuntos, firma y controles del flujo antes de cerrar o reabrir la ficha.',
        side: 'top' as Side
      }
    },
    {
      element: '#drawer-close-btn',
      popover: {
        title: 'Cerrar expediente',
        description: 'Cierra el panel cuando termines la revision y vuelve a la lista general del modulo.',
        side: 'left' as Side,
        ...closeDrawerStep()
      }
    },
    {
      element: '#nav-rrhh',
      popover: {
        title: 'Gestion RRHH',
        description: 'Usa este modulo para documentos laborales, cargos internos y revision de adjuntos de recursos humanos.',
        side: 'right' as Side,
        ...goToViewStep('rrhh')
      }
    },
    {
      element: '#tour-docs-list',
      popover: {
        title: 'Flujo RRHH',
        description: 'El flujo es parecido a SSOMA, pero enfocado en documentos laborales. Abrimos un expediente para verlo.',
        side: 'top' as Side,
        ...openDrawerStep()
      }
    },
    {
      element: '#drawer-info-section',
      popover: {
        title: 'Revision laboral',
        description: 'Desde aqui puedes validar informacion, revisar adjuntos y dejar listo el expediente del trabajador.',
        side: 'top' as Side
      }
    },
    {
      element: '#drawer-close-btn',
      popover: {
        title: 'Continuar recorrido',
        description: 'Cerramos este panel para pasar a los modulos especiales del sistema.',
        side: 'left' as Side,
        ...closeDrawerStep()
      }
    },
    {
      element: '#nav-vida_ley',
      popover: {
        title: 'Vida Ley',
        description: 'Aqui concentras la nomina y datos necesarios para el seguimiento administrativo del seguro Vida Ley.',
        side: 'right' as Side,
        ...goToViewStep('vida_ley')
      }
    },
    {
      popover: {
        title: 'Trabajo masivo',
        description: 'Esta vista es util cuando necesitas revisar, corregir o exportar informacion en bloque.'
      }
    },
    {
      element: '#nav-cesados',
      popover: {
        title: 'Cesados',
        description: 'Aqui quedan archivados los trabajadores inactivos. Sirve para consulta historica o restauracion en caso de reingreso.',
        side: 'right' as Side,
        ...goToViewStep('cesados')
      }
    },
    {
      popover: {
        title: 'Cierre del recorrido',
        description: 'Ya tienes el mapa del sistema. La idea es que siempre sepas donde revisar, donde corregir y donde validar cada proceso.',
        onNextClick: () => {
          changeView('dashboard')
          setTimeout(() => driverObj.current?.moveNext(), 750)
        }
      }
    },
    {
      popover: {
        title: 'Capacitacion completada',
        description: 'Ya tienes una ruta clara del panel: dashboard para monitoreo, biometria para evidencia, SSOMA y RRHH para gestion, y modulos especiales para seguimiento.',
        align: 'center' as Alignment
      }
    }
  ]

  const tourSteps = baseTourSteps.map(attachAutoScroll)

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: true,
      overlayColor: 'rgba(15, 23, 42, 0.85)',
      popoverClass: 'driverjs-theme',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atras',
      doneBtnText: 'Finalizar',
      steps: tourSteps,
      onDestroyStarted: () => {
        if (!driverObj.current?.hasNextStep() || driverObj.current?.isLastStep()) {
          launchConfetti()
          changeView('dashboard')
        }
        driverObj.current?.destroy()
      }
    })
  }, [changeView, openFirstDrawer, closeDrawer])

  const startTour = () => {
    changeView('dashboard')
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      driverObj.current?.drive()
    }, 500)
  }

  return (
    <div className="px-3 pb-3">
      <button
        onClick={startTour}
        className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-800/60 hover:border-sky-500/40 hover:to-sky-900/30 transition-all duration-200 shadow-md"
      >
        <div className="shrink-0 w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-300">
          <Compass size={18} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-bold text-white leading-tight truncate">Capacitación Guiada</p>
          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">Tour interactivo del sistema</p>
        </div>
        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 text-[10px] font-bold border border-sky-400/20 group-hover:bg-sky-500/25 transition-colors">
          <Sparkles size={10} />
          Iniciar
        </span>
      </button>
    </div>
  )
}
