'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, HardHat, ShieldCheck, CheckCircle, PenTool, Play, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import SignatureCanvas from 'react-signature-canvas'
import { createClient } from '@/utils/supabase/client'

export default function InduccionWorker({ workerData, onFinish }: any) {
  const [step, setStep] = useState(1)
  const [checks, setChecks] = useState({ video: false, epps: false, iperc: false })
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const sigPad = useRef<any>(null)
  const supabase = createClient()
  
  // Simulamos carga de EPPs según el cargo (Inteligencia)
  const epps = [
    { nombre: 'Casco de Seguridad', tipo: 'Básico' },
    { nombre: 'Zapatos de Seguridad', tipo: 'Básico' },
    { nombre: 'Chaleco / Ropa', tipo: 'Ropa' }
  ]

  // --- SIMULACIÓN DE VIDEO QUE AVANZA ---
  useEffect(() => {
    if (step === 1 && !videoCompleted) {
        const interval = setInterval(() => {
            setVideoProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setVideoCompleted(true)
                    toast.success("Video completado. Ahora puedes continuar.")
                    return 100
                }
                return prev + 1 // Avanza 1% cada 50ms (aprox 5 seg total para demo)
            })
        }, 50) 
        return () => clearInterval(interval)
    }
  }, [step, videoCompleted])

  const handleSign = async () => {
    if (sigPad.current?.isEmpty()) { toast.error("La firma es obligatoria"); return }
    
    setSaving(true)
    const signature = sigPad.current.getTrimmedCanvas().toDataURL('image/png')

    try {
        // GUARDADO REAL EN LA NUEVA COLUMNA
        const { error } = await supabase
            .from('fichas')
            .update({ 
                ssoma_completed: true, // <--- ESTO ES LO IMPORTANTE
                ssoma_updated_at: new Date().toISOString(),
                // url_firma_ssoma: signature // Si tuvieras columna aparte, sino usa la genérica
            })
            .eq('id', workerData.id)

        if (error) throw error

        toast.success("Inducción registrada correctamente")
        setTimeout(() => {
            onFinish() 
        }, 1000)

    } catch (error: any) {
        toast.error("Error al guardar: " + error.message)
    } finally {
        setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-3xl mx-auto my-10 animate-in fade-in zoom-in duration-300">
      
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-emerald-400"/> Inducción SSOMA</h2>
        <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">Paso {step}/3</span>
      </div>

      <div className="p-8">
        
        {/* PASO 1: VIDEO OBLIGATORIO */}
        {step === 1 && (
            <div className="flex flex-col items-center text-center space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Inducción de Seguridad</h3>
                    <p className="text-slate-500">Debes ver todo el video para continuar.</p>
                </div>
                
                {/* REPRODUCTOR SIMULADO */}
                <div className="w-full aspect-video bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border-4 border-slate-100 group">
                    {!videoCompleted ? (
                        <>
                            <p className="text-white/80 font-bold z-10">Reproduciendo Inducción...</p>
                            <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-75" style={{width: `${videoProgress}%`}}></div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-emerald-400 animate-in zoom-in">
                            <CheckCircle size={48}/>
                            <span className="font-bold mt-2">Video Completado</span>
                        </div>
                    )}
                </div>

                <label className={`flex items-center gap-4 p-4 border rounded-xl w-full text-left transition-all ${videoCompleted ? 'cursor-pointer hover:bg-slate-50 opacity-100' : 'opacity-50 cursor-not-allowed bg-slate-50'}`}>
                    <input 
                        type="checkbox" 
                        checked={checks.video} 
                        onChange={e => setChecks({...checks, video: e.target.checked})} 
                        disabled={!videoCompleted} // BLOQUEADO HASTA QUE TERMINE EL VIDEO
                        className="w-6 h-6 accent-blue-600"
                    />
                    <span className="font-bold text-slate-700">Declaro bajo juramento haber visto y entendido el video.</span>
                </label>

                <button 
                    onClick={() => setStep(2)} 
                    disabled={!checks.video} 
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                >
                    Continuar
                </button>
            </div>
        )}

        {/* PASO 2: EPPs */}
        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                    <HardHat className="text-blue-600 shrink-0"/>
                    <div>
                        <h3 className="font-bold text-blue-800">Entrega de EPPs</h3>
                        <p className="text-sm text-blue-600">Equipos asignados a tu cargo: <strong>{workerData.cargo || 'GENERAL'}</strong></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {epps.map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                            <span className="font-bold text-slate-700">{e.nombre}</span>
                            <CheckCircle size={20} className="text-emerald-500"/>
                        </div>
                    ))}
                </div>

                <label className="flex items-center gap-4 p-4 border-2 border-dashed border-emerald-300 bg-emerald-50/30 rounded-xl w-full cursor-pointer text-left">
                    <input type="checkbox" checked={checks.epps} onChange={e => setChecks({...checks, epps: e.target.checked})} className="w-5 h-5 accent-emerald-600"/>
                    <span className="text-sm font-bold text-emerald-800">Confirmo la recepción de estos equipos en buen estado.</span>
                </label>

                <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50">Atrás</button>
                    <button onClick={() => setStep(3)} disabled={!checks.epps} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg">Confirmar y Firmar</button>
                </div>
            </div>
        )}

        {/* PASO 3: FIRMA */}
        {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-8">
                <h3 className="text-xl font-bold text-slate-800">Firma de Conformidad</h3>
                <p className="text-slate-500 text-sm">Al firmar aceptas los términos de la inducción y la recepción de EPPs.</p>
                
                <div className="border-2 border-slate-300 border-dashed rounded-2xl bg-slate-50 relative overflow-hidden h-64 touch-none mx-auto w-full">
                    <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full cursor-crosshair'}} />
                    <button onClick={() => sigPad.current?.clear()} className="absolute top-2 right-2 text-xs bg-white border px-2 py-1 rounded hover:bg-red-50 text-red-500 font-bold shadow-sm">Borrar</button>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50">Atrás</button>
                    <button onClick={handleSign} disabled={saving} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin"/> : <><CheckCircle/> FINALIZAR PROCESO</>}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  )
}