'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { buildBiometricUpdate } from '@/utils/biometric'
import { UploadCloud, X, CheckCircle, AlertCircle, FileText, ScanFace, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BiometricBatchUpload({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  // Manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
      setLogs([])
      setProgress(0)
    }
  }

  // --- LÓGICA INTELIGENTE DE DISTRIBUCIÓN ---
  const processUploads = async () => {
    if (files.length === 0) return
    setUploading(true)
    setLogs([])
    
    let successCount = 0
    let errorCount = 0

    try {
        // 1. Obtener lista de trabajadores para validar DNI vs ID
        const { data: workers, error } = await supabase.from('fichas').select('id, dni, nombres, apellido_paterno')
        
        if (error || !workers) {
            throw new Error("No se pudo cargar la lista de trabajadores.")
        }

        const total = files.length

        for (let i = 0; i < total; i++) {
            const file = files[i]
            const fileName = file.name.toLowerCase()

            // A. Detectar DNI en el nombre (busca 8 dígitos seguidos)
            const dniMatch = fileName.match(/(\d{8})/)
            
            if (!dniMatch) {
                setLogs(prev => [`⚠️ "${file.name}": No detecté un DNI válido en el nombre.`, ...prev])
                errorCount++
                setProgress(Math.round(((i + 1) / total) * 100))
                continue
            }

            const dni = dniMatch[0]
            const worker = workers.find(w => w.dni === dni)

            if (!worker) {
                setLogs(prev => [`⚠️ DNI ${dni}: No existe ningún trabajador registrado con este DNI.`, ...prev])
                errorCount++
                setProgress(Math.round(((i + 1) / total) * 100))
                continue
            }

            // B. Detectar si es FIRMA o HUELLA
            let targetColumn = ''
            let folder = ''

            if (fileName.includes('firma') || fileName.includes('sign')) {
                targetColumn = 'firma_url'
                folder = 'firmas'
            } else if (fileName.includes('huella') || fileName.includes('finger')) {
                targetColumn = 'huella_url'
                folder = 'huellas'
            } else {
                setLogs(prev => [`❓ "${file.name}": No sé si es firma o huella. Agrega "_firma" o "_huella" al nombre.`, ...prev])
                errorCount++
                setProgress(Math.round(((i + 1) / total) * 100))
                continue
            }

            // C. Subir a Supabase Storage
            const ext = file.name.split('.').pop()
            const filePath = `${worker.id}/${folder}_${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('biometria')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                setLogs(prev => [`❌ ${dni}: Error subiendo imagen (${uploadError.message})`, ...prev])
                errorCount++
                continue
            }

            // D. Obtener URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('biometria')
                .getPublicUrl(filePath)

            // E. Actualizar Ficha del Trabajador
            const { error: dbError } = await supabase
                .from('fichas')
                .update(buildBiometricUpdate(targetColumn as 'firma_url' | 'huella_url', publicUrl))
                .eq('id', worker.id)

            if (dbError) {
                setLogs(prev => [`❌ ${dni}: Error actualizando base de datos`, ...prev])
                errorCount++
            } else {
                const tipo = targetColumn === 'firma_url' ? 'Firma' : 'Huella'
                setLogs(prev => [`✅ ${worker.nombres} ${worker.apellido_paterno}: ${tipo} actualizada.`, ...prev])
                successCount++
            }

            // Actualizar barra de progreso
            setProgress(Math.round(((i + 1) / total) * 100))
        }

        toast.success(`Proceso finalizado. ${successCount} archivos procesados correctamente.`)
        if (successCount > 0) onComplete()

    } catch (err: any) {
        toast.error("Error crítico: " + err.message)
    } finally {
        setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
        
        {/* ZONA DE ARRASTRE ÚNICA */}
        {!uploading && files.length === 0 ? (
            <label className="flex-1 border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors p-8">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-indigo-600">
                    <ScanFace size={40}/>
                </div>
                <h3 className="font-bold text-slate-800 text-xl mb-2">Importador Inteligente</h3>
                <p className="text-slate-500 text-sm text-center mb-6 max-w-sm">
                    Arrastra <strong>todas</strong> las fotos (firmas y huellas) aquí. 
                    El sistema leerá el nombre del archivo y las distribuirá automáticamente.
                </p>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 w-full max-w-xs">
                    <p className="font-bold mb-2 text-slate-800">Reglas de Nombres (Ejemplos):</p>
                    <ul className="space-y-1.5 list-disc pl-4">
                        <li><code className="bg-slate-100 px-1 rounded">12345678_firma.jpg</code> (Detecta Firma)</li>
                        <li><code className="bg-slate-100 px-1 rounded">12345678_huella.jpg</code> (Detecta Huella)</li>
                    </ul>
                </div>
                
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
        ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 px-1">
                    <div>
                        <h4 className="font-bold text-slate-800">Archivos en cola</h4>
                        <p className="text-xs text-slate-500">{files.length} imágenes detectadas</p>
                    </div>
                    {!uploading && (
                        <button onClick={() => setFiles([])} className="text-xs text-red-500 font-bold hover:underline">
                            Cancelar / Limpiar
                        </button>
                    )}
                </div>

                {uploading && (
                    <div className="mb-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex justify-between text-xs font-bold mb-2 text-blue-800">
                            <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Procesando e Inteligencia Artificial...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{width: `${progress}%`}}></div>
                        </div>
                    </div>
                )}

                <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-y-auto font-mono text-xs shadow-inner custom-scrollbar">
                    {logs.length === 0 && !uploading && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <FileText size={30} className="mb-2"/>
                            <p>Esperando confirmación...</p>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1.5 break-words">
                            {log.startsWith('✅') ? (
                                <span className="text-emerald-400">{log}</span>
                            ) : log.startsWith('❌') ? (
                                <span className="text-red-400">{log}</span>
                            ) : (
                                <span className="text-amber-400">{log}</span>
                            )}
                        </div>
                    ))}
                </div>

                {!uploading && (
                    <button 
                        onClick={processUploads}
                        className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <ScanFace size={20}/>
                        EJECUTAR DISTRIBUCIÓN AUTOMÁTICA
                    </button>
                )}
            </div>
        )}
    </div>
  )
}
