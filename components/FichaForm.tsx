'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Wallet,
  HardHat, ShieldCheck, PenTool, Eraser, Users, FileBadge, Plus, Trash2, Lock, Hammer, FileText, Download, Image as ImageIcon
} from 'lucide-react'

// --- ESTRUCTURA DE PASOS ---
const STEPS = [
  { id: 1, title: 'Datos Personales', icon: <User size={18} /> },
  { id: 2, title: 'Familia', icon: <Users size={18} /> },
  { id: 3, title: 'Laboral', icon: <HardHat size={18} /> },
  { id: 4, title: 'Documentos', icon: <FileBadge size={18} /> },
  { id: 5, title: 'Finalizar', icon: <PenTool size={18} /> },
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

  // --- LÓGICA PARA DETECTAR SI EL DNI ES PDF ---
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
                doc_esposa_dni: ficha.url_esposa_dni, // <--- CORREGIDO AQUÍ TAMBIÉN AL LEER
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
  
  // --- FUNCIÓN GUARDAR (AQUÍ ESTABA EL ERROR) ---
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
        
        // --- CORRECCIÓN AQUÍ ---
        // Antes decía url_dni_esposa, ahora es url_esposa_dni según tu DB
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

  if (isLoadingData) return <div className="h-screen flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-slate-800" size={40}/></div>

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

  // --- WIZARD EDITABLE ---
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-300">{STEPS[currentStep-1].icon}</div>
                 <div><h2 className="text-xl font-bold text-slate-900 leading-none">{STEPS[currentStep-1].title}</h2><p className="text-xs text-slate-500 font-medium mt-1">Paso {currentStep} de 5</p></div>
             </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-white overflow-hidden p-8 min-h-[500px] relative">
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
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
                    <p className="text-xs text-slate-500 mb-4 -mt-2">Puedes subir fotos (JPG/PNG) o documentos PDF. Si subes un PDF en el DNI, no es necesario subir el reverso.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <ImageUpload label="DNI (Frontal o PDF)" bucket="documentos" currentUrl={formData.doc_dni_trabajador} onUpload={(u:any)=>setFormData({...formData, doc_dni_trabajador:u})} />
                        
                        {!isDniPdf && (
                             <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}>
                                <ImageUpload label="DNI (Reverso)" bucket="documentos" currentUrl={formData.doc_dni_reverso} onUpload={(u:any)=>setFormData({...formData, doc_dni_reverso:u})} />
                             </motion.div>
                        )}
                        
                        <ImageUpload label="Certiadulto" bucket="documentos" currentUrl={formData.doc_certiadulto} onUpload={(u:any)=>setFormData({...formData, doc_certiadulto:u})} />
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
                    <div className="border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 relative overflow-hidden h-56 mx-auto max-w-xl touch-none mb-8 shadow-inner">
                        {formData.url_firma ? <img src={formData.url_firma} className="w-full h-full object-contain p-4" /> : <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full cursor-crosshair'}} onEnd={handleSignatureEnd} />}
                        {formData.url_firma && <button onClick={clearSignature} className="absolute top-4 right-4 bg-white text-slate-700 hover:text-red-600 p-2 rounded-lg shadow-md border border-slate-100 transition-colors"><Eraser size={20}/></button>}
                        {!formData.url_firma && <div className="absolute bottom-2 left-0 w-full text-center text-xs text-slate-400 pointer-events-none">Firma aquí</div>}
                    </div>
                    <label className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all max-w-xl mx-auto ${declaracionAceptada ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <input type="checkbox" checked={declaracionAceptada} onChange={(e) => setDeclaracionAceptada(e.target.checked)} className="w-6 h-6 accent-blue-600" />
                        <div><span className="font-bold block text-sm">Declaración Jurada</span><span className={`text-xs ${declaracionAceptada ? 'text-slate-300' : 'text-slate-500'}`}>Declaro bajo juramento que toda la información consignada es verdadera.</span></div>
                    </label>
                </StepWrapper>}
             </AnimatePresence>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-50">
             <div className="max-w-5xl mx-auto flex justify-between items-center">
                 <button onClick={() => setCurrentStep(p => Math.max(1, p - 1))} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100'}`}><ChevronLeft size={20}/> Atrás</button>
                 {currentStep < 5 ? (
                    <button onClick={() => { guardarProgreso(); setCurrentStep(p => Math.min(5, p + 1)) }} className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">Siguiente <ChevronRight size={20}/></button>
                 ) : (
                    <button onClick={finalizarFicha} disabled={sending} className="bg-emerald-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2">{sending ? <Loader2 className="animate-spin"/> : <><CheckCircle/> ENVIAR FICHA</>}</button>
                 )}
             </div>
        </div>
      </div>
    </div>
  )
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

// --- COMPONENTE MEJORADO: SOPORTE PDF + IMAGEN ---
function ImageUpload({label, bucket, onUpload, currentUrl}: any) { 
    const [uploading, setUploading] = useState(false); 
    const supabase = createClient(); 
    const isPdf = currentUrl?.toLowerCase().includes('.pdf');
    const handleFile = async (e:any) => { if(!e.target.files?.length) return; setUploading(true); const file = e.target.files[0]; const fn = `${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from(bucket).upload(fn, file); if(error) toast.error("Error al subir"); else { const { data } = supabase.storage.from(bucket).getPublicUrl(fn); onUpload(data.publicUrl); toast.success("Documento cargado"); } setUploading(false) }; 
    return (
        <div className={`relative border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all group h-32 flex flex-col items-center justify-center overflow-hidden ${currentUrl ? (isPdf ? 'border-red-500 bg-red-50/30' : 'border-emerald-500 bg-emerald-50/30') : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
            <input type="file" accept="image/*,.pdf" onChange={handleFile} className="absolute inset-0 opacity-0 z-10 cursor-pointer" disabled={uploading} />
            <div className="flex flex-col items-center gap-2 z-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${currentUrl ? (isPdf ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600') : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>{uploading ? <Loader2 className="animate-spin" size={20}/> : currentUrl ? (isPdf ? <FileText size={20}/> : <ImageIcon size={20}/>) : <Camera size={20}/>}</div>
                <div className="flex flex-col"><span className="text-xs font-bold text-slate-600 leading-tight px-2 line-clamp-2">{label}</span><span className="text-[10px] text-slate-400 mt-1">{uploading ? 'Subiendo...' : currentUrl ? 'Clic para cambiar' : 'Foto o PDF'}</span></div>
            </div>
            {currentUrl && !isPdf && <div className="absolute inset-0 z-[-1] opacity-20 bg-center bg-cover" style={{backgroundImage: `url(${currentUrl})`}}></div>}
        </div> 
    )
}

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