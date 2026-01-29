'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Building2, Wallet,
  HardHat, Phone, MapPin, ShieldCheck, PenTool, Eraser, Users, AlertTriangle, FileText, Lock, FileBadge, Plus, Trash2, Eye
} from 'lucide-react'

// --- ESTRUCTURA DE PASOS ---
const STEPS = [
  { id: 1, title: 'Datos Personales y Financieros', icon: <User size={18} /> },
  { id: 2, title: 'Derecho Habientes', icon: <Users size={18} /> },
  { id: 3, title: 'Laboral y Formación', icon: <HardHat size={18} /> },
  { id: 4, title: 'Emergencia y Documentos', icon: <FileBadge size={18} /> },
  { id: 5, title: 'Firma y Declaración', icon: <PenTool size={18} /> },
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

  // --- ESTADO COMPLETO (Sincronizado con BD) ---
  const [formData, setFormData] = useState<any>({
    // DATOS PERSONALES
    apellido_paterno: '', apellido_materno: '', nombres: '',
    fecha_nacimiento: '', dni: '', direccion: '', distrito: '', provincia: '', departamento: '',
    correo: '', celular: '',
    
    // PENSIONES
    sistema_pension: '', afp_nombre: '', cuspp: '',
    
    // BANCARIOS
    banco: '', cuenta_ahorros: '', cci: '', // Agregado CCI por si acaso
    
    // DERECHO HABIENTES (Objetos complejos)
    esposa_datos: { paterno: '', materno: '', nombres: '', dni: '' },
    hijos_datos: [], 
    
    // LABORALES
    categoria: '', cargo: '', nombre_obra: '', fecha_ingreso: '',
    carnet_retcc: '', fecha_vencimiento_retcc: '',
    
    // FORMACION
    nivel_educativo: '', carrera: '', centro_formacion: '',
    
    // EMERGENCIA
    emergencia_nombre: '', emergencia_parentesco: '', emergencia_telefono: '',
    
    // DOCUMENTOS (URLs)
    doc_dni_trabajador: '', doc_certiadulto: '', doc_policiales: '', doc_penales: '', doc_carnet_retcc: '',
    doc_esposa_matrimonio: '', doc_esposa_dni: '',
    doc_hijos_nacimiento: '', doc_hijos_dni: '', doc_hijos_estudios: '',
    
    // FIRMA
    url_firma: ''
  })

  // Carga inicial
  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingData(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: ficha } = await supabase.from('fichas').select('*').eq('user_id', user.id).maybeSingle()
        if (ficha) {
            // Parsear JSONs
            let esposaObj = { paterno: '', materno: '', nombres: '', dni: '' }
            let hijosArr: any[] = []
            try { esposaObj = ficha.esposa ? JSON.parse(ficha.esposa) : esposaObj } catch(e) {}
            try { hijosArr = ficha.hijos ? JSON.parse(ficha.hijos) : [] } catch(e) {}

            setFormData({
                ...formData,
                ...ficha, // Carga campos directos
                esposa_datos: esposaObj,
                hijos_datos: hijosArr,
                // Mapeos de compatibilidad si los nombres en DB difieren del state
                cuenta_ahorros: ficha.numero_cuenta || ficha.cuenta_ahorros,
                nivel_educativo: ficha.nivel_educacion || ficha.nivel_educativo,
                centro_formacion: ficha.universidad || ficha.centro_formacion,
                emergencia_parentesco: ficha.emergencia_relacion || ficha.emergencia_parentesco,
                emergencia_telefono: ficha.emergencia_celular || ficha.emergencia_telefono,
                // Docs
                doc_dni_trabajador: ficha.url_dni_frontal, 
                doc_certiadulto: ficha.url_antecedentes,
                doc_carnet_retcc: ficha.url_carnet,
            })
            if (ficha.estado === 'completado') setIsCompleted(true)
        } else {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (profile) setFormData((prev:any) => ({...prev, nombres: profile.nombres, apellido_paterno: profile.apellido_paterno, apellido_materno: profile.apellido_materno, dni: profile.dni, celular: profile.telefono, correo: user.email}))
        }
        
        supabase.channel('my-ficha').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas', filter: `user_id=eq.${user.id}` }, (payload) => {
            if(payload.new.estado === 'pendiente') { setIsCompleted(false); toast.info("Edición habilitada") }
            else if (payload.new.estado === 'completado') setIsCompleted(true)
        }).subscribe()
      }
      setIsLoadingData(false)
    }
    loadUser()
  }, [])

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  // Handlers complejos
  const handleEsposaChange = (field: string, val: string) => setFormData((prev:any) => ({ ...prev, esposa_datos: { ...prev.esposa_datos, [field]: val } }))
  const addHijo = () => setFormData((prev:any) => ({ ...prev, hijos_datos: [...prev.hijos_datos, { paterno: '', materno: '', nombres: '' }] }))
  const removeHijo = (idx: number) => setFormData((prev:any) => ({ ...prev, hijos_datos: prev.hijos_datos.filter((_:any, i:number) => i !== idx) }))
  const handleHijoChange = (idx: number, field: string, val: string) => {
      const newHijos = [...formData.hijos_datos]; newHijos[idx] = { ...newHijos[idx], [field]: val }
      setFormData((prev:any) => ({ ...prev, hijos_datos: newHijos }))
  }
  const handleSignatureEnd = () => { if (sigPad.current) setFormData((prev:any) => ({ ...prev, url_firma: sigPad.current.getTrimmedCanvas().toDataURL('image/png') })) }
  const clearSignature = () => { sigPad.current?.clear(); setFormData((prev:any) => ({ ...prev, url_firma: '' })) }
  
  const cleanAndSave = async (complete: boolean = false) => {
    if (!user) return
    const payload = {
        nombres: formData.nombres, apellido_paterno: formData.apellido_paterno, apellido_materno: formData.apellido_materno,
        dni: formData.dni, fecha_nacimiento: formData.fecha_nacimiento, direccion: formData.direccion, distrito: formData.distrito, provincia: formData.provincia, departamento: formData.departamento, celular: formData.celular,
        sistema_pension: formData.sistema_pension, afp_nombre: formData.afp_nombre, cuspp: formData.cuspp,
        banco: formData.banco, numero_cuenta: formData.cuenta_ahorros, cci: formData.cci,
        categoria: formData.categoria, cargo: formData.cargo, nombre_obra: formData.nombre_obra, fecha_ingreso: formData.fecha_ingreso,
        carnet_retcc: formData.carnet_retcc, fecha_vencimiento_retcc: formData.fecha_vencimiento_retcc,
        nivel_educacion: formData.nivel_educativo, carrera: formData.carrera, universidad: formData.centro_formacion,
        emergencia_nombre: formData.emergencia_nombre, emergencia_celular: formData.emergencia_telefono, emergencia_relacion: formData.emergencia_parentesco,
        esposa: JSON.stringify(formData.esposa_datos), hijos: JSON.stringify(formData.hijos_datos),
        url_dni_frontal: formData.doc_dni_trabajador, url_antecedentes: formData.doc_certiadulto, url_carnet: formData.doc_carnet_retcc,
        url_acta_matrimonio: formData.doc_esposa_matrimonio, url_constancia_estudios: formData.doc_hijos_estudios, // Mapeos docs restantes
        url_firma: formData.url_firma, updated_at: new Date().toISOString(), estado: complete ? 'completado' : 'pendiente'
    }
    Object.keys(payload).forEach((key:any) => { if ((payload as any)[key] === '') (payload as any)[key] = null });
    const { error } = await supabase.from('fichas').upsert({ user_id: user.id, correo: user.email, ...payload }, { onConflict: 'user_id' })
    return error
  }

  const validarObligatorios = () => {
      const err = []
      if(!formData.apellido_paterno) err.push("Apellido Paterno"); if(!formData.nombres) err.push("Nombres")
      if(!formData.dni) err.push("DNI"); if(!formData.direccion) err.push("Dirección"); if(!formData.celular) err.push("Celular")
      if(!formData.sistema_pension) err.push("Pensión"); if(!formData.banco) err.push("Banco"); if(!formData.cuenta_ahorros) err.push("Cuenta")
      if(!formData.categoria) err.push("Categoría"); if(!formData.cargo) err.push("Cargo"); if(!formData.nivel_educativo) err.push("Nivel Educativo")
      if(!formData.emergencia_nombre) err.push("Contacto Emergencia"); if(!formData.doc_dni_trabajador) err.push("Doc. DNI"); if(!formData.url_firma) err.push("Firma")
      return err
  }

  const finalizarFicha = async () => {
    const err = validarObligatorios()
    if (err.length > 0) { toast.error("Faltan: " + err.slice(0,3).join(", ") + "..."); return }
    if (!declaracionAceptada) { toast.error("Acepta la declaración jurada"); return }
    setSending(true)
    const error = await cleanAndSave(true)
    if (!error) { toast.success("Enviado"); setIsCompleted(true); new Audio('/success.mp3').play().catch(()=>{}) }
    else toast.error("Error: " + error.message)
    setSending(false)
  }

  if (isLoadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>

  // =====================================================================
  //  VISTA COMPLETA MODO LECTURA (EXPEDIENTE DIGITAL)
  // =====================================================================
  if (isCompleted) return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white max-w-5xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full"><CheckCircle size={32}/></div>
                    <div><h2 className="text-xl font-bold">Expediente Enviado</h2><p className="text-emerald-100 text-sm">Esperando validación de RR.HH.</p></div>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold flex gap-2 items-center"><Lock size={14}/> Solo Lectura</div>
            </div>

            <div className="p-8 space-y-10">
                {/* 1. DATOS PERSONALES */}
                <SectionRead title="1. DATOS PERSONALES" icon={<User/>}>
                    <GridRead>
                        <FieldRead label="Apellido Paterno" val={formData.apellido_paterno} />
                        <FieldRead label="Apellido Materno" val={formData.apellido_materno} />
                        <FieldRead label="Nombres" val={formData.nombres} />
                        <FieldRead label="F. Nacimiento" val={formData.fecha_nacimiento} />
                        <FieldRead label="DNI" val={formData.dni} highlight />
                        <FieldRead label="Correo" val={formData.correo} />
                        <FieldRead label="Celular" val={formData.celular} />
                        <FieldRead label="Dirección" val={formData.direccion} full />
                        <FieldRead label="Distrito" val={formData.distrito} />
                        <FieldRead label="Provincia" val={formData.provincia} />
                        <FieldRead label="Departamento" val={formData.departamento} />
                    </GridRead>
                </SectionRead>

                {/* 2. PENSIONES Y BANCO */}
                <SectionRead title="2. PENSIONES Y BANCARIOS" icon={<Wallet/>}>
                    <GridRead>
                        <FieldRead label="Sistema Pensión" val={formData.sistema_pension} />
                        <FieldRead label="Nombre AFP" val={formData.afp_nombre} />
                        <FieldRead label="CUSPP" val={formData.cuspp} />
                        <FieldRead label="Banco" val={formData.banco} />
                        <FieldRead label="Cuenta Ahorros" val={formData.cuenta_ahorros} highlight />
                    </GridRead>
                </SectionRead>

                {/* 3. DERECHO HABIENTES */}
                <SectionRead title="3. DERECHO HABIENTES" icon={<Users/>}>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <h4 className="text-xs font-bold text-slate-500 mb-3">ESPOSA / CONVIVIENTE</h4>
                        <GridRead>
                            <FieldRead label="Nombre Completo" val={`${formData.esposa_datos?.nombres || ''} ${formData.esposa_datos?.paterno || ''}`} full />
                            <FieldRead label="DNI" val={formData.esposa_datos?.dni} />
                        </GridRead>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 mb-3">HIJOS ({formData.hijos_datos?.length || 0})</h4>
                        {formData.hijos_datos?.length > 0 ? (
                            <div className="space-y-2">
                                {formData.hijos_datos.map((h:any, i:number) => (
                                    <div key={i} className="text-sm p-2 bg-white border rounded flex justify-between">
                                        <span className="font-bold">{h.nombres} {h.paterno} {h.materno}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-sm text-slate-400 italic">No registrados</span>}
                    </div>
                </SectionRead>

                {/* 4. LABORAL Y FORMACIÓN */}
                <SectionRead title="4. LABORAL Y FORMACIÓN" icon={<HardHat/>}>
                    <GridRead>
                        <FieldRead label="Categoría" val={formData.categoria} />
                        <FieldRead label="Cargo" val={formData.cargo} />
                        <FieldRead label="Nivel Educativo" val={formData.nivel_educativo} />
                        <FieldRead label="Carrera/Oficio" val={formData.carrera} />
                        <FieldRead label="Centro Formación" val={formData.centro_formacion} full />
                    </GridRead>
                </SectionRead>

                {/* 5. EMERGENCIA */}
                <SectionRead title="5. CONTACTO EMERGENCIA" icon={<HeartPulse/>}>
                    <GridRead>
                        <FieldRead label="Nombre" val={formData.emergencia_nombre} full />
                        <FieldRead label="Parentesco" val={formData.emergencia_parentesco} />
                        <FieldRead label="Teléfono" val={formData.emergencia_telefono} />
                    </GridRead>
                </SectionRead>

                {/* 6. DOCUMENTOS */}
                <SectionRead title="6. DOCUMENTOS ADJUNTOS" icon={<FileBadge/>}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DocRead label="DNI Frontal" url={formData.doc_dni_trabajador} />
                        <DocRead label="Certiadulto" url={formData.doc_certiadulto} />
                        <DocRead label="Policiales" url={formData.doc_policiales} />
                        <DocRead label="Penales" url={formData.doc_penales} />
                        <DocRead label="Carnet RETCC" url={formData.doc_carnet_retcc} />
                        <DocRead label="Esposa Doc" url={formData.doc_esposa_dni} />
                    </div>
                </SectionRead>

                {/* FIRMA */}
                <div className="border-t pt-8 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Firma Digital</p>
                    {formData.url_firma ? <img src={formData.url_firma} className="h-24 mx-auto border-2 border-dashed border-slate-300 p-4 rounded-xl bg-slate-50"/> : <p>Sin firma</p>}
                </div>
            </div>
        </motion.div>
    </div>
  )

  if (!hasStarted) return <WelcomeScreen onStart={() => setHasStarted(true)} />

  // --- WIZARD EDITABLE (Tu formulario normal) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-sans pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center px-2">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 p-2 rounded-lg">{STEPS[currentStep-1].icon}</span>{STEPS[currentStep-1].title}</h2>
             <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 shadow-sm">Paso {currentStep}/5</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-6">
             <AnimatePresence mode='wait'>
                
                {/* PASO 1: PERSONALES, PENSIONES, BANCARIOS */}
                {currentStep === 1 && <StepWrapper key="1">
                    <SectionTitle title="DATOS PERSONALES (OBLIGATORIO)" icon={<User/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Input label="Apellido Paterno" name="apellido_paterno" val={formData.apellido_paterno} set={handleChange} required />
                        <Input label="Apellido Materno" name="apellido_materno" val={formData.apellido_materno} set={handleChange} required />
                        <Input label="Nombres" name="nombres" val={formData.nombres} set={handleChange} required />
                        <Input label="Fecha de nacimiento" type="date" name="fecha_nacimiento" val={formData.fecha_nacimiento} set={handleChange} required />
                        <Input label="DNI / Carnet de extranjería N°" name="dni" val={formData.dni} set={handleChange} required />
                        <Input label="Dirección actual" name="direccion" val={formData.direccion} set={handleChange} required />
                        <Input label="Distrito" name="distrito" val={formData.distrito} set={handleChange} required />
                        <Input label="Provincia" name="provincia" val={formData.provincia} set={handleChange} required />
                        <Input label="Departamento" name="departamento" val={formData.departamento} set={handleChange} required />
                        <Input label="Correo Electrónico" name="correo" val={formData.correo} set={handleChange} />
                        <Input label="Celular N°" name="celular" val={formData.celular} set={handleChange} required />
                    </div>

                    <SectionTitle title="SISTEMA DE PENSIONES (OBLIGATORIO)" icon={<ShieldCheck/>} className="mt-8"/>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex gap-6 items-center">
                            <Radio label="ONP" name="sistema_pension" val="ONP" current={formData.sistema_pension} set={handleChange} />
                            <Radio label="AFP" name="sistema_pension" val="AFP" current={formData.sistema_pension} set={handleChange} />
                        </div>
                        {formData.sistema_pension === 'AFP' && <Input label="Nombre AFP" name="afp_nombre" val={formData.afp_nombre} set={handleChange} />}
                        <Input label="CUSPP" name="cuspp" val={formData.cuspp} set={handleChange} />
                    </div>

                    <SectionTitle title="DATOS BANCARIOS (OBLIGATORIO)" icon={<Wallet/>} className="mt-8"/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Select label="Banco" name="banco" val={formData.banco} set={handleChange} options={['Interbank', 'BBVA', 'BCP', 'Scotiabank', 'Banco de la Nación']} required />
                        <Input label="Cuenta de ahorros N°" name="cuenta_ahorros" val={formData.cuenta_ahorros} set={handleChange} required />
                        <Input label="CCI (Opcional)" name="cci" val={formData.cci} set={handleChange} />
                    </div>
                </StepWrapper>}

                {/* PASO 2: DERECHO HABIENTES */}
                {currentStep === 2 && <StepWrapper key="2">
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm font-bold border border-yellow-200">Esta sección NO es obligatoria.</div>
                    
                    <SectionTitle title="ESPOSA / CONVIVIENTE" icon={<Users/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                        <Input label="Apellido Paterno" val={formData.esposa_datos.paterno} onChange={(e:any)=>handleEsposaChange('paterno', e.target.value)} />
                        <Input label="Apellido Materno" val={formData.esposa_datos.materno} onChange={(e:any)=>handleEsposaChange('materno', e.target.value)} />
                        <Input label="Nombres" val={formData.esposa_datos.nombres} onChange={(e:any)=>handleEsposaChange('nombres', e.target.value)} />
                        <Input label="DNI / Carnet Ext. N°" val={formData.esposa_datos.dni} onChange={(e:any)=>handleEsposaChange('dni', e.target.value)} />
                    </div>

                    <SectionTitle title="HIJOS" icon={<Users/>} />
                    {formData.hijos_datos.map((hijo:any, idx:number) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl mb-3 relative group border border-slate-100">
                            <Input label="Apellido Paterno" val={hijo.paterno} onChange={(e:any)=>handleHijoChange(idx, 'paterno', e.target.value)} />
                            <Input label="Apellido Materno" val={hijo.materno} onChange={(e:any)=>handleHijoChange(idx, 'materno', e.target.value)} />
                            <Input label="Nombres" val={hijo.nombres} onChange={(e:any)=>handleHijoChange(idx, 'nombres', e.target.value)} />
                            <button onClick={()=>removeHijo(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button onClick={addHijo} className="mt-2 flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-3 rounded-xl transition-colors border border-blue-200 border-dashed w-full justify-center">
                        <Plus size={16}/> Agregar Hijo
                    </button>
                </StepWrapper>}

                {/* PASO 3: LABORAL Y FORMACION */}
                {currentStep === 3 && <StepWrapper key="3">
                    <SectionTitle title="DATOS LABORALES (OBLIGATORIO)" icon={<HardHat/>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input label="Categoría" name="categoria" val={formData.categoria} set={handleChange} required />
                        <Input label="Cargo" name="cargo" val={formData.cargo} set={handleChange} required />
                    </div>

                    <SectionTitle title="FORMACION Y EXPERIENCIA (OBLIGATORIO)" icon={<GraduationCap/>} className="mt-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Select label="Nivel educativo" name="nivel_educativo" val={formData.nivel_educativo} set={handleChange} options={['Primaria', 'Secundaria', 'Técnico', 'Universitario']} required />
                        <Input label="Carrera / Oficio / Especialidad" name="carrera" val={formData.carrera} set={handleChange} required />
                        <Input label="Universidad / Instituto / Centro de formación" name="centro_formacion" val={formData.centro_formacion} set={handleChange} required className="md:col-span-2" />
                    </div>
                </StepWrapper>}

                {/* PASO 4: EMERGENCIA Y DOCUMENTOS */}
                {currentStep === 4 && <StepWrapper key="4">
                    <SectionTitle title="CONTACTO DE EMERGENCIA (OBLIGATORIO)" icon={<HeartPulse/>} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-red-50 p-4 rounded-xl mb-8 border border-red-100">
                        <Input label="Nombre Completo" name="emergencia_nombre" val={formData.emergencia_nombre} set={handleChange} required />
                        <Input label="Parentesco" name="emergencia_parentesco" val={formData.emergencia_parentesco} set={handleChange} required />
                        <Input label="Teléfono" name="emergencia_telefono" val={formData.emergencia_telefono} set={handleChange} required />
                    </div>

                    <SectionTitle title="DOCUMENTOS" icon={<FileBadge/>} />
                    
                    <div className="mb-6">
                        <h4 className="font-bold text-sm text-slate-700 mb-3 bg-slate-100 px-3 py-1 rounded inline-block">Trabajador (OBLIGATORIO)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ImageUpload label="DNI / Carnet Extranjería" bucket="documentos" currentUrl={formData.doc_dni_trabajador} onUpload={(u:any)=>setFormData({...formData, doc_dni_trabajador:u})} />
                            <ImageUpload label="Certiadulto / certijoven" bucket="documentos" currentUrl={formData.doc_certiadulto} onUpload={(u:any)=>setFormData({...formData, doc_certiadulto:u})} />
                            <ImageUpload label="Antecedentes Policiales" bucket="documentos" currentUrl={formData.doc_policiales} onUpload={(u:any)=>setFormData({...formData, doc_policiales:u})} />
                            <ImageUpload label="Antecedentes Penales" bucket="documentos" currentUrl={formData.doc_penales} onUpload={(u:any)=>setFormData({...formData, doc_penales:u})} />
                            <ImageUpload label="Carnet RETCC" bucket="documentos" currentUrl={formData.doc_carnet_retcc} onUpload={(u:any)=>setFormData({...formData, doc_carnet_retcc:u})} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold text-sm text-slate-700 mb-3 bg-slate-100 px-3 py-1 rounded inline-block">Esposa (NO OBLIGATORIO)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ImageUpload label="Cert. Matrimonio / Unión Hecho" bucket="documentos" currentUrl={formData.doc_esposa_matrimonio} onUpload={(u:any)=>setFormData({...formData, doc_esposa_matrimonio:u})} />
                            <ImageUpload label="DNI / Carnet Extranjería" bucket="documentos" currentUrl={formData.doc_esposa_dni} onUpload={(u:any)=>setFormData({...formData, doc_esposa_dni:u})} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold text-sm text-slate-700 mb-3 bg-slate-100 px-3 py-1 rounded inline-block">Hijos (NO OBLIGATORIO)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ImageUpload label="Partida de Nacimiento" bucket="documentos" currentUrl={formData.doc_hijos_nacimiento} onUpload={(u:any)=>setFormData({...formData, doc_hijos_nacimiento:u})} />
                            <ImageUpload label="DNI / Carnet Extranjería" bucket="documentos" currentUrl={formData.doc_hijos_dni} onUpload={(u:any)=>setFormData({...formData, doc_hijos_dni:u})} />
                            <ImageUpload label="Certificado de estudios" bucket="documentos" currentUrl={formData.doc_hijos_estudios} onUpload={(u:any)=>setFormData({...formData, doc_hijos_estudios:u})} />
                        </div>
                    </div>
                </StepWrapper>}

                {/* PASO 5: FIRMA */}
                {currentStep === 5 && <StepWrapper key="5">
                     <SectionTitle title="FIRMA DEL TRABAJADOR (OBLIGATORIO)" icon={<PenTool/>} />
                     <div className="border-2 border-slate-300 border-dashed rounded-2xl bg-white relative overflow-hidden h-48 mx-auto max-w-lg touch-none mb-6">
                        {formData.url_firma ? <img src={formData.url_firma} className="w-full h-full object-contain p-4" /> : <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full cursor-crosshair'}} onEnd={handleSignatureEnd} />}
                        {formData.url_firma && <button onClick={clearSignature} className="absolute top-2 right-2 bg-red-100 text-red-600 p-2 rounded-full"><Eraser size={16}/></button>}
                    </div>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${declaracionAceptada ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200'}`}>
                        <input type="checkbox" checked={declaracionAceptada} onChange={(e) => setDeclaracionAceptada(e.target.checked)} className="w-5 h-5 accent-white" />
                        <span className="text-sm font-bold">Declaro bajo juramento que los datos son verdaderos.</span>
                    </label>
                </StepWrapper>}
             </AnimatePresence>

             {/* Footer Navigation */}
             <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <button onClick={() => setCurrentStep(p => Math.max(1, p - 1))} disabled={currentStep === 1} className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-500 hover:bg-slate-200'}`}><ChevronLeft size={20}/> Atrás</button>
                 {currentStep < 5 ? (
                    <button onClick={() => { cleanAndSave(); setCurrentStep(p => Math.min(5, p + 1)) }} className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all flex items-center gap-2">Siguiente <ChevronRight size={20}/></button>
                 ) : (
                    <button onClick={finalizarFicha} disabled={sending} className="bg-green-600 text-white font-bold px-10 py-3 rounded-xl hover:scale-105 transition-all shadow-lg flex items-center gap-2">{sending ? <Loader2 className="animate-spin"/> : <><CheckCircle/> ENVIAR FICHA</>}</button>
                 )}
             </div>
        </div>
      </div>
    </div>
  )
}

// --- PANTALLA BIENVENIDA ---
function WelcomeScreen({onStart}:any) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-6 text-center"><motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="max-w-lg"><div className="mb-8 inline-flex p-6 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-200"><FileText size={48} /></div><h1 className="text-4xl font-extrabold mb-4 text-slate-900">Ficha de Personal</h1><p className="text-lg text-slate-500 mb-10">Complete su información para formalizar el registro.</p><button onClick={onStart} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg">Comenzar Llenado</button></motion.div></div>
}

// --- SUBCOMPONENTES ---
function SectionRead({title, icon, children}: any) {
    return <div className="mb-8 last:mb-0"><div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 text-slate-800"><div className="text-blue-600">{icon}</div><h3 className="font-bold text-lg">{title}</h3></div>{children}</div>
}
function GridRead({children}: any) { return <div className="grid grid-cols-2 md:grid-cols-3 gap-6">{children}</div> }
function FieldRead({label, val, full, highlight}: any) { return <div className={`p-3 rounded-lg border border-slate-100 bg-slate-50 ${full ? 'col-span-2 md:col-span-3' : ''} ${highlight ? 'bg-blue-50/50 border-blue-100' : ''}`}><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p><p className={`font-bold text-sm ${highlight ? 'text-blue-700' : 'text-slate-800'}`}>{val || '-'}</p></div> }
function DocRead({label, url}: any) { if(!url) return null; return <a href={url} target="_blank" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 shadow-sm transition-all"><FileBadge size={20} className="text-blue-500"/><div className="truncate"><p className="text-xs font-bold text-slate-700 truncate">{label}</p><p className="text-[10px] text-slate-400">Ver documento</p></div></a> }

function StepWrapper({children}: any) { return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="p-8">{children}</motion.div>}
function SectionTitle({title, icon, className=""}: any) { return <div className={`flex items-center gap-3 mb-6 ${className}`}><div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">{icon}</div><h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{title}</h3></div>}
function Input({label, name, val, set, type="text", required=false, readOnly=false, onChange, className=""}: any) { return <div className={className}><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label><input type={type} name={name} value={val || ''} onChange={onChange || set} readOnly={readOnly} className={`w-full p-3 rounded-lg border outline-none transition-all font-medium ${readOnly ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-800'}`}/></div>}
function Radio({label, name, val, current, set}: any) { return <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${current === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}><input type="radio" name={name} value={val} checked={current === val} onChange={set} className="hidden"/><span className="font-bold text-sm">{label}</span></label>}
function Select({label, name, val, set, options=[], required=false}: any) { return <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label><div className="relative"><select name={name} value={val || ''} onChange={set} className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer"><option value="">Seleccionar...</option>{options.map((o:string)=><option key={o} value={o}>{o}</option>)}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="rotate-90" size={16}/></div></div></div>}
function ImageUpload({label, bucket, onUpload, currentUrl}: any) { const [uploading, setUploading] = useState(false); const supabase = createClient(); const handleFile = async (e:any) => { if(!e.target.files?.length) return; setUploading(true); const file = e.target.files[0]; const fn = `${Math.random()}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from(bucket).upload(fn, file); if(error) toast.error("Error"); else { const { data } = supabase.storage.from(bucket).getPublicUrl(fn); onUpload(data.publicUrl); toast.success("Cargado"); } setUploading(false) }; return <div className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-all ${currentUrl ? 'border-green-500 bg-green-50/20' : 'border-slate-300'}`}><input type="file" accept="image/*,.pdf" onChange={handleFile} className="absolute inset-0 opacity-0 z-10 cursor-pointer" disabled={uploading} /><div className="flex flex-col items-center gap-1">{uploading ? <Loader2 className="animate-spin text-blue-600"/> : currentUrl ? <CheckCircle className="text-green-600" size={20}/> : <Camera className="text-slate-400" size={20}/>}<span className="text-xs font-bold text-slate-600">{label}</span></div></div> }