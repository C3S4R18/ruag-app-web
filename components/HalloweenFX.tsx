'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isHalloween } from '@/utils/season'

/**
 * Capa decorativa de octubre para toda la web (portal del obrero, login y
 * panel admin). Se monta una sola vez en el layout raíz.
 *
 *  - Pone la clase `halloween` en <html>: globals.css redefine ahí los
 *    colores esmeralda/teal de Tailwind, así todo lo verde se vuelve
 *    calabaza sin tocar los componentes.
 *  - Dibuja murciélagos, telarañas, araña y niebla en una capa fija que
 *    no captura clics (pointer-events: none).
 *
 * Fuera de octubre no renderiza nada y quita la clase: el 1 de noviembre
 * la web vuelve sola al diseño normal.
 */
export default function HalloweenFX() {
    const pathname = usePathname() || '/'
    const [activo, setActivo] = useState(false)

    useEffect(() => {
        const on = isHalloween()
        setActivo(on)
        document.documentElement.classList.toggle('halloween', on)
        return () => document.documentElement.classList.remove('halloween')
    }, [])

    // El panel admin es herramienta de trabajo: decoración más discreta.
    const esAdmin = pathname.startsWith('/admin')

    const murcielagos = useMemo(() => {
        const n = esAdmin ? 2 : 6
        // Pseudo-aleatorio estable para no re-sortear en cada render.
        return Array.from({ length: n }, (_, i) => {
            const r = (k: number) => ((Math.sin((i + 1) * 9301 + k * 49297) + 1) / 2)
            return {
                top: 6 + r(1) * (esAdmin ? 18 : 46),       // % de altura
                escala: 0.55 + r(2) * 0.8,
                duracion: 14 + r(3) * 16,                   // s cruzando
                retraso: -r(4) * 30,                        // arrancan repartidos
                aleteo: 0.22 + r(5) * 0.18,                 // s por aleteo
                onda: 10 + r(6) * 26,                       // px de vaivén
            }
        })
    }, [esAdmin])

    if (!activo) return null

    return (
        <div aria-hidden className="ruag-hw-layer">
            <style>{CSS}</style>

            {/* Telarañas de esquina */}
            <Telarana className="ruag-hw-web ruag-hw-web--left" />
            <Telarana className="ruag-hw-web ruag-hw-web--right" flip />

            {/* Araña colgando (sólo fuera del admin) */}
            {!esAdmin && (
                <div className="ruag-hw-spider">
                    <span className="ruag-hw-thread" />
                    <Arana />
                </div>
            )}

            {/* Murciélagos */}
            {murcielagos.map((m, i) => (
                <div
                    key={i}
                    className="ruag-hw-bat-track"
                    style={{
                        top: `${m.top}%`,
                        animationDuration: `${m.duracion}s`,
                        animationDelay: `${m.retraso}s`,
                    }}
                >
                    <div
                        className="ruag-hw-bat-bob"
                        style={{ ['--onda' as any]: `${m.onda}px`, animationDuration: `${m.duracion / 4}s` }}
                    >
                        <Murcielago escala={m.escala} aleteo={m.aleteo} />
                    </div>
                </div>
            ))}

            {/* Niebla baja (no en admin: taparía tablas) */}
            {!esAdmin && <div className="ruag-hw-fog" />}
        </div>
    )
}

/* ─── Dibujos SVG ──────────────────────────────────────────────────────── */

function Murcielago({ escala, aleteo }: { escala: number; aleteo: number }) {
    return (
        <svg
            width={46 * escala}
            height={22 * escala}
            viewBox="0 0 46 22"
            className="ruag-hw-bat"
            style={{ animationDuration: `${aleteo}s` }}
        >
            <path
                fill="currentColor"
                d="M23 8 L21 4 L20 8 C16 4 9 2 2 5 C5 6 6 8 6 10 C9 9 12 10 13 12 C15 11 18 12 19 14 C20 13 21.5 13 23 15 C24.5 13 26 13 27 14 C28 12 31 11 33 12 C34 10 37 9 40 10 C40 8 41 6 44 5 C37 2 30 4 26 8 L25 4 L23 8 Z"
            />
        </svg>
    )
}

