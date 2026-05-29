'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getSignatureUrl } from '@/utils/biometric'
import { extractDocDates } from '@/utils/docExpiry'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import jsPDF from 'jspdf'
import { 
  User, CheckCircle, ChevronRight, ChevronLeft,
  Camera, Loader2, HeartPulse, GraduationCap, Wallet,
  HardHat, ShieldCheck, PenTool, Eraser, Users, FileBadge, Plus, Trash2, Lock, Hammer, FileText, Download, Image as ImageIcon, UploadCloud, RefreshCw, X, Calendar, Eye, RotateCw, Wand2, ArrowRight, PlayCircle,
  CloudOff, Clock, ExternalLink, FileWarning
} from 'lucide-react'
import Link from 'next/link'
import DocumentPreviewModal from './DocumentPreviewModal'
import AnimatedIcon, { type AnimatedIconKey } from './AnimatedIcon'
import ObraSelect from './ObraSelect'

// --- ESTRUCTURA DE PASOS ---
const STEPS: Array<{ id: number, title: string, icon: any, animatedIcon: AnimatedIconKey }> = [
  { id: 1, title: 'Personal', icon: <User size={18} />, animatedIcon: 'personal' },
  { id: 2, title: 'Familia', icon: <Users size={18} />, animatedIcon: 'familia' },
  { id: 3, title: 'Laboral', icon: <HardHat size={18} />, animatedIcon: 'laboral' },
  { id: 4, title: 'Documentos', icon: <FileBadge size={18} />, animatedIcon: 'docs' },
  { id: 5, title: 'Firma', icon: <PenTool size={18} />, animatedIcon: 'firma' },
]

function parseDocumentUrls(value?: string | null) {
  const raw = value?.trim() || ''
  if (!raw) return [] as string[]

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {}
  }

  return [raw]
}

