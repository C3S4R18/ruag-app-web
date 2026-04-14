'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getSignatureUrl } from '@/utils/biometric'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import jsPDF from 'jspdf'
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Wallet,
  HardHat, ShieldCheck, PenTool, Eraser, Users, FileBadge, Plus, Trash2, Lock, Hammer, FileText, Download, Image as ImageIcon, UploadCloud, RefreshCw, X, Calendar, Eye, RotateCw, Wand2, ArrowRight, PlayCircle
} from 'lucide-react'
import Link from 'next/link'
import DocumentPreviewModal from './DocumentPreviewModal'

// --- ESTRUCTURA DE PASOS ---
const STEPS = [
  { id: 1, title: 'Personal', icon: <User size={18} /> },
  { id: 2, title: 'Familia', icon: <Users size={18} /> },
  { id: 3, title: 'Laboral', icon: <HardHat size={18} /> },
  { id: 4, title: 'Documentos', icon: <FileBadge size={18} /> },
  { id: 5, title: 'Firma', icon: <PenTool size={18} /> },
]

export default function FichaForm() {
  const supabase = createClient()
  const sigPad = useRef<any>(null)
   
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sending, setSending] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [declaracionAceptada, setDeclaracionAceptada] = useState(false)

  // --- ESTADO COMPLETO ---
  const [formData, setFormData] = useState<any>({
    id: null,
    // DATOS PERSONALES
    apellido_paterno: '', apellido_materno: '', nombres: '',
    fecha_nacimiento: '', dni: '', direccion: '', distrito: '', provincia: '', departamento: '',
    correo: '', celular: '',
    
    // PENSIONES Y BANCO
    sistema_pension: '', afp_nombre: '', cuspp: '',
    banco: '', cuenta_ahorros: '', cci: '',
    
    // FAMILIA
    esposa_datos: { paterno: '', materno: '', nombres: '', dni: '' },
    hijos_datos: [], 
    
    // LABORAL
    categoria: '', cargo: '', nombre_obra: '', fecha_ingreso: '',
    nivel_educativo: '', carrera: '', centro_formacion: '',
    
    // EMERGENCIA
    emergencia_nombre: '', emergencia_parentesco: '', emergencia_telefono: '',
    
    // DOCUMENTOS
    doc_dni_trabajador: '', 
    // doc_dni_reverso: '', // ELIMINADO
    doc_certiadulto: '', 
    doc_policiales: '', doc_penales: '',
    doc_carnet_retcc: '',
    doc_esposa_matrimonio: '', doc_esposa_dni: '',
    doc_hijos_nacimiento: '', doc_hijos_dni: '', doc_hijos_estudios: '',
    
    // FIRMA
    url_firma: ''
  })
  
  // Estado local para Inducción (para mostrar en el dashboard)
  const [induccionState, setInduccionState] = useState({
      videoProgress: 0,
      examenNota: null as number | null,
      ssomaCompleted: false
  })

  const isDniPdf = formData.doc_dni_trabajador && formData.doc_dni_trabajador.toLowerCase().includes('.pdf');

  // Carga inicial
  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingData(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: ficha } = await supabase.from('fichas').select('*').eq('user_id', user.id).maybeSingle()
        if (ficha) {
            let esposaObj = { paterno: '', materno: '', nombres: '', dni: '' }
            let hijosArr: any[] = []
            try { esposaObj = ficha.esposa ? JSON.parse(ficha.esposa) : esposaObj } catch(e) {}
            try { hijosArr = ficha.hijos ? JSON.parse(ficha.hijos) : [] } catch(e) {}

            setFormData({
                ...formData,
                ...ficha,
                esposa_datos: esposaObj,
                hijos_datos: hijosArr,
                cuenta_ahorros: ficha.numero_cuenta || ficha.cuenta_ahorros,
                nivel_educativo: ficha.nivel_educacion || ficha.nivel_educativo,
                centro_formacion: ficha.universidad || ficha.centro_formacion,
                emergencia_parentesco: ficha.emergencia_relacion || ficha.emergencia_parentesco,
                emergencia_telefono: ficha.emergencia_celular || ficha.emergencia_telefono,
                
                // Mapeo Correcto de URLs
                doc_dni_trabajador: ficha.url_dni_frontal, 
                doc_certiadulto: ficha.url_antecedentes,
                doc_carnet_retcc: ficha.url_carnet,
                doc_policiales: ficha.url_policiales,
                doc_penales: ficha.url_penales,
                doc_esposa_matrimonio: ficha.url_acta_matrimonio,
                doc_esposa_dni: ficha.url_esposa_dni, 
                doc_hijos_nacimiento: ficha.url_hijos_nacimiento,
                doc_hijos_dni: ficha.url_hijos_dni, 
                doc_hijos_estudios: ficha.url_constancia_estudios,
                url_firma: getSignatureUrl(ficha)
            })
            
            // Cargar estado de inducción
            setInduccionState({
                videoProgress: ficha.video_progress || 0,
                examenNota: ficha.examen_nota,
                ssomaCompleted: ficha.ssoma_completed || false
            })
            
            // --- CORRECCIÓN CLAVE: Si ya está completado, bloquear inmediatamente ---
            if (ficha.estado === 'completado') {
                setIsCompleted(true)
                setHasStarted(true) // Saltar pantalla de bienvenida si ya terminó
            }
        } else {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (profile) setFormData((prev:any) => ({...prev, nombres: profile.nombres, apellido_paterno: profile.apellido_paterno, apellido_materno: profile.apellido_materno, dni: profile.dni, celular: profile.telefono, correo: user.email}))
        }
        
        supabase.channel('my-ficha').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas', filter: `user_id=eq.${user.id}` }, (payload) => {
            if(payload.new.estado === 'pendiente') { 
                setIsCompleted(false)
                toast.info("Edición habilitada") 
            }
            else if (payload.new.estado === 'completado') {
                setIsCompleted(true)
            }
            
            // Actualizar estado inducción en tiempo real
            if (payload.new.video_progress !== undefined || payload.new.examen_nota !== undefined) {
                setInduccionState({
                    videoProgress: payload.new.video_progress || 0,
                    examenNota: payload.new.examen_nota,
                    ssomaCompleted: payload.new.ssoma_completed || false
                })
            }
        }).subscribe()
      }
      setIsLoadingData(false)
    }
    loadUser()
  }, [])

  // --- AUTOGUARDADO CUANDO SE ACTUALIZAN DOCUMENTOS ---
  // Este useEffect vigila cambios en los documentos y los guarda automáticamente en DB
  // para que no se pierdan si se refresca la página.
  useEffect(() => {
      // --- CORRECCIÓN CLAVE: NO AUTOGUARDAR SI YA ESTÁ COMPLETADO ---
      if (isCompleted) return;

      if (user && formData.id && (
          formData.doc_dni_trabajador || 
          formData.doc_certiadulto ||
          formData.doc_carnet_retcc || 
          formData.doc_policiales ||
          formData.doc_penales ||
          formData.doc_esposa_matrimonio ||
          formData.doc_esposa_dni ||
          formData.doc_hijos_dni ||
          formData.doc_hijos_estudios
      )) {
          // Usamos un debounce (retraso) pequeño para no saturar si hay muchos cambios rápidos
          const timer = setTimeout(() => {
              guardarProgreso(false, true); // true = silent save (sin toast)
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [
      // Añadimos isCompleted a las dependencias para que el efecto reaccione al bloqueo
      isCompleted,
      formData.doc_dni_trabajador, 
      formData.doc_certiadulto,
      formData.doc_carnet_retcc,
      formData.doc_policiales,
      formData.doc_penales,
      formData.doc_esposa_matrimonio,
      formData.doc_esposa_dni,
      formData.doc_hijos_dni,
      formData.doc_hijos_estudios
  ]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })
   
  // Handlers
  const handleEsposaChange = (field: string, val: string) => setFormData((prev:any) => ({ ...prev, esposa_datos: { ...prev.esposa_datos, [field]: val } }))
   
  const addHijo = () => setFormData((prev:any) => ({ ...prev, hijos_datos: [...prev.hijos_datos, { paterno: '', materno: '', nombres: '', fecha_nacimiento: '' }] }))
  const removeHijo = (idx: number) => setFormData((prev:any) => ({ ...prev, hijos_datos: prev.hijos_datos.filter((_:any, i:number) => i !== idx) }))
  const handleHijoChange = (idx: number, field: string, val: string) => {
      const newHijos = [...formData.hijos_datos]; newHijos[idx] = { ...newHijos[idx], [field]: val }
      setFormData((prev:any) => ({ ...prev, hijos_datos: newHijos }))
  }

  // --- LÓGICA DE FIRMA ---
  const handleSignatureEnd = () => { }
   
  const clearSignature = () => { 
      if (sigPad.current) {
        sigPad.current.clear(); 
      }
      setFormData((prev:any) => ({ ...prev, url_firma: '' })) 
  }
   
  // --- LÓGICA DE VALIDACIÓN ---
  const validateCurrentStep = () => {
    if (currentStep === 1) {
        if (!formData.apellido_paterno || !formData.apellido_materno || !formData.nombres || 
            !formData.fecha_nacimiento || !formData.dni || !formData.celular || 
            !formData.direccion || !formData.distrito || !formData.provincia || !formData.departamento ||
            !formData.banco || !formData.cuenta_ahorros || !formData.sistema_pension) {
            toast.error("Por favor, completa todos los campos personales y bancarios marcados con *.")
            return false
        }
        if (formData.dni.length < 8) {
            toast.error("El DNI debe tener al menos 8 dígitos.")
            return false
        }
    }

    if (currentStep === 3) {
        if (!formData.cargo || !formData.nombre_obra || !formData.categoria) {
            toast.error("Por favor, completa toda la información laboral obligatoria.")
            return false
        }
    }

    if (currentStep === 4) {
        if (!formData.emergencia_nombre || !formData.emergencia_parentesco || !formData.emergencia_telefono) {
            toast.error("Los datos de contacto de emergencia son obligatorios.")
            return false
        }
        if (!formData.doc_dni_trabajador) {
             toast.error("Es obligatorio subir el DNI (Frontal y Reverso).")
             return false
        }
    }

    return true
  }

  const handleNextStep = () => {
      if (validateCurrentStep()) {
          guardarProgreso()
          setCurrentStep(p => Math.min(5, p + 1))
      }
  }

  const guardarProgreso = async (complete: boolean = false, silent: boolean = false) => {
    // --- CORRECCIÓN ADICIONAL: SEGURIDAD ---
    // Si ya está completado en el estado local y tratamos de guardar sin completar (autoguardado), abortamos.
    if (!user || (isCompleted && !complete)) return

    let currentSignature = formData.url_firma;
    if (sigPad.current && !sigPad.current.isEmpty()) {
        currentSignature = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        setFormData((prev:any) => ({...prev, url_firma: currentSignature}))
    }

    const payload = {
        nombres: formData.nombres, apellido_paterno: formData.apellido_paterno, apellido_materno: formData.apellido_materno,
        dni: formData.dni, fecha_nacimiento: formData.fecha_nacimiento, direccion: formData.direccion, distrito: formData.distrito, provincia: formData.provincia, departamento: formData.departamento, celular: formData.celular,
        sistema_pension: formData.sistema_pension, afp_nombre: formData.afp_nombre, cuspp: formData.cuspp,
        banco: formData.banco, numero_cuenta: formData.cuenta_ahorros, cci: formData.cci,
        categoria: formData.categoria, cargo: formData.cargo, nombre_obra: formData.nombre_obra, fecha_ingreso: formData.fecha_ingreso,
        nivel_educacion: formData.nivel_educativo, carrera: formData.carrera, universidad: formData.centro_formacion,
        emergencia_nombre: formData.emergencia_nombre, emergencia_celular: formData.emergencia_telefono, emergencia_relacion: formData.emergencia_parentesco,
        esposa: JSON.stringify(formData.esposa_datos), hijos: JSON.stringify(formData.hijos_datos),
        
        // DOCUMENTOS
        url_dni_frontal: formData.doc_dni_trabajador, 
        url_dni_reverso: null, 
        url_antecedentes: formData.doc_certiadulto, url_policiales: formData.doc_policiales, url_penales: formData.doc_penales,
        url_carnet: formData.doc_carnet_retcc,
        url_acta_matrimonio: formData.doc_esposa_matrimonio, 
        url_esposa_dni: formData.doc_esposa_dni, 
        url_hijos_nacimiento: formData.doc_hijos_nacimiento, url_hijos_dni: formData.doc_hijos_dni, url_constancia_estudios: formData.doc_hijos_estudios,
        
        url_firma: currentSignature, firma_url: currentSignature, updated_at: new Date().toISOString(), 
        
        // Solo cambiamos el estado si explícitamente se marca como completa (al final) o si es la primera vez.
        // Si ya está completada, mantenemos 'completado'
        estado: complete ? 'completado' : (isCompleted ? 'completado' : 'pendiente')
    }
    
    Object.keys(payload).forEach((key:any) => { if ((payload as any)[key] === '') (payload as any)[key] = null });
    
    const { data, error } = await supabase
        .from('fichas')
        .upsert({ user_id: user.id, correo: user.email, ...payload }, { onConflict: 'user_id' })
        .select().single()
    
    if (data) setFormData((prev:any) => ({...prev, id: data.id}))
    if (complete) return error
    if (!error && !silent) toast.success("Progreso guardado")
  }

  const finalizarFicha = async () => {
    let hasSignature = !!formData.url_firma;
    if (sigPad.current && !sigPad.current.isEmpty()) {
        hasSignature = true;
    }

    if (!hasSignature) { toast.error("Debes firmar en el recuadro para continuar."); return }
    if (!declaracionAceptada) { toast.error("Debes aceptar la declaración jurada."); return }
    
    if (!validateCurrentStep()) return

    setSending(true)
    const error = await guardarProgreso(true)
    if (!error) { toast.success("Ficha enviada"); setIsCompleted(true) }
    else toast.error("Error: " + error.message)
    setSending(false)
  }

  if (isLoadingData) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-800" size={40}/></div>

  // --- VISTA LECTURA (COMPLETA Y HABILITADA PARA SSOMA) ---
  if (isCompleted) {
    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 flex justify-center pb-20">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white max-w-4xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                
                {/* HEADER DE FICHA COMPLETADA */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="bg-white/10 p-4 rounded-full border border-white/20"><Hammer size={40} className="text-white" /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Ficha de Datos Validada!</h2>
                            <p className="text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">Tus datos personales han sido registrados correctamente.</p>
                        </div>
                        <div className="mt-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-xs font-bold tracking-wider">PASO 1 COMPLETADO</div>
                    </div>
                </div>

                {/* --- NUEVO: MÓDULO DE INDUCCIÓN SSOMA --- */}
                <div className="p-8 border-b border-slate-100 bg-blue-50/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600"/> Inducción de Seguridad (Obligatorio)
                    </h3>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${induccionState.ssomaCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600 animate-pulse'}`}>
                            {induccionState.ssomaCompleted ? <CheckCircle size={32}/> : <PlayCircle size={32}/>}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 mb-1">
                                {induccionState.ssomaCompleted ? "Inducción Aprobada" : "Video de Inducción SSOMA"}
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-2">
                                {induccionState.ssomaCompleted 
                                    ? `¡Felicitaciones! Has aprobado el examen con nota ${induccionState.examenNota}/20.`
                                    : "Para ingresar a obra, debes completar la inducción virtual. Este video dura 13:12 min y no se puede adelantar."
                                }
                            </p>
                            <div className="flex gap-2">
                                {induccionState.ssomaCompleted ? (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200">HABILITADO</span>
                                ) : (
                                    <>
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200">PENDIENTE</span>
                                        {induccionState.videoProgress > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">PROGRESO: {induccionState.videoProgress}%</span>}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {!induccionState.ssomaCompleted && (
                            <Link href="/induccion">
                                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2">
                                    {induccionState.videoProgress > 0 ? "CONTINUAR" : "INICIAR"} INDUCCIÓN <ArrowRight size={18}/>
                                </button>
                            </Link>
                        )}
                        
                        {induccionState.ssomaCompleted && (
                            <button disabled className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-none opacity-80 cursor-default flex items-center gap-2">
                                <CheckCircle size={18}/> COMPLETADO
                            </button>
                        )}
                    </div>
                </div>

                {/* RESUMEN DE DATOS */}
                <div className="p-8 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest border-b pb-2"><FileText size={14}/> Resumen de Datos Registrados</div>
                    <div className="space-y-8 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* 1. PERSONAL */}
                        <SectionRead title="1. Datos Personales" icon={<User size={16}/>}>
                            <GridRead>
                                <FieldRead label="Apellidos y Nombres" val={`${formData.apellido_paterno} ${formData.apellido_materno}, ${formData.nombres}`} full />
                                <FieldRead label="DNI" val={formData.dni} highlight />
                                <FieldRead label="Fecha Nacimiento" val={formData.fecha_nacimiento} />
                                <FieldRead label="Celular" val={formData.celular} />
                                <FieldRead label="Correo" val={formData.correo} />
                                <FieldRead label="Dirección" val={formData.direccion} full />
                                <FieldRead label="Distrito/Prov/Dep" val={`${formData.distrito} - ${formData.provincia} - ${formData.departamento}`} full />
                            </GridRead>
                        </SectionRead>

                        {/* 2. FAMILIA (SI EXISTE) */}
                        <SectionRead title="2. Datos Familiares" icon={<Users size={16}/>}>
                            {formData.esposa_datos.nombres ? (
                                <div className="mb-4 pb-4 border-b border-slate-100">
                                    <h5 className="font-bold text-xs text-slate-500 mb-2">ESPOSA / CONVIVIENTE</h5>
                                    <GridRead>
                                        <FieldRead label="Nombre Completo" val={`${formData.esposa_datos.nombres} ${formData.esposa_datos.paterno} ${formData.esposa_datos.materno}`} full/>
                                        <FieldRead label="DNI" val={formData.esposa_datos.dni}/>
                                    </GridRead>
                                </div>
                            ) : <p className="text-sm text-slate-400 italic">Sin cónyuge registrado</p>}
                            
                            {formData.hijos_datos.length > 0 ? (
                                <div>
                                    <h5 className="font-bold text-xs text-slate-500 mb-2">HIJOS ({formData.hijos_datos.length})</h5>
                                    {formData.hijos_datos.map((h:any, i:number) => (
                                        <div key={i} className="mb-2 p-3 bg-slate-50 rounded-lg text-sm border border-slate-200">
                                            <span className="font-bold text-slate-800">{h.nombres} {h.paterno} {h.materno}</span> 
                                            <span className="text-slate-500 text-xs ml-2"> (Nac: {h.fecha_nacimiento || 'No registrada'})</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-400 italic">Sin hijos registrados</p>}
                        </SectionRead>

                        {/* 3. BANCARIOS */}
                        <SectionRead title="3. Datos Bancarios" icon={<Wallet size={16}/>}>
                            <GridRead>
                                <FieldRead label="Banco" val={formData.banco} />
                                <FieldRead label="N° Cuenta" val={formData.cuenta_ahorros} highlight />
                                <FieldRead label="CCI" val={formData.cci} />
                                <FieldRead label="AFP/ONP" val={`${formData.sistema_pension} ${formData.afp_nombre ? '- ' + formData.afp_nombre : ''}`} />
                                <FieldRead label="CUSPP" val={formData.cuspp} />
                            </GridRead>
                        </SectionRead>

                        {/* 4. LABORAL */}
                        <SectionRead title="4. Información Laboral" icon={<HardHat size={16}/>}>
                            <GridRead>
                                <FieldRead label="Cargo" val={formData.cargo} highlight />
                                <FieldRead label="Categoría" val={formData.categoria} />
                                <FieldRead label="Obra" val={formData.nombre_obra} highlight />
                                <FieldRead label="Fecha Ingreso" val={formData.fecha_ingreso} />
                                <FieldRead label="Nivel Educativo" val={formData.nivel_educativo} />
                                <FieldRead label="Carrera/Oficio" val={formData.carrera} />
                                <FieldRead label="Institución" val={formData.centro_formacion} />
                            </GridRead>
                        </SectionRead>

                         {/* 5. EMERGENCIA */}
                         <SectionRead title="5. Contacto Emergencia" icon={<HeartPulse size={16}/>}>
                            <GridRead>
                                <FieldRead label="Nombre" val={formData.emergencia_nombre} />
                                <FieldRead label="Parentesco" val={formData.emergencia_parentesco} />
                                <FieldRead label="Teléfono" val={formData.emergencia_telefono} highlight />
                            </GridRead>
                        </SectionRead>

                        {/* 6. DOCUMENTOS */}
                        <SectionRead title="6. Documentos Adjuntos" icon={<FileBadge size={16}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <DocRead label="DNI Completo (PDF)" url={formData.doc_dni_trabajador} />
                                <DocRead label="Antecedentes" url={formData.doc_certiadulto} />
                                <DocRead label="Carnet RETCC" url={formData.doc_carnet_retcc} />
                                <DocRead label="Ant. Policiales" url={formData.doc_policiales} />
                                <DocRead label="Ant. Penales" url={formData.doc_penales} />
                                {formData.doc_esposa_matrimonio && <DocRead label="Acta Matrimonio" url={formData.doc_esposa_matrimonio} />}
                                {formData.doc_esposa_dni && <DocRead label="DNI Esposa" url={formData.doc_esposa_dni} />}
                                {formData.doc_hijos_dni && <DocRead label="DNI Hijos" url={formData.doc_hijos_dni} />}
                                {formData.doc_hijos_estudios && <DocRead label="Estudios Hijos" url={formData.doc_hijos_estudios} />}
                            </div>
                        </SectionRead>

                        <div className="pt-8 border-t border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-4">Firma Digital Registrada</p>
                            {formData.url_firma && <img src={formData.url_firma} className="h-24 mx-auto object-contain border border-dashed border-slate-300 bg-white p-2 rounded-lg" />}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
  }

  if (!hasStarted) return <WelcomeScreen onStart={() => setHasStarted(true)} />

  // --- WIZARD EDITABLE ---
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de Pasos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 sticky top-2 z-20">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paso {currentStep} de 5</span>
                <span className="text-xs font-bold text-slate-800">{Math.round((currentStep / 5) * 100)}% Completado</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(currentStep / 5) * 100}%` }} 
                    className="bg-slate-900 h-full rounded-full" 
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className="flex justify-between mt-4 px-2">
                {STEPS.map((step) => (
                    <div key={step.id} className={`flex flex-col items-center gap-1 ${currentStep === step.id ? 'text-slate-900 scale-105' : currentStep > step.id ? 'text-emerald-500' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${currentStep === step.id ? 'border-slate-900 bg-slate-900 text-white' : currentStep > step.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200'}`}>
                            {currentStep > step.id ? <CheckCircle size={14}/> : step.icon}
                        </div>
                        <span className="text-[10px] font-bold hidden sm:block">{step.title}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-6 md:p-10 min-h-[500px] relative">
             <AnimatePresence mode='wait'>
                {currentStep === 1 && <StepWrapper key="1">
                    <SectionTitle title="Información Personal" icon={<User/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <Input label="Apellido Paterno" name="apellido_paterno" val={formData.apellido_paterno} set={handleChange} required readOnly={!!formData.apellido_paterno} />
                        <Input label="Apellido Materno" name="apellido_materno" val={formData.apellido_materno} set={handleChange} required readOnly={!!formData.apellido_materno} />
                        <Input label="Nombres" name="nombres" val={formData.nombres} set={handleChange} required readOnly={!!formData.nombres} />
                        <Input label="Fecha Nacimiento" type="date" name="fecha_nacimiento" val={formData.fecha_nacimiento} set={handleChange} required readOnly={!!formData.fecha_nacimiento} />
                        <Input label="DNI" name="dni" val={formData.dni} set={handleChange} required readOnly={!!formData.dni} />
                        <Input label="Dirección" name="direccion" val={formData.direccion} set={handleChange} required />
                        <Input label="Distrito" name="distrito" val={formData.distrito} set={handleChange} required />
                        <Input label="Provincia" name="provincia" val={formData.provincia} set={handleChange} required />
                        <Input label="Departamento" name="departamento" val={formData.departamento} set={handleChange} required />
                        <Input label="Correo Electrónico" name="correo" val={formData.correo} set={handleChange} />
                        <Input label="Celular" name="celular" val={formData.celular} set={handleChange} />
                    </div>
                    <SectionTitle title="Datos Bancarios" icon={<Wallet/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1"><Select label="Banco" name="banco" val={formData.banco} set={handleChange} options={['Interbank', 'BBVA', 'BCP', 'Scotiabank', 'Banco de la Nación']} required /></div>
                        <Input label="N° Cuenta" name="cuenta_ahorros" val={formData.cuenta_ahorros} set={handleChange} required />
                        <Input label="CCI (20 dígitos)" name="cci" val={formData.cci} set={handleChange} />
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100">
                            <div className="flex gap-4 items-center h-full pt-4"><Radio label="ONP" name="sistema_pension" val="ONP" current={formData.sistema_pension} set={handleChange} /><Radio label="AFP" name="sistema_pension" val="AFP" current={formData.sistema_pension} set={handleChange} /></div>
                            {formData.sistema_pension === 'AFP' && <Input label="Nombre AFP" name="afp_nombre" val={formData.afp_nombre} set={handleChange} />}
                            <Input label="CUSPP" name="cuspp" val={formData.cuspp} set={handleChange} />
                        </div>
                    </div>
                </StepWrapper>}

                {currentStep === 2 && <StepWrapper key="2">
                    <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm flex items-center gap-3"><Users size={20}/> Sección opcional. Complétala solo si tienes esposa/hijos.</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Esposa / Conviviente</h4>
                            <div className="space-y-4">
                                <Input label="DNI" val={formData.esposa_datos.dni} onChange={(e:any)=>handleEsposaChange('dni', e.target.value)} />
                                <Input label="Nombres" val={formData.esposa_datos.nombres} onChange={(e:any)=>handleEsposaChange('nombres', e.target.value)} />
                                <div className="grid grid-cols-2 gap-4"><Input label="A. Paterno" val={formData.esposa_datos.paterno} onChange={(e:any)=>handleEsposaChange('paterno', e.target.value)} /><Input label="A. Materno" val={formData.esposa_datos.materno} onChange={(e:any)=>handleEsposaChange('materno', e.target.value)} /></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2"><h4 className="font-bold text-slate-800">Hijos Registrados</h4><button onClick={addHijo} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 flex gap-1 items-center"><Plus size={12}/> AGREGAR</button></div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.hijos_datos.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">No hay hijos registrados</p>}
                                {formData.hijos_datos.map((hijo:any, idx:number) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                                            <button onClick={()=>removeHijo(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 bg-white p-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                            <div className="grid grid-cols-1 gap-3">
                                                <Input label="Nombres" val={hijo.nombres} onChange={(e:any)=>handleHijoChange(idx, 'nombres', e.target.value)} />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input label="Paterno" val={hijo.paterno} onChange={(e:any)=>handleHijoChange(idx, 'paterno', e.target.value)} />
                                                    <Input label="Materno" val={hijo.materno} onChange={(e:any)=>handleHijoChange(idx, 'materno', e.target.value)} />
                                                </div>
                                                <Input label="Fecha Nacimiento" type="date" val={hijo.fecha_nacimiento} onChange={(e:any)=>handleHijoChange(idx, 'fecha_nacimiento', e.target.value)} />
                                            </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </StepWrapper>}

                {currentStep === 3 && <StepWrapper key="3">
                    <SectionTitle title="Datos de Obra" icon={<HardHat/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <Input label="Cargo" name="cargo" val={formData.cargo} set={handleChange} required />
                        <Input label="Obra / Proyecto" name="nombre_obra" val={formData.nombre_obra} set={handleChange} required />
                        <Input label="Categoría" name="categoria" val={formData.categoria} set={handleChange} required />
                        <Input label="Fecha Ingreso" type="date" name="fecha_ingreso" val={formData.fecha_ingreso} set={handleChange} />
                    </div>
                    <SectionTitle title="Formación Académica" icon={<GraduationCap/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select label="Nivel educativo" name="nivel_educativo" val={formData.nivel_educativo} set={handleChange} options={['Primaria', 'Secundaria', 'Técnico', 'Universitario']} />
                            <Input label="Carrera / Oficio" name="carrera" val={formData.carrera} set={handleChange} />
                            <Input label="Institución Educativa" name="centro_formacion" val={formData.centro_formacion} set={handleChange} className="md:col-span-2" />
                    </div>
                </StepWrapper>}

                {currentStep === 4 && <StepWrapper key="4">
                    <SectionTitle title="En caso de emergencia llamar a:" icon={<HeartPulse/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-red-50/50 p-6 rounded-2xl mb-10 border border-red-100">
                        <Input label="Nombre Completo" name="emergencia_nombre" val={formData.emergencia_nombre} set={handleChange} required />
                        <Input label="Parentesco" name="emergencia_parentesco" val={formData.emergencia_parentesco} set={handleChange} required />
                        <Input label="Teléfono" name="emergencia_telefono" val={formData.emergencia_telefono} set={handleChange} required />
                    </div>

                    <SectionTitle title="Documentos del Trabajador" icon={<FileBadge/>} />
                    <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 inline-block">
                        💡 Puedes subir archivos PDF o tomar una foto (se convertirá a PDF automáticamente).
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {/* CAMBIO: Solo un campo para DNI completo */}
                        <div className="md:col-span-2">
                             <ImageUpload label="DNI (Frontal y Reverso)" bucket="documentos" currentUrl={formData.doc_dni_trabajador} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_dni_trabajador:u}))} />
                        </div>
                        
                        <ImageUpload label="Certiadulto (Antecedentes)" bucket="documentos" currentUrl={formData.doc_certiadulto} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_certiadulto:u}))} />
                        <ImageUpload label="Carnet RETCC" bucket="documentos" currentUrl={formData.doc_carnet_retcc} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_carnet_retcc:u}))} />
                        <ImageUpload label="Ant. Policiales" bucket="documentos" currentUrl={formData.doc_policiales} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_policiales:u}))} />
                        <ImageUpload label="Ant. Penales" bucket="documentos" currentUrl={formData.doc_penales} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_penales:u}))} />
                    </div>

                    <SectionTitle title="Documentos Familiares" icon={<Users/>} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <ImageUpload label="Acta Matrimonio" bucket="documentos" currentUrl={formData.doc_esposa_matrimonio} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_esposa_matrimonio:u}))} />
                        <ImageUpload label="DNI Esposa" bucket="documentos" currentUrl={formData.doc_esposa_dni} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_esposa_dni:u}))} />
                        <ImageUpload label="DNI Hijos" bucket="documentos" currentUrl={formData.doc_hijos_dni} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_hijos_dni:u}))} />
                        <ImageUpload label="Estudios Hijos" bucket="documentos" currentUrl={formData.doc_hijos_estudios} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_hijos_estudios:u}))} />
                    </div>
                </StepWrapper>}

                {currentStep === 5 && <StepWrapper key="5">
                    <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-slate-900">Firma de Conformidad</h3>
                            <p className="text-slate-500">Dibuja tu firma en el recuadro para validar la ficha.</p>
                    </div>
                    {/* -- FIRMA CORREGIDA: No se bloquea al levantar el dedo -- */}
                    <div className="border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 relative overflow-hidden h-56 mx-auto max-w-xl touch-none mb-8 shadow-inner hover:border-slate-300 transition-colors">
                        {/* Si ya existe firma guardada y no estamos editando (isCompleted), muestra imagen. Si no, muestra canvas */}
                        {isCompleted && formData.url_firma ? (
                             <img src={formData.url_firma} className="w-full h-full object-contain p-4" />
                        ) : (
                             <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full cursor-crosshair'}} />
                        )}
                        
                        {!isCompleted && (
                            <>
                                <button onClick={clearSignature} className="absolute top-4 right-4 bg-white text-slate-700 hover:text-red-600 p-2 rounded-lg shadow-md border border-slate-100 transition-colors"><Eraser size={20}/></button>
                                <div className="absolute bottom-2 left-0 w-full text-center text-xs text-slate-400 pointer-events-none">Firma dentro del recuadro (puedes levantar el dedo)</div>
                            </>
                        )}
                    </div>

                    <label className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all max-w-xl mx-auto ${declaracionAceptada ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <input type="checkbox" checked={declaracionAceptada} onChange={(e) => setDeclaracionAceptada(e.target.checked)} className="w-6 h-6 accent-emerald-500" />
                        <div><span className="font-bold block text-sm">Declaración Jurada</span><span className={`text-xs ${declaracionAceptada ? 'text-slate-300' : 'text-slate-500'}`}>Declaro bajo juramento que toda la información consignada es verdadera.</span></div>
                    </label>
                </StepWrapper>}
             </AnimatePresence>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
             <div className="max-w-5xl mx-auto flex justify-between items-center">
                 <button onClick={() => setCurrentStep(p => Math.max(1, p - 1))} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}><ChevronLeft size={20}/> Atrás</button>
                 {currentStep < 5 ? (
                    <button onClick={handleNextStep} className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95">Siguiente <ChevronRight size={20}/></button>
                 ) : (
                    <button onClick={finalizarFicha} disabled={sending} className="bg-emerald-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">{sending ? <Loader2 className="animate-spin"/> : <><CheckCircle/> ENVIAR FICHA</>}</button>
                 )}
             </div>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENTE MEJORADO: SOPORTE CAMARA, PDF AUTO, ENCUADRE REAL Y PREVIEW ---
