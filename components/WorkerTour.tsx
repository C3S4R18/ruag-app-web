'use client'

import { useEffect, useRef } from 'react'
import { driver, type Alignment, type DriveStep, type Side } from 'driver.js'
import 'driver.js/dist/driver.css'
import { Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import AdminGifIcon from '@/components/AdminGifIcon'

export type WorkerTab = 'home' | 'documents' | 'uploads' | 'lectura' | 'profile'

interface WorkerTourProps {
  changeTab: (tab: WorkerTab) => void
  setSidebar: (open: boolean) => void
}

function getScrollableAncestors(element: HTMLElement) {
  const ancestors: HTMLElement[] = []
  let current = element.parentElement
  while (current) {
    const styles = window.getComputedStyle(current)
    const canScroll =
      /(auto|scroll|overlay)/.test(`${styles.overflowY} ${styles.overflowX}`) &&
      (current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth)
    if (canScroll) ancestors.push(current)
    current = current.parentElement
  }
  return ancestors
}

function scrollElementIntoView(element?: Element) {
  if (!element || !(element instanceof HTMLElement)) return
  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    for (const container of getScrollableAncestors(element)) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const targetTop =
        elementRect.top - containerRect.top + container.scrollTop -
        container.clientHeight / 2 + elementRect.height / 2
      container.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
    }
  })
}

