'use client'
import { useState, useEffect } from 'react'
import { Fingerprint, Check, ScanLine, Loader2, RefreshCw, Trash2 } from 'lucide-react'

interface BiometricFingerprintProps {
  onSave: (data: string) => Promise<void>;
  onClear: () => Promise<void>; // Nueva prop para borrar
  existingFingerprint?: string | null;
}

export default function BiometricFingerprint({ onSave, onClear, existingFingerprint }: BiometricFingerprintProps) {
    const [scanning, setScanning] = useState(false)
    const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(existingFingerprint || null)

    // Detectar si ya existe al cargar
    useEffect(() => {
        setCurrentFingerprint(existingFingerprint || null)
    }, [existingFingerprint])

    const handleScan = () => {
        setScanning(true)
        // NOTA IMPORTANTE PARA HID DIGITALPERSONA 5300:
        // Aquí debes integrar el SDK de DigitalPersona ('dpUareU').
        // Normalmente el SDK escucha eventos. Aquí simulamos la captura exitosa.
        
        setTimeout(async () => {
            // Simulamos Base64 de la huella
            const dummyData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" 
            
            await onSave(dummyData) // Guardar en BD
            setCurrentFingerprint(dummyData)
            setScanning(false)
        }, 2000)
    }

    const handleClearInternal = async () => {
        if(!confirm("¿Estás seguro de borrar la huella registrada?")) return
        setScanning(true)
        await onClear()
        setCurrentFingerprint(null)
        setScanning(false)
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-8 gap-6 text-center">
            
            {/* ÍCONO CENTRAL */}
            <div className={`relative w-40 h-40 rounded-3xl flex items-center justify-center border-4 transition-all ${
                currentFingerprint 
                ? 'border-emerald-500 bg-emerald-50' 
                : scanning ? 'border-blue-500 bg-blue-50 animate-pulse' : 'border-slate-200 bg-slate-50'
            }`}>
                <Fingerprint size={80} className={
                    currentFingerprint ? 'text-emerald-600' : scanning ? 'text-blue-500' : 'text-slate-300'
                } />
                
                {scanning && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50}/></div>}
                
                {currentFingerprint && (
                    <div className="absolute -bottom-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <Check size={12}/> CAPTURADA
                    </div>
                )}
            </div>
            
            {/* TEXTOS */}
            <div>
                <h3 className="text-xl font-bold text-slate-800">
                    {currentFingerprint ? 'Huella Registrada Correctamente' : 'Lector HID DigitalPersona 5300'}
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[250px] mx-auto">
                    {currentFingerprint 
                        ? 'La huella ya se encuentra en la base de datos.' 
                        : 'Coloque el dedo índice del trabajador en el lector para escanear.'}
                </p>
            </div>

            {/* BOTONES */}
            <div className="mt-4">
                {currentFingerprint ? (
                    <button 
                        onClick={handleClearInternal}
                        disabled={scanning}
                        className="px-8 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold flex items-center gap-3 hover:bg-red-50 transition-all shadow-sm"
                    >
                        {scanning ? 'Procesando...' : <><Trash2 size={20}/> BORRAR HUELLA</>}
                    </button>
                ) : (
                    <button 
                        onClick={handleScan} 
                        disabled={scanning}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50"
                    >
                        {scanning ? 'Escaneando...' : <><ScanLine size={20}/> ACTIVAR LECTOR</>}
                    </button>
                )}
            </div>
        </div>
    )
}