function serializeDocumentUrls(urls: string[]) {
  const normalized = urls.map((item) => item.trim()).filter(Boolean)
  if (!normalized.length) return ''
  if (normalized.length === 1) return normalized[0]
  return JSON.stringify(normalized)
}

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
    tipo_documento: 'DNI',
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
                setHasStarted(true)
            } else {
                // Ficha existe pero no está completa → restaurar borrador local si es más reciente
                try {
                    const draftStr = localStorage.getItem(`ruag_draft_${user.id}`)
                    if (draftStr) {
                        const draft = JSON.parse(draftStr)
                        const { _savedAt, ...draftFields } = draft
                        const fichaTime = ficha.updated_at ? new Date(ficha.updated_at).getTime() : 0
                        if ((_savedAt || 0) > fichaTime) {
                            setFormData((prev: any) => ({ ...prev, ...draftFields }))
                        }
                    }
                } catch(e) {}
            }
        } else {
            // Sin ficha en Supabase → intentar restaurar borrador local primero
            try {
                const draftStr = localStorage.getItem(`ruag_draft_${user.id}`)
                if (draftStr) {
                    const draft = JSON.parse(draftStr)
                    const { _savedAt, ...draftFields } = draft
                    setFormData((prev: any) => ({ ...prev, ...draftFields }))
                } else {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                    if (profile) setFormData((prev:any) => ({...prev, nombres: profile.nombres, apellido_paterno: profile.apellido_paterno, apellido_materno: profile.apellido_materno, dni: profile.dni, celular: profile.telefono, correo: user.email}))
                }
            } catch(e) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (profile) setFormData((prev:any) => ({...prev, nombres: profile.nombres, apellido_paterno: profile.apellido_paterno, apellido_materno: profile.apellido_materno, dni: profile.dni, celular: profile.telefono, correo: user.email}))
            }
        }
        
        supabase.channel('my-ficha').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fichas', filter: `user_id=eq.${user.id}` }, (payload) => {
            if(payload.new.estado === 'pendiente') {
                // Solo avisamos si REALMENTE se reabrió (pasó de completado → pendiente),
                // no en cada autoguardado mientras el obrero edita.
                setIsCompleted(prev => {
                    if (prev) toast.info("Edición habilitada")
                    return false
                })
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

  // --- KEEPALIVE DE SESIÓN ---
  // Refresca el JWT cada 10 minutos mientras el formulario está abierto.
  // El JWT de Supabase expira en 60 min; esto garantiza que nunca llegue a vencer.
  useEffect(() => {
    if (isCompleted) return
    const interval = setInterval(async () => {
      try { await supabase.auth.refreshSession() } catch (_) {}
    }, 10 * 60 * 1000) // cada 10 minutos
    return () => clearInterval(interval)
  }, [isCompleted])

  // --- BORRADOR AUTOMÁTICO EN LOCALSTORAGE ---
  // Guarda en localStorage 1.2s después del último cambio (debounce).
  // Se restaura al recargar si la ficha aún no está completada.
  useEffect(() => {
    if (!user?.id || isCompleted || isLoadingData) return
    const timer = setTimeout(() => {
      try {
        const { url_firma, ...rest } = formData
        localStorage.setItem(`ruag_draft_${user.id}`, JSON.stringify({ ...rest, _savedAt: Date.now() }))
      } catch(e) {}
    }, 1200)
    return () => clearTimeout(timer)
  }, [formData, user?.id, isCompleted, isLoadingData])

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
        if (formData.tipo_documento === 'CE') {
            if (formData.dni.length < 6) {
                toast.error("El Carnet de Extranjería debe tener al menos 6 caracteres.")
                return false
            }
        } else {
            if (!/^\d{8}$/.test(formData.dni)) {
                toast.error("El DNI debe tener exactamente 8 dígitos numéricos.")
                return false
            }
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
        const missing: string[] = []
        if (!formData.doc_dni_trabajador) missing.push("DNI (Frontal y Reverso)")
        if (!formData.doc_certiadulto) missing.push("Certiadulto (Antecedentes)")
        if (!formData.doc_carnet_retcc) missing.push("Carnet RETCC")
        if (missing.length) {
            toast.error(`Falta subir: ${missing.join(", ")}.`)
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

  const ensureProfileExists = async (sessionUser: any, payload: any) => {
    if (!sessionUser?.id) {
      return { ok: false, error: "Sesión no disponible." }
    }

    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', sessionUser.id)
      .maybeSingle()

    if (lookupError) {
      return { ok: false, error: lookupError.message }
    }

    if (existingProfile?.id) {
      return { ok: true }
    }

    const meta: any = sessionUser.user_metadata || {}
    const profileRescue = {
      id: sessionUser.id,
      nombres: payload.nombres || meta.nombres || meta.full_name || '',
      apellido_paterno: payload.apellido_paterno || meta.apellido_paterno || '',
      apellido_materno: payload.apellido_materno || meta.apellido_materno || '',
      dni: payload.dni || meta.dni || null,
      telefono: payload.celular || meta.telefono || null,
      role: 'obrero',
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileRescue, { onConflict: 'id' })

    if (upsertError) {
      return { ok: false, error: upsertError.message }
    }

    return { ok: true }
  }

  const guardarProgreso = async (complete: boolean = false, silent: boolean = false) => {
    // Refrescar el token activamente antes de guardar (evita FK error por JWT expirado)
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
    const sessionUser = session?.user ?? null
    if (refreshError || !sessionUser) {
        toast.error("Tu sesión ha expirado. Vuelve a iniciar sesión e intenta de nuevo.")
        return { message: "Sesión expirada. Vuelve a iniciar sesión." } as any
    }

    if (isCompleted && !complete) return

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

    const profileReady = await ensureProfileExists(sessionUser, payload)
    if (!profileReady.ok) {
        if (!silent) {
            toast.error("No se pudo validar tu perfil", {
                description: profileReady.error || "Intenta cerrar sesión e ingresar nuevamente.",
            })
        }
        return { message: profileReady.error || "No se pudo validar el perfil." } as any
    }
    
    let { data, error } = await supabase
        .from('fichas')
        .upsert({ user_id: sessionUser.id, correo: sessionUser.email, ...payload }, { onConflict: 'user_id' })
        .select().single()

    // ── Auto-fix: si el profile no existe (FK violation), lo creamos y reintentamos.
    // Esto puede pasar en cuentas creadas antes del trigger on_auth_user_created.
    if (error && (error.code === '23503' || /fichas_user_id_fkey|violates foreign key/i.test(error.message))) {
        const retryProfile = await ensureProfileExists(sessionUser, payload)
        if (retryProfile.ok) {
            const retry = await supabase
                .from('fichas')
                .upsert({ user_id: sessionUser.id, correo: sessionUser.email, ...payload }, { onConflict: 'user_id' })
                .select().single()
            data = retry.data
            error = retry.error
        } else if (!silent) {
            toast.error("Falta tu perfil base", {
                description: retryProfile.error || "Pide al administrador que ejecute la migración de perfiles.",
            })
        }
    }

    if (data) setFormData((prev:any) => ({...prev, id: data.id}))
    if (complete) return error
    if (!error && !silent) toast.success("Progreso guardado")
  }

  // ── IA: lee las fechas de vencimiento del documento recién subido y las
  // guarda en la ficha. Se ejecuta en segundo plano (no bloquea la subida).
  const analyzeDocWithAI = async (docType: 'retcc' | 'antecedentes' | 'dni', serializedUrl: string) => {
      try {
          const uid = user?.id
          if (!uid || !serializedUrl) return
          // serializedUrl puede ser JSON array o url simple; tomamos la última imagen
          let imageUrl = serializedUrl
          if (serializedUrl.trim().startsWith('[')) {
              try {
                  const arr = JSON.parse(serializedUrl)
                  imageUrl = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : serializedUrl
              } catch { /* noop */ }
          }
          // Gemini 2.5 lee imágenes y PDFs, así que enviamos cualquiera de los dos.
          toast.loading('Leyendo fechas del documento con IA…', { id: `ia-${docType}` })
          const dates = await extractDocDates(imageUrl, docType)
          toast.dismiss(`ia-${docType}`)
          if (!dates) {
              toast.message('No se pudieron leer las fechas automáticamente. El administrador podrá revisarlas.')
              return
          }

          const update: any = { ia_meta_patch: true }
          if (docType === 'retcc') {
              update.fecha_vencimiento_retcc = dates.fecha_caducidad
              update.retcc_fecha_inscripcion = dates.fecha_inscripcion
          } else if (docType === 'dni') {
              update.dni_fecha_vencimiento = dates.fecha_caducidad
          } else {
              update.antecedentes_fecha_vencimiento = dates.fecha_caducidad
              update.antecedentes_fecha_emision = dates.fecha_emision
          }
          delete update.ia_meta_patch

          const { error: upErr } = await supabase.from('fichas').update(update).eq('user_id', uid)
          if (!upErr) {
              setFormData((prev: any) => ({ ...prev, ...update }))
              if (dates.fecha_caducidad) {
                  toast.success(`Fecha de vencimiento detectada: ${new Date(dates.fecha_caducidad).toLocaleDateString('es-PE')}`)
              }
          }
      } catch {
          toast.dismiss(`ia-${docType}`)
      }
  }

  // Cuando se elimina un documento, también borramos las fechas detectadas por la IA.
  const clearDocDates = async (docType: 'retcc' | 'antecedentes' | 'dni') => {
      try {
          const update: any = docType === 'retcc'
              ? { fecha_vencimiento_retcc: null, retcc_fecha_inscripcion: null }
              : docType === 'dni'
              ? { dni_fecha_vencimiento: null }
              : { antecedentes_fecha_vencimiento: null, antecedentes_fecha_emision: null }
          setFormData((prev: any) => ({ ...prev, ...update }))
          const uid = user?.id
          if (uid) await supabase.from('fichas').update(update).eq('user_id', uid)
      } catch { /* noop */ }
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
    if (!error) {
        try { if (user?.id) localStorage.removeItem(`ruag_draft_${user.id}`) } catch(e) {}
        toast.success("Ficha enviada")
        setIsCompleted(true)
    }
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
                                <FieldRead label={formData.tipo_documento === 'CE' ? 'Carnet Extranjería' : 'DNI'} val={formData.dni} highlight />
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

                        {/* 6. DOCUMENTOS DEL TRABAJADOR */}
                        <SectionRead title="6. Documentos del Trabajador" icon={<FileBadge size={16}/>}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <DocSlot label="DNI (Frontal y Reverso)" url={formData.doc_dni_trabajador} />
                                <DocSlot label="Certiadulto (Antecedentes)" url={formData.doc_certiadulto} />
                                <DocSlot label="Carnet RETCC" url={formData.doc_carnet_retcc} />
                                <DocSlot label="Antecedentes Policiales" url={formData.doc_policiales} />
                                <DocSlot label="Antecedentes Penales" url={formData.doc_penales} />
                            </div>
                        </SectionRead>

                        {/* 7. DOCUMENTOS FAMILIARES (siempre se listan, aunque estén vacíos) */}
                        <SectionRead title="7. Documentos Familiares" icon={<Users size={16}/>}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <DocSlot label="Acta de Matrimonio" url={formData.doc_esposa_matrimonio} optional />
                                <DocSlot label="DNI Esposa" url={formData.doc_esposa_dni} optional />
                                <DocSlot label="Partida Nacimiento Hijos" url={formData.doc_hijos_nacimiento} optional />
                                <DocSlot label="DNI Hijos" url={formData.doc_hijos_dni} optional />
                                <DocSlot label="Constancia de Estudios Hijos" url={formData.doc_hijos_estudios} optional />
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
    <div className="min-h-screen relative py-6 px-4 font-sans pb-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40" />
      <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(900px 500px at 90% -10%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(700px 400px at -10% 110%, rgba(100,116,139,0.10), transparent 60%)'
      }} />
      <div className="max-w-4xl mx-auto">

        {/* Header de Pasos — glass crimson */}
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-lg shadow-slate-900/10 border border-white/60 ring-1 ring-white/60 mb-6 sticky top-2 z-20"
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-[0.2em] ring-1 ring-white/40">
                        Paso {currentStep}/5
                    </span>
                    <span className="text-sm font-extrabold text-stone-900 hidden sm:inline tracking-tight">
                        {STEPS.find(s => s.id === currentStep)?.title}
                    </span>
                </div>
                <motion.span
                    key={currentStep}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="text-[11px] font-extrabold text-emerald-700 bg-white/70 backdrop-blur ring-1 ring-emerald-200 border border-white/60 px-3 py-1 rounded-full"
                >
                    {Math.round((currentStep / 5) * 100)}% Completado
                </motion.span>
            </div>
            <div className="relative w-full bg-stone-200/70 rounded-full h-2 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / 5) * 100}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-700 rounded-full"
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Brillo sutil deslizándose */}
                <motion.div
                    className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    animate={{ x: ['-3rem', `calc(${(currentStep / 5) * 100}% + 3rem)`] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>
            <div className="flex justify-between mt-5 px-1">
                {STEPS.map((step) => {
                    const isCurrent = currentStep === step.id
                    const isDone = currentStep > step.id
                    return (
                        <motion.button
                            key={step.id}
                            type="button"
                            onClick={() => { if (isDone) setCurrentStep(step.id) }}
                            whileHover={isDone ? { y: -2 } : {}}
                            whileTap={isDone ? { scale: 0.95 } : {}}
                            className={`flex flex-col items-center gap-1.5 ${isDone ? 'cursor-pointer' : ''}`}
                        >
                            <motion.div
                                animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                                transition={isCurrent ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all backdrop-blur ${
                                    isCurrent ? 'bg-white/80 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/25 border border-white/60' :
                                    isDone ? 'bg-white/70 ring-1 ring-emerald-200 border border-white/50' :
                                    'bg-stone-100/60 ring-1 ring-stone-200/60 grayscale opacity-50'
                                }`}
                            >
                                {isDone ? (
                                    <motion.div
                                        key={`done-${step.id}`}
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                                    >
                                        <AnimatedIcon name="check" size={30} bounceOnMount={false} />
                                    </motion.div>
                                ) : (
                                    <AnimatedIcon name={step.animatedIcon} size={28} bounceOnMount={false} />
                                )}
                                {isCurrent && (
                                    <motion.span
                                        className="absolute inset-0 rounded-full ring-2 ring-emerald-500/40 pointer-events-none"
                                        animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
                                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                                    />
                                )}
                            </motion.div>
                            <span className={`text-[10px] font-bold hidden sm:block tracking-tight ${
                                isCurrent ? 'text-stone-900' : isDone ? 'text-emerald-700' : 'text-stone-400'
                            }`}>{step.title}</span>
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-900/10 border border-white/60 ring-1 ring-white/60 overflow-hidden p-6 md:p-10 min-h-[500px] relative">
             <AnimatePresence mode='wait'>
                {currentStep === 1 && <StepWrapper key="1">
                    <SectionTitle title="Información Personal" animatedIcon="personal" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <Input label="Apellido Paterno" name="apellido_paterno" val={formData.apellido_paterno} set={handleChange} required readOnly={!!formData.apellido_paterno} />
                        <Input label="Apellido Materno" name="apellido_materno" val={formData.apellido_materno} set={handleChange} required readOnly={!!formData.apellido_materno} />
                        <Input label="Nombres" name="nombres" val={formData.nombres} set={handleChange} required readOnly={!!formData.nombres} />
                        <Input label="Fecha Nacimiento" type="date" name="fecha_nacimiento" val={formData.fecha_nacimiento} set={handleChange} required readOnly={!!formData.fecha_nacimiento} />
                        {/* --- TIPO DE DOCUMENTO (PERUANO / EXTRANJERO) --- */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de Documento</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleChange({ target: { name: 'tipo_documento', value: 'DNI' } })}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.tipo_documento !== 'CE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                                    DNI
                                </button>
                                <button type="button" onClick={() => handleChange({ target: { name: 'tipo_documento', value: 'CE' } })}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.tipo_documento === 'CE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                                    Carnet Extranjería
                                </button>
                            </div>
                        </div>
                        <Input label={formData.tipo_documento === 'CE' ? 'N° Carnet de Extranjería' : 'DNI'} name="dni" val={formData.dni} set={handleChange} required />
                        <Input label="Dirección" name="direccion" val={formData.direccion} set={handleChange} required />
                        <Input label="Distrito" name="distrito" val={formData.distrito} set={handleChange} required />
                        <Input label="Provincia" name="provincia" val={formData.provincia} set={handleChange} required />
                        <Input label="Departamento" name="departamento" val={formData.departamento} set={handleChange} required />
                        <Input label="Correo Electrónico" name="correo" val={formData.correo} set={handleChange} />
                        <Input label="Celular" name="celular" val={formData.celular} set={handleChange} />
                    </div>
                    <SectionTitle title="Datos Bancarios" animatedIcon="datosBancarios" />
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
                    <SectionTitle title="Información Familiar" animatedIcon="familia" />
                    <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm flex items-center gap-3">
                        <AnimatedIcon name="familia" size={26} bounceOnMount={false} />
                        <span>Sección opcional. Compléta solo si tienes esposa/hijos.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <AnimatedIcon name="esposa" size={26} bounceOnMount={false} />
                                <h4 className="font-bold text-slate-800">Esposa / Conviviente</h4>
                            </div>
                            <div className="space-y-4">
                                <Input label="DNI" val={formData.esposa_datos.dni} onChange={(e:any)=>handleEsposaChange('dni', e.target.value)} />
                                <Input label="Nombres" val={formData.esposa_datos.nombres} onChange={(e:any)=>handleEsposaChange('nombres', e.target.value)} />
                                <div className="grid grid-cols-2 gap-4"><Input label="A. Paterno" val={formData.esposa_datos.paterno} onChange={(e:any)=>handleEsposaChange('paterno', e.target.value)} /><Input label="A. Materno" val={formData.esposa_datos.materno} onChange={(e:any)=>handleEsposaChange('materno', e.target.value)} /></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <AnimatedIcon name="hijos" size={26} bounceOnMount={false} />
                                    <h4 className="font-bold text-slate-800">Hijos Registrados</h4>
                                </div>
                                <button onClick={addHijo} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 flex gap-1 items-center"><Plus size={12}/> AGREGAR</button>
                            </div>
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
                    <SectionTitle title="Información Laboral" animatedIcon="laboral" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <Input label="Cargo" name="cargo" val={formData.cargo} set={handleChange} required />
                        <ObraSelect value={formData.nombre_obra} onChange={(v) => setFormData((p:any) => ({ ...p, nombre_obra: v }))} required />
                        <Input label="Categoría" name="categoria" val={formData.categoria} set={handleChange} required />
                        <Input label="Fecha Ingreso" type="date" name="fecha_ingreso" val={formData.fecha_ingreso} set={handleChange} />
                    </div>
                    <SectionTitle title="Formación Académica" animatedIcon="formacionAcademica" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select label="Nivel educativo" name="nivel_educativo" val={formData.nivel_educativo} set={handleChange} options={['Primaria', 'Secundaria', 'Técnico', 'Universitario']} />
                            <Input label="Carrera / Oficio" name="carrera" val={formData.carrera} set={handleChange} />
                            <Input label="Institución Educativa" name="centro_formacion" val={formData.centro_formacion} set={handleChange} className="md:col-span-2" />
                    </div>
                </StepWrapper>}

                {currentStep === 4 && <StepWrapper key="4">
                    <SectionTitle title="En caso de emergencia llamar a:" animatedIcon="contactoEmergencia" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-emerald-50/50 p-6 rounded-2xl mb-10 border border-emerald-100">
                        <Input label="Nombre Completo" name="emergencia_nombre" val={formData.emergencia_nombre} set={handleChange} required />
                        <Input label="Parentesco" name="emergencia_parentesco" val={formData.emergencia_parentesco} set={handleChange} required />
                        <Input label="Teléfono" name="emergencia_telefono" val={formData.emergencia_telefono} set={handleChange} required />
                    </div>

                    <SectionTitle title="Documentos del Trabajador" animatedIcon="docs" />
                    <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 bg-amber-200 text-amber-900 rounded-lg flex items-center justify-center font-extrabold">!</div>
                        <div className="text-xs text-amber-900">
                            <p className="font-bold mb-1">DNI (Frontal y Reverso), Certiadulto y Carnet RETCC son obligatorios.</p>
                            <p className="text-amber-800">Sin ellos no podrás avanzar al siguiente paso. Puedes subir PDF o tomar foto.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="md:col-span-2">
                             <ImageUpload label="DNI (Frontal y Reverso)" bucket="documentos" required currentUrl={formData.doc_dni_trabajador} onUpload={(u:any)=>{ setFormData((prev: any) => ({...prev, doc_dni_trabajador:u})); if (u) analyzeDocWithAI('dni', u); else clearDocDates('dni') }} />
                        </div>
                        <ImageUpload label="Certiadulto (Antecedentes)" bucket="documentos" required currentUrl={formData.doc_certiadulto} onUpload={(u:any)=>{ setFormData((prev: any) => ({...prev, doc_certiadulto:u})); if (u) analyzeDocWithAI('antecedentes', u); else clearDocDates('antecedentes') }} />
                        <ImageUpload label="Carnet RETCC" bucket="documentos" required currentUrl={formData.doc_carnet_retcc} onUpload={(u:any)=>{ setFormData((prev: any) => ({...prev, doc_carnet_retcc:u})); if (u) analyzeDocWithAI('retcc', u); else clearDocDates('retcc') }} />
                        <ImageUpload label="Ant. Policiales" bucket="documentos" currentUrl={formData.doc_policiales} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_policiales:u}))} />
                        <ImageUpload label="Ant. Penales" bucket="documentos" currentUrl={formData.doc_penales} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_penales:u}))} />
                    </div>

                    <SectionTitle title="Documentos Familiares" animatedIcon="familia" />
                    <p className="text-xs text-slate-500 mb-4 italic">Estos documentos son opcionales. Súbelos si corresponde a tu caso.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <ImageUpload label="Acta Matrimonio" bucket="documentos" currentUrl={formData.doc_esposa_matrimonio} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_esposa_matrimonio:u}))} />
                        <ImageUpload label="DNI Esposa" bucket="documentos" currentUrl={formData.doc_esposa_dni} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_esposa_dni:u}))} />
                        <ImageUpload label="DNI Hijos" bucket="documentos" currentUrl={formData.doc_hijos_dni} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_hijos_dni:u}))} />
                        <ImageUpload label="Estudios Hijos" bucket="documentos" currentUrl={formData.doc_hijos_estudios} onUpload={(u:any)=>setFormData((prev: any) => ({...prev, doc_hijos_estudios:u}))} />
                    </div>
                </StepWrapper>}

                {currentStep === 5 && <StepWrapper key="5">
                    <div className="text-center mb-8 flex flex-col items-center">
                            <AnimatedIcon name="firma" size={56} surface="gradient" bounceOnMount />
                            <h3 className="text-2xl font-bold text-slate-900 mt-3">Firma de Conformidad</h3>
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

        <div className="fixed bottom-0 left-0 w-full bg-white/70 backdrop-blur-xl border-t border-white/60 p-4 z-50 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)]">
             <div className="max-w-5xl mx-auto">
                 <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-400">Paso {String(currentStep).padStart(2,'0')} / 05</span>
                    <span className="flex-1 h-px bg-stone-200 mx-3"/>
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-700">{currentStep === 5 ? 'Enviar' : 'Siguiente'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <button
                         onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
                         disabled={currentStep === 1}
                         className={`flex items-center gap-2 font-extrabold px-6 py-3 rounded-xl uppercase tracking-[0.18em] text-xs transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/70 backdrop-blur ring-1 ring-slate-200 border border-white/60 text-slate-700 hover:bg-white hover:shadow-md hover:shadow-slate-500/10'}`}
                     >
                         <ChevronLeft size={18}/> Atrás
                     </button>
                     {currentStep < 5 ? (
                        <button
                            onClick={handleNextStep}
                            className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-extrabold uppercase tracking-[0.18em] text-xs px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 ring-1 ring-white/40 active:scale-95"
                        >
                            Siguiente <ArrowRight size={18}/>
                        </button>
                     ) : (
                        <button
                            onClick={finalizarFicha}
                            disabled={sending}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 text-white font-extrabold uppercase tracking-[0.18em] text-xs px-10 py-3 rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/30 ring-1 ring-white/40 flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {sending ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle size={18}/> Enviar Ficha</>}
                        </button>
                     )}
                 </div>
             </div>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENTE MEJORADO: SOPORTE CAMARA, PDF AUTO, ENCUADRE REAL Y PREVIEW ---
function ImageUpload({label, bucket, onUpload, currentUrl, required = false}: any) {
    const [uploading, setUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showScanTutorial, setShowScanTutorial] = useState(false);
    const [previewModal, setPreviewModal] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const supabase = createClient(); 
    
    const documentUrls = parseDocumentUrls(currentUrl);
    const primaryUrl = documentUrls[documentUrls.length - 1] || '';
    const isPdf = primaryUrl.toLowerCase().includes('.pdf');
    
    // Si es DNI o Carnet usamos formato tarjeta, sino A4
    const captureFormat = (label.toLowerCase().includes('dni') || label.toLowerCase().includes('carnet')) 
        ? 'id-card' 
        : 'a4';

    const handleFile = async (e:any) => { 
        if(!e.target.files?.length) return; 
        await processUpload(Array.from(e.target.files));
        e.target.value = '';
    }; 
    
    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        await processUpload([file]);
    };

    const removePage = (indexToRemove: number) => {
        const nextUrls = documentUrls.filter((_: string, index: number) => index !== indexToRemove);
        onUpload(serializeDocumentUrls(nextUrls));
        toast.success("Hoja eliminada");
    };

    const processUpload = async (files: File[]) => {
        setUploading(true);
        const uploadedUrls: string[] = [];

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}_${index}.${fileExt}`;

            const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
                contentType: file.type 
            }); 

            if (error) {
                toast.error("Error al subir uno de los documentos");
                console.error(error);
                continue;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName); 
            uploadedUrls.push(data.publicUrl); 
        }

        if (uploadedUrls.length) {
            onUpload(serializeDocumentUrls([...documentUrls, ...uploadedUrls]));
            toast.success(uploadedUrls.length > 1 ? "Documentos cargados correctamente" : "Documento cargado correctamente");
        }

        setUploading(false);
    };

    const missingRequired = required && documentUrls.length === 0
    return (
        <>
            <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all group min-h-44 overflow-hidden ${
                documentUrls.length
                    ? (isPdf ? 'border-red-500 bg-red-50/30' : 'border-emerald-500 bg-emerald-50/30')
                    : missingRequired
                        ? 'border-amber-400 bg-amber-50/40 hover:border-amber-500'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}>
                {required && (
                    <span className={`absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider z-20 ${
                        documentUrls.length
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-200 text-amber-900 border border-amber-300 animate-pulse'
                    }`}>
                        {documentUrls.length ? '✓ OK' : 'Obligatorio'}
                    </span>
                )}
                
                <div className="flex flex-col gap-3 w-full relative z-10 pointer-events-auto">
                    {!uploading && (
                        <>
                            <div className="flex flex-wrap justify-center gap-2">
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors active:scale-95 text-xs font-bold" title="Subir Archivo">
                                    <input type="file" accept="image/*,.pdf" multiple onChange={handleFile} className="hidden" />
                                    <UploadCloud size={18}/>
                                    {documentUrls.length ? 'Agregar hoja' : 'Subir archivo'}
                                </label>
                                <button type="button" onClick={() => setShowScanTutorial(true)} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors active:scale-95 text-xs font-bold" title="Tomar Foto">
                                    <Camera size={18}/>
                                    Escanear
                                </button>
                                {documentUrls.length > 0 && (
                                     <button type="button" onClick={() => { setPreviewIndex(0); setPreviewModal(true) }} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors active:scale-95 text-xs font-bold" title="Ver Documento">
                                         <Eye size={18}/>
                                         Ver hojas
                                     </button>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-600 leading-tight px-1 line-clamp-2">{label}</span>
                                <span className="text-[10px] text-slate-400 mt-1">
                                    {documentUrls.length
                                        ? `${documentUrls.length} hoja${documentUrls.length > 1 ? 's' : ''} cargada${documentUrls.length > 1 ? 's' : ''}`
                                        : 'PDF o Foto'}
                                </span>
                            </div>
                            {documentUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {documentUrls.slice(0, 4).map((url: string, index: number) => {
                                        const pagePdf = url.toLowerCase().includes('.pdf')
                                        return (
                                            <div key={`${url}-${index}`} className="relative rounded-xl border border-slate-200 bg-white p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removePage(index)}
                                                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/95 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center"
                                                    title="Quitar hoja"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <button type="button" onClick={() => { setPreviewIndex(index); setPreviewModal(true) }} className="w-full text-left">
                                                    <div className="aspect-[4/3] rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                                                        {pagePdf ? (
                                                            <div className="flex flex-col items-center gap-1 text-red-500">
                                                                <FileText size={26} />
                                                                <span className="text-[10px] font-bold">PDF</span>
                                                            </div>
                                                        ) : (
                                                            <img src={url} alt={`${label} ${index + 1}`} className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 gap-2">
                                                        <span className="text-[10px] font-bold text-slate-600">Hoja {index + 1}</span>
                                                        <span className="text-[10px] text-slate-400">{pagePdf ? 'PDF' : 'Imagen'}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                    {uploading && <div className="flex flex-col items-center"><Loader2 className="animate-spin text-blue-500" size={24}/><span className="text-[10px] font-bold text-blue-500 mt-2">Procesando...</span></div>}
                </div>

                {primaryUrl && !isPdf && <div className="absolute inset-0 z-0 opacity-20 bg-center bg-cover blur-sm" style={{backgroundImage: `url(${primaryUrl})`}}></div>}
                {primaryUrl && isPdf && <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center"><FileText size={60} className="text-red-500"/></div>}
            </div> 

            {showScanTutorial && (
                <ScanTutorialModal
                    format={captureFormat}
                    label={label}
                    onClose={() => setShowScanTutorial(false)}
                    onStart={() => { setShowScanTutorial(false); setShowCamera(true); }}
                />
            )}

            {showCamera && (
                <CameraCaptureModal
                    onClose={() => setShowCamera(false)}
                    onCapture={handleCameraCapture}
                    format={captureFormat}
                />
            )}

            {/* Modal de Previsualización */}
            {previewModal && documentUrls.length > 0 && (
                <DocumentPreviewModal
                    label={label}
                    urls={documentUrls}
                    initialIndex={previewIndex}
                    onClose={() => setPreviewModal(false)}
                />
            )}
        </>
    )
}

/**
 * Realce automático tipo escáner (sin librerías):
 *  1. Auto-niveles: blanquea el fondo y oscurece el texto (estira el histograma).
 *  2. Contraste suave alrededor del medio.
 *  3. Escala de grises opcional (B/N).
 * Hace que la foto se vea nítida y "escaneada" en vez de una foto plana.
 */
function enhanceDocumentCanvas(
    canvas: HTMLCanvasElement,
    opts: { grayscale?: boolean; contrast?: number } = {},
) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { grayscale = false, contrast = 1.12 } = opts
    const w = canvas.width
    const h = canvas.height
    if (w === 0 || h === 0) return

    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data
    const total = w * h

    // Histograma de luminancia
    const hist = new Array(256).fill(0)
    for (let i = 0; i < data.length; i += 4) {
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0
        hist[lum]++
    }
    // Percentiles 2% / 98% para los puntos negro y blanco
    const loCut = total * 0.02
    const hiCut = total * 0.02
    let acc = 0
    let lo = 0
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= loCut) { lo = v; break } }
    acc = 0
    let hi = 255
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= hiCut) { hi = v; break } }
    if (hi - lo < 16) { lo = 0; hi = 255 } // imagen muy plana: no estirar
    const range = hi - lo || 255

    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            let v = data[i + c]
            v = ((v - lo) / range) * 255      // auto-niveles
            v = (v - 128) * contrast + 128     // contraste
            data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v
        }
        if (grayscale) {
            const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = data[i + 1] = data[i + 2] = g
        }
    }
    ctx.putImageData(imageData, 0, 0)
}

/** Enfoque (unsharp mask) ligero con kernel 3x3 para que el texto se lea más nítido. */
function sharpenCanvas(canvas: HTMLCanvasElement, amount = 0.6) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    if (w === 0 || h === 0) return
    // Evita procesar imágenes gigantescas (coste/memoria)
    if (w * h > 6_000_000) return

    const src = ctx.getImageData(0, 0, w, h)
    const out = ctx.createImageData(w, h)
    const s = src.data
    const o = out.data
    const c = 1 + 4 * amount
    const e = -amount
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4
            if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
                o[idx] = s[idx]; o[idx + 1] = s[idx + 1]; o[idx + 2] = s[idx + 2]; o[idx + 3] = s[idx + 3]
                continue
            }
            for (let ch = 0; ch < 3; ch++) {
                const p = idx + ch
                let v = s[p] * c
                    + s[p - 4] * e
                    + s[p + 4] * e
                    + s[p - w * 4] * e
                    + s[p + w * 4] * e
                o[p] = v < 0 ? 0 : v > 255 ? 255 : v
            }
            o[idx + 3] = s[idx + 3]
        }
    }
    ctx.putImageData(out, 0, 0)
}

// --- TUTORIAL ANIMADO ANTES DEL ESCÁNER (igual que en la app móvil) ---
function ScanTutorialModal({ format, label, onClose, onStart }: { format: 'id-card' | 'a4', label: string, onClose: () => void, onStart: () => void }) {
    const isId = format === 'id-card';
    const steps: { icon: any; text: string; accent?: boolean }[] = isId ? [
        { icon: <FileBadge size={18}/>, text: 'Coloca el documento sobre una superficie plana y con buena luz, sin reflejos.' },
        { icon: <Camera size={18}/>, text: 'Encuádralo dentro del recuadro verde y toma la foto.' },
        { icon: <FileText size={18}/>, text: 'Captura el FRENTE del documento.', accent: true },
        { icon: <RotateCw size={18}/>, text: 'Voltea el DNI y captura el REVERSO.', accent: true },
        { icon: <CheckCircle size={18}/>, text: 'Revisa, aplica realce si quieres y confirma.' },
    ] : [
        { icon: <FileText size={18}/>, text: 'Coloca el documento completo sobre una superficie plana y con buena luz.' },
        { icon: <Camera size={18}/>, text: 'Encuádralo dentro del recuadro y toma la foto.' },
        { icon: <Plus size={18}/>, text: 'Si tiene varias hojas, agrégalas una a una.' },
        { icon: <CheckCircle size={18}/>, text: 'Revisa el resultado y confirma.' },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200"
            >
                <div className="p-5 space-y-4 bg-gradient-to-b from-white via-sky-50/40 to-white">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">¿Cómo escanear?</h3>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                {label} · {isId ? '2 caras (frente y reverso)' : 'una o varias hojas'}
                            </p>
                        </div>
                        <div className="shrink-0 w-11 h-11 rounded-full bg-white border border-sky-100 flex items-center justify-center shadow-sm">
                            <Camera size={20} className="text-sky-600"/>
                        </div>
                    </div>

                    {/* Video de demostración */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center" style={{ maxHeight: '52vh' }}>
                        <video
                            src="/escaneo-demo.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-auto max-h-[52vh] object-contain"
                        />
                        <span className="absolute top-3 left-3 text-[9px] font-bold tracking-wider text-white bg-black/50 px-2.5 py-1 rounded-full">DEMOSTRACIÓN</span>
                        {isId && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/10 border border-emerald-400/60 px-3 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>FRENTE</span>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/10 border border-amber-400/60 px-3 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>REVERSO</span>
                            </div>
                        )}
                    </div>

                    {/* Pasos */}
                    <div className="space-y-2.5">
                        {steps.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.08 * i + 0.1, duration: 0.25 }}
                                className="flex items-center gap-3"
                            >
                                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${s.accent ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                                    {s.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Paso {i + 1}</p>
                                    <p className="text-[13px] font-medium text-slate-700 leading-snug">{s.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Botones */}
                    <button onClick={onStart} className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all active:scale-[0.98]">
                        <Camera size={18}/> Comenzar escaneo
                    </button>
                    <button onClick={onClose} className="w-full py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </div>
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
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Realce automático tipo escáner (siempre): blanquea fondo, sube contraste y enfoca.
            const gray = filter === 'bw' || filter === 'high-contrast';
            const contrastBoost = filter === 'high-contrast' ? 1.5 : filter === 'bw' ? 1.25 : 1.12;
            enhanceDocumentCanvas(canvas, { grayscale: gray, contrast: contrastBoost });
            sharpenCanvas(canvas, 0.6);

            const processedImage = canvas.toDataURL('image/jpeg', 0.92);

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
                                filter: filter === 'bw' ? 'grayscale(100%) contrast(1.45) brightness(1.05)' : filter === 'high-contrast' ? 'grayscale(100%) contrast(2.0) brightness(1.05)' : 'contrast(1.14) brightness(1.05) saturate(1.05)',
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
                                <span>{filter === 'original' ? 'AUTO COLOR' : filter === 'bw' ? 'B/N' : 'ALTO CONTR.'}</span>
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
    const checklist: { key: AnimatedIconKey; text: string }[] = [
        { key: 'personal', text: 'Datos personales y bancarios' },
        { key: 'docs', text: 'Documentos del trabajador y familiares' },
        { key: 'firma', text: 'Firma digital de conformidad' },
    ]
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
            {/* Blobs decorativos mint */}
            <motion.div
                aria-hidden
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-24 -right-20 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
                aria-hidden
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-300/30 rounded-full blur-3xl pointer-events-none"
            />

            <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="relative w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-[28px] shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/70 overflow-hidden my-auto"
            >
                {/* HERO oscuro — arriba en móvil, izquierda en PC */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 sm:p-10 flex flex-col justify-between text-white overflow-hidden min-h-[230px] md:min-h-[460px]">
                    <motion.span
                        aria-hidden
                        className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative">
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400">Portal Obrero · RUAG</span>
                        <h2 className="text-2xl sm:text-3xl font-black mt-3 leading-tight">
                            Tu legajo,<br/><span className="text-emerald-400">en orden.</span>
                        </h2>
                    </div>
                    <div className="relative my-7 flex justify-center md:justify-start">
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.2 }}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-emerald-900/20 ring-1 ring-white/30"
                        >
                            <AnimatedIcon name="docs" size={84} bounceOnMount={false}/>
                        </motion.div>
                    </div>
                    <p className="relative text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Completa tu ficha una sola vez. Nosotros la mantenemos sincronizada y al día.
                    </p>
                </div>

                {/* CONTENIDO — abajo en móvil, derecha en PC */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">00 — Bienvenida</span>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-3">
                        Ficha <span className="italic text-emerald-600">de Datos</span>
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed mb-7">
                        Bienvenido al sistema <span className="font-extrabold text-slate-900">RUAG</span>.
                        Ten a mano tu DNI y documentos.
                    </p>
                    <ul className="space-y-3 mb-8">
                        {checklist.map((item, i) => (
                            <motion.li
                                key={item.key}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
                                className="flex items-center gap-3 text-sm text-slate-700"
                            >
                                <span className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                                    <AnimatedIcon name={item.key} size={24} bounceOnMount={false}/>
                                </span>
                                <span className="font-medium">{item.text}</span>
                            </motion.li>
                        ))}
                    </ul>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onStart}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-extrabold uppercase tracking-[0.18em] text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-colors"
                    >
                        Comenzar <ArrowRight size={20}/>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}

function SectionTitle({title, icon, animatedIcon}: { title: string, icon?: any, animatedIcon?: AnimatedIconKey }) {
    return (
        <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-6 pb-3 border-b border-stone-200/70"
        >
            {animatedIcon ? (
                <div className="w-12 h-12 rounded-xl bg-white/70 backdrop-blur ring-1 ring-white/70 border border-white/50 flex items-center justify-center shadow-sm shadow-slate-900/5">
                    <AnimatedIcon name={animatedIcon} size={32} bounceOnMount />
                </div>
            ) : (
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                    {icon}
                </div>
            )}
            <div className="flex-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.22em]">RUAG · Ficha</span>
                <h3 className="text-lg font-black text-stone-900 tracking-tight leading-none mt-0.5">{title}</h3>
            </div>
        </motion.div>
    )
}
function SectionRead({title, icon, children}: any) {
    return (
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 ring-1 ring-white/60 shadow-md shadow-slate-900/5">
            <div className="flex items-center gap-2 mb-4 text-stone-900 font-extrabold border-b border-stone-200/70 pb-2">
                <span className="text-emerald-700">{icon}</span>
                <h3 className="tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    )
}
function Input({label, name, val, set, type="text", required=false, readOnly=false, onChange, placeholder, className=""}: any) {
    if (type === 'date') {
        return <DateInput label={label} name={name} val={val} set={set} onChange={onChange} required={required} readOnly={readOnly} className={className} />
    }
    return <div className={className}><label className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1"><span>{label} {required && <span className="text-red-500">*</span>}</span>{readOnly && <Lock size={10} className="text-slate-300" />}</label><input type={type} name={name} value={val || ''} onChange={onChange || set} readOnly={readOnly} placeholder={placeholder} className={`w-full p-3.5 rounded-xl border outline-none transition-all font-medium text-sm ${readOnly ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none shadow-none' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300 shadow-sm'}`} /></div>
}

// --- Helpers de fecha ---
function toIsoDate(value?: string): string {
    if (!value) return ''
    const trimmed = String(value).trim()
    if (!trimmed) return ''
    // Ya viene ISO (YYYY-MM-DD opcionalmente con tiempo)
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    // Acepta dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy con año de 2 o 4 dígitos
    const cleaned = trimmed.replace(/[.\-]/g, '/').replace(/\s/g, '')
    const parts = cleaned.split('/')
    if (parts.length !== 3) return ''
    let [d, m, y] = parts
    if (!d || !m || !y) return ''
    const day = parseInt(d, 10)
    const month = parseInt(m, 10)
    if (Number.isNaN(day) || Number.isNaN(month)) return ''
    let year = parseInt(y, 10)
    if (Number.isNaN(year)) return ''
    if (y.length === 2) {
        const cur = new Date().getFullYear() % 100
        year = year <= cur ? 2000 + year : 1900 + year
    }
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return ''
    const dt = new Date(year, month - 1, day)
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return ''
    return `${year.toString().padStart(4,'0')}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
}

function calcAgeText(iso: string): { text: string, future: boolean } {
    if (!iso) return { text: '', future: false }
    const [yy, mm, dd] = iso.split('-').map((n) => parseInt(n, 10))
    if (!yy || !mm || !dd) return { text: '', future: false }
    const birth = new Date(yy, mm - 1, dd)
    const today = new Date()
    if (birth > today) return { text: 'Fecha futura no permitida', future: true }
    let years = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--
    if (years < 1) {
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth()) - (today.getDate() < birth.getDate() ? 1 : 0)
        return { text: `${Math.max(months, 0)} meses`, future: false }
    }
    return { text: years === 1 ? '1 año' : `${years} años`, future: false }
}

function DateInput({ label, name, val, set, onChange, required, readOnly, className = '' }: any) {
    const isoVal = toIsoDate(val)
    const today = new Date().toISOString().slice(0, 10)
    const age = calcAgeText(isoVal)
    const handler = (e: any) => {
        // Normaliza al callback existente sin romper las firmas (handleChange espera e.target.{name,value})
        const next = e?.target?.value ?? ''
        if (onChange) return onChange({ target: { name, value: next } })
        if (set) return set({ target: { name, value: next } })
    }
    return (
        <div className={className}>
            <label className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                <span>{label} {required && <span className="text-red-500">*</span>}</span>
                {readOnly && <Lock size={10} className="text-slate-300" />}
            </label>
            <div className="relative">
                <input
                    type="date"
                    name={name}
                    value={isoVal}
                    onChange={handler}
                    readOnly={readOnly}
                    max={today}
                    min="1900-01-01"
                    className={`w-full p-3.5 pr-12 rounded-xl border outline-none transition-all font-medium text-sm ${readOnly ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none shadow-none' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-300 shadow-sm'}`}
                />
                {isoVal && age.text && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none ${age.future ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {age.text}
                    </span>
                )}
            </div>
            {!isoVal && val && String(val).trim() && (
                <p className="text-[10px] text-amber-600 mt-1 pl-1">No se pudo leer “{String(val)}”. Usa el selector.</p>
            )}
        </div>
    )
}
function Select({label, name, val, set, options=[], required=false}: any) { return <div><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">{label} {required && <span className="text-red-500">*</span>}</label><div className="relative"><select name={name} value={val || ''} onChange={set} className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-sm text-slate-700 appearance-none cursor-pointer shadow-sm"><option value="">Seleccionar...</option>{options.map((o:string)=><option key={o} value={o}>{o}</option>)}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight className="rotate-90" size={16}/></div></div></div>}
function Radio({label, name, val, current, set}: any) { return <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all w-full ${current === val ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${current === val ? 'border-white' : 'border-slate-300'}`}>{current === val && <div className="w-2 h-2 rounded-full bg-white"/>}</div><input type="radio" name={name} value={val} checked={current === val} onChange={set} className="hidden"/><span className="font-bold text-sm">{label}</span></label>}
function StepWrapper({children}: any) { return <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="p-1">{children}</motion.div>}
function GridRead({children}: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div> }
function FieldRead({label, val, full, highlight}: any) { return <div className={`${full ? 'col-span-1 md:col-span-2' : ''} flex flex-col`}><span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</span><span className={`text-sm font-medium border-b border-slate-100 pb-1 ${highlight ? 'text-blue-700 font-bold' : 'text-slate-800'}`}>{val || '-'}</span></div> }
function DocRead({label, url}: any) {
    const [previewOpen, setPreviewOpen] = useState(false)
    const urls = parseDocumentUrls(url)
    if (!urls.length) return null
    const primaryUrl = urls[urls.length - 1]
    const isPdf = primaryUrl.toLowerCase().includes('.pdf')
    return (
        <>
            <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-all group text-left ${isPdf ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}
            >
                <div className={`p-2 rounded ${isPdf ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{isPdf ? <FileText size={16}/> : <ImageIcon size={16}/>}</div>
                <div className="flex-1 overflow-hidden"><p className="text-xs font-bold text-slate-700 truncate">{label}</p><p className="text-[10px] text-slate-400">{urls.length > 1 ? `${urls.length} hojas` : (isPdf ? 'Documento PDF' : 'Imagen')}</p></div>
                <Eye size={14} className="text-slate-300 group-hover:text-slate-500"/>
            </button>

            {previewOpen && (
                <DocumentPreviewModal
                    label={label}
                    urls={urls}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </>
    )
}

// Slot que SIEMPRE se renderiza: si el documento existe lo abre en el modal,
// si no, muestra un placeholder estilo "Pendiente de carga" como en la app móvil.
function DocSlot({ label, url, optional = false }: { label: string, url?: string, optional?: boolean }) {
    const [previewOpen, setPreviewOpen] = useState(false)
    const urls = parseDocumentUrls(url)
    const isUploaded = urls.length > 0
    const primaryUrl = isUploaded ? urls[urls.length - 1] : ''
    const isPdf = isUploaded && primaryUrl.toLowerCase().includes('.pdf')

    if (!isUploaded) {
        return (
            <div className={`group relative w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${optional ? 'bg-slate-50/50 border-slate-200' : 'bg-amber-50/50 border-amber-200'}`}>
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${optional ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                    {optional ? <CloudOff size={16} /> : <FileWarning size={16} />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className={`text-xs font-bold truncate ${optional ? 'text-slate-500' : 'text-amber-900'}`}>{label}</p>
                    <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${optional ? 'text-slate-400' : 'text-amber-700'}`}>
                        <Clock size={9} />
                        {optional ? 'No registrado' : 'Pendiente de carga'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            <motion.button
                type="button"
                onClick={() => setPreviewOpen(true)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative w-full flex items-center gap-3 p-3 border rounded-xl text-left transition-shadow hover:shadow-md ${isPdf ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-300'}`}
            >
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isPdf ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isPdf ? <FileText size={16}/> : <ImageIcon size={16}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{label}</p>
                    <p className={`text-[10px] mt-0.5 font-bold flex items-center gap-1 ${isPdf ? 'text-red-600' : 'text-emerald-600'}`}>
                        <CheckCircle size={9} />
                        {urls.length > 1 ? `${urls.length} hojas · LISTO` : (isPdf ? 'PDF · LISTO' : 'IMAGEN · LISTO')}
                    </p>
                </div>
                <Eye size={14} className="text-slate-400 group-hover:text-slate-600"/>
            </motion.button>

            {previewOpen && (
                <DocumentPreviewModal
                    label={label}
                    urls={urls}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </>
    )
}

