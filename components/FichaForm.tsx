'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Building2, Wallet,
  HardHat, Phone, MapPin, ShieldCheck, PenTool, Eraser, Users, AlertTriangle, FileText
} from 'lucide-react'

// Pasos del Wizard
const STEPS = [
  { id: 1, title: 'Datos Personales', icon: <User size={18} /> },
  { id: 2, title: 'Datos Laborales', icon: <HardHat size={18} /> },
  { id: 3, title: 'Formación/Familia', icon: <Users size={18} /> },
  { id: 4, title: 'Bancario/Salud', icon: <Wallet size={18} /> },
  { id: 5, title: 'Firma y Envío', icon: <PenTool size={18} /> },
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

  // ESTADO COMPLETO 
  const [formData, setFormData] = useState({
    // 1. Personal
    nombres: '', apellido_paterno: '', apellido_materno: '',
    dni: '', fecha_nacimiento: '', celular: '', estado_civil: '',
    direccion: '', distrito: '', provincia: '', departamento: '',
    url_dni_frontal: '', url_dni_reverso: '',
    
    // 2. Laboral
    carnet_retcc: '', fecha_vencimiento_retcc: '', url_carnet: '',
    nombre_obra: '', fecha_ingreso: '', categoria: '', cargo: '',
    sistema_pension: '', afp_nombre: '', cuspp: '', 
    
    // 3. Social / Estudios
    nivel_educacion: '', carrera: '', universidad: '', anio_egresado: '',
    esposa: '', hijos: '', url_acta_matrimonio: '', url_constancia_estudios: '',
    
    // 4. Financiero / Emergencia
    banco: '', numero_cuenta: '', cci: '',
    emergencia_nombre: '', emergencia_celular: '',
    
    // 5. Firma
    url_firma: ''
  })

  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingData(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: ficha } = await supabase.from('fichas').select('*').eq('user_id', user.id).maybeSingle()
        
        if (ficha) {
            const safeData = Object.keys(ficha).reduce((acc: any, key) => {
                acc[key] = ficha[key] === null ? '' : ficha[key]
                return acc
            }, {})
            setFormData(prev => ({...prev, ...safeData}))
            if (ficha.estado === 'completado') setIsCompleted(true)
        } else {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (profile) {
                setFormData(prev => ({
                    ...prev, 
                    nombres: profile.nombres || '',
                    apellido_paterno: profile.apellido_paterno || '',
                    apellido_materno: profile.apellido_materno || '',
                    dni: profile.dni || '',
                    celular: profile.telefono || ''
                }))
            }
        }
      }
      setIsLoadingData(false)
    }
    loadUser()
  }, [])

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSignatureEnd = () => {
    if (sigPad.current) setFormData(prev => ({ ...prev, url_firma: sigPad.current.getTrimmedCanvas().toDataURL('image/png') }))
  }
  const clearSignature = () => {
    sigPad.current?.clear()
    setFormData(prev => ({ ...prev, url_firma: '' }))
  }

  const cleanDataForSupabase = (data: any) => {
    const cleaned = { ...data }
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === '') cleaned[key] = null
    })
    return cleaned
  }

  const guardarProgreso = async (silent = false) => {
    if (!user) return
    const payload = cleanDataForSupabase(formData)
    const { error } = await supabase.from('fichas').upsert(
        { user_id: user.id, correo: user.email, ...payload, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
    )

    if (!silent) {
        if(error) toast.error("Error al guardar borrador")
        else toast.success("Progreso guardado")
    }
  }

  const validarFormulario = () => {
    const errores = []
    if (!formData.fecha_nacimiento) errores.push("Fecha Nacimiento")
    if (!formData.celular) errores.push("Celular")
    if (!formData.direccion) errores.push("Dirección")
    if (!formData.distrito) errores.push("Distrito")
    if (!formData.url_dni_frontal) errores.push("Foto DNI Frontal")
    if (!formData.nombre_obra) errores.push("Nombre de Obra")
    if (!formData.fecha_ingreso) errores.push("Fecha Ingreso")
    if (!formData.cargo) errores.push("Cargo")
    if (!formData.sistema_pension) errores.push("Sistema Pensión")
    if (formData.sistema_pension === 'AFP' && !formData.afp_nombre) errores.push("Nombre AFP")
    if (!formData.banco) errores.push("Banco")
    if (!formData.numero_cuenta) errores.push("N° Cuenta")
    if (!formData.cci) errores.push("CCI")
    if (!formData.emergencia_nombre) errores.push("Nombre Emergencia")
    if (!formData.emergencia_celular) errores.push("Celular Emergencia")
    if (!formData.url_firma) errores.push("Firma Digital")
    return errores
  }

  const finalizarFicha = async () => {
    if (!user) {
        toast.error("Sesión expirada. Recarga la página.")
        return
    }

    const camposFaltantes = validarFormulario()
    
    if (camposFaltantes.length > 0) {
        toast.error(
            <div className="space-y-1">
                <p className="font-bold flex items-center gap-2"><AlertTriangle size={16}/> Faltan datos obligatorios:</p>
                <ul className="list-disc pl-4 text-xs">
                    {camposFaltantes.slice(0, 5).map(c => <li key={c}>{c}</li>)}
                    {camposFaltantes.length > 5 && <li>...y más</li>}
                </ul>
            </div>, 
            { duration: 5000 }
        )
        return
    }

    if (!declaracionAceptada) {
        toast.error("⚠️ Debes aceptar la Declaración Jurada.")
        return
    }

    setSending(true)
    try {
        const payload = cleanDataForSupabase(formData)
        
        const { error } = await supabase.from('fichas').upsert(
            {
                user_id: user.id, 
                correo: user.email, 
                ...payload, 
                estado: 'completado', 
                updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
        )
        
        if (error) throw error
        
        toast.success("¡Ficha enviada correctamente!")
        new Audio('/success.mp3').play().catch(()=>{}) 
        setIsCompleted(true)
    } catch (error: any) {
        console.error("Error envío:", error)
        toast.error("Error: " + error.message)
    } finally {
        setSending(false)
    }
  }

  if (isLoadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>

  if (isCompleted) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-slate-100">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Enviado!</h2>
                <p className="text-slate-500 mb-8">Tus datos han sido registrados bajo declaración jurada.</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 flex items-center justify-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600"/>
                    Estado: <span className="text-green-600 font-bold">Verificado</span>
                </div>
            </motion.div>
        </div>
    )
  }

  if (!hasStarted) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="max-w-lg">
                <div className="mb-8 inline-flex p-6 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-200">
                    <FileText size={48} />
                </div>
                <h1 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">Ficha de Personal</h1>
                <p className="text-lg text-slate-500 mb-10 leading-relaxed">
                    Completa tu información para formalizar tu registro.
                </p>
                <button onClick={()=>setHasStarted(true)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg hover:shadow-xl">Comenzar Llenado</button>
            </motion.div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-sans pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center px-2">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">{STEPS[currentStep-1].icon}</span>
                {STEPS[currentStep-1].title}
             </h2>
             <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 shadow-sm">Paso {currentStep}/5</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-6">
             <AnimatePresence mode='wait'>
                {currentStep === 1 && <StepWrapper key="1">
                    <SectionTitle title="Información Básica" icon={<User/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Input label="Nombres" name="nombres" val={formData.nombres} set={handleChange} readOnly={true} className="md:col-span-3" />
                        <Input label="Ap. Paterno" name="apellido_paterno" val={formData.apellido_paterno} set={handleChange} readOnly={true} />
                        <Input label="Ap. Materno" name="apellido_materno" val={formData.apellido_materno} set={handleChange} readOnly={true} />
                        <Input label="DNI" name="dni" val={formData.dni} set={handleChange} readOnly={true} />
                    </div>
                    <SectionTitle title="Detalles Personales" icon={<Phone/>} className="mt-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                         <Input label="Fecha Nacimiento" type="date" name="fecha_nacimiento" val={formData.fecha_nacimiento} set={handleChange} required />
                         <Input label="Celular" name="celular" val={formData.celular} set={handleChange} required />
                         <Select label="Estado Civil" name="estado_civil" val={formData.estado_civil} set={handleChange} options={['Soltero', 'Casado', 'Conviviente', 'Divorciado']} required />
                    </div>
                    <SectionTitle title="Domicilio" icon={<MapPin/>} className="mt-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                         <Input label="Dirección Exacta" name="direccion" val={formData.direccion} set={handleChange} required className="md:col-span-3" />
                         <Input label="Distrito" name="distrito" val={formData.distrito} set={handleChange} required />
                         <Input label="Provincia" name="provincia" val={formData.provincia} set={handleChange} required />
                         <Input label="Departamento" name="departamento" val={formData.departamento} set={handleChange} required />
                    </div>
                    <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                         <h4 className="font-bold text-sm text-slate-700 mb-4 flex gap-2 items-center"><Camera size={16}/> Fotos del DNI (Obligatorio)</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ImageUpload label="Foto Frontal" bucket="documentos" currentUrl={formData.url_dni_frontal} onUpload={(u:any)=>setFormData({...formData, url_dni_frontal:u})} />
                            <ImageUpload label="Foto Reverso" bucket="documentos" currentUrl={formData.url_dni_reverso} onUpload={(u:any)=>setFormData({...formData, url_dni_reverso:u})} />
                         </div>
                    </div>
                </StepWrapper>}

                {currentStep === 2 && <StepWrapper key="2">
                    <SectionTitle title="Datos de Obra" icon={<Building2/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input label="Nombre de Obra / Proyecto" name="nombre_obra" val={formData.nombre_obra} set={handleChange} required className="md:col-span-2" />
                        <Input label="Fecha Ingreso" type="date" name="fecha_ingreso" val={formData.fecha_ingreso} set={handleChange} required />
                        <Select label="Categoría" name="categoria" val={formData.categoria} set={handleChange} options={['Operario', 'Oficial', 'Peon', 'Staff', 'Capataz']} required />
                        <Input label="Cargo" name="cargo" val={formData.cargo} set={handleChange} required className="md:col-span-2" />
                    </div>
                    <SectionTitle title="Documentación Técnica (RETCC)" icon={<HardHat/>} className="mt-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input label="N° Carnet RETCC" name="carnet_retcc" val={formData.carnet_retcc} set={handleChange} />
                        <Input label="Vencimiento RETCC" type="date" name="fecha_vencimiento_retcc" val={formData.fecha_vencimiento_retcc} set={handleChange} />
                        <div className="md:col-span-2"><ImageUpload label="Foto Carnet RETCC" bucket="documentos" currentUrl={formData.url_carnet} onUpload={(u:any)=>setFormData({...formData, url_carnet:u})} /></div>
                    </div>
                    <SectionTitle title="Sistema de Pensiones" icon={<ShieldCheck/>} className="mt-8"/>
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                         <Select label="Régimen" name="sistema_pension" val={formData.sistema_pension} set={handleChange} options={['ONP', 'AFP']} required />
                         {formData.sistema_pension === 'AFP' && <Input label="Nombre AFP" name="afp_nombre" val={formData.afp_nombre} set={handleChange} required placeholder="Ej: Integra, Prima..." />}
                         <Input label="CUSPP (Si tiene)" name="cuspp" val={formData.cuspp} set={handleChange} />
                    </div>
                </StepWrapper>}

                {currentStep === 3 && <StepWrapper key="3">
                    <SectionTitle title="Educación" icon={<GraduationCap/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <Select label="Nivel Educativo" name="nivel_educacion" val={formData.nivel_educacion} set={handleChange} options={['Primaria', 'Secundaria', 'Tecnico', 'Universitario']} />
                         <Input label="Carrera / Oficio" name="carrera" val={formData.carrera} set={handleChange} />
                         <Input label="Institución" name="universidad" val={formData.universidad} set={handleChange} />
                         <Input label="Año Egreso" name="anio_egresado" val={formData.anio_egresado} set={handleChange} />
                         <div className="md:col-span-2"><ImageUpload label="Certificado Estudios (Opcional)" bucket="documentos" currentUrl={formData.url_constancia_estudios} onUpload={(u:any)=>setFormData({...formData, url_constancia_estudios:u})} /></div>
                    </div>
                    <SectionTitle title="Datos Familiares" icon={<Users/>} className="mt-8"/>
                    <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="md:col-span-2 flex items-center gap-2 mb-2"><span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">OPCIONAL</span></div>
                         <Input label="Esposa / Conviviente" name="esposa" val={formData.esposa} set={handleChange} />
                         <Input label="Hijos (Nombres)" name="hijos" val={formData.hijos} set={handleChange} placeholder="Ej: Juan (5), Maria (2)" />
                         <div className="md:col-span-2"><ImageUpload label="Acta Matrimonio / DNI Hijos" bucket="documentos" currentUrl={formData.url_acta_matrimonio} onUpload={(u:any)=>setFormData({...formData, url_acta_matrimonio:u})} /></div>
                    </div>
                </StepWrapper>}

                {currentStep === 4 && <StepWrapper key="4">
                    <SectionTitle title="Cuenta Bancaria (Haberes)" icon={<Wallet/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-green-50 p-4 rounded-xl mb-4">
                        <Input label="Banco" name="banco" val={formData.banco} set={handleChange} required placeholder="Ej: BCP, BBVA..."/>
                        <Input label="N° Cuenta" name="numero_cuenta" val={formData.numero_cuenta} set={handleChange} required />
                        <Input label="CCI (20 dígitos)" name="cci" val={formData.cci} set={handleChange} required className="md:col-span-2" placeholder="002..."/>
                    </div>
                    <SectionTitle title="En Caso de Emergencia" icon={<HeartPulse/>} className="mt-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-red-50 p-4 rounded-xl">
                       <Input label="Nombre de Contacto" name="emergencia_nombre" val={formData.emergencia_nombre} set={handleChange} required />
                       <Input label="Celular de Contacto" name="emergencia_celular" val={formData.emergencia_celular} set={handleChange} required />
                    </div>
                </StepWrapper>}

                {currentStep === 5 && <StepWrapper key="5">
                     <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-slate-800">Firma del Trabajador</h3>
                        <p className="text-slate-500">Dibuja tu firma en el recuadro para dar validez legal a la ficha.</p>
                     </div>
                     <div className="border-2 border-slate-300 border-dashed rounded-2xl bg-white relative overflow-hidden h-64 shadow-inner touch-none mx-auto max-w-lg">
                        {formData.url_firma ? (
                            <img src={formData.url_firma} alt="Firma" className="w-full h-full object-contain p-6" />
                        ) : (
                            <SignatureCanvas 
                                ref={sigPad} 
                                penColor="black" 
                                canvasProps={{className: 'w-full h-full cursor-crosshair'}} 
                                onEnd={handleSignatureEnd} 
                            />
                        )}
                        {formData.url_firma && <button onClick={clearSignature} className="absolute top-4 right-4 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition-colors shadow-sm"><Eraser size={20}/></button>}
                    </div>
                    <div className="mt-8 max-w-lg mx-auto">
                        <label className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${declaracionAceptada ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <div className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${declaracionAceptada ? 'bg-white border-white' : 'border-slate-300 bg-white'}`}>
                                {declaracionAceptada && <CheckCircle size={16} className="text-blue-600" />}
                            </div>
                            <input type="checkbox" checked={declaracionAceptada} onChange={(e) => setDeclaracionAceptada(e.target.checked)} className="hidden" />
                            <div className="text-sm">
                                <span className="font-bold block mb-1 text-base flex items-center gap-2"><ShieldCheck size={16}/> Declaración Jurada</span>
                                <span className={declaracionAceptada ? 'text-blue-100' : 'text-slate-500'}>
                                    Declaro bajo juramento que toda la información consignada y documentación adjunta es verdadera y correcta.
                                </span>
                            </div>
                        </label>
                    </div>
                </StepWrapper>}
             </AnimatePresence>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}><ChevronLeft size={20}/> Atrás</button>
                 {currentStep < 5 ? (
                    <button onClick={() => { guardarProgreso(true); setCurrentStep(prev => Math.min(5, prev + 1)) }} className="flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-300">Siguiente <ChevronRight size={20}/></button>
                 ) : (
                    <button onClick={finalizarFicha} disabled={sending} className="flex items-center gap-2 bg-green-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-green-700 hover:scale-105 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:scale-100">{sending ? <Loader2 className="animate-spin"/> : <><CheckCircle/> ENVIAR FICHA</>}</button>
                 )}
             </div>
        </div>
      </div>
    </div>
  )
}

function StepWrapper({children}: any) {
    return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="p-8">{children}</motion.div>
}

function SectionTitle({title, icon, className=""}: any) {
    return (
        <div className={`flex items-center gap-3 mb-6 ${className}`}>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">{icon}</div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
    )
}

function Input({label, name, val, set, type="text", placeholder="", required=false, readOnly=false, className=""}: any) {
    return (
        <div className={className}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            <input 
                type={type} name={name} value={val || ''} onChange={set} placeholder={placeholder} readOnly={readOnly}
                className={`w-full p-3.5 rounded-xl border outline-none transition-all font-medium 
                    ${readOnly 
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none' 
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-700'
                    }`}
            />
        </div>
    )
}

function Select({label, name, val, set, options=[], required=false}: any) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="relative">
                <select name={name} value={val || ''} onChange={set} className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer">
                    <option value="">Seleccionar...</option>
                    {options.map((opt:string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="rotate-90" size={16}/></div>
            </div>
        </div>
    )
}

function ImageUpload({label, bucket, onUpload, currentUrl}: any) {
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const handleFile = async (e: any) => {
        if (!e.target.files?.length) return
        setUploading(true)
        const file = e.target.files[0]
        const fn = `${Math.random()}.${file.name.split('.').pop()}`
        
        const { error } = await supabase.storage.from(bucket).upload(fn, file)
        if (error) { 
            toast.error("Error al subir")
            setUploading(false) 
        } else { 
            const { data } = supabase.storage.from(bucket).getPublicUrl(fn)
            onUpload(data.publicUrl)
            setUploading(false)
            toast.success("Cargado") 
        }
    }

    return (
        <div className={`relative group border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer overflow-hidden ${currentUrl ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}>
            <input type="file" accept="image/*,.pdf" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" disabled={uploading} />
            
            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                {uploading ? (
                    <>
                        <Loader2 className="animate-spin text-blue-600"/>
                        <span className="text-xs font-bold text-blue-600">Subiendo...</span>
                    </>
                ) : currentUrl ? (
                    <>
                        <CheckCircle size={20} className="text-green-500"/>
                        <span className="text-xs font-bold text-blue-700 mt-1">Archivo Cargado</span>
                    </>
                ) : (
                    <>
                        <Camera size={20} className="text-slate-400"/>
                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700">{label}</span>
                    </>
                )}
            </div>
        </div>
    )
}