function ImageUpload({label, bucket, onUpload, currentUrl}: any) { 
    const [uploading, setUploading] = useState(false); 
    const [showCamera, setShowCamera] = useState(false);
    const [previewModal, setPreviewModal] = useState(false);
    const supabase = createClient(); 
    
    const isPdf = currentUrl?.toLowerCase().includes('.pdf');
    
    // Si es DNI o Carnet usamos formato tarjeta, sino A4
    const captureFormat = (label.toLowerCase().includes('dni') || label.toLowerCase().includes('carnet')) 
        ? 'id-card' 
        : 'a4';

    const handleFile = async (e:any) => { 
        if(!e.target.files?.length) return; 
        processUpload(e.target.files[0]);
    }; 
    
    const handleCameraCapture = (file: File) => {
        setShowCamera(false);
        processUpload(file);
    };

    const processUpload = async (file: File) => {
        setUploading(true);
        const fileExt = file.name.split('.').pop() || 'pdf'; 
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
            contentType: file.type 
        }); 
        
        if(error) {
            toast.error("Error al subir el documento");
            console.error(error);
        } else { 
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName); 
            // 🔴 AQUI ES CLAVE: Actualizamos el estado DEL PADRE inmediatamente
            onUpload(data.publicUrl); 
            toast.success("Documento cargado correctamente"); 
        } 
        setUploading(false);
    };

    return (
        <>
            <div className={`relative border border-dashed rounded-xl p-4 text-center transition-all group h-36 flex flex-col items-center justify-center overflow-hidden ${currentUrl ? (isPdf ? 'border-red-500 bg-red-50/30' : 'border-emerald-500 bg-emerald-50/30') : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
                
                <div className="flex flex-col gap-3 w-full relative z-10 pointer-events-auto">
                    {!uploading && (
                        <>
                            <div className="flex justify-center gap-2">
                                <label className="cursor-pointer bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors active:scale-95" title="Subir Archivo">
                                    <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
                                    <UploadCloud size={18}/>
                                </label>
                                <button onClick={() => setShowCamera(true)} className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors active:scale-95" title="Tomar Foto">
                                    <Camera size={18}/>
                                </button>
                                {currentUrl && (
                                     <button onClick={() => setPreviewModal(true)} className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors active:scale-95" title="Ver Documento">
                                         <Eye size={18}/>
                                     </button>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-600 leading-tight px-1 line-clamp-2">{label}</span>
                                <span className="text-[9px] text-slate-400 mt-1">{currentUrl ? 'Actualizar' : 'PDF o Foto'}</span>
                            </div>
                        </>
                    )}
                    {uploading && <div className="flex flex-col items-center"><Loader2 className="animate-spin text-blue-500" size={24}/><span className="text-[10px] font-bold text-blue-500 mt-2">Procesando...</span></div>}
                </div>

                {currentUrl && !isPdf && <div className="absolute inset-0 z-0 opacity-20 bg-center bg-cover blur-sm" style={{backgroundImage: `url(${currentUrl})`}}></div>}
                {currentUrl && isPdf && <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center"><FileText size={60} className="text-red-500"/></div>}
            </div> 

            {showCamera && (
                <CameraCaptureModal 
                    onClose={() => setShowCamera(false)} 
                    onCapture={handleCameraCapture} 
                    format={captureFormat} 
                />
            )}

            {/* Modal de Previsualización */}
            {previewModal && currentUrl && (
                <DocumentPreviewModal
                    label={label}
                    url={currentUrl}
                    onClose={() => setPreviewModal(false)}
                />
            )}
        </>
    )
}

// --- MODAL TIPO CAMSCANNER (CORREGIDO AL 100% + DOBLE CARA) ---
function CameraCaptureModal({ onClose, onCapture, format }: { onClose: () => void, onCapture: (file: File) => void, format: 'id-card' | 'a4' }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [step, setStep] = useState<'camera' | 'edit'>('camera');
    const [filter, setFilter] = useState<'original' | 'bw' | 'high-contrast'>('original');
    const [rotation, setRotation] = useState(0);
    const [processing, setProcessing] = useState(false);

    // --- NUEVO: Estado para capturas múltiples (DNI Front/Back) ---
    const [capturedSide1, setCapturedSide1] = useState<string | null>(null);

    // Configuración del recuadro
    const isLandscape = format === 'id-card';
    const aspectRatio = isLandscape ? 1.58 : 0.70; // 1.58 = Tarjeta, 0.70 = A4
    
    // Texto dinámico según el paso actual
    let guideText = "";
    if (format === 'a4') {
        guideText = "Encuadra el documento completo";
    } else {
        // Si es DNI, mostramos Frontal o Reverso
        guideText = capturedSide1 ? "Ahora encuadra el REVERSO" : "Encuadra la parte FRONTAL";
    }

    const startCamera = async () => {
        try {
            // Pedimos la máxima resolución posible para que el texto se vea nítido
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', 
                    width: { ideal: 2160 }, // 4K si es posible
                    height: { ideal: 3840 } 
                } 
            });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            console.error("Error cámara:", err);
            toast.error("No se pudo acceder a la cámara.");
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => { startCamera(); return () => stopCamera(); }, []);

    // --- MAGIA DEL RECORTE (FIXED) ---
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            
            // 1. Obtener dimensiones REALES del video (ej: 1920x1080)
            const videoW = video.videoWidth;
            const videoH = video.videoHeight;
            
            // 2. Obtener dimensiones DE PANTALLA (ej: 400x800)
            // Usamos el contenedor padre para saber el tamaño visible exacto
            const rect = video.getBoundingClientRect(); 

            // 3. Calcular qué tan grande es el video renderizado en pantalla (considerando object-fit: cover)
            const videoRatio = videoW / videoH;
            const screenRatio = rect.width / rect.height;
            
            let renderW, renderH;

            if (screenRatio > videoRatio) {
                // La pantalla es más ancha que el video (zoom ancho)
                renderW = rect.width;
                renderH = rect.width / videoRatio;
            } else {
                // La pantalla es más alta que el video (zoom alto - caso normal en móvil)
                renderH = rect.height;
                renderW = rect.height * videoRatio;
            }

            // 4. Calcular el tamaño del recuadro verde en PÍXELES DE PANTALLA
            // El recuadro es 90% del ancho de la pantalla (limitado a 448px)
            const boxWidthScreen = Math.min(rect.width * 0.9, 448);
            const boxHeightScreen = boxWidthScreen / aspectRatio;

            // 5. Calcular el MULTIPLICADOR (Cuántos píxeles reales hay por píxel de pantalla)
            const multiplier = videoW / renderW;

            // 6. Calcular tamaño de recorte en PÍXELES REALES
            const cropW = boxWidthScreen * multiplier;
            const cropH = boxHeightScreen * multiplier;

            // 7. Calcular coordenadas para recortar desde el CENTRO EXACTO
            const cropX = (videoW - cropW) / 2;
            const cropY = (videoH - cropH) / 2;

            // 8. Dibujar en el canvas
            const canvas = canvasRef.current;
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // drawImage(source, x, y, w, h, destX, destY, destW, destH)
                ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                
                // Guardar imagen y pasar a edición
                setTempImage(canvas.toDataURL('image/jpeg', 1.0));
                setStep('edit');
                stopCamera();
            }
        }
    };

    // --- PROCESAR, CONTROLAR FLUJO DNI Y GENERAR PDF ---
    const handleConfirmStep = async () => {
        if (!tempImage) return;
        setProcessing(true);

        try {
            // 1. Procesar la imagen actual (aplicar rotación y filtros)
            const img = new Image();
            img.src = tempImage;
            await new Promise(r => img.onload = r);

            const canvas = document.createElement('canvas');
            const isRotated = rotation % 180 !== 0;
            canvas.width = isRotated ? img.height : img.width;
            canvas.height = isRotated ? img.width : img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("No context");

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            
            if (filter === 'bw') ctx.filter = 'grayscale(100%) contrast(1.2)';
            if (filter === 'high-contrast') ctx.filter = 'grayscale(100%) contrast(2.0)';
            
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            const processedImage = canvas.toDataURL('image/jpeg', 0.85);

            // --- LÓGICA DE DNI (DOBLE CARA) ---
            if (format === 'id-card' && !capturedSide1) {
                // Si es DNI y aún no tenemos la primera cara:
                // Guardamos la primera cara, reseteamos y pedimos la segunda.
                setCapturedSide1(processedImage);
                setProcessing(false);
                setStep('camera');
                setTempImage(null);
                setRotation(0);
                setFilter('original');
                
                // Reiniciar cámara
                startCamera(); 
                toast.info("Frontal guardado. Ahora toma el REVERSO.");
                return; // IMPORTANTE: Detenemos aquí para no generar PDF aún
            }

            // --- GENERAR PDF FINAL ---
            const pdfDoc = new jsPDF('p', 'mm', 'a4'); // Siempre Portrait para DNI
            const pageWidth = pdfDoc.internal.pageSize.getWidth();
            const pageHeight = pdfDoc.internal.pageSize.getHeight();
            const margin = 10;
            const maxW = pageWidth - margin * 2;
            
            // Función auxiliar para añadir imagen al PDF
            const addImageToPdf = (imgData: string, yPos: number, maxHeight: number) => {
                const props = pdfDoc.getImageProperties(imgData);
                const imgRatio = props.width / props.height;
                let finalW = maxW;
                let finalH = maxW / imgRatio;
                
                if (finalH > maxHeight) {
                    finalH = maxHeight;
                    finalW = finalH * imgRatio;
                }
                const xPos = (pageWidth - finalW) / 2;
                pdfDoc.addImage(imgData, 'JPEG', xPos, yPos, finalW, finalH);
            };

            if (format === 'id-card' && capturedSide1) {
                // CASO DNI COMPLETO: Poner Frontal Arriba y Reverso (actual) Abajo
                const halfHeight = (pageHeight - margin * 3) / 2; // Espacio para cada cara
                
                // Cara 1 (Frontal)
                addImageToPdf(capturedSide1, margin, halfHeight);
                
                // Cara 2 (Reverso - la que acabamos de procesar)
                addImageToPdf(processedImage, margin + halfHeight + 10, halfHeight);

            } else {
                // CASO DOCUMENTO SIMPLE (A4)
                const maxH = pageHeight - margin * 2;
                // Si la imagen es apaisada (A4 horizontal), rotamos la página del PDF
                const props = pdfDoc.getImageProperties(processedImage);
                if (props.width > props.height) {
                    pdfDoc.deletePage(1);
                    pdfDoc.addPage('a4', 'l');
                    // Recalcular para landscape
                    const lPageW = pdfDoc.internal.pageSize.getWidth();
                    const lPageH = pdfDoc.internal.pageSize.getHeight();
                      // Logica simple para landscape...
                      pdfDoc.addImage(processedImage, 'JPEG', margin, margin, lPageW - margin*2, lPageH - margin*2, undefined, 'FAST');
                } else {
                    addImageToPdf(processedImage, margin, maxH);
                }
            }
            
            const pdfBlob = pdfDoc.output('blob');
            const fileName = `scan_${format}_${Date.now()}.pdf`;
            const file = new File([pdfBlob], fileName, { type: "application/pdf" });

            onCapture(file);

        } catch (e) {
            console.error(e);
            toast.error("Error al generar PDF");
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col font-sans">
            {step === 'camera' && (
                <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                        <button onClick={onClose} className="text-white bg-white/10 p-2.5 rounded-full backdrop-blur-md hover:bg-white/20"><X size={20}/></button>
                        <div className="px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white/90 text-xs font-bold border border-white/10 shadow-lg flex items-center gap-2">
                             {format === 'id-card' ? (
                                <>
                                    <div className={`w-2 h-2 rounded-full ${capturedSide1 ? 'bg-slate-500' : 'bg-emerald-400'}`}></div>
                                    <span>{capturedSide1 ? 'Paso 2: Reverso' : 'Paso 1: Frontal'}</span>
                                </>
                             ) : (
                                <span>Modo Documento</span>
                             )}
                        </div>
                    </div>
                    
                    {/* Video - Importante: object-fit cover */}
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* Guía de Recorte (Overlay) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        {/* El recuadro visual */}
                        <div 
                            className="relative rounded-lg transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)]" // Sombra gigante para oscurecer el fondo
                            style={{
                                width: '90%',
                                maxWidth: '448px', 
                                aspectRatio: aspectRatio,
                                border: `2px solid ${capturedSide1 ? '#fbbf24' : '#34d399'}`, // Amarillo para reverso, Verde para frontal
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' // Oscurece todo lo que no es el DNI
                            }}
                        >
                            {/* Esquinas decorativas */}
                            <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 -mt-0.5 -ml-0.5 ${capturedSide1 ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                            <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 -mt-0.5 -mr-0.5 ${capturedSide1 ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 -mb-0.5 -ml-0.5 ${capturedSide1 ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 -mb-0.5 -mr-0.5 ${capturedSide1 ? 'border-amber-400' : 'border-emerald-400'}`}></div>
                            
                            {/* Texto guía */}
                            <div className="absolute -bottom-10 left-0 w-full text-center">
                                <span className={`text-white text-xs font-medium tracking-wide bg-black/60 px-3 py-1.5 rounded-full ${capturedSide1 ? 'text-amber-300' : 'text-emerald-300'}`}>{guideText}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botón de Captura */}
                    <div className="absolute bottom-0 w-full pb-10 pt-20 bg-gradient-to-t from-black via-black/60 to-transparent flex justify-center items-center z-20">
                        <button onClick={capturePhoto} className="w-18 h-18 bg-white/20 rounded-full p-1.5 backdrop-blur-sm active:scale-95 transition-all">
                            <div className={`w-16 h-16 bg-white rounded-full border-4 border-transparent ring-2 shadow-xl ${capturedSide1 ? 'ring-amber-500' : 'ring-emerald-500'}`}></div>
                        </button>
                    </div>
                </div>
            )}

            {step === 'edit' && tempImage && (
                <div className="relative flex-1 bg-slate-900 flex flex-col animate-in fade-in duration-300">
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
                        <img 
                            src={tempImage} 
                            className="max-w-full max-h-full object-contain shadow-2xl border border-white/5"
                            style={{ 
                                transform: `rotate(${rotation}deg)`,
                                filter: filter === 'bw' ? 'grayscale(100%) contrast(1.2)' : filter === 'high-contrast' ? 'grayscale(100%) contrast(2.0)' : 'none',
                                transition: 'filter 0.3s ease, transform 0.3s ease'
                            }}
                        />
                    </div>

                    <div className="bg-slate-900 p-5 pb-8 border-t border-white/10 space-y-5 z-20">
                        <div className="flex justify-center gap-8">
                            <button onClick={()=>setRotation(r => r + 90)} className="text-slate-300 flex flex-col items-center gap-2 text-[10px] font-medium transition-colors hover:text-white group">
                                <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 border border-white/5"><RotateCw size={20}/></div>
                                <span>ROTAR</span>
                            </button>
                            <button onClick={()=>setFilter(f => f === 'original' ? 'bw' : f === 'bw' ? 'high-contrast' : 'original')} className="text-slate-300 flex flex-col items-center gap-2 text-[10px] font-medium transition-colors hover:text-white group">
                                <div className={`p-3 rounded-full border ${filter !== 'original' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}><Wand2 size={20}/></div>
                                <span>{filter === 'original' ? 'ORIGINAL' : filter === 'bw' ? 'B/N' : 'REALCE'}</span>
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setStep('camera'); setTempImage(null); startCamera(); }} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700">
                                <RefreshCw className="inline mr-2 -mt-0.5" size={16}/> Repetir
                            </button>
                            <button onClick={handleConfirmStep} disabled={processing} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                {processing ? <Loader2 className="animate-spin" size={18}/> : (
                                    <>
                                        {(format === 'id-card' && !capturedSide1) ? (
                                            <>Siguiente <ArrowRight size={18}/></>
                                        ) : (
                                            <><CheckCircle size={18}/> Confirmar PDF</>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

// --- COMPONENTES AUXILIARES (DEFINIDOS AL FINAL PARA SOLUCIONAR ERRORES) ---

function WelcomeScreen({onStart}:any) {
    return <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center"><motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl shadow-slate-200"><div className="mb-8 inline-flex p-5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-500/20"><FileBadge size={40} /></div><h1 className="text-3xl font-extrabold mb-3 text-slate-900">Ficha de Datos</h1><p className="text-slate-500 mb-10 leading-relaxed">Bienvenido al sistema RUAG. Ten a mano tu DNI y documentos.</p><button onClick={onStart} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl">Comenzar</button></motion.div></div>
}

function SectionTitle({title, icon}: any) { return <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100"><div className="text-slate-400">{icon}</div><h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3></div>}
function SectionRead({title, icon, children}: any) { return <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><div className="flex items-center gap-2 mb-4 text-slate-900 font-bold border-b border-slate-100 pb-2"><span className="text-slate-500">{icon}</span><h3>{title}</h3></div>{children}</div>}
function Input({label, name, val, set, type="text", required=false, readOnly=false, onChange, placeholder, className=""}: any) { return <div className={className}><label className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1"><span>{label} {required && <span className="text-red-500">*</span>}</span>{readOnly && <Lock size={10} className="text-slate-300" />}</label><input type={type} name={name} value={val || ''} onChange={onChange || set} readOnly={readOnly} placeholder={placeholder} className={`w-full p-3.5 rounded-xl border outline-none transition-all font-medium text-sm ${readOnly ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none shadow-none' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300 shadow-sm'}`} /></div>}
function Select({label, name, val, set, options=[], required=false}: any) { return <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">{label} {required && <span className="text-red-500">*</span>}</label><div className="relative"><select name={name} value={val || ''} onChange={set} className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-sm text-slate-700 appearance-none cursor-pointer shadow-sm"><option value="">Seleccionar...</option>{options.map((o:string)=><option key={o} value={o}>{o}</option>)}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="rotate-90" size={16}/></div></div></div>}
function Radio({label, name, val, current, set}: any) { return <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all w-full ${current === val ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${current === val ? 'border-white' : 'border-slate-300'}`}>{current === val && <div className="w-2 h-2 rounded-full bg-white"/>}</div><input type="radio" name={name} value={val} checked={current === val} onChange={set} className="hidden"/><span className="font-bold text-sm">{label}</span></label>}
function StepWrapper({children}: any) { return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="p-1">{children}</motion.div>}
function GridRead({children}: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div> }
function FieldRead({label, val, full, highlight}: any) { return <div className={`${full ? 'col-span-1 md:col-span-2' : ''} flex flex-col`}><span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</span><span className={`text-sm font-medium border-b border-slate-100 pb-1 ${highlight ? 'text-blue-700 font-bold' : 'text-slate-800'}`}>{val || '-'}</span></div> }
function DocRead({label, url}: any) {
    const [previewOpen, setPreviewOpen] = useState(false)
    if (!url) return null
    const isPdf = url.toLowerCase().includes('.pdf')
    return (
        <>
            <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-all group text-left ${isPdf ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}
            >
                <div className={`p-2 rounded ${isPdf ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{isPdf ? <FileText size={16}/> : <ImageIcon size={16}/>}</div>
                <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-slate-700 truncate">{label}</p><p className="text-[10px] text-slate-400">{isPdf ? 'Documento PDF' : 'Imagen'}</p></div>
                <Eye size={14} className="text-slate-300 group-hover:text-slate-500"/>
            </button>

            {previewOpen && (
                <DocumentPreviewModal
                    label={label}
                    url={url}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </>
    )
}
