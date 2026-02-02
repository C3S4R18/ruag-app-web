'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import jsPDF from 'jspdf' // Asegúrate de tener instalado: npm install jspdf
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Wallet,
  HardHat, ShieldCheck, PenTool, Eraser, Users, FileBadge, Plus, Trash2, Lock, Hammer, FileText, Download, Image as ImageIcon, UploadCloud, RefreshCw, X, Maximize
} from 'lucide-react'

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
    doc_dni_trabajador: '', doc_dni_reverso: '',
    doc_certiadulto: '', 
    doc_policiales: '', doc_penales: '',
    doc_carnet_retcc: '',
    doc_esposa_matrimonio: '', doc_esposa_dni: '',
    doc_hijos_nacimiento: '', doc_hijos_dni: '', doc_hijos_estudios: '',
    
    // FIRMA
    url_firma: ''
  })

  // Detectar PDF para mostrar icono en lugar de preview
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
                doc_dni_reverso: ficha.url_dni_reverso,
                doc_certiadulto: ficha.url_antecedentes,
                doc_carnet_retcc: ficha.url_carnet,
                doc_policiales: ficha.url_policiales,
                doc_penales: ficha.url_penales,
                doc_esposa_matrimonio: ficha.url_acta_matrimonio,
                doc_esposa_dni: ficha.url_esposa_dni, 
                doc_hijos_nacimiento: ficha.url_hijos_nacimiento,
                doc_hijos_dni: ficha.url_hijos_dni, 
                doc_hijos_estudios: ficha.url_constancia_estudios,
            })
            
            if (ficha.estado === 'completado') setIsCompleted(true)
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
                toast.success("Ficha validada")
            }
        }).subscribe()
      }
      setIsLoadingData(false)
    }
    loadUser()
  }, [])

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  // Handlers
  const handleEsposaChange = (field: string, val: string) => setFormData((prev:any) => ({ ...prev, esposa_datos: { ...prev.esposa_datos, [field]: val } }))
  const addHijo = () => setFormData((prev:any) => ({ ...prev, hijos_datos: [...prev.hijos_datos, { paterno: '', materno: '', nombres: '' }] }))
  const removeHijo = (idx: number) => setFormData((prev:any) => ({ ...prev, hijos_datos: prev.hijos_datos.filter((_:any, i:number) => i !== idx) }))
  const handleHijoChange = (idx: number, field: string, val: string) => {
      const newHijos = [...formData.hijos_datos]; newHijos[idx] = { ...newHijos[idx], [field]: val }
      setFormData((prev:any) => ({ ...prev, hijos_datos: newHijos }))
  }
  const handleSignatureEnd = () => { if (sigPad.current) setFormData((prev:any) => ({ ...prev, url_firma: sigPad.current.getTrimmedCanvas().toDataURL('image/png') })) }
  const clearSignature = () => { sigPad.current?.clear(); setFormData((prev:any) => ({ ...prev, url_firma: '' })) }
  
  const guardarProgreso = async (complete: boolean = false) => {
    if (!user) return
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
        url_dni_frontal: formData.doc_dni_trabajador, url_dni_reverso: formData.doc_dni_reverso,
        url_antecedentes: formData.doc_certiadulto, url_policiales: formData.doc_policiales, url_penales: formData.doc_penales,
        url_carnet: formData.doc_carnet_retcc,
        url_acta_matrimonio: formData.doc_esposa_matrimonio, 
        url_esposa_dni: formData.doc_esposa_dni, 
        url_hijos_nacimiento: formData.doc_hijos_nacimiento, url_hijos_dni: formData.doc_hijos_dni, url_constancia_estudios: formData.doc_hijos_estudios,
        
        url_firma: formData.url_firma, updated_at: new Date().toISOString(), estado: complete ? 'completado' : 'pendiente'
    }
    // Limpieza de nulos
    Object.keys(payload).forEach((key:any) => { if ((payload as any)[key] === '') (payload as any)[key] = null });
    
    const { data, error } = await supabase
        .from('fichas')
        .upsert({ user_id: user.id, correo: user.email, ...payload }, { onConflict: 'user_id' })
        .select().single()
    
    if (data) setFormData((prev:any) => ({...prev, id: data.id}))
    if (complete) return error
    if (!error) toast.success("Progreso guardado")
  }

  const finalizarFicha = async () => {
    if(!formData.apellido_paterno || !formData.dni || !formData.celular) { toast.error("Faltan datos obligatorios"); return }
    if (!declaracionAceptada) { toast.error("Debes aceptar la declaración jurada"); return }
    setSending(true)
    const error = await guardarProgreso(true)
    if (!error) { toast.success("Ficha enviada"); setIsCompleted(true) }
    else toast.error("Error: " + error.message)
    setSending(false)
  }

  if (isLoadingData) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-800" size={40}/></div>

  // VISTA LECTURA
  if (isCompleted) {
    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 flex justify-center pb-20">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white max-w-4xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="bg-white/10 p-4 rounded-full border border-white/20"><Hammer size={40} className="text-white animate-pulse" /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Registro Exitoso!</h2>
                            <p className="text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">Tu ficha ha sido enviada. El módulo de <strong className="text-white">Inducción SSOMA</strong> estará disponible proximamente puede continuar 😸.</p>
                        </div>
                        <div className="mt-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-xs font-bold tracking-wider">FICHA COMPLETADA</div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold uppercase text-xs tracking-widest border-b pb-2"><FileText size={14}/> Resumen de tu Legajo</div>
                    <div className="space-y-8">
                        <SectionRead title="1. Datos Personales" icon={<User size={16}/>}>
                            <GridRead>
                                <FieldRead label="Apellidos y Nombres" val={`${formData.apellido_paterno} ${formData.apellido_materno}, ${formData.nombres}`} full />
                                <FieldRead label="DNI" val={formData.dni} highlight />
                                <FieldRead label="Celular" val={formData.celular} />
                                <FieldRead label="Dirección" val={formData.direccion} full />
                            </GridRead>
                        </SectionRead>
                        <SectionRead title="2. Datos Bancarios" icon={<Wallet size={16}/>}>
                            <GridRead>
                                <FieldRead label="Banco" val={formData.banco} />
                                <FieldRead label="N° Cuenta" val={formData.cuenta_ahorros} highlight />
                                <FieldRead label="AFP/ONP" val={formData.sistema_pension} />
                            </GridRead>
                        </SectionRead>
                        <SectionRead title="3. Laboral" icon={<HardHat size={16}/>}>
                            <GridRead>
                                <FieldRead label="Cargo" val={formData.cargo} highlight />
                                <FieldRead label="Obra" val={formData.nombre_obra} highlight />
                            </GridRead>
                        </SectionRead>
                        <SectionRead title="4. Documentos" icon={<FileBadge size={16}/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <DocRead label="DNI (Frontal)" url={formData.doc_dni_trabajador} />
                                <DocRead label="DNI (Reverso)" url={formData.doc_dni_reverso} />
                                <DocRead label="Antecedentes" url={formData.doc_certiadulto} />
                                <DocRead label="Carnet RETCC" url={formData.doc_carnet_retcc} />
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

  // --- WIZARD EDITABLE (MEJORADO) ---
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de Pasos Mejorado */}
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
                    </div>
                    <SectionTitle title="Contacto y Ubicación" icon={<ShieldCheck/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <Input label="Celular N°" name="celular" val={formData.celular} set={handleChange} required placeholder="999 000 000" />
                        <Input label="Correo Electrónico" name="correo" val={formData.correo} set={handleChange} />
                        <Input label="Dirección actual" name="direccion" val={formData.direccion} set={handleChange} required />
                        <Input label="Distrito" name="distrito" val={formData.distrito} set={handleChange} required />
                        <Input label="Provincia" name="provincia" val={formData.provincia} set={handleChange} required />
                        <Input label="Departamento" name="departamento" val={formData.departamento} set={handleChange} required />
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
                                            <div className="grid grid-cols-1 gap-3"><Input label="Nombres" val={hijo.nombres} onChange={(e:any)=>handleHijoChange(idx, 'nombres', e.target.value)} /><div className="grid grid-cols-2 gap-3"><Input label="Paterno" val={hijo.paterno} onChange={(e:any)=>handleHijoChange(idx, 'paterno', e.target.value)} /><Input label="Materno" val={hijo.materno} onChange={(e:any)=>handleHijoChange(idx, 'materno', e.target.value)} /></div></div>
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
                            <Select label="Nivel educativo" name="nivel_educativo" val={formData.nivel_educativo} set={handleChange} options={['Primaria', 'Secundaria', 'Técnico', 'Universitario']} required />
                            <Input label="Carrera / Oficio" name="carrera" val={formData.carrera} set={handleChange} required />
                            <Input label="Institución Educativa" name="centro_formacion" val={formData.centro_formacion} set={handleChange} required className="md:col-span-2" />
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
                        <ImageUpload label="DNI (Frontal o PDF)" bucket="documentos" currentUrl={formData.doc_dni_trabajador} onUpload={(u:any)=>setFormData({...formData, doc_dni_trabajador:u})} />
                        
                        {!isDniPdf && (
                            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}>
                                <ImageUpload label="DNI (Reverso)" bucket="documentos" currentUrl={formData.doc_dni_reverso} onUpload={(u:any)=>setFormData({...formData, doc_dni_reverso:u})} />
                            </motion.div>
                        )}
                        
                        <ImageUpload label="Certiadulto (Antecedentes)" bucket="documentos" currentUrl={formData.doc_certiadulto} onUpload={(u:any)=>setFormData({...formData, doc_certiadulto:u})} />
                        <ImageUpload label="Carnet RETCC" bucket="documentos" currentUrl={formData.doc_carnet_retcc} onUpload={(u:any)=>setFormData({...formData, doc_carnet_retcc:u})} />
                        <ImageUpload label="Ant. Policiales" bucket="documentos" currentUrl={formData.doc_policiales} onUpload={(u:any)=>setFormData({...formData, doc_policiales:u})} />
                        <ImageUpload label="Ant. Penales" bucket="documentos" currentUrl={formData.doc_penales} onUpload={(u:any)=>setFormData({...formData, doc_penales:u})} />
                    </div>

                    <SectionTitle title="Documentos Familiares" icon={<Users/>} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <ImageUpload label="Acta Matrimonio" bucket="documentos" currentUrl={formData.doc_esposa_matrimonio} onUpload={(u:any)=>setFormData({...formData, doc_esposa_matrimonio:u})} />
                        <ImageUpload label="DNI Esposa" bucket="documentos" currentUrl={formData.doc_esposa_dni} onUpload={(u:any)=>setFormData({...formData, doc_esposa_dni:u})} />
                        <ImageUpload label="DNI Hijos" bucket="documentos" currentUrl={formData.doc_hijos_dni} onUpload={(u:any)=>setFormData({...formData, doc_hijos_dni:u})} />
                        <ImageUpload label="Estudios Hijos" bucket="documentos" currentUrl={formData.doc_hijos_estudios} onUpload={(u:any)=>setFormData({...formData, doc_hijos_estudios:u})} />
                    </div>
                </StepWrapper>}

                {currentStep === 5 && <StepWrapper key="5">
                    <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-slate-900">Firma de Conformidad</h3>
                            <p className="text-slate-500">Dibuja tu firma en el recuadro para validar la ficha.</p>
                    </div>
                    <div className="border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 relative overflow-hidden h-56 mx-auto max-w-xl touch-none mb-8 shadow-inner hover:border-slate-300 transition-colors">
                        {formData.url_firma ? <img src={formData.url_firma} className="w-full h-full object-contain p-4" /> : <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full cursor-crosshair'}} onEnd={handleSignatureEnd} />}
                        {formData.url_firma && <button onClick={clearSignature} className="absolute top-4 right-4 bg-white text-slate-700 hover:text-red-600 p-2 rounded-lg shadow-md border border-slate-100 transition-colors"><Eraser size={20}/></button>}
                        {!formData.url_firma && <div className="absolute bottom-2 left-0 w-full text-center text-xs text-slate-400 pointer-events-none">Firma dentro del recuadro</div>}
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
                    <button onClick={() => { guardarProgreso(); setCurrentStep(p => Math.min(5, p + 1)) }} className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95">Siguiente <ChevronRight size={20}/></button>
                 ) : (
                    <button onClick={finalizarFicha} disabled={sending} className="bg-emerald-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">{sending ? <Loader2 className="animate-spin"/> : <><CheckCircle/> ENVIAR FICHA</>}</button>
                 )}
             </div>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENTE MEJORADO: SOPORTE CAMARA, PDF AUTO Y ENCUADRE ---
