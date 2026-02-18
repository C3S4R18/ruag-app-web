'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Play, ShieldCheck, CheckCircle2, XCircle, 
  AlertTriangle, Loader2, ArrowRight, Timer, Lock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

// --- PREGUNTAS EXACTAS DEL EXAMEN (SG-FOR-57) ---
const QUESTIONS = [
  // PÁGINA 1
  { 
    id: 1, 
    question: "1. ¿Qué significa IPER?", 
    options: [
      "Identificación de Peligros y Evaluación de riesgos", // Correcta
      "Identificación de Riesgos y Evaluación de peligros",
      "Identificación de Peligros Y riesgos"
    ], 
    answer: 0 
  },
  { 
    id: 2, 
    question: "2. ¿Qué función cumple la línea de anclaje?", 
    options: [
      "Anclar y sujetar al trabajador a un punto fijo o línea de vida", // Correcta
      "Ayudar al trabajador durante el ascenso a determinado lugar",
      "Decorar el arnés de seguridad"
    ], 
    answer: 0 
  },
  { 
    id: 3, 
    question: "3. Trabajos en Altura, son todos aquellos que se realizan a una diferencia de nivel de:", 
    options: [
      "2,5 metros",
      "2,00 metros",
      "1,80 metros" // Correcta
    ], 
    answer: 2 
  },
  { 
    id: 4, 
    question: "4. ¿Cuál es el principal riesgo que encontramos en los trabajos en altura?", 
    options: [
      "Riesgo de explosión",
      "Riesgo de caída a diferente nivel", // Correcta
      "Riesgo de caída al mismo Nivel"
    ], 
    answer: 1 
  },
  { 
    id: 5, 
    question: "5. Es responsabilidad de los empleados:", 
    options: [
      "No inspeccionar los equipos previos al uso",
      "Retirar y colocar las guardas de protección de los equipos",
      "Usar y mantener los EPP/EPC en buen estado de conservación" // Correcta
    ], 
    answer: 2 
  },
  // RELLENO LÓGICO (Preguntas estándar SSOMA 6-14 para completar las 20)
  { 
    id: 6, 
    question: "6. Antes de iniciar una tarea crítica (altura, caliente, espacios confinados), se debe:", 
    options: [
      "Avisar verbalmente al compañero",
      "Firmar el Permiso de Trabajo de Alto Riesgo (PETAR) y ATS", // Correcta
      "Empezar rápido para terminar pronto"
    ], 
    answer: 1 
  },
  { 
    id: 7, 
    question: "7. ¿Qué EPP es fundamental para proteger la cabeza de caídas de objetos?", 
    options: [
      "Gorra de tela",
      "Casco de seguridad con barbiquejo", // Correcta
      "Capucha"
    ], 
    answer: 1 
  },
  { 
    id: 8, 
    question: "8. ¿Cuántas personas pueden trabajar simultáneamente sobre una escalera simple?", 
    options: [
      "Dos personas",
      "Solo una persona", // Correcta
      "Tres personas si son livianas"
    ], 
    answer: 1 
  },
  { 
    id: 9, 
    question: "9. En caso de sismo, la conducta correcta es:", 
    options: [
      "Correr gritando hacia la salida",
      "Mantener la calma y ubicarse en zonas de seguridad interna", // Correcta
      "Empujar a los compañeros"
    ], 
    answer: 1 
  },
  { 
    id: 10, 
    question: "10. Los residuos de metal, latas y cables se desechan en el contenedor de color:", 
    options: [
      "Amarillo", // Correcta (Metales)
      "Azul",
      "Rojo"
    ], 
    answer: 0 
  },
  { 
    id: 11, 
    question: "11. ¿Qué se debe hacer si observas una condición insegura en obra?", 
    options: [
      "Ignorarla para no tener problemas",
      "Reportarla inmediatamente al supervisor de seguridad", // Correcta
      "Tratar de arreglarla sin saber cómo"
    ], 
    answer: 1 
  },
  { 
    id: 12, 
    question: "12. El arnés de seguridad debe contar obligatoriamente con:", 
    options: [
      "Doble línea de vida (estrobo) con amortiguador de impacto", // Correcta
      "Una soga simple",
      "Cadenas metálicas"
    ], 
    answer: 0 
  },
  { 
    id: 13, 
    question: "13. ¿Para qué sirven los tapones auditivos u orejeras?", 
    options: [
      "Para que no entre polvo a los oídos",
      "Para proteger del ruido excesivo generado por equipos", // Correcta
      "Para no escuchar al supervisor"
    ], 
    answer: 1 
  },
  { 
    id: 14, 
    question: "14. El orden y limpieza en el área de trabajo sirve para:", 
    options: [
      "Prevenir accidentes como tropezones y caídas", // Correcta
      "Que se vea bonito solamente",
      "Perder tiempo barriendo"
    ], 
    answer: 0 
  },
  // PÁGINA 3 DEL PDF
  { 
    id: 15, 
    question: "15. Cuando el cable de una herramienta de poder presente cortes, debo:", 
    options: [
      "Realizar empalmes con cinta",
      "Cortar el tramo roto",
      "Cambiar de cable" // Correcta
    ], 
    answer: 2 
  },
  { 
    id: 16, 
    question: "16. De acuerdo al rombo NFPA 704, ¿qué color representa la INFLAMABILIDAD?", 
    options: [
      "Azul",
      "Amarillo",
      "Rojo" // Correcta
    ], 
    answer: 2 
  },
  { 
    id: 17, 
    question: "17. Se llaman así a las herramientas fabricadas artesanalmente, sin certificación. Su uso está prohibido:", 
    options: [
      "Herramientas hechizas", // Correcta
      "Herramientas de fábrica",
      "Ninguna de las anteriores"
    ], 
    answer: 0 
  },
  { 
    id: 18, 
    question: "18. Respecto de las cajas de herramientas, ¿Se pueden guardar objetos personales?", 
    options: [
      "Verdadero",
      "Falso" // Correcta
    ], 
    answer: 1 
  },
  { 
    id: 19, 
    question: "19. Son causas comunes de accidentes con herramientas:", 
    options: [
      "Uso adecuado de herramientas",
      "Uso de herramientas en buen estado",
      "Falta de inspecciones diarias de pre uso de herramientas" // Correcta
    ], 
    answer: 2 
  },
  { 
    id: 20, 
    question: "20. La seguridad en obra es tarea de:", 
    options: [
      "Solo el prevencionista",
      "Solo el ingeniero residente",
      "Todos los trabajadores (Responsabilidad compartida)" // Correcta
    ], 
    answer: 2 
  }
]