function Telarana({ className, flip }: { className: string; flip?: boolean }) {
    // Radios y anillos de un cuarto de círculo desde la esquina.
    const radios = 7
    const anillos = 5
    const R = 150
    const lineas: string[] = []
    for (let i = 0; i <= radios; i++) {
        const a = (Math.PI / 2) * (i / radios)
        lineas.push(`M0 0L${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)}`)
    }
    for (let r = 1; r <= anillos; r++) {
        const rad = R * (r / (anillos + 0.4))
        let d = ''
        for (let i = 0; i <= radios; i++) {
            const a = (Math.PI / 2) * (i / radios)
            // Cada tramo se combea un poco hacia la esquina, como tela real.
            const x = rad * Math.cos(a)
            const y = rad * Math.sin(a)
            d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `Q${(x * 0.92).toFixed(1)} ${(y * 0.92).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
        }
        lineas.push(d)
    }
    return (
        <svg
            className={className}
            viewBox="0 0 150 150"
            style={flip ? { transform: 'scaleX(-1)' } : undefined}
        >
            <path d={lineas.join(' ')} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
    )
}

function Arana() {
    return (
        <svg width="34" height="30" viewBox="0 0 34 30">
            <g stroke="#17101F" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M17 15 L4 8 M17 15 L2 15 M17 15 L4 23" />
                <path d="M17 15 L30 8 M17 15 L32 15 M17 15 L30 23" />
            </g>
            <circle cx="17" cy="15" r="7.5" fill="#17101F" />
            <circle cx="14.2" cy="13.4" r="1.6" fill="#FF7A1A" />
            <circle cx="19.8" cy="13.4" r="1.6" fill="#FF7A1A" />
        </svg>
    )
}

/* ─── Estilos (sólo existen mientras la capa está montada) ─────────────── */

const CSS = `
.ruag-hw-layer {
  position: fixed;
  inset: 0;
  z-index: 45;
  pointer-events: none;
  overflow: hidden;
}

.ruag-hw-web {
  position: absolute;
  top: 0;
  width: 150px;
  height: 150px;
  color: rgba(100, 85, 120, 0.22);
}
.ruag-hw-web--left { left: 0; }
.ruag-hw-web--right { right: 0; }

.ruag-hw-spider {
  position: absolute;
  top: 0;
  right: 118px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: top center;
  animation: ruag-hw-swing 3.4s ease-in-out infinite alternate;
}
.ruag-hw-thread {
  width: 1px;
  height: 92px;
  background: linear-gradient(to bottom, rgba(120,110,140,0.1), rgba(120,110,140,0.55));
  animation: ruag-hw-drop 5.5s ease-in-out infinite alternate;
}

.ruag-hw-bat-track {
  position: absolute;
  left: 0;
  animation-name: ruag-hw-fly;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.ruag-hw-bat-bob {
  animation-name: ruag-hw-bob;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
.ruag-hw-bat {
  display: block;
  color: rgba(23, 16, 31, 0.72);
  transform-origin: center 30%;
  animation-name: ruag-hw-flap;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.ruag-hw-fog {
  position: absolute;
  left: -20%;
  right: -20%;
  bottom: -40px;
  height: 140px;
  background:
    radial-gradient(ellipse at 20% 60%, rgba(124, 58, 237, 0.10), transparent 60%),
    radial-gradient(ellipse at 70% 70%, rgba(255, 122, 26, 0.07), transparent 60%);
  animation: ruag-hw-fog 22s linear infinite alternate;
}

@keyframes ruag-hw-fly {
  from { transform: translateX(-10vw); }
  to   { transform: translateX(110vw); }
}
@keyframes ruag-hw-bob {
  from { transform: translateY(calc(var(--onda) * -1)); }
  to   { transform: translateY(var(--onda)); }
}
@keyframes ruag-hw-flap {
  from { transform: scaleY(1); }
  to   { transform: scaleY(0.35); }
}
@keyframes ruag-hw-swing {
  from { transform: rotate(-6deg); }
  to   { transform: rotate(6deg); }
}
@keyframes ruag-hw-drop {
  from { height: 70px; }
  to   { height: 118px; }
}
@keyframes ruag-hw-fog {
  from { transform: translateX(-6%); }
  to   { transform: translateX(6%); }
}

/* Accesibilidad: quien pidió menos movimiento ve la decoración quieta. */
@media (prefers-reduced-motion: reduce) {
  .ruag-hw-layer * { animation: none !important; }
  .ruag-hw-bat-track { display: none; }
}

/* Pantallas chicas: menos ruido. */
@media (max-width: 640px) {
  .ruag-hw-web { width: 96px; height: 96px; }
  .ruag-hw-spider { right: 64px; }
}

@media print {
  .ruag-hw-layer { display: none; }
}
`