function ImageUpload({label, bucket, onUpload, currentUrl}: any) { 
    const [uploading, setUploading] = useState(false); 
    const [showCamera, setShowCamera] = useState(false);
    const supabase = createClient(); 
    
    // Detectar si ya es un PDF (por si viene de BD)
    const isPdf = currentUrl?.toLowerCase().includes('.pdf');
    
    // Determinar el formato de captura basado en el nombre del documento
    // Si dice DNI o Carnet -> Horizontal (ID Card). Si no -> Vertical (A4)
    const captureFormat = (label.toLowerCase().includes('dni') || label.toLowerCase().includes('carnet')) 
        ? 'id-card' 
        : 'a4';

    // Subida Normal de Archivos
    const handleFile = async (e:any) => { 
        if(!e.target.files?.length) return; 
        processUpload(e.target.files[0]);
    }; 
    
    // Subida desde Cámara (Recibe un File que YA ES PDF gracias al modal)
    const handleCameraCapture = (file: File) => {
        setShowCamera(false);
        processUpload(file);
    };

    const processUpload = async (file: File) => {
        setUploading(true);
        // Generar nombre único
        const fileExt = file.name.split('.').pop() || 'pdf'; 
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
            contentType: file.type // Aseguramos que se suba con el tipo correcto (pdf o img)
        }); 
        
        if(error) {
            toast.error("Error al subir el documento");
            console.error(error);
        } else { 
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName); 
            onUpload(data.publicUrl); 
            toast.success("Documento cargado correctamente"); 
        } 
        setUploading(false);
    };

    return (
        <>
            <div className={`relative border border-dashed rounded-xl p-4 text-center transition-all group h-36 flex flex-col items-center justify-center overflow-hidden ${currentUrl ? (isPdf ? 'border-red-500 bg-red-50/30' : 'border-emerald-500 bg-emerald-50/30') : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
                
                <div className="flex flex-col gap-3 w-full relative z-10">
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

            {/* Modal de Cámara Inteligente */}
            {showCamera && (
                <CameraCaptureModal 
                    onClose={() => setShowCamera(false)} 
                    onCapture={handleCameraCapture} 
                    format={captureFormat} // Pasamos el formato detectado
                />
            )}
        </>
    )
}

// --- MODAL DE CÁMARA MEJORADO (CON GENERACIÓN DE PDF) ---
function CameraCaptureModal({ onClose, onCapture, format }: { onClose: () => void, onCapture: (file: File) => void, format: 'id-card' | 'a4' }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Configuración según formato
    const isLandscape = format === 'id-card';
    const guideText = isLandscape ? "Ubica el DNI dentro del recuadro" : "Ubica el documento completo";
    
    // Estilos del recuadro guía (Aspect Ratio)
    // DNI aprox 1.58:1 (landscape) | A4 aprox 1:1.41 (portrait)
    const frameClasses = isLandscape 
        ? "w-[90%] aspect-[1.58] max-w-md"  // Horizontal
        : "h-[80%] aspect-[0.70] max-h-[600px]"; // Vertical

    const startCamera = async () => {
        try {
            // Intentar usar cámara trasera con alta resolución
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
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

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Configurar canvas al tamaño nativo del video para máxima calidad
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Efecto espejo si es cámara frontal (opcional, aquí asumimos trasera)
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setImage(canvas.toDataURL('image/jpeg', 0.9)); // Calidad 0.9
                // No detenemos la cámara aún por si quiere reintentar rápido
            }
        }
    };

    const confirmAndConvertToPdf = async () => {
        if (!image) return;
        setProcessing(true);

        try {
            // 1. Crear instancia de PDF (A4)
            // 'p' = portrait (vertical), 'l' = landscape (horizontal)
            // Si el formato es ID-Card, usamos A4 pero ponemos la imagen centrada
            // Si el formato es A4, llenamos la página
            const pdfDoc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdfDoc.internal.pageSize.getWidth();
            const pageHeight = pdfDoc.internal.pageSize.getHeight();

            // 2. Cargar imagen para obtener dimensiones
            const imgProps = pdfDoc.getImageProperties(image);
            
            let finalWidth, finalHeight, x, y;

            if (isLandscape) {
                // DNI: Centrado y con un tamaño razonable (ej. 85mm ancho real aprox, lo escalamos a 150mm para que se vea bien)
                finalWidth = 150; 
                finalHeight = (imgProps.height * finalWidth) / imgProps.width;
                x = (pageWidth - finalWidth) / 2;
                y = (pageHeight - finalHeight) / 2;
            } else {
                // A4: Ajustar al ancho de la página con márgenes
                const margin = 10;
                finalWidth = pageWidth - (margin * 2);
                finalHeight = (imgProps.height * finalWidth) / imgProps.width;
                
                // Si la altura se pasa, ajustar por altura
                if (finalHeight > (pageHeight - margin * 2)) {
                    finalHeight = pageHeight - (margin * 2);
                    finalWidth = (imgProps.width * finalHeight) / imgProps.height;
                }
                x = (pageWidth - finalWidth) / 2;
                y = margin; // Margen superior
            }

            // 3. Agregar imagen al PDF
            pdfDoc.addImage(image, 'JPEG', x, y, finalWidth, finalHeight);

            // 4. Generar Blob
            const pdfBlob = pdfDoc.output('blob');
            const fileName = `scan_${isLandscape ? 'dni' : 'doc'}_${Date.now()}.pdf`;
            const file = new File([pdfBlob], fileName, { type: "application/pdf" });

            // 5. Enviar al padre
            onCapture(file);
            stopCamera();
        } catch (e) {
            console.error(e);
            toast.error("Error al generar PDF");
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {image ? (
                // VISTA PREVIA
                <div className="relative flex-1 flex flex-col items-center justify-center bg-black">
                    <img src={image} alt="Captura" className="max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/20" />
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex gap-4 justify-center pb-8">
                        <button 
                            onClick={() => setImage(null)} 
                            className="flex-1 bg-white/10 backdrop-blur-md text-white border border-white/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
                            disabled={processing}
                        >
                            <RefreshCw className="inline mr-2" size={16}/> Repetir
                        </button>
                        <button 
                            onClick={confirmAndConvertToPdf} 
                            disabled={processing}
                            className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                        >
                            {processing ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle size={18}/> Confirmar PDF</>}
                        </button>
                    </div>
                </div>
            ) : (
                // VISTA CÁMARA
                <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                        <button onClick={onClose} className="text-white bg-white/10 p-2.5 rounded-full backdrop-blur-md"><X size={20}/></button>
                        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/90 text-xs font-medium border border-white/10">
                            {isLandscape ? 'Modo: Tarjeta / DNI' : 'Modo: Documento A4'}
                        </div>
                    </div>

                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* --- RECUADRO GUÍA INTELIGENTE --- */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        {/* Fondo oscuro con recorte (mask) visualmente simulado por bordes grandes o div semitransparentes, 
                            aquí usaremos un borde simple pero elegante */}
                        <div className={`relative border-2 border-white/90 rounded-xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)] transition-all duration-300 ${frameClasses}`}>
                            {/* Esquinas decorativas */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-lg"></div>
                            
                            {/* Línea de escaneo animada */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-scan"></div>
                            
                            {/* Instrucción central */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 text-xs font-bold bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm whitespace-nowrap">
                                {guideText}
                            </div>
                        </div>
                    </div>

                    {/* Footer Controles */}
                    <div className="absolute bottom-0 w-full pb-10 pt-20 bg-gradient-to-t from-black via-black/50 to-transparent flex justify-center items-center z-20">
                        <button 
                            onClick={capturePhoto} 
                            className="w-20 h-20 bg-white rounded-full border-4 border-slate-300/50 shadow-2xl active:scale-90 transition-transform flex items-center justify-center relative"
                        >
                            <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-200 ring-2 ring-transparent group-hover:ring-emerald-500"></div>
                        </button>
                    </div>
                </div>
            )}
            {/* Canvas oculto para procesar */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

// --- COMPONENTES AUXILIARES ---

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
    if (!url) return null
    const isPdf = url.toLowerCase().includes('.pdf')
    return (
        <a href={url} target="_blank" className={`flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-all group ${isPdf ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            <div className={`p-2 rounded ${isPdf ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{isPdf ? <FileText size={16}/> : <ImageIcon size={16}/>}</div>
            <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-slate-700 truncate">{label}</p><p className="text-[10px] text-slate-400">{isPdf ? 'Documento PDF' : 'Imagen'}</p></div>
            <Download size={14} className="text-slate-300 group-hover:text-slate-500"/>
        </a>
    )
}