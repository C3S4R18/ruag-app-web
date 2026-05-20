'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Move, Crop, RefreshCcw, Check, X } from 'lucide-react'

/* ────────────────────────────────────────────────────────────────────
 *  PhotoEditor — editor cuadrado de fotos con pan / zoom / rotate.
 *
 *  - Recibe un Blob (la foto cruda capturada o subida).
 *  - El usuario arrastra para mover, usa slider para hacer zoom y los
 *    botones para rotar 90°.
 *  - Devuelve un Blob JPEG 720x720 con la composición renderizada.
 * ──────────────────────────────────────────────────────────────────── */

interface PhotoEditorProps {
    sourceBlob: Blob
    onCancel: () => void
    onDone: (out: Blob, previewUrl: string) => void
    /** Lado en px del canvas de salida (output). */
    outputSize?: number
    /** Lado en px del viewport visual (UI). */
    viewportSize?: number
}

export default function PhotoEditor({
    sourceBlob,
    onCancel,
    onDone,
    outputSize = 720,
    viewportSize = 320,
}: PhotoEditorProps) {
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    const [scale, setScale] = useState(1) // multiplicador aplicado sobre el fit base
    const [rotation, setRotation] = useState(0) // 0/90/180/270
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [working, setWorking] = useState(false)

    // Drag state
    const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const previewUrlRef = useRef<string | null>(null)

    /* ── Cargar imagen base ── */
    useEffect(() => {
        const url = URL.createObjectURL(sourceBlob)
        previewUrlRef.current = url
        const img = new Image()
        img.onload = () => {
            setImage(img)
            setScale(1)
            setRotation(0)
            setOffset({ x: 0, y: 0 })
        }
        img.onerror = () => {
            console.error('No se pudo cargar la imagen')
        }
        img.src = url
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        }
    }, [sourceBlob])

    /* ── Cálculo del tamaño "fit" dentro del viewport (la mínima escala
         que rellena el cuadrado completo, considerando rotación). ── */
    const baseFit = useCallback(() => {
        if (!image) return 1
        // Después de rotar 90/270 los lados se intercambian
        const rotated = rotation % 180 !== 0
        const w = rotated ? image.height : image.width
        const h = rotated ? image.width : image.height
        // Para que el cuadrado del viewport quede totalmente cubierto.
        return Math.max(viewportSize / w, viewportSize / h)
    }, [image, rotation, viewportSize])

    /* ── Pan: drag handlers ── */
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        target.setPointerCapture(e.pointerId)
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            baseX: offset.x,
            baseY: offset.y,
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy })
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {}
        }
        dragRef.current = null
    }

    /* ── Wheel para zoom ── */
    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        const next = scale * (e.deltaY < 0 ? 1.08 : 0.92)
        setScale(Math.max(1, Math.min(4, next)))
    }

    /* ── Render del canvas con la composición final. ── */
    const renderOutput = useCallback(async (): Promise<Blob> => {
        if (!image) throw new Error('Sin imagen')
        const canvas = document.createElement('canvas')
        canvas.width = outputSize
        canvas.height = outputSize
        const ctx = canvas.getContext('2d')!

        // Fondo blanco por si hay zonas que el zoom + drag dejaron vacías.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, outputSize, outputSize)

        const scaleFactor = outputSize / viewportSize
        const fit = baseFit()
        const drawScale = fit * scale * scaleFactor

        ctx.save()
        // Mover al centro del canvas y aplicar offset del usuario (escalado al output)
        ctx.translate(
            outputSize / 2 + offset.x * scaleFactor,
            outputSize / 2 + offset.y * scaleFactor,
        )
        ctx.rotate((rotation * Math.PI) / 180)
        // Dibujamos centrada en el origen, tras la traslación
        const drawW = image.width * drawScale
        const drawH = image.height * drawScale
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('toBlob falló'))),
                'image/jpeg',
                0.9,
            )
        })
    }, [image, offset.x, offset.y, rotation, scale, outputSize, viewportSize, baseFit])

    const handleDone = async () => {
        try {
            setWorking(true)
            const blob = await renderOutput()
            const url = URL.createObjectURL(blob)
            onDone(blob, url)
        } catch (e) {
            console.error(e)
        } finally {
            setWorking(false)
        }
    }

    const reset = () => {
        setScale(1)
        setRotation(0)
        setOffset({ x: 0, y: 0 })
    }

    /* ── Render ── */
    const fit = baseFit()
    const drawScale = fit * scale
    const displayedW = image ? image.width * drawScale : 0
    const displayedH = image ? image.height * drawScale : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            {/* VIEWPORT */}
            <div
                ref={viewportRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                className="relative mx-auto select-none overflow-hidden bg-slate-900 ring-1 ring-slate-200 rounded-2xl cursor-grab active:cursor-grabbing"
                style={{ width: viewportSize, height: viewportSize, touchAction: 'none' }}
            >
                {image && (
                    <img
                        src={previewUrlRef.current ?? ''}
                        alt=""
                        draggable={false}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: displayedW,
                            height: displayedH,
                            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                            pointerEvents: 'none',
                            willChange: 'transform',
                        }}
                    />
                )}

                {/* Overlay guía circular */}
                <div className="absolute inset-4 rounded-full border-2 border-white/40 pointer-events-none" />
                {/* Cruz central */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-px h-6 bg-white/35" />
                    <div className="absolute h-px w-6 bg-white/35" />
                </div>
                {/* Hint inferior */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 bg-slate-900/40 backdrop-blur px-2.5 py-1 rounded-full pointer-events-none">
                    <Move size={11} /> Arrastra
                </div>
            </div>

            {/* ZOOM SLIDER */}
            <div className="mt-5 flex items-center gap-3">
                <button
                    onClick={() => setScale((s) => Math.max(1, s * 0.9))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Alejar"
                >
                    <ZoomOut size={16} />
                </button>
                <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.01}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-500"
                />
                <button
                    onClick={() => setScale((s) => Math.min(4, s * 1.1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Acercar"
                >
                    <ZoomIn size={16} />
                </button>
            </div>

            {/* CONTROLES ROTACIÓN */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                    <RotateCcw size={14} /> -90°
                </button>
                <button
                    onClick={reset}
                    className="py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                    <RefreshCcw size={14} /> Reset
                </button>
                <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                    <RotateCw size={14} /> +90°
                </button>
            </div>

            {/* ACCIONES */}
            <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                    onClick={onCancel}
                    className="py-3 flex items-center justify-center gap-2 text-[12px] font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                    <X size={14} /> Cancelar
                </button>
                <button
                    onClick={handleDone}
                    disabled={working || !image}
                    className="py-3 flex items-center justify-center gap-2 text-[12px] font-bold rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition disabled:opacity-60"
                >
                    {working ? (
                        <>Procesando…</>
                    ) : (
                        <>
                            <Crop size={14} /> Aplicar recorte
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    )
}