export default function WorkerTour({ changeTab, setSidebar }: WorkerTourProps) {
  const driverObj = useRef<any>(null)
  const isMobile = useRef(false)

  const launchConfetti = () => {
    const end = Date.now() + 1800
    ;(function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  // Ejecuta una acción y AVANZA solo cuando el obrero toca "Siguiente".
  const actThenNext = (fn: () => void, delay = 550) => ({
    onNextClick: () => {
      fn()
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

  const buildSteps = (mobile: boolean): DriveStep[] => {
    // Lado del popover: en móvil el sidebar entra desde la izquierda, así que
    // el popover va a la derecha del item; en escritorio igual.
    const navSide: Side = 'right'

    const welcome: DriveStep = {
      popover: {
        title: '¡Bienvenido a tu Portal RUAG! 👷',
        description: 'Te voy a mostrar paso a paso cómo usar la app. Mira el recuadro que ilumina cada botón y toca "Siguiente" para avanzar.',
        align: 'center' as Alignment,
        ...actThenNext(() => changeTab('home'))
      }
    }

    const homeNav: DriveStep = {
      element: '#wt-home',
      popover: {
        title: 'Inicio',
        description: 'Este botón te lleva a tu pantalla principal: tu bienvenida, tu progreso de documentos y los accesos rápidos.',
        side: navSide,
        align: 'start' as Alignment,
        ...(mobile ? actThenNext(() => { setSidebar(false); changeTab('home') }, 650) : {})
      }
    }

    const ficha: DriveStep = {
      element: '#wt-ficha',
      popover: {
        title: 'Aquí está tu Ficha',
        description: 'Tu ficha personal está dentro del Inicio. Aquí ves y actualizas tus datos: nombre, DNI, obra y cargo. Mantenla siempre al día.',
        side: 'top' as Side,
        align: 'center' as Alignment,
        ...(mobile ? actThenNext(() => setSidebar(true), 500) : {})
      }
    }

    const documentsNav: DriveStep = {
      element: '#wt-documents',
      popover: {
        title: 'Mis Registros',
        description: 'Aquí firmas tus documentos: las actas y registros de seguridad (SSOMA) y de RRHH que el administrador habilita para ti.',
        side: navSide
      }
    }

    const uploadsNav: DriveStep = {
      element: '#wt-uploads',
      popover: {
        title: 'Archivos SSOMA',
        description: 'Aquí subes tus documentos: DNI, exámenes médicos, certificados. El sistema los revisa y los guarda en tu legajo.',
        side: navSide
      }
    }

    const lecturaNav: DriveStep = {
      element: '#wt-lectura',
      popover: {
        title: 'Lectura Obligatoria',
        description: 'Aquí están los documentos que DEBES leer y descargar. Cada descarga queda registrada con fecha y hora como evidencia.',
        side: navSide
      }
    }

    const profileNav: DriveStep = {
      element: '#wt-profile',
      popover: {
        title: 'Mi Perfil',
        description: 'Aquí configuras tu cuenta: tu correo, tu contraseña y tu foto de perfil. Vamos a entrar para ver cómo cambiar la foto.',
        side: navSide,
        ...actThenNext(() => { if (mobile) setSidebar(false); changeTab('profile') }, 650)
      }
    }

    const photoBtn: DriveStep = {
      element: '#wt-photo-btn',
      popover: {
        title: 'Cambiar tu foto de perfil',
        description: 'Toca este botón. Se abre un editor donde eliges la imagen, la recortas, la giras y la acercas. Al guardar, tu foto aparece en tu perfil y para el administrador.',
        side: 'top' as Side,
        align: 'center' as Alignment
      }
    }

    const finish: DriveStep = {
      popover: {
        title: '¡Listo! 🎉',
        description: 'Ya conoces tu portal: Inicio y tu Ficha, Mis Registros para firmar, Archivos SSOMA para subir, Lectura Obligatoria para leer, y Mi Perfil para tu foto. ¡Vuelve a esta guía cuando quieras!',
        align: 'center' as Alignment,
        ...actThenNext(() => { if (mobile) setSidebar(false); changeTab('home') }, 400)
      }
    }

    if (mobile) {
      const menu: DriveStep = {
        element: '#wt-menu',
        popover: {
          title: 'Tu menú',
          description: 'Este es el botón del menú. Tócalo para abrir tu navegación lateral. Lo abro para mostrarte cada sección.',
          side: 'bottom' as Side,
          align: 'start' as Alignment,
          ...actThenNext(() => setSidebar(true), 600)
        }
      }
      return [welcome, menu, homeNav, ficha, documentsNav, uploadsNav, lecturaNav, profileNav, photoBtn, finish]
    }

    return [welcome, homeNav, ficha, documentsNav, uploadsNav, lecturaNav, profileNav, photoBtn, finish]
  }

  const makeDriver = (mobile: boolean) => {
    const steps = buildSteps(mobile).map(attachAutoScroll)
    return driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 12,
      overlayColor: 'rgba(15, 23, 42, 0.78)',
      popoverClass: 'driverjs-theme',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Finalizar',
      steps,
      onDestroyStarted: () => {
        if (!driverObj.current?.hasNextStep() || driverObj.current?.isLastStep()) {
          launchConfetti()
        }
        try { localStorage.setItem('worker_tour_seen', '1') } catch {}
        setSidebar(false)
        changeTab('home')
        driverObj.current?.destroy()
      }
    })
  }

  useEffect(() => {
    // El tutorial sale OBLIGATORIO la primera vez; luego ya no.
    let seen = '1'
    try { seen = localStorage.getItem('worker_tour_seen') || '' } catch {}
    if (!seen) {
      const t = setTimeout(() => startTour(), 1100)
      return () => { clearTimeout(t); driverObj.current?.destroy?.() }
    }
    return () => { driverObj.current?.destroy?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTour = () => {
    isMobile.current = typeof window !== 'undefined' && window.innerWidth < 1024
    changeTab('home')
    if (!isMobile.current) setSidebar(true)
    driverObj.current = makeDriver(isMobile.current)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      driverObj.current?.drive()
    }, 450)
  }

  return (
    <button
      onClick={startTour}
      title="Guía guiada · Cómo usar la app"
      className="group w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/40 transition-all duration-200 shadow-sm"
    >
      <AdminGifIcon name="capacitacion.gif" size={34} variant="bare" />
      <div className="flex-1 text-left min-w-0">
        <p className="text-[12.5px] font-bold text-slate-900 leading-tight truncate">Guía de uso</p>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">Tour paso a paso del portal</p>
      </div>
      <span className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 group-hover:bg-emerald-100 transition-colors">
        <Sparkles size={10} />
        Iniciar
      </span>
    </button>
  )
}
