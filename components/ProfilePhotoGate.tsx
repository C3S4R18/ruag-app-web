'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Camera, ImagePlus, RotateCcw, Loader2, CheckCircle2, ScanFace } from 'lucide-react'
import PhotoEditor from './PhotoEditor'

/* ──────────────────────────────────────────────────────────────────────
 *  ProfilePhotoGate
 *
 *  Modal full-screen blocking. Aparece cuando el usuario no tiene
 *  `foto_perfil_url` en su ficha. Permite:
 *   1. Tomar foto con la cámara (getUserMedia)
 *   2. Elegir foto de la galería (input file)
 *  Sube a Supabase Storage (bucket worker-photos / {uid}/perfil.jpg) y
 *  guarda la URL pública en fichas.foto_perfil_url.
 *
 *  Estilo: editorial / moderno / animado. Coherente con el portal obrero.
 * ──────────────────────────────────────────────────────────────────── */

interface ProfilePhotoGateProps {
    userId: string
    workerName: string
    onUploaded: (url: string) => void
    /** Si true, el usuario puede cerrar el modal sin subir (modo "editar"). */
    dismissible?: boolean
    onDismiss?: () => void
}

type Step = 'choose' | 'camera' | 'editing' | 'preview' | 'uploading' | 'done'

export default function ProfilePhotoGate({ userId, workerName, onUploaded, dismissible = false, onDismiss }: ProfilePhotoGateProps) {
    const supabase = createClient()
    const [step, setStep] = useState<Step>('choose')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
    const [rawBlob, setRawBlob] = useState<Blob | null>(null) // foto cruda antes del editor
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

    const videoRef = useRef<HTMLVideoElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    /* ── Cámara ── */
    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
        try {
            setCameraError(null)
            if (stream) stream.getTracks().forEach((t) => t.stop())
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
                audio: false,
            })
            setStream(newStream)
            setFacingMode(mode)
            if (videoRef.current) {
                videoRef.current.srcObject = newStream
                await videoRef.current.play().catch(() => null)
            }
        } catch (err: any) {
            setCameraError(err?.message ?? 'No se pudo acceder a la cámara')
            toast.error('Cámara no disponible', { description: 'Usa la opción de galería.' })
            setStep('choose')
        }
    }

    useEffect(() => {
        if (step === 'camera') startCamera()
        else if (stream) {
            stream.getTracks().forEach((t) => t.stop())
            setStream(null)
        }
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    const captureFromCamera = () => {
        if (!videoRef.current) return
        const video = videoRef.current
        // Captura la imagen completa del video (sin crop) — el usuario
        // recorta luego en el editor.
        const w = video.videoWidth || 720
        const h = video.videoHeight || 720
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        // Si es selfie, espejamos (para que coincida con lo que ve el usuario)
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, w, h)
        canvas.toBlob(
            (blob) => {
                if (!blob) return
                setRawBlob(blob)
                setStep('editing')
            },
            'image/jpeg',
            0.95,
        )
    }

    const handleFile = (file: File) => {
        // Llevamos el archivo crudo al editor sin pre-recortar.
        setRawBlob(file)
        setStep('editing')
    }

    const upload = async () => {
        if (!previewBlob) return
        setStep('uploading')
        try {
            const path = `${userId}/perfil.jpg`
            const { error: upErr } = await supabase.storage
                .from('worker-photos')
                .upload(path, previewBlob, {
                    contentType: 'image/jpeg',
                    upsert: true,
                    cacheControl: '3600',
                })
            if (upErr) throw upErr

            const { data: pub } = supabase.storage.from('worker-photos').getPublicUrl(path)
            // cache-bust
            const finalUrl = `${pub.publicUrl}?t=${Date.now()}`

            const { error: updErr } = await supabase
                .from('fichas')
                .update({ foto_perfil_url: finalUrl })
                .eq('user_id', userId)
            if (updErr) throw updErr

            setStep('done')
            toast.success('Foto guardada', { description: 'Tu foto de perfil se subió correctamente.' })
            // pequeño delay para mostrar el check
            setTimeout(() => onUploaded(finalUrl), 900)
        } catch (e: any) {
            toast.error('No se pudo subir la foto', { description: e?.message ?? 'Intenta nuevamente.' })
            setStep('preview')
        }
    }

    /* ── Render ── */
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-slate-900/30 overflow-hidden border border-white/40"
            >
                {/* HEADER */}
                <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15">
                            <ScanFace size={20} className="text-emerald-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">{dismissible ? 'Editar foto' : 'Paso obligatorio'}</p>
                            <h2 className="text-[18px] font-black tracking-tight leading-tight">Tu foto de perfil</h2>
                        </div>
                        {dismissible && onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-white/80 transition"
                                title="Cerrar"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="relative z-10 mt-3 text-[13px] leading-relaxed text-slate-300">
                        Hola{workerName ? `, ${workerName.split(' ')[0]}` : ''}. Antes de continuar
                        necesitamos una foto formal tuya — la usará el administrador para identificarte.
                    </p>
                </div>

                {/* BODY */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {step === 'choose' && (
                            <motion.div
                                key="choose"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                <button
                                    onClick={() => setStep('camera')}
                                    className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                                        <Camera size={22} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[14px] font-bold text-slate-900">Tomar foto</p>
                                        <p className="text-[12px] text-slate-500">Usa la cámara ahora</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md group-hover:scale-105 transition-transform">
                                        <ImagePlus size={22} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[14px] font-bold text-slate-900">Subir desde galería</p>
                                        <p className="text-[12px] text-slate-500">JPG, PNG · hasta 10 MB</p>
                                    </div>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleFile(f)
                                        e.target.value = ''
                                    }}
                                />

                                <p className="text-center text-[11px] text-slate-400 pt-2">
                                    Tu foto sólo es visible para el administrador.
                                </p>
                            </motion.div>
                        )}

                        {step === 'camera' && (
                            <motion.div
                                key="camera"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-slate-200">
                                    <video
                                        ref={videoRef}
                                        playsInline
                                        muted
                                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                    />
                                    {/* Guía facial circular */}
                                    <div className="absolute inset-6 rounded-full border-2 border-white/40 pointer-events-none" />
                                    {cameraError && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm p-4 text-center">
                                            {cameraError}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setStep('choose')}
                                        className="py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={captureFromCamera}
                                        className="py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-slate-900 text-white shadow hover:-translate-y-0.5 transition"
                                    >
                                        Capturar
                                    </button>
                                    <button
                                        onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
                                        className="py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Voltear
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'editing' && rawBlob && (
                            <motion.div
                                key="editing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <PhotoEditor
                                    sourceBlob={rawBlob}
                                    onCancel={() => {
                                        setRawBlob(null)
                                        setStep('choose')
                                    }}
                                    onDone={(blob, url) => {
                                        setPreviewBlob(blob)
                                        setPreviewUrl(url)
                                        setStep('preview')
                                    }}
                                />
                            </motion.div>
                        )}

                        {(step === 'preview' || step === 'uploading') && previewUrl && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    {step === 'uploading' && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                            <Loader2 className="animate-spin mb-3" size={32} />
                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Subiendo foto…</p>
                                        </div>
                                    )}
                                </div>

                                {step === 'preview' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => {
                                                if (rawBlob) {
                                                    setStep('editing')
                                                } else {
                                                    setPreviewUrl(null)
                                                    setPreviewBlob(null)
                                                    setStep('choose')
                                                }
                                            }}
                                            className="py-3 flex items-center justify-center gap-1 text-[11px] font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPreviewUrl(null)
                                                setPreviewBlob(null)
                                                setRawBlob(null)
                                                setStep('choose')
                                            }}
                                            className="py-3 flex items-center justify-center gap-1 text-[11px] font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <RotateCcw size={12} /> Otra
                                        </button>
                                        <button
                                            onClick={upload}
                                            className="py-3 flex items-center justify-center gap-1 text-[11px] font-bold rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220 }}
                                className="flex flex-col items-center text-center py-6"
                            >
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 size={36} />
                                </div>
                                <p className="mt-4 text-[16px] font-bold text-slate-900">¡Listo!</p>
                                <p className="text-[12px] text-slate-500 mt-1">Tu foto quedó guardada.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
