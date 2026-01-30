'use client'
import { useRef, useState, useEffect } from 'react'
import { Eraser, Save, Check, PenTool, RefreshCw } from 'lucide-react'

interface BiometricSignatureProps {
  onSave: (data: string) => Promise<void>;
  onClear: () => Promise<void>; // Nueva prop para borrar de BD
  existingSignature?: string | null;
}

export default function BiometricSignature({ onSave, onClear, existingSignature }: BiometricSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentSignature, setCurrentSignature] = useState<string | null>(existingSignature || null)
  const [loading, setLoading] = useState(false)

  // Sincronizar estado si cambia la prop
  useEffect(() => {
     setCurrentSignature(existingSignature || null)
  }, [existingSignature])

  // --- LÓGICA DE DIBUJO (CANVAS / WACOM FALLBACK) ---
  const startDrawing = (e: any) => {
    if (currentSignature) return // Si ya hay firma, no dejar dibujar encima sin borrar
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'
    setIsDrawing(true)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.lineTo(x, y); ctx.stroke()
  }

  const stopDrawing = () => { 
      setIsDrawing(false); 
      const canvas = canvasRef.current; 
      canvas?.getContext('2d')?.closePath() 
  }

  // --- GUARDAR EN BD ---
  const handleSaveInternal = async () => {
      const canvas = canvasRef.current
      if(canvas) {
          setLoading(true)
          const dataUrl = canvas.toDataURL('image/png')
          await onSave(dataUrl)
          setCurrentSignature(dataUrl)
          setLoading(false)
      }
  }

  // --- BORRAR DE BD Y LIMPIAR PANTALLA ---
  const handleClearInternal = async () => {
      setLoading(true)
      await onClear() // Borra de Supabase
      setCurrentSignature(null) // Limpia visualmente
      
      // Limpiar Canvas
      const canvas = canvasRef.current; 
      if(canvas) canvas.getContext('2d')?.clearRect(0,0, canvas.width, canvas.height)
      setLoading(false)
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-4">
        {/* ESTADO VISUAL */}
        <div className="mb-4 flex items-center justify-between w-full max-w-[600px]">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <PenTool size={18}/> Wacom STU-540 / Pantalla
            </h3>
            {currentSignature ? (
                <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14}/> FIRMA REGISTRADA
                </span>
            ) : (
                <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold">
                    PENDIENTE DE FIRMA
                </span>
            )}
        </div>

        {/* AREA DE FIRMA */}
        <div className="relative w-full max-w-[600px] aspect-video bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner">
            {currentSignature ? (
                <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
                    <img src={currentSignature} className="w-full h-full object-contain p-4" alt="Firma" />
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
                         <p className="font-bold text-slate-500 bg-white/80 px-4 py-2 rounded-lg shadow-sm">Firma Bloqueada</p>
                    </div>
                </div>
            ) : (
                <canvas 
                    ref={canvasRef} width={600} height={350}
                    className="w-full h-full touch-none cursor-crosshair bg-white"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                />
            )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4 mt-6 w-full justify-center">
            {currentSignature ? (
                <button 
                    onClick={handleClearInternal} 
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
                >
                    {loading ? "Borrando..." : <><RefreshCw size={18}/> BORRAR Y REPETIR FIRMA</>}
                </button>
            ) : (
                <>
                    <button onClick={() => {
                        const canvas = canvasRef.current; 
                        if(canvas) canvas.getContext('2d')?.clearRect(0,0, canvas.width, canvas.height)
                    }} className="px-4 py-2 text-slate-400 hover:text-slate-600 font-bold text-sm">
                        <Eraser size={16} className="inline mr-1"/> Limpiar Lienzo
                    </button>
                    <button 
                        onClick={handleSaveInternal} 
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                    >
                        {loading ? "Guardando..." : <><Save size={18}/> GUARDAR FIRMA</>}
                    </button>
                </>
            )}
        </div>
    </div>
  )
}