export default function InduccionPage() {
  const supabase = createClient()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Ref para controlar el envío a BD sin re-renderizar
  const lastSavedProgress = useRef(0) 

  const [step, setStep] = useState<'welcome' | 'video' | 'exam' | 'result'>('welcome')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([]) 
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- 1. CARGA INICIAL INTELIGENTE ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      // Consultar el estado actual de la ficha
      const { data: ficha } = await supabase
        .from('fichas')
        .select('video_progress, ssoma_completed, examen_nota')
        .eq('user_id', user.id)
        .single()

      if (ficha) {
          // LÓGICA DE REDIRECCIÓN AUTOMÁTICA
          
          // CASO A: YA APROBÓ EL CURSO (Permanencia)
          if (ficha.ssoma_completed === true) {
              setScore(ficha.examen_nota || 20)
              setStep('result')
          } 
          // CASO B: VIDEO COMPLETADO PERO NO APROBADO AÚN (Saltar video)
          else if (ficha.video_progress === 100) {
              setVideoProgress(100)
              setVideoEnded(true)
              setStep('welcome') // Se queda en welcome, pero el botón dirá "IR AL EXAMEN"
          }
          // CASO C: EN PROGRESO O NUEVO
          else {
              setVideoProgress(ficha.video_progress || 0)
              setStep('welcome')
          }
      }
      
      setLoading(false)
    }
    checkUser()
  }, [])

  // --- LÓGICA DE SINCRONIZACIÓN ROBUSTA (VIDEO) ---
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (step === 'video' && !videoEnded && user) {
        // Ejecutar cada 2 segundos
        interval = setInterval(async () => {
            if (videoRef.current && !videoRef.current.paused) {
                const current = videoRef.current.currentTime
                const total = videoRef.current.duration || 1
                const pct = Math.floor((current / total) * 100)

                // Guardar en BD si avanza
                if (pct > lastSavedProgress.current && pct < 100) {
                    lastSavedProgress.current = pct
                    // Actualización "Fire and Forget"
                    supabase.from('fichas')
                        .update({ video_progress: pct })
                        .eq('user_id', user.id)
                        .then(({ error }) => {
                             if(error) console.error("Error sync video:", error)
                        })
                }
            }
        }, 2000)
    }
    return () => clearInterval(interval)
  }, [step, videoEnded, user])

  // Handler Visual
  const handleVideoTimeUpdate = () => {
     if (videoRef.current) {
         const current = videoRef.current.currentTime
         const total = videoRef.current.duration || 1
         const pct = (current / total) * 100
         setVideoProgress(pct)
     }
  }

  const handleVideoEnded = async () => {
      setVideoEnded(true)
      setVideoProgress(100)
      if (user) {
        await supabase.from('fichas').update({ video_progress: 100 }).eq('user_id', user.id)
      }
      toast.success("Video completado. Iniciando examen...")
      setTimeout(() => setStep('exam'), 1500)
  }

  const handleAnswer = (optionIndex: number) => {
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = optionIndex
      setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
      if (currentQuestion < QUESTIONS.length - 1) {
          setCurrentQuestion(c => c + 1)
      } else {
          finishExam()
      }
  }

  const finishExam = async () => {
      setIsSubmitting(true)
      let correctCount = 0
      QUESTIONS.forEach((q, idx) => { if (answers[idx] === q.answer) correctCount++ })
      
      const finalScore = correctCount 
      setScore(finalScore)
      const approved = finalScore >= 14
      
      try {
          if (user) {
              await supabase.from('fichas').update({
                  examen_nota: finalScore,
                  ssoma_completed: approved,
                  video_progress: 100 // Asegurar que quede en 100
              }).eq('user_id', user.id)
          }

          setStep('result')
          
          if (approved) {
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#059669'] })
              new Audio('/upload_success.mp3').play().catch(()=> {})
          }
      } catch (error) { toast.error("Error al guardar resultados") } finally { setIsSubmitting(false) }
  }

  // --- LÓGICA DE REPETICIÓN (CASTIGO) ---
  const handleRetry = async () => {
      setLoading(true)
      // Resetear estados locales
      setStep('video') 
      setVideoEnded(false)
      setVideoProgress(0)
      lastSavedProgress.current = 0 
      setAnswers([])
      setCurrentQuestion(0)
      
      // Resetear BD (Obligatorio ver video de nuevo)
      if (user) {
          await supabase.from('fichas').update({ 
              video_progress: 0, 
              examen_nota: null, 
              ssoma_completed: false 
          }).eq('user_id', user.id)
      }
      setLoading(false)
  }

  // Función para iniciar desde el Welcome (inteligente)
  const handleStart = () => {
      if (videoProgress === 100) {
          setStep('exam') // Si ya vio el video, directo al examen
      } else {
          setStep('video') // Si no, al video
      }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" size={40}/></div>

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-white overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Fondo Animado */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <ShieldCheck className="text-emerald-400" size={24}/>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">Inducción SSOMA</h1>
                    <p className="text-xs text-slate-400">Sistema de Seguridad RUAG</p>
                </div>
            </div>
            {step === 'exam' && (
                <div className="px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-sm font-bold flex items-center gap-2 text-indigo-300">
                    <Timer size={16}/>
                    {currentQuestion + 1} / {QUESTIONS.length}
                </div>
            )}
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 flex items-center justify-center">
            <AnimatePresence mode='wait'>
                
                {/* --- PASO 1: BIENVENIDA --- */}
                {step === 'welcome' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
                        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl relative z-10">
                            {videoProgress === 100 ? <CheckCircle2 className="text-emerald-400" size={32}/> : <Play className="text-emerald-400 fill-emerald-400/20" size={32} />}
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-4 text-white relative z-10">
                            {videoProgress === 100 ? 'Listo para el Examen' : 'Inducción Obligatoria'}
                        </h2>
                        
                        <div className="text-slate-400 mb-8 text-sm leading-relaxed relative z-10 space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${videoProgress === 100 ? 'bg-emerald-500' : 'bg-blue-400'}`}></div> 
                                {videoProgress === 100 ? 'Video Completado' : 'Video de Seguridad (13:12 min)'}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Examen de 20 preguntas
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Aprobación mínima: <strong>14/20</strong>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleStart}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-base relative z-10 flex items-center justify-center gap-2 group-hover:gap-3"
                        >
                            {videoProgress === 100 ? 'COMENZAR EXAMEN' : 'VER VIDEO'} <ArrowRight size={18}/>
                        </button>
                    </motion.div>
                )}

                {/* --- PASO 2: VIDEO PLAYER --- */}
                {step === 'video' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full max-w-5xl"
                    >
                        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group ring-4 ring-slate-900/50">
                            <video 
                                ref={videoRef}
                                src="/videos/induccion_ssoma.mp4" 
                                className="w-full h-full object-cover"
                                onTimeUpdate={handleVideoTimeUpdate}
                                onEnded={handleVideoEnded}
                                controls={false} 
                                onContextMenu={(e) => e.preventDefault()}
                                autoPlay
                                playsInline
                            />

                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent pt-20">
                                <div className="mb-3 flex justify-between text-xs font-bold text-slate-300 uppercase tracking-widest">
                                    <span>{videoEnded ? "Completado" : "Reproduciendo..."}</span>
                                    <span>{Math.round(videoProgress)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{ width: `${videoProgress}%` }}
                                    />
                                </div>
                            </div>
                            
                            {!videoEnded && videoRef.current?.paused && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => videoRef.current?.play()}>
                                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 transition-transform hover:bg-white/20">
                                        <Play size={48} className="text-white fill-white ml-2" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- PASO 3: EXAMEN --- */}
                {step === 'exam' && (
                    <motion.div 
                        key="exam"
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        className="max-w-2xl w-full"
                    >
                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-white border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                                    style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="mb-8 mt-4">
                                <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-100">
                                    {QUESTIONS[currentQuestion].question}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden ${answers[currentQuestion] === idx ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-slate-200'}`}
                                    >
                                        <span className="font-medium text-sm md:text-base relative z-10">{option}</span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 ${answers[currentQuestion] === idx ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                                            {answers[currentQuestion] === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
                                <button 
                                    onClick={handleNextQuestion}
                                    disabled={answers[currentQuestion] === undefined}
                                    className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {currentQuestion === QUESTIONS.length - 1 ? (isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Finalizar Examen') : <>Siguiente <ArrowRight size={18}/></>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- PASO 4: RESULTADO --- */}
                {step === 'result' && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full text-center"
                    >
                        <div className={`rounded-3xl p-10 shadow-2xl border-4 backdrop-blur-xl relative overflow-hidden ${score >= 14 ? 'bg-slate-900/80 border-emerald-500/50' : 'bg-slate-900/80 border-red-500/50'}`}>
                            
                            <div className={`absolute inset-0 opacity-20 ${score >= 14 ? 'bg-emerald-500' : 'bg-red-500'} blur-3xl`}></div>

                            <div className="relative z-10">
                                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg border-4 ${score >= 14 ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
                                    {score >= 14 ? <CheckCircle2 size={48}/> : <XCircle size={48}/>}
                                </div>
                                
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                    {score >= 14 ? '¡APROBADO!' : 'REPROBADO'}
                                </h2>
                                
                                <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">Nota Final</p>
                                
                                <div className="text-7xl font-black text-white mb-8 tracking-tighter flex items-end justify-center gap-2">
                                    {score}<span className="text-3xl text-slate-500 font-bold mb-2">/20</span>
                                </div>

                                {score >= 14 ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-300 text-sm font-medium border border-emerald-500/20">
                                            Inducción completada. Ya estás habilitado para ingresar a obra.
                                        </div>
                                        <button 
                                            onClick={() => router.push('/dashboard')}
                                            className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                                        >
                                            IR AL DASHBOARD
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-500/10 rounded-xl text-red-300 text-sm font-medium border border-red-500/20 flex items-center gap-3 text-left">
                                            <AlertTriangle className="shrink-0" size={20}/>
                                            <span>Necesitas 14 para aprobar. Debes repetir la inducción.</span>
                                        </div>
                                        <button 
                                            onClick={handleRetry}
                                            className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4"/> REPETIR TODO
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// Icono auxiliar para botón de repetir
import { RefreshCw } from 'lucide-react'