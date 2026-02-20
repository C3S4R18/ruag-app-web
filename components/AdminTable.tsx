'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { FichaDocument } from './FichaPdf'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

// --- COMPONENTES BIOMÉTRICOS ---
import BiometricSignature from './ssoma/BiometricSignature' 
import BiometricFingerprint from './ssoma/BiometricFingerprint'

// --- DOCUMENTOS IMPRIMIBLES SSOMA ---
import { CargoRisstPrintable } from './CargoRisstPrintable'
import { RegistroCapacitacionPrintable } from './RegistroCapacitacionPrintable'
import { InduccionHombreNuevoPrintable } from './InduccionHombreNuevoPrintable'
import { EntregaEppPrintable } from './EntregaEppPrintable'
import { ActaDerechoSaberPrintable } from './ActaDerechoSaberPrintable'
import { ActaEntregaIpercPrintable } from './ActaEntregaIpercPrintable'

// --- DOCUMENTOS IMPRIMIBLES RRHH ---
import { CargoRitPrintable } from './CargoRitPrintable' 
import { CargoPoliticaPrevencionPrintable } from './CargoPoliticaPrevencionPrintable'

import { 
  FileText, Search, Download, Trash2, 
  CheckCircle, ShieldCheck, X, Save, 
  Loader2, Building2, Printer, 
  ChevronLeft, ChevronRight, User, Wallet, HardHat, 
  CheckSquare, Square, Unlock, Lock, FileBadge, BellRing, BellOff, Bell,
  PenTool, Fingerprint, Share2, MoreHorizontal, Edit3,
  FileCheck, MessageSquare, Filter, ScanFace, Briefcase, 
  HeartPulse, GraduationCap, UploadCloud, Plus, Users, Zap, Mail,
  MailCheck, Clock, AlertCircle, RotateCcw, Monitor, ArrowUpDown,
  ArrowRightCircle, FileSpreadsheet, UserX, Cake, CalendarClock, Ban, Check, History 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- INTERFACES ---
interface FichaDrawerProps {
    ficha: any;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
    onDownload: () => void;
    downloading: boolean;
    onPrintPreview: (img: string) => void;
    onNotifyChange?: (action: string, details: string) => void;
}

interface AdminTableProps {
    onOpenChat?: (worker: any) => void;
    refreshTrigger?: number; 
    onNotifyChange?: (action: string, details: string) => void; 
}

// --- CONSTANTES DE DOCUMENTOS ---
const SSOMA_DOCS = [
    { id: 'risst', label: 'Cargo RISST', desc: 'Anexo 03 - Reglamento Interno SST' },
    { id: 'capacitacion', label: 'Registro Capacitación', desc: 'SG-FOR-01 Inducción General' },
    { id: 'induccion', label: 'Inducción Hombre Nuevo', desc: 'SG-FOR-06' },
    { id: 'epp', label: 'Entrega de EPPs', desc: 'SG-FOR-08 Control de Equipos' },
    { id: 'derecho', label: 'Acta Derecho a Saber', desc: 'SG-FOR-110' },
    { id: 'iperc', label: 'Entrega IPERC', desc: 'SG-FOR-112' },
]

const RRHH_DOCS = [
    { id: 'cargo_rit', label: 'Cargo Reglamento Interno', desc: 'Constancia de recepción RIT' },
    { id: 'cargo_politica_prevencion', label: 'Cargo Política Prevención', desc: 'Hostigamiento Sexual' },
]

export default function AdminTable({ onOpenChat, refreshTrigger = 0, onNotifyChange }: AdminTableProps) {
  const supabase = createClient()
  const [fichas, setFichas] = useState<any[]>([])
  const [selectedFicha, setSelectedFicha] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // IMPRESIÓN
  const [showDocSelector, setShowDocSelector] = useState(false)
  const [selectedDocsToPrint, setSelectedDocsToPrint] = useState<string[]>([])
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null) 
  const [pdfFile, setPdfFile] = useState<File | null>(null) 
  const [preparingDoc, setPreparingDoc] = useState(false)
  const [printImage, setPrintImage] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
    
  // ESTADO PARA CONTROLAR LA INCLUSIÓN DE FIRMAS
  const [includeSignatures, setIncludeSignatures] = useState(false)

  // FILTROS & UI
  const [searchTerm, setSearchTerm] = useState('')
  const [filterObra, setFilterObra] = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [deleting, setDeleting] = useState(false)
    
  // ACCIONES MASIVAS
  const [moving, setMoving] = useState(false) // Para Vida Ley
  const [movingSctr, setMovingSctr] = useState(false) // Para SCTR
  const [cessing, setCessing] = useState(false) // Para Cesados (NUEVO)
  const [exporting, setExporting] = useState(false)
  const [openingFichas, setOpeningFichas] = useState(false) // Para Abrir Fichas Masivo (NUEVO)

  // ESTADO DEL MODAL DE CONFIRMACIÓN PERSONALIZADO
  const [confirmDialog, setConfirmDialog] = useState<{
      isOpen: boolean; title: string; message: string; confirmText: string; confirmColor: string; icon: any; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Aceptar', confirmColor: 'bg-blue-600', icon: null, onConfirm: () => {} });

  // Audio y Notificaciones
  const [audioEnabled, setAudioEnabled] = useState(false) 
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  // --- AQUI ESTÁ EL CAMBIO PARA PERSISTENCIA ---
  const [notifications, setNotifications] = useState<any[]>([]) 
  const [isNotifInitialized, setIsNotifInitialized] = useState(false) // Para evitar sobrescribir al cargar

  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  // --- NUEVA LÓGICA: ALERTAS DE HIJOS MAYORES DE EDAD ---
  const [adultChildrenAlerts, setAdultChildrenAlerts] = useState<any[]>([])
  const [showBirthdayDropdown, setShowBirthdayDropdown] = useState(false)

  // --- NUEVA FUNCIÓN PARA ENVIAR NOTIFICACIONES A TODOS SIN DUPLICAR Y CON NOMBRE CORRECTO ---
  const emitAdminAction = async (action: string, details: string) => {
      // 1. Obtener el usuario actual
      const { data } = await supabase.auth.getUser();
      let adminName = 'ADMIN';

      if (data?.user) {
          // Intentar sacar el nombre de user_metadata
          const meta = data.user.user_metadata || {};
          let rawName = meta.nombres || meta.nombre || meta.name || meta.full_name || meta.first_name;

          // Si no está en metadata, consultamos la tabla perfiles directamente
          if (!rawName) {
              try {
                  const { data: profileData } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', data.user.id)
                      .single();
                  
                  if (profileData) {
                      rawName = profileData.nombres || profileData.nombre || profileData.name || profileData.full_name;
                  }
              } catch (error) {
                  // Silencioso por si no existe la tabla
              }
          }

          // Si aún no hay nombre, usamos el correo sin el @
          if (!rawName && data.user.email) {
              rawName = data.user.email.split('@')[0];
          }

          // EXCEPCIÓN FORZADA: Si el usuario es fabrigc18, forzamos el nombre JORGAN
          if (data.user?.email?.toLowerCase().includes('fabrigc18') || (rawName && rawName.toLowerCase() === 'fabrigc18')) {
              rawName = 'JORGAN';
          }

          // Tomamos solo el primer nombre y lo ponemos en mayúsculas
          adminName = (rawName || 'ADMIN').split(' ')[0].toUpperCase();
      }

      // 2. Crear ID único para evitar rebotes/duplicados en Supabase
      const actionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);

      const newLog = {
          id: actionId,
          type: 'action',
          user: adminName,
          msg: action,
          details: details,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };

      // 3. Agregar la notificación a nosotros mismos localmente SIN DUPLICAR
      setNotifications(prev => {
          if (prev.some(n => n.id === actionId || (n.msg === action && n.details === details && n.time === newLog.time))) return prev;
          return [newLog, ...prev];
      });

      // 4. Enviar el broadcast a todos los demás admins conectados usando EXACTAMENTE el mismo ID
      supabase.channel('admin_room').send({
          type: 'broadcast',
          event: 'admin_action',
          payload: newLog
      });

      // 5. Ejecutar el prop original para Google Sheets
      if (onNotifyChange) onNotifyChange(action, details);
  };

  // --- HELPER PARA ESTILOS DINÁMICOS DE NOTIFICACIONES ---
  const getActionStyle = (actionMsg: string) => {
      const msg = actionMsg.toLowerCase();
      if (msg.includes('validó')) return { icon: <CheckCircle size={14}/>, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
      if (msg.includes('reabrió') || msg.includes('editó')) return { icon: <Unlock size={14}/>, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
      if (msg.includes('eliminó') || msg.includes('cesó') || msg.includes('baja')) return { icon: <Trash2 size={14}/>, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
      if (msg.includes('exportó')) return { icon: <FileSpreadsheet size={14}/>, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' };
      if (msg.includes('imprimiendo')) return { icon: <Printer size={14}/>, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
      return { icon: <Zap size={14}/>, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }; // Default (ej. movió a SCTR)
  };

  // --- 1. CARGAR NOTIFICACIONES GUARDADAS AL INICIO ---
  useEffect(() => {
    const saved = localStorage.getItem('ruag_notifications')
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Filtro extra por si quedaron duplicados viejos guardados
            const unique = parsed.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
            setNotifications(unique);
        } catch (e) {
            console.error("Error cargando notificaciones", e)
        }
    }
    setIsNotifInitialized(true)
  }, [])

  // --- 2. GUARDAR NOTIFICACIONES CADA VEZ QUE CAMBIEN ---
  useEffect(() => {
    if (isNotifInitialized) {
        localStorage.setItem('ruag_notifications', JSON.stringify(notifications))
    }
  }, [notifications, isNotifInitialized])


  // --- EFECTO REFRESH AUTOMÁTICO ---
  useEffect(() => {
    if (refreshTrigger > 0) {
        fetchFichas()
    }
  }, [refreshTrigger])

  // Carga inicial y configuración
  useEffect(() => {
    const savedAudioPref = localStorage.getItem('admin_audio_enabled')
    if (savedAudioPref === 'true') {
        setAudioEnabled(true)
    }

    fetchFichas()
      
    // Listener de Fichas (Cambios en DB)
    const fichasChannel = supabase.channel('realtime-fichas').on('postgres_changes', { event: '*', schema: 'public', table: 'fichas' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
             // Solo agregamos si NO es vida ley Y NO es cesado Y NO es SCTR
             if (!payload.new.in_vida_ley && !payload.new.es_cesado && !payload.new.in_sctr) {
                 setFichas((prev) => {
                     const updated = [payload.new, ...prev]
                     checkForAdultChildren(updated)
                     return updated
                 })
                 if(payload.new.estado === 'completado') { toast.success(`🔔 Nuevo Ingreso: ${payload.new.nombres}`); playSystemSound() }
             }
          } else if (payload.eventType === 'UPDATE') {
             // Si se movió a vida ley O a cesados O a SCTR, lo sacamos de la lista
             setFichas((prev) => {
                if (payload.new.in_vida_ley === true || payload.new.es_cesado === true || payload.new.in_sctr === true) {
                    return prev.filter(f => f.id !== payload.new.id)
                } else {
                    // Mantenemos los datos del perfil anterior (si existían) mezclando el objeto
                    const updatedList = prev.map(f => f.id === payload.new.id ? { ...f, ...payload.new } : f)
                    checkForAdultChildren(updatedList)
                    return updatedList
                }
             })

             // 🔴 ACTUALIZACIÓN EN TIEMPO REAL DEL DRAWER
             setSelectedFicha((currentSelected: any) => {
                if (currentSelected && currentSelected.id === payload.new.id) {
                    // Si la ficha se fue a cesados/vida ley, cerrar drawer
                    if (payload.new.in_vida_ley || payload.new.es_cesado || payload.new.in_sctr) {
                        return null; 
                    }
                    // Si no, actualizar datos (incluidos nuevos documentos)
                    return { ...currentSelected, ...payload.new }
                }
                return currentSelected
             })
             
             // Notificar si se confirmó el correo
             if (payload.new.email_confirmed_at && !payload.old.email_confirmed_at) {
                 toast.success(`📧 Correo confirmado por ${payload.new.nombres}`);
                 playSystemSound();
             }
             if (payload.new.estado === 'completado' && payload.old.estado !== 'completado') { 
                 toast.success(`✅ Completado: ${payload.new.nombres}`); 
                 playSystemSound();
             }
          } else if (payload.eventType === 'DELETE') {
             setFichas((prev) => {
                 const updatedList = prev.filter(f => f.id !== payload.old.id)
                 checkForAdultChildren(updatedList)
                 return updatedList
             })
             setSelectedIds(prev => prev.filter(id => id !== payload.old.id))
             
             // Cerrar drawer si se elimina la ficha que se está viendo
             setSelectedFicha((prev: any) => (prev && prev.id === payload.old.id) ? null : prev)
          }
      }).subscribe()

    // Listener de Chat
    const chatChannel = supabase.channel('global-chat-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
            const newMsg = payload.new
            if (!newMsg.is_admin) {
                playChatSound()
                toast.info("Nuevo mensaje de chat recibido")
                setUnreadCounts(prev => ({
                    ...prev,
                    [newMsg.worker_id]: (prev[newMsg.worker_id] || 0) + 1
                }))
                setNotifications(prev => [
                    { 
                        id: newMsg.id, 
                        type: 'chat', // TIPO CHAT (SE PUEDE BORRAR)
                        worker_id: newMsg.worker_id,
                        msg: newMsg.content || 'Adjunto enviado',
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    }, 
                    ...prev
                ])
            }
        })
        .subscribe()

    const adminActivityChannel = supabase.channel('admin_room')
        .on('broadcast', { event: 'admin_action' }, ({ payload }) => {
            setNotifications(prev => {
                // Evitar duplicados por si el broadcast hace eco al remitente
                if (prev.some(n => n.id === payload.id || (n.msg === payload.msg && n.details === payload.details && n.time === payload.time))) {
                    return prev;
                }
                return [payload, ...prev];
            });
        })
        .subscribe()

    return () => { 
        supabase.removeChannel(fichasChannel) 
        supabase.removeChannel(chatChannel)
        supabase.removeChannel(adminActivityChannel)
    }
  }, [])

  // --- FUNCIÓN PARA DETECTAR HIJOS Y GESTIONAR ESTADOS ---
  const checkForAdultChildren = (data: any[]) => {
      const alerts: any[] = []
      
      data.forEach(worker => {
          if (worker.hijos) {
              try {
                  const hijos = typeof worker.hijos === 'string' ? JSON.parse(worker.hijos) : worker.hijos
                  
                  if (Array.isArray(hijos)) {
                      hijos.forEach((hijo: any, index: number) => {
                          if (hijo.fecha_nacimiento) {
                              const birthDate = new Date(hijo.fecha_nacimiento)
                              const today = new Date()
                              
                              let age = today.getFullYear() - birthDate.getFullYear()
                              const m = today.getMonth() - birthDate.getMonth()
                              
                              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                  age--
                              }

                              const isExtended = hijo.extension_estudios === true;
                              const isRemoved = hijo.baja_beneficio === true; 
                              const requestDate = hijo.fecha_solicitud_constancia ? new Date(hijo.fecha_solicitud_constancia) : null;

                              // LÓGICA MEJORADA: 
                              // Solo entra si tiene 18 o más, PERO menos de 25 años.
                              // Además, si ya marcaste "isExtended" o "isRemoved", NO DEBE SALIR EN LA LISTA.
                              if (age >= 18 && age < 25 && !isExtended && !isRemoved) {
                                  let daysWaiting = 0;
                                  let status = 'new'; 

                                  if (requestDate) {
                                      const diffTime = Math.abs(today.getTime() - requestDate.getTime());
                                      daysWaiting = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      status = 'waiting';
                                  }

                                  alerts.push({
                                      id: `${worker.id}-${index}`, 
                                      workerId: worker.id,
                                      workerName: `${worker.nombres} ${worker.apellido_paterno}`,
                                      childIndex: index,
                                      childName: hijo.nombres,
                                      childAge: age,
                                      status: status,
                                      daysWaiting: daysWaiting
                                  })
                              }
                          }
                      })
                  }
              } catch (e) {
                  console.error("Error parseando hijos de", worker.nombres, e)
              }
          }
      })
      
      setAdultChildrenAlerts(alerts)
  }

  // --- FUNCIÓN PARA ACTUALIZAR ESTADO DEL HIJO ---
  const updateChildStatus = async (alertItem: any, action: 'request' | 'extend' | 'remove') => {
      const worker = fichas.find(f => f.id === alertItem.workerId);
      if (!worker) return;

      let hijosArray = typeof worker.hijos === 'string' ? JSON.parse(worker.hijos) : worker.hijos;
      if (!Array.isArray(hijosArray)) hijosArray = [];

      const hijo = hijosArray[alertItem.childIndex];
      if (!hijo) return;

      if (action === 'request') {
          hijo.fecha_solicitud_constancia = new Date().toISOString();
          toast.info(`Se marcó como solicitado para ${hijo.nombres}`);
      } else if (action === 'extend') {
          hijo.extension_estudios = true;
          hijo.fecha_solicitud_constancia = null; 
          toast.success(`Beneficio extendido para ${hijo.nombres} (Estudios)`);
      } else if (action === 'remove') {
          hijo.baja_beneficio = true;
          hijo.fecha_solicitud_constancia = null;
          toast.error(`Beneficio retirado para ${hijo.nombres}`);
      }

      const { error } = await supabase
          .from('fichas')
          .update({ hijos: JSON.stringify(hijosArray) })
          .eq('id', worker.id);

      if (error) {
          toast.error("Error al actualizar: " + error.message);
      } else {
          // Actualizamos la ficha localmente y luego RE-EVALUAMOS todo para que desaparezca
          const updatedFichas = fichas.map(f => f.id === worker.id ? { ...f, hijos: hijosArray } : f);
          setFichas(updatedFichas);
          checkForAdultChildren(updatedFichas); 
      }
  };

  const fetchFichas = async () => {
    if(fichas.length === 0) setLoading(true)
    const { data } = await supabase.from('fichas')
        .select(`*, profiles(role)`)
        .is('in_vida_ley', false)
        .is('es_cesado', false) 
        .is('in_sctr', false)
        .order('updated_at', { ascending: false })
      
    if (data) {
        setFichas(data)
        checkForAdultChildren(data) 
    }
    setLoading(false)
  }

  const playSystemSound = () => {
    const isEnabled = localStorage.getItem('admin_audio_enabled') === 'true'
    if (isEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play().catch((e) => console.warn("Audio bloqueado:", e))
    }
  }

  const playChatSound = () => {
    const isEnabled = localStorage.getItem('admin_audio_enabled') === 'true'
    if (isEnabled) {
        const audio = new Audio('/notificationMSM.mp3') 
        audio.play().catch((e) => console.warn("Audio bloqueado:", e))
    }
  }

  const toggleAudio = () => {
      const newState = !audioEnabled
      setAudioEnabled(newState)
      localStorage.setItem('admin_audio_enabled', String(newState))
      if (newState) {
          toast.success("🔊 Audio activado")
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => {})
      } else {
          toast.info("🔇 Audio desactivado")
      }
  }

  const handleChatClick = (worker: any) => {
      if (worker.user_id) {
          setUnreadCounts(prev => {
              const newCounts = { ...prev }
              delete newCounts[worker.user_id]
              return newCounts
          })
      }
      if (onOpenChat) onOpenChat(worker)
  }

  const handleNotificationClick = (notif: any) => {
      if (notif.type === 'chat') {
          const worker = fichas.find(f => f.user_id === notif.worker_id)
          if (worker) {
              handleChatClick(worker)
              setShowNotifDropdown(false)
              // Al hacer clic, borramos ese mensaje específico
              const newNotifs = notifications.filter(n => n.id !== notif.id)
              setNotifications(newNotifs)
          } else {
              toast.error("El trabajador no se encuentra en la lista actual.")
          }
      } 
  }

  // --- LÓGICA: BORRAR SOLO MENSAJES ---
  const handleClearChats = () => {
      const onlyActions = notifications.filter(n => n.type === 'action')
      setNotifications(onlyActions)
      toast.success("Mensajes leídos eliminados")
  }

  // --- NUEVA LÓGICA: BORRAR TODO EL HISTORIAL DE CAMBIOS ---
  const handleClearHistory = () => {
      setNotifications(prev => prev.filter(n => n.type !== 'action'))
      toast.success("Historial de cambios limpiado")
  }

  const handleSelectAll = (filteredData: any[]) => {
      if (selectedIds.length === filteredData.length && filteredData.length > 0) setSelectedIds([]) 
      else setSelectedIds(filteredData.map(f => f.id)) 
  }

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id))
      else setSelectedIds(prev => [...prev, id])
  }

  // --- DRAG START PARA LA TABLA ---
  const handleDragStart = (e: React.DragEvent, worker: any) => {
      e.dataTransfer.setData("workerId", worker.id)
      e.dataTransfer.effectAllowed = "move"
  }

  // --- ACCIONES MASIVAS (Eliminar, Mover, Exportar, Abrir Fichas) ---
  const handleBulkDelete = async () => {
      if (selectedIds.length === 0) return;
      setConfirmDialog({
          isOpen: true,
          title: 'Eliminar Fichas',
          message: `⚠️ ¿Estás seguro de eliminar ${selectedIds.length} fichas seleccionadas?\n\nEsta acción eliminará todos los datos y no se podrá deshacer.`,
          confirmText: 'Sí, Eliminar',
          confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
          icon: <Trash2 className="text-red-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              setDeleting(true)
              try {
                  const { error } = await supabase.from('fichas').delete().in('id', selectedIds)
                  if (error) throw error
                  toast.success("Registros eliminados correctamente")
                  emitAdminAction("eliminó", `${selectedIds.length} fichas de trabajadores`)
                  setSelectedIds([])
              } catch (error: any) { toast.error("Error: " + error.message) } finally { setDeleting(false) }
          }
      });
  }

  const handleBulkOpenFichas = async () => {
      if (selectedIds.length === 0) return;
      setConfirmDialog({
          isOpen: true,
          title: 'Reabrir Fichas',
          message: `¿Estás seguro de ABRIR y cambiar a estado Pendiente las ${selectedIds.length} fichas seleccionadas?\n\nEsto permitirá a los trabajadores editar nuevamente su información.`,
          confirmText: 'Reabrir Fichas',
          confirmColor: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: <Unlock className="text-blue-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              setOpeningFichas(true);
              try {
                  const { error } = await supabase.from('fichas').update({ estado: 'pendiente' }).in('id', selectedIds);
                  if (error) throw error;
                  toast.success(`${selectedIds.length} fichas reabiertas correctamente.`);
                  emitAdminAction("reabrió", `${selectedIds.length} fichas de trabajadores`);
                  setFichas(prev => prev.map(f => selectedIds.includes(f.id) ? { ...f, estado: 'pendiente' } : f));
                  setSelectedIds([]);
              } catch (error: any) { toast.error("Error al abrir fichas: " + error.message); } finally { setOpeningFichas(false); }
          }
      });
  };

  const handleMoveToVidaLey = async () => {
      if (selectedIds.length === 0) { toast.warning("Selecciona al menos un trabajador para mover."); return; }
      setConfirmDialog({
          isOpen: true,
          title: 'Mover a Vida Ley',
          message: `¿Estás seguro de mover ${selectedIds.length} trabajadores a la gestión de VIDA LEY?\n\nDesaparecerán de esta lista principal y pasarán al módulo de bajas para su gestión en Excel.`,
          confirmText: 'Mover a Vida Ley',
          confirmColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          icon: <ArrowRightCircle className="text-emerald-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              setMoving(true);
              try {
                  const { error } = await supabase.from('fichas').update({ in_vida_ley: true }).in('id', selectedIds);
                  if (error) throw error;
                  toast.success(`${selectedIds.length} trabajadores movidos a Vida Ley.`);
                  emitAdminAction("movió", `${selectedIds.length} obreros a la gestión de Vida Ley`);
                  setFichas(prev => prev.filter(f => !selectedIds.includes(f.id)));
                  setSelectedIds([]);
              } catch (error: any) { console.error(error); toast.error("Error al mover: " + error.message); } finally { setMoving(false); }
          }
      });
  };

  const handleMoveToSctr = async () => {
      if (selectedIds.length === 0) { toast.warning("Selecciona trabajadores."); return; }
      setConfirmDialog({
          isOpen: true,
          title: 'Mover a SCTR',
          message: `¿Deseas mover a los ${selectedIds.length} trabajadores seleccionados a la nómina de SCTR?\n\nSerán transferidos a esa sección.`,
          confirmText: 'Mover a SCTR',
          confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
          icon: <ShieldCheck className="text-amber-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              setMovingSctr(true);
              try {
                  const { error } = await supabase.from('fichas').update({ in_sctr: true }).in('id', selectedIds);
                  if (error) throw error;
                  toast.success(`${selectedIds.length} trabajadores movidos a SCTR.`);
                  emitAdminAction("movió", `${selectedIds.length} obreros a SCTR`);
                  setFichas(prev => prev.filter(f => !selectedIds.includes(f.id)));
                  setSelectedIds([]);
              } catch (error: any) { toast.error("Error: " + error.message); } finally { setMovingSctr(false); }
          }
      });
  };

  const handleMoveToCesados = async () => {
      if (selectedIds.length === 0) { toast.warning("Selecciona trabajadores."); return; }
      setConfirmDialog({
          isOpen: true,
          title: 'Dar de Baja',
          message: `⚠️ ¿CONFIRMAR CESE para ${selectedIds.length} trabajadores? \n\nPasarán a la lista de Cesados y saldrán de los activos definitivamente.`,
          confirmText: 'Confirmar Cese',
          confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
          icon: <UserX className="text-red-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              setCessing(true)
              try {
                  const { error } = await supabase.from('fichas').update({ es_cesado: true, fecha_cese: new Date().toISOString(), in_vida_ley: false, in_sctr: false }).in('id', selectedIds)
                  if (error) throw error
                  toast.success(`${selectedIds.length} trabajadores dados de baja exitosamente.`)
                  setFichas(prev => prev.filter(f => !selectedIds.includes(f.id)))
                  setSelectedIds([])
                  emitAdminAction("cesó", `a ${selectedIds.length} trabajadores`)
              } catch (error: any) { toast.error("Error al cesar: " + error.message) } finally { setCessing(false) }
          }
      });
  }

  const handleExportVidaLey = () => {
      if (selectedIds.length === 0) { toast.warning("Selecciona trabajadores."); return; }
      setExporting(true); toast.info("Generando Excel...");
      try {
          const selectedWorkers = fichas.filter(f => selectedIds.includes(f.id));
          const excelData = selectedWorkers.map(w => ({
              'Nombres': w.nombres || '', 'Paterno': w.apellido_paterno || '', 'Materno': w.apellido_materno || '',
              'TipoTrab': 'O', 'TipoDoc': 'DNI', 'NroDoc': w.dni || '', 'Sexo': 'M',
              'FechaNac': w.fecha_nacimiento ? new Date(w.fecha_nacimiento).toLocaleDateString('es-PE') : '',
              'Moneda': 'S', 'Remuneracion': '', 'Sede': w.nombre_obra || ''
          }));
          const worksheet = XLSX.utils.json_to_sheet(excelData); const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Planilla Vida Ley");
          XLSX.writeFile(workbook, `Trama_Vida_Ley_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
          toast.success("Exportado."); 
          emitAdminAction("exportó", `Excel de ${selectedIds.length} trabajadores`);
      } catch (error: any) { toast.error("Error al generar el Excel."); } finally { setExporting(false); }
  };

  const handleResetConfirmation = async (id: string) => {
      setConfirmDialog({
          isOpen: true,
          title: 'Resetear Confirmación',
          message: '¿Deseas anular la confirmación de recepción y volver a poner el estado en Pendiente?',
          confirmText: 'Resetear',
          confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
          icon: <RotateCcw className="text-amber-500" size={32}/>,
          onConfirm: async () => {
              setConfirmDialog(prev => ({...prev, isOpen: false}));
              const { error } = await supabase.from('fichas').update({ email_confirmed_at: null }).eq('id', id)
              if (error) { toast.error("Error al resetear: " + error.message) } else {
                  toast.success("Estado reseteado a Pendiente")
                  setFichas(prev => prev.map(f => f.id === id ? { ...f, email_confirmed_at: null } : f))
              }
          }
      });
  }

  const handleDownloadPDF = async (ficha: any) => {
    try {
        setDownloadingPdf(true); toast.info("Generando PDF Digital...")
        const blob = await pdf(<FichaDocument ficha={ficha} />).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a'); link.href = url; link.download = `Ficha_${ficha.dni}.pdf`
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
        toast.success("Descarga completada")
    } catch (error: any) { toast.error("Error PDF: " + error.message) } finally { setDownloadingPdf(false) }
  }

  const handleDeleteLocal = () => { fetchFichas(); setSelectedFicha(null) }

  // --- LÓGICA DE IMPRESIÓN ---
  const handleOpenDocSelector = () => {
      if (selectedIds.length !== 1) { toast.warning("Selecciona exactamente 1 trabajador para imprimir."); return }
      setSelectedDocsToPrint([]) 
      setIncludeSignatures(false)
      setShowDocSelector(true)
  }

  const toggleDocSelection = (docId: string) => {
      setSelectedDocsToPrint(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId])
  }

  const toggleSelectAllDocs = (docs: any[]) => {
      const allIds = docs.map(d => d.id)
      const allSelected = allIds.every((id: string) => selectedDocsToPrint.includes(id))
      if (allSelected) {
          setSelectedDocsToPrint(prev => prev.filter(id => !allIds.includes(id)))
      } else {
          setSelectedDocsToPrint(prev => [...Array.from(new Set([...prev, ...allIds]))])
      }
  }

  const handleGenerateCombinedDocs = async () => {
      if (selectedDocsToPrint.length === 0) { toast.warning("Selecciona al least un documento"); return }
      setPreparingDoc(true)
      setShowDocSelector(false) 
      emitAdminAction("está imprimiendo", `Legajo de ${workerToPrint?.nombres}`)
      setTimeout(async () => {
          if (!printRef.current) { toast.error("Error de renderizado"); setPreparingDoc(false); return }
          try {
              const pdfDoc = new jsPDF('p', 'mm', 'a4')
              pdfDoc.deletePage(1)
              const elements = Array.from(printRef.current.children) as HTMLElement[]
              for (let i = 0; i < elements.length; i++) {
                  const element = elements[i]
                  const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', onclone: (clonedDoc) => { const all = clonedDoc.querySelectorAll('*'); all.forEach((el: any) => { el.style.color = '#000000'; if (getComputedStyle(el).borderColor !== 'rgba(0, 0, 0, 0)') { el.style.borderColor = '#000000'; } el.style.removeProperty('color-scheme'); }) } });
                  const imgData = canvas.toDataURL('image/jpeg', 0.7)
                  const imgProps = pdfDoc.getImageProperties(imgData)
                  const orientation = imgProps.width > imgProps.height ? 'l' : 'p'
                  const pdfWidth = orientation === 'p' ? 210 : 297
                  const pdfHeight = orientation === 'p' ? 297 : 210
                  pdfDoc.addPage('a4', orientation)
                  pdfDoc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
              }
              const nombreArchivo = `Legajo_${workerToPrint?.dni}.pdf`
              const pdfBlob = pdfDoc.output('blob')
              if (pdfBlob.size > 48 * 1024 * 1024) { toast.error("El archivo sigue siendo muy pesado. Intenta seleccionar menos documentos."); setPreparingDoc(false); return }
              const pdfUrl = URL.createObjectURL(pdfBlob)
              const file = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' })
              setPdfBlobUrl(pdfUrl)
              setPdfFile(file)
          } catch (error: any) { console.error("Error PDF:", error); toast.error("Error al generar PDF: " + error.message) } finally { setPreparingDoc(false) }
      }, 1500) 
  }

  const obrasUnicas = Array.from(new Set(fichas.map(f => f.nombre_obra).filter(Boolean)))
  const filteredAndSorted = fichas.filter(f => {
      const s = searchTerm.toLowerCase()
      return (f.nombres?.toLowerCase().includes(s) || f.apellido_paterno?.toLowerCase().includes(s) || f.dni?.includes(s)) &&
             (filterObra === 'Todas' || f.nombre_obra === filterObra) &&
             (filterEstado === 'Todos' || (filterEstado === 'Completado' ? f.estado === 'completado' : f.estado !== 'completado'))
  }).sort((a, b) => {
      const nameA = `${a.apellido_paterno} ${a.nombres}`.toLowerCase();
      const nameB = `${b.apellido_paterno} ${b.nombres}`.toLowerCase();
      
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
  });

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const workerToPrint = fichas.find(f => f.id === selectedIds[0])
  
  // SEPARAR NOTIFICACIONES PARA RENDERIZAR
  const chatNotifs = notifications.filter(n => n.type === 'chat')
  const actionNotifs = notifications.filter(n => n.type === 'action')

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterObra, filterEstado])

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative font-sans">
      
      {/* MODAL DE CONFIRMACIÓN GLOBAL ADMIN TABLE */}
      <AnimatePresence>
          {confirmDialog.isOpen && (
              <ConfirmModal 
                  isOpen={confirmDialog.isOpen} 
                  onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                  title={confirmDialog.title}
                  message={confirmDialog.message}
                  confirmText={confirmDialog.confirmText}
                  confirmColor={confirmDialog.confirmColor}
                  icon={confirmDialog.icon}
                  onConfirm={confirmDialog.onConfirm}
              />
          )}
      </AnimatePresence>

      {/* CONTENEDOR OCULTO DE IMPRESIÓN */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0 overflow-hidden" style={{ zIndex: -100 }}>
          <div ref={printRef} style={{ width: 'fit-content', backgroundColor: '#ffffff', color: '#000000' }}>
              {workerToPrint && selectedDocsToPrint.map((docId) => {
                  const fichaForPrint = includeSignatures 
                      ? workerToPrint 
                      : { ...workerToPrint, firma_url: null, huella_url: null };

                  return (
                      <div key={docId} style={{ padding: 0, margin: 0, backgroundColor: '#ffffff' }}> 
                          {/* SSOMA */}
                          {docId === 'risst' && <CargoRisstPrintable ficha={fichaForPrint} />}
                          {docId === 'capacitacion' && <RegistroCapacitacionPrintable ficha={fichaForPrint} />}
                          {docId === 'induccion' && <InduccionHombreNuevoPrintable ficha={fichaForPrint} />}
                          {docId === 'epp' && <EntregaEppPrintable ficha={fichaForPrint} />}
                          {docId === 'derecho' && <ActaDerechoSaberPrintable ficha={fichaForPrint} />}
                          {docId === 'iperc' && <ActaEntregaIpercPrintable ficha={fichaForPrint} />}
                          
                          {/* RRHH */}
                          {docId === 'cargo_rit' && <CargoRitPrintable ficha={fichaForPrint} />}
                          {docId === 'cargo_politica_prevencion' && <CargoPoliticaPrevencionPrintable ficha={fichaForPrint} />}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* BARRA SUPERIOR */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
            
            <div className="relative w-full xl:w-96 group" id="tour-search">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                    <Search size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar por DNI, Nombre o Apellido..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none text-sm font-medium transition-all placeholder:text-slate-400" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                
                {/* --- NUEVO BOTÓN: GESTIÓN BENEFICIOS (18-24) --- */}
                <div className="relative">
                    <button onClick={() => setShowBirthdayDropdown(!showBirthdayDropdown)} className={`relative p-2.5 rounded-xl border transition-all ${showBirthdayDropdown ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <Cake size={18} />
                        {adultChildrenAlerts.length > 0 && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-pink-500 border-2 border-white rounded-full animate-pulse"></span>}
                    </button>
                    <AnimatePresence>
                        {showBirthdayDropdown && (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 origin-top-right">
                                <div className="p-4 border-b border-slate-100 bg-pink-50/50 flex justify-between items-center">
                                    <h4 className="font-bold text-pink-800 text-sm flex items-center gap-2"><Cake size={16}/> Gestión Beneficios (18+)</h4>
                                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-pink-600 border border-pink-200">{adultChildrenAlerts.length} Pendientes</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto bg-slate-50/50">
                                    {adultChildrenAlerts.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400"><p className="text-xs font-medium">Todo al día. No hay hijos pendientes.</p></div>
                                    ) : (
                                        adultChildrenAlerts.map((alert) => (
                                            <div key={alert.id} className="p-4 hover:bg-white transition-colors border-b border-slate-100 last:border-0 bg-white">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-800">{alert.childName}</p>
                                                            {alert.status === 'new' && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 rounded">NUEVO</span>}
                                                            {alert.status === 'waiting' && <span className={`text-[9px] font-bold px-1.5 rounded ${alert.daysWaiting > 7 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>{alert.daysWaiting > 7 ? 'DEMORADO' : 'ESPERANDO'}</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-500">Cumplió <span className="font-bold text-pink-600">{alert.childAge} años</span></p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Padre: {alert.workerName}</p>
                                                    </div>
                                                </div>

                                                {/* BARRA DE ACCIONES */}
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-2">
                                                    {alert.status === 'new' ? (
                                                        <>
                                                            <div className="text-[10px] text-slate-400 text-center italic">¿Ya solicitaste la constancia de estudios?</div>
                                                            <button 
                                                                onClick={() => updateChildStatus(alert, 'request')}
                                                                className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"
                                                            >
                                                                <CalendarClock size={12}/> SOLICITAR DOCUMENTO
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className={`text-xs text-center font-medium ${alert.daysWaiting > 7 ? 'text-red-500' : 'text-amber-600'}`}>
                                                            Esperando documentos hace {alert.daysWaiting} días
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-1 border-t border-slate-200">
                                                        <button 
                                                            onClick={() => updateChildStatus(alert, 'extend')}
                                                            className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-md hover:bg-emerald-100 flex items-center justify-center gap-1"
                                                            title="Trajo constancia: Extender beneficio"
                                                        >
                                                            <Check size={12}/> ESTUDIA (Extender)
                                                        </button>
                                                        <button 
                                                            onClick={() => updateChildStatus(alert, 'remove')}
                                                            className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-md hover:bg-red-100 flex items-center justify-center gap-1"
                                                            title="No estudia: Quitar beneficio"
                                                        >
                                                            <Ban size={12}/> NO ESTUDIA (Baja)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- CAMPANA DE NOTIFICACIONES MODIFICADA --- */}
                <div className="relative" id="tour-notifications">
                    <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className={`relative p-2.5 rounded-xl border transition-all ${showNotifDropdown ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <Bell size={18} />
                        {(chatNotifs.length + actionNotifs.length) > 0 && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
                    </button>
                    <AnimatePresence>
                        {showNotifDropdown && (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 origin-top-right">
                                {/* Cabecera Principal */}
                                <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-sm">Centro de Notificaciones</h4>
                                    <button onClick={() => setShowNotifDropdown(false)} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><X size={16} className="text-slate-400 hover:text-slate-600"/></button>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto bg-slate-50/80">
                                    
                                    {/* SECCIÓN 1: MENSAJES (Borrables) */}
                                    {chatNotifs.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2.5 bg-blue-50/90 border-b border-blue-100 flex justify-between items-center sticky top-0 backdrop-blur-md z-10 shadow-sm">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><MessageSquare size={14}/> Mensajes Recientes</span>
                                                <button onClick={handleClearChats} className="text-[10px] bg-white border border-blue-200 px-2 py-1 rounded-md text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">Limpiar</button>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                <AnimatePresence mode="popLayout">
                                                    {chatNotifs.map((notif) => {
                                                        const w = fichas.find(f => f.user_id === notif.worker_id); 
                                                        const name = w ? w.nombres.split(' ')[0] : 'Obrero';
                                                        return (
                                                            <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} key={notif.id} onClick={() => handleNotificationClick(notif)} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-inner">{name.charAt(0)}</div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex justify-between items-start">
                                                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate pr-2">{name}</p>
                                                                            <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">{notif.time}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.msg}</p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECCIÓN 2: HISTORIAL ADMIN (Permanente) */}
                                    {actionNotifs.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2.5 bg-slate-100/90 border-y border-slate-200 sticky top-0 backdrop-blur-md z-10 shadow-sm flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"><History size={14}/> Historial de Cambios</span>
                                                <button onClick={handleClearHistory} className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded-md text-slate-600 font-bold hover:bg-slate-200 transition-colors shadow-sm active:scale-95">Limpiar</button>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                <AnimatePresence mode="popLayout">
                                                    {actionNotifs.map((notif) => {
                                                        const style = getActionStyle(notif.msg);
                                                        return (
                                                            <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={notif.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default group">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`w-9 h-9 rounded-full ${style.bg} ${style.text} flex items-center justify-center text-xs font-bold shrink-0 border ${style.border} shadow-inner group-hover:scale-110 transition-transform`}>
                                                                        {style.icon}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <p className="text-sm font-bold text-slate-700 leading-tight"><span className={style.text}>{notif.user}</span> <span className="font-medium text-slate-600">{notif.msg}</span></p>
                                                                            <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-2"><Clock size={10}/> {notif.time}</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 mt-1 italic leading-relaxed border-l-2 border-slate-200 pl-2 ml-0.5">"{notif.details}"</p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {notifications.length === 0 && (
                                        <div className="p-8 text-center text-slate-400">
                                            <Bell size={24} className="mx-auto mb-2 opacity-20"/>
                                            <p className="text-xs font-medium">Sin novedades</p>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button id="tour-audio" onClick={toggleAudio} className={`relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${audioEnabled ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    {audioEnabled ? <BellRing size={16} className="animate-pulse"/> : <BellOff size={16}/>}
                    <span className="hidden sm:inline">{audioEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-50/50 p-1 rounded-xl border border-slate-200" id="tour-filters">
                    <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <select className="pl-9 pr-8 py-2 bg-transparent text-sm font-semibold text-slate-600 outline-none cursor-pointer hover:text-slate-900 transition-colors appearance-none max-w-[200px] truncate" value={filterObra} onChange={(e) => setFilterObra(e.target.value)}>
                            <option value="Todas">Todas las Obras</option>
                            {Array.from(new Set(fichas.map(f => f.nombre_obra).filter(Boolean))).map((obra: any) => <option key={obra} value={obra}>{obra}</option>)}
                        </select>
                    </div>
                    <div className="w-[1px] h-5 bg-slate-200"></div>
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <select className="pl-9 pr-8 py-2 bg-transparent text-sm font-semibold text-slate-600 outline-none cursor-pointer hover:text-slate-900 transition-colors appearance-none" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}><option value="Todos">Todos los Estados</option><option value="Completado">✅ Completados</option><option value="Pendiente">⏳ Pendientes</option></select>
                    </div>
                </div>
                
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div initial={{opacity:0, scale:0.9, x: 20}} animate={{opacity:1, scale:1, x: 0}} exit={{opacity:0, scale:0.9, x: 20}} className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl shadow-xl shadow-slate-900/20" id="tour-bulk-actions">
                            <span className="text-xs font-bold text-slate-400 px-2">{selectedIds.length}</span><div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
                            
                            {/* NUEVO BOTÓN: ABRIR FICHAS (MASIVO) */}
                            <button onClick={handleBulkOpenFichas} disabled={openingFichas} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors" title="Abrir Fichas (Pendiente)">
                                {openingFichas ? <Loader2 className="animate-spin" size={14}/> : <Unlock size={14}/>} <span className="hidden sm:inline">ABRIR FICHAS</span>
                            </button>

                            <button onClick={handleMoveToCesados} disabled={cessing} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors" title="Dar de Baja Definitiva">
                                {cessing ? <Loader2 className="animate-spin" size={14}/> : <UserX size={14}/>} <span className="hidden sm:inline">DAR DE BAJA</span>
                            </button>

                            <button onClick={handleMoveToSctr} disabled={movingSctr} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors" title="Mover a SCTR">
                                {movingSctr ? <Loader2 className="animate-spin" size={14}/> : <ShieldCheck size={14}/>} <span className="hidden sm:inline">A SCTR</span>
                            </button>

                            <button onClick={handleMoveToVidaLey} disabled={moving} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors" title="Mover a Vida Ley">
                                {moving ? <Loader2 className="animate-spin" size={14}/> : <ArrowRightCircle size={14}/>} <span className="hidden sm:inline">A VIDA LEY</span>
                            </button>

                            <button onClick={handleExportVidaLey} disabled={exporting} className="p-2 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-lg transition-colors" title="Exportar Vida Ley (Excel Directo)">
                                {exporting ? <Loader2 className="animate-spin" size={16}/> : <FileSpreadsheet size={16}/>}
                            </button>

                            <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>

                            <button onClick={handleOpenDocSelector} disabled={preparingDoc} className="p-2 text-white hover:bg-slate-700 rounded-lg transition-colors" title="Imprimir Selección">{preparingDoc ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>}</button>
                            <button onClick={handleBulkDelete} disabled={deleting} className="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors" title="Eliminar Selección">{deleting ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>}</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="flex-1 overflow-auto bg-white min-h-[500px]">
        {/* Aquí la clave: table-fixed para que respete los anchos de columna */}
        <table className="w-full min-w-max text-left border-collapse table-fixed">
            <thead className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100">
                <tr>
                    <th className="px-4 py-3 w-12 text-center"><button onClick={() => handleSelectAll(filteredAndSorted)} className="text-slate-300 hover:text-blue-600 transition-colors">{selectedIds.length > 0 && selectedIds.length === filteredAndSorted.length ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</button></th>
                    
                    {/* COLABORADOR - ANCHO FIJO */}
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[25%]">Colaborador</th>
                    
                    {/* UBICACIÓN - ANCHO FIJO */}
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[20%]">Ubicación / Cargo</th>
                    
                    {/* NUEVAS COLUMNAS - ANCHOS FIJOS */}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[15%]">Estado Ficha</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[15%]">Confirmación</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[10%]">Biometría</th>
                    
                    {/* ACCIONES - ANCHO FIJO CRUCIAL */}
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[140px]">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {loading ? (
                    <tr><td colSpan={7} className="p-24 text-center"><div className="flex flex-col items-center gap-4"><div className="p-4 bg-blue-50 rounded-full"><Loader2 className="animate-spin text-blue-600" size={32}/></div><p className="font-medium text-slate-500 animate-pulse">Sincronizando base de datos...</p></div></td></tr>
                ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={7} className="p-24 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><div className="p-4 bg-slate-50 rounded-full"><Search size={32} className="text-slate-300"/></div><p>No se encontraron resultados.</p></div></td></tr>
                ) : paginatedData.map((ficha, index) => (
                    <motion.tr 
                        key={ficha.id} 
                        id={index === 0 ? "tour-row-0" : undefined} 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: index * 0.02 }} 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLTableRowElement>, ficha)}
                        className={`group hover:bg-slate-50/80 transition-colors cursor-move active:cursor-grabbing ${selectedIds.includes(ficha.id) ? 'bg-blue-50/30' : ''}`} 
                        onClick={() => setSelectedFicha(ficha)}
                    >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => handleSelectOne(ficha.id)} className="text-slate-300 hover:text-blue-600 transition-colors">{selectedIds.includes(ficha.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</button></td>
                        
                        {/* COLABORADOR - TRUNCATE PARA QUE NO SE SALGA */}
                        <td className="px-4 py-3 overflow-hidden">
                            <div className="flex items-center gap-4 max-w-full">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 shadow-sm shrink-0 uppercase relative">{ficha.nombres?.charAt(0)}{ficha.apellido_paterno?.charAt(0)}<span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span></div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">{ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}</p>
                                    <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ficha.dni}</span></div>
                                </div>
                            </div>
                        </td>

                        {/* UBICACIÓN - TRUNCATE Y TOOLTIP */}
                        <td className="px-4 py-3 overflow-hidden">
                            <div className="flex flex-col gap-1 max-w-full">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 w-full" title={ficha.nombre_obra}>
                                    <Building2 size={13} className="text-slate-400 shrink-0"/>
                                    <span className="truncate block w-full">{ficha.nombre_obra || 'Sin Obra'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full">
                                    <HardHat size={13} className="text-slate-400 shrink-0"/>
                                    <span className="truncate block w-full capitalize">{ficha.cargo || 'Sin Cargo'}</span>
                                </div>
                            </div>
                        </td>
                        
                        {/* ESTADO */}
                        <td className="px-4 py-3 text-center">
                            {ficha.estado === 'completado' ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                    <CheckCircle size={14} /> COMPLETADO
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                                     <Loader2 size={14} className="animate-spin" /> PENDIENTE
                                </div>
                            )}
                        </td>

                        {/* CONFIRMACIÓN */}
                        <td className="px-4 py-3 text-center">
                            {ficha.email_confirmed_at ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm cursor-help whitespace-nowrap" title={`Confirmado el: ${new Date(ficha.email_confirmed_at).toLocaleString()}`}>
                                            <MailCheck size={14}/> RECIBIDO
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleResetConfirmation(ficha.id); }}
                                        className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-200 transition-colors"
                                        title="Resetear a Pendiente"
                                    >
                                        <RotateCcw size={12}/>
                                    </button>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-sm opacity-70 whitespace-nowrap">
                                    <Clock size={14}/> PENDIENTE
                                </div>
                            )}
                        </td>
                        
                        {/* BIOMETRÍA */}
                        <td className="px-4 py-3"><div className="flex items-center justify-center gap-3"><div className={`p-2 rounded-lg border transition-all ${ficha.firma_url ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title={ficha.firma_url ? "Firma Registrada" : "Falta Firma"}><PenTool size={14}/></div><div className={`p-2 rounded-lg border transition-all ${ficha.huella_url ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title={ficha.huella_url ? "Huella Registrada" : "Falta Huella"}><Fingerprint size={14}/></div></div></td>
                        
                        {/* ACCIONES */}
                        <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2">
                                    {onOpenChat && (
                                        <button onClick={(e) => { e.stopPropagation(); handleChatClick(ficha) }} className="relative p-2.5 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-xl transition-all active:scale-95" title="Chat con trabajador">
                                            <MessageSquare size={16} />
                                            {unreadCounts[ficha.user_id] > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">{unreadCounts[ficha.user_id]}</span>)}
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedFicha(ficha) }} className="p-2.5 text-slate-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all active:scale-95" title="Editar Ficha"><Edit3 size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(ficha) }} className="p-2.5 text-slate-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-all active:scale-95" title="Descargar PDF"><Download size={16}/></button>
                                </div>
                            </div>
                        </td>
                    </motion.tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- DRAWER Y MODALES --- */}
      <AnimatePresence>{selectedFicha && (<FichaDrawer ficha={selectedFicha} onClose={() => setSelectedFicha(null)} onUpdate={fetchFichas} onDelete={handleDeleteLocal} onDownload={() => handleDownloadPDF(selectedFicha)} downloading={downloadingPdf} onPrintPreview={(img) => setPrintImage(img)} onNotifyChange={emitAdminAction} />)}</AnimatePresence>

      <AnimatePresence>
        {showDocSelector && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setShowDocSelector(false)}>
                <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Printer className="text-blue-600" size={20}/> Centro de Impresión</h3><p className="text-xs text-slate-500 mt-1">Selecciona los documentos para generar el legajo.</p></div>
                        <button onClick={() => setShowDocSelector(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-400"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        
                        {/* SELECTOR DE MODO DE IMPRESIÓN */}
                        <div className="mb-6">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Modo de Impresión</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div onClick={() => setIncludeSignatures(false)} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${!includeSignatures ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <div className="flex justify-center mb-2 text-slate-600"><PenTool size={24} className={!includeSignatures ? 'text-blue-600' : 'text-slate-400'}/></div>
                                    <div className="text-center"><div className={`text-sm font-bold ${!includeSignatures ? 'text-blue-700' : 'text-slate-600'}`}>Firma Manual</div><div className="text-[10px] text-slate-400 mt-1">Imprimir sin firmas.</div></div>
                                    {!includeSignatures && <div className="absolute top-2 right-2 text-blue-600"><CheckCircle size={16}/></div>}
                                </div>
                                <div onClick={() => setIncludeSignatures(true)} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${includeSignatures ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <div className="flex justify-center mb-2 text-slate-600"><ScanFace size={24} className={includeSignatures ? 'text-indigo-600' : 'text-slate-400'}/></div>
                                    <div className="text-center"><div className={`text-sm font-bold ${includeSignatures ? 'text-indigo-700' : 'text-slate-600'}`}>Biometría Digital</div><div className="text-[10px] text-slate-400 mt-1">Usar firmas escaneadas.</div></div>
                                    {includeSignatures && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircle size={16}/></div>}
                                </div>
                            </div>
                        </div>

                        {/* LISTA DE DOCUMENTOS SSOMA */}
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documentación SSOMA</span>
                            <button onClick={() => toggleSelectAllDocs(SSOMA_DOCS)} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">Seleccionar Todo</button>
                        </div>
                        <div className="space-y-2 mb-6">
                            {SSOMA_DOCS.map((doc) => (
                                <label key={doc.id} className={`flex items-start gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${selectedDocsToPrint.includes(doc.id) ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedDocsToPrint.includes(doc.id) ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-300'}`}>{selectedDocsToPrint.includes(doc.id) && <CheckSquare size={12} className="text-white"/>}</div>
                                    <input type="checkbox" className="hidden" checked={selectedDocsToPrint.includes(doc.id)} onChange={() => toggleDocSelection(doc.id)}/>
                                    <div><div className="font-bold text-slate-800 text-sm">{doc.label}</div><div className="text-xs text-slate-400 mt-0.5">{doc.desc}</div></div>
                                </label>
                            ))}
                        </div>

                        {/* LISTA DE DOCUMENTOS RRHH (NUEVO) */}
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documentación RRHH</span>
                            <button onClick={() => toggleSelectAllDocs(RRHH_DOCS)} className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded-md transition-colors">Seleccionar Todo</button>
                        </div>
                        <div className="space-y-2 mb-6">
                            {RRHH_DOCS.map((doc) => (
                                <label key={doc.id} className={`flex items-start gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${selectedDocsToPrint.includes(doc.id) ? 'border-purple-500 bg-purple-50/50 shadow-sm ring-1 ring-purple-500/20' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedDocsToPrint.includes(doc.id) ? 'bg-purple-600 border-purple-600 scale-110' : 'bg-white border-slate-300'}`}>{selectedDocsToPrint.includes(doc.id) && <CheckSquare size={12} className="text-white"/>}</div>
                                    <input type="checkbox" className="hidden" checked={selectedDocsToPrint.includes(doc.id)} onChange={() => toggleDocSelection(doc.id)}/>
                                    <div><div className="font-bold text-slate-800 text-sm">{doc.label}</div><div className="text-xs text-slate-400 mt-0.5">{doc.desc}</div></div>
                                </label>
                            ))}
                        </div>

                        <button 
                            onClick={handleGenerateCombinedDocs}
                            disabled={selectedDocsToPrint.length === 0 || preparingDoc}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
                        >
                            {preparingDoc ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}
                            {preparingDoc ? 'Procesando PDF...' : `Generar PDF Unificado (${selectedDocsToPrint.length})`}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfBlobUrl && (
            <PdfPreviewModal 
                pdfUrl={pdfBlobUrl} 
                pdfFile={pdfFile} 
                workerName={workerToPrint ? `${workerToPrint.nombres.split(' ')[0]} ${workerToPrint.apellido_paterno}` : ''} 
                workerId={workerToPrint?.id}
                onClose={() => { setPdfBlobUrl(null); setPdfFile(null) }} 
            />
        )}
      </AnimatePresence>
      <AnimatePresence>{printImage && (<PrintPreviewModal image={printImage} onClose={() => setPrintImage(null)} />)}</AnimatePresence>
    </div>
  )
}

function FichaDrawer({ ficha, onClose, onUpdate, onDelete, onDownload, downloading, onPrintPreview, onNotifyChange }: FichaDrawerProps & { onNotifyChange?: (a:string, d:string)=>void }) {
    const [isEditing, setIsEditing] = useState(false)
    const supabase = createClient()
    const [formData, setFormData] = useState<any>(() => ({
        ...ficha,
        esposa_datos: ficha.esposa ? JSON.parse(ficha.esposa) : { paterno: '', materno: '', nombres: '', dni: '' },
        hijos_datos: ficha.hijos ? JSON.parse(ficha.hijos) : []
    }))
    const [saving, setSaving] = useState(false)
    const [loadingAction, setLoadingAction] = useState(false)

    // ESTADO DEL MODAL DE CONFIRMACIÓN EN EL DRAWER
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean; title: string; message: string; confirmText: string; confirmColor: string; icon: any; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', confirmText: 'Aceptar', confirmColor: 'bg-blue-600', icon: null, onConfirm: () => {} });

    useEffect(() => {
        let esposaObj = { paterno: '', materno: '', nombres: '', dni: '' }
        let hijosArr: any[] = []
        try { esposaObj = ficha.esposa ? JSON.parse(ficha.esposa) : esposaObj } catch(e) {}
        try { hijosArr = ficha.hijos ? JSON.parse(ficha.hijos) : [] } catch(e) {}
        setFormData({ ...ficha, esposa_datos: esposaObj, hijos_datos: hijosArr })
    }, [ficha])
    const handleSave = async () => {
        setSaving(true)
        const payload = { ...formData, esposa: JSON.stringify(formData.esposa_datos), hijos: JSON.stringify(formData.hijos_datos) }
        delete payload.esposa_datos; delete payload.hijos_datos; const cleaned = { ...payload }; delete cleaned.profiles 
        Object.keys(cleaned).forEach(k => { if(cleaned[k] === '') cleaned[k] = null })
        const { error } = await supabase.from('fichas').update(cleaned).eq('id', ficha.id)
        setSaving(false)
        if (error) toast.error("Error al guardar: " + error.message)
        else { 
            toast.success("Datos actualizados")
            if(onNotifyChange) onNotifyChange("editó", `Datos de ${ficha.nombres}`)
            setIsEditing(false)
            onUpdate() 
        }
    }
    const handleChangeStatus = async (newStatus: 'pendiente' | 'completado') => {
        setLoadingAction(true)
        try {
            const { error } = await supabase.from('fichas').update({ estado: newStatus }).eq('id', ficha.id)
            if (error) throw error
            if(newStatus === 'pendiente') toast.success("Ficha ABIERTA para edición")
            else toast.success("Ficha CERRADA y Validada")
            if(onNotifyChange) onNotifyChange(newStatus === 'completado' ? 'validó' : 'reabrió', `Ficha de ${ficha.nombres}`)
            onUpdate(); onClose()
        } catch (error: any) { toast.error("Error: " + error.message) } finally { setLoadingAction(false) }
    }
    const handleDeleteDoc = async (field: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Documento',
            message: '¿Estás seguro de eliminar este documento adjunto?\n\nEsta acción no se puede deshacer y el archivo se perderá.',
            confirmText: 'Eliminar',
            confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
            icon: <Trash2 className="text-red-500" size={32}/>,
            onConfirm: async () => {
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                const { error } = await supabase.from('fichas').update({ [field]: null }).eq('id', ficha.id)
                if (error) toast.error("Error al eliminar")
                else {
                    toast.success("Documento eliminado")
                    setFormData((prev: any) => ({ ...prev, [field]: null }))
                    onUpdate() 
                }
            }
        });
    }
    const handleEsposaChange = (field: string, val: string) => setFormData((prev:any) => ({ ...prev, esposa_datos: { ...prev.esposa_datos, [field]: val } }))
    const addHijo = () => setFormData((prev:any) => ({ ...prev, hijos_datos: [...prev.hijos_datos, { paterno: '', materno: '', nombres: '', fecha_nacimiento: '' }] }))
    const removeHijo = (idx: number) => setFormData((prev:any) => ({ ...prev, hijos_datos: prev.hijos_datos.filter((_:any, i:number) => i !== idx) }))
    const handleHijoChange = (idx: number, field: string, val: string) => {
        const newHijos = [...formData.hijos_datos]; newHijos[idx] = { ...newHijos[idx], [field]: val }
        setFormData((prev:any) => ({ ...prev, hijos_datos: newHijos }))
    }
    const handleAdminDocUpload = async (file: File, fieldName: string) => {
        if (!file) return
        const toastId = toast.loading("Subiendo documento...")
        try {
            const fileExt = file.name.split('.').pop() || 'pdf'
            const fileName = `admin_upload_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('documentos').upload(fileName, file)
            if(uploadError) throw uploadError
            const { data } = supabase.storage.from('documentos').getPublicUrl(fileName)
            setFormData((prev: any) => ({ ...prev, [fieldName]: data.publicUrl }))
            toast.success("Documento subido (Guardar cambios para confirmar)", { id: toastId })
        } catch(e) {
            toast.error("Error al subir", { id: toastId })
        }
    }
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-white/20 relative" onClick={e => e.stopPropagation()}>
                
                {/* MODAL DE CONFIRMACIÓN DEL DRAWER */}
                <AnimatePresence>
                    {confirmDialog.isOpen && (
                        <ConfirmModal 
                            isOpen={confirmDialog.isOpen} 
                            onClose={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                            title={confirmDialog.title}
                            message={confirmDialog.message}
                            confirmText={confirmDialog.confirmText}
                            confirmColor={confirmDialog.confirmColor}
                            icon={confirmDialog.icon}
                            onConfirm={confirmDialog.onConfirm}
                        />
                    )}
                </AnimatePresence>

                <div id="drawer-header" className="h-24 px-8 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldCheck size={120} /></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-slate-900/20 uppercase">
                            {ficha.nombres.charAt(0)}{ficha.apellido_paterno.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-2xl leading-none tracking-tight">{ficha.nombres}</h2>
                            <p className="font-medium text-slate-500 text-lg">{ficha.apellido_paterno}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">{ficha.dni}</span>
                        </div>
                    </div>
                    <button id="drawer-close-btn" onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors relative z-10 text-slate-500"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 scroll-smooth">
                    <div id="drawer-actions-top" className="flex gap-3 sticky top-0 z-10 pb-4 bg-slate-50/95 backdrop-blur-sm pt-2">
                        <button onClick={onDownload} disabled={downloading} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 active:scale-95">{downloading ? <Loader2 className="animate-spin" size={16}/> : <><Download size={16}/> Descargar PDF</>}</button>
                        <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 flex items-center justify-center gap-2 border py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${isEditing ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'}`}>{isEditing ? 'Cancelar Edición' : 'Editar Datos'}</button>
                    </div>
                    <div id="drawer-info-section">
                        <Section title="Información Personal" icon={<User size={18}/>}>
                            <Grid>
                                <Field label="Apellido Paterno" name="apellido_paterno" val={formData.apellido_paterno} edit={isEditing} set={setFormData}/>
                                <Field label="Apellido Materno" name="apellido_materno" val={formData.apellido_materno} edit={isEditing} set={setFormData}/>
                                <Field label="Nombres" name="nombres" val={formData.nombres} edit={isEditing} set={setFormData}/>
                                <Field label="F. Nacimiento" name="fecha_nacimiento" val={formData.fecha_nacimiento} edit={isEditing} set={setFormData} type="date"/>
                                <Field label="DNI" name="dni" val={formData.dni} edit={isEditing} set={setFormData}/>
                                <Field label="Dirección" name="direccion" val={formData.direccion} edit={isEditing} set={setFormData} full/>
                                <Field label="Distrito" name="distrito" val={formData.distrito} edit={isEditing} set={setFormData}/>
                                <Field label="Provincia" name="provincia" val={formData.provincia} edit={isEditing} set={setFormData}/>
                                <Field label="Correo Electrónico" name="correo" val={formData.correo} edit={isEditing} set={setFormData}/>
                                <Field label="Celular" name="celular" val={formData.celular} edit={isEditing} set={setFormData}/>
                            </Grid>
                        </Section>
                        <Section title="Familia" icon={<Users size={18}/>}>
                             <div className="mb-4 pb-4 border-b border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 mb-2">ESPOSA / CONVIVIENTE</h4>
                                <Grid>
                                    <Field label="Nombres" val={formData.esposa_datos?.nombres || ''} edit={isEditing} customChange={(v:any)=>handleEsposaChange('nombres', v)} />
                                    <Field label="DNI" val={formData.esposa_datos?.dni || ''} edit={isEditing} customChange={(v:any)=>handleEsposaChange('dni', v)} />
                                    <Field label="Ap. Paterno" val={formData.esposa_datos?.paterno || ''} edit={isEditing} customChange={(v:any)=>handleEsposaChange('paterno', v)} />
                                    <Field label="Ap. Materno" val={formData.esposa_datos?.materno || ''} edit={isEditing} customChange={(v:any)=>handleEsposaChange('materno', v)} />
                                </Grid>
                             </div>
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-500">HIJOS ({formData.hijos_datos?.length || 0})</h4>
                                    {isEditing && <button onClick={addHijo} className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded flex items-center gap-1"><Plus size={10}/> Add</button>}
                                </div>
                                {formData.hijos_datos?.map((h:any, i:number) => (
                                    <div key={i} className="mb-3 p-3 bg-slate-100 rounded-lg relative group">
                                            {isEditing && <button onClick={()=>removeHijo(i)} className="absolute top-1 right-1 text-slate-400 hover:text-red-500"><X size={14}/></button>}
                                            <Grid>
                                                <Field label="Nombres" val={h.nombres} edit={isEditing} customChange={(v:any)=>handleHijoChange(i, 'nombres', v)} />
                                                <Field label="F. Nacimiento" val={h.fecha_nacimiento} edit={isEditing} type="date" customChange={(v:any)=>handleHijoChange(i, 'fecha_nacimiento', v)} />
                                                <Field label="Ap. Paterno" val={h.paterno} edit={isEditing} customChange={(v:any)=>handleHijoChange(i, 'paterno', v)} />
                                                <Field label="Ap. Materno" val={h.materno} edit={isEditing} customChange={(v:any)=>handleHijoChange(i, 'materno', v)} />
                                            </Grid>
                                    </div>
                                ))}
                             </div>
                        </Section>
                        <Section title="Sistema de Pensiones" icon={<ShieldCheck size={18}/>}>
                            <Grid>
                                <Field label="Régimen" name="sistema_pension" val={formData.sistema_pension} edit={isEditing} set={setFormData}/>
                                <Field label="Nombre AFP" name="afp_nombre" val={formData.afp_nombre} edit={isEditing} set={setFormData}/>
                                <Field label="CUSPP" name="cuspp" val={formData.cuspp} edit={isEditing} set={setFormData}/>
                            </Grid>
                        </Section>
                        <Section title="Datos Bancarios" icon={<Wallet size={18}/>}>
                            <Grid>
                                <Field label="Banco" name="banco" val={formData.banco} edit={isEditing} set={setFormData}/>
                                <Field label="N° Cuenta" name="numero_cuenta" val={formData.numero_cuenta} edit={isEditing} set={setFormData}/>
                                <Field label="CCI" name="cci" val={formData.cci} edit={isEditing} set={setFormData}/>
                            </Grid>
                        </Section>
                        <Section title="Información Laboral" icon={<HardHat size={18}/>}>
                            <Grid>
                                <Field label="Categoría" name="categoria" val={formData.categoria} edit={isEditing} set={setFormData}/>
                                <Field label="Cargo" name="cargo" val={formData.cargo} edit={isEditing} set={setFormData}/>
                                <Field label="Fecha Ingreso" name="fecha_ingreso" val={formData.fecha_ingreso} edit={isEditing} set={setFormData} type="date"/>
                                <Field label="Obra" name="nombre_obra" val={formData.nombre_obra} edit={isEditing} set={setFormData}/>
                            </Grid>
                        </Section>
                        <Section title="Educación" icon={<GraduationCap size={18}/>}>
                            <Grid>
                                <Field label="Nivel" name="nivel_educacion" val={formData.nivel_educacion} edit={isEditing} set={setFormData}/>
                                <Field label="Carrera" name="carrera" val={formData.carrera} edit={isEditing} set={setFormData}/>
                                <Field label="Institución" name="universidad" val={formData.universidad} edit={isEditing} set={setFormData} full/>
                            </Grid>
                        </Section>
                        <Section title="Emergencia" icon={<HeartPulse size={18}/>}>
                            <Grid>
                                <Field label="Nombre Contacto" name="emergencia_nombre" val={formData.emergencia_nombre} edit={isEditing} set={setFormData}/>
                                <Field label="Parentesco" name="emergencia_relacion" val={formData.emergencia_relacion} edit={isEditing} set={setFormData}/>
                                <Field label="Teléfono" name="emergencia_celular" val={formData.emergencia_celular} edit={isEditing} set={setFormData}/>
                            </Grid>
                        </Section>
                        <Section title="Documentos Adjuntos" icon={<FileBadge size={18}/>}>
                            <div className="grid grid-cols-2 gap-4">
                                <DocCard label="DNI (Frontal y Reverso)" url={formData.url_dni_frontal} onDelete={() => handleDeleteDoc('url_dni_frontal')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_dni_frontal')} />
                                <DocCard label="Carnet RETCC" url={formData.url_carnet} onDelete={() => handleDeleteDoc('url_carnet')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_carnet')} />
                                <DocCard label="Antecedentes" url={formData.url_antecedentes} onDelete={() => handleDeleteDoc('url_antecedentes')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_antecedentes')} />
                                <DocCard label="Ant. Policiales" url={formData.url_policiales} onDelete={() => handleDeleteDoc('url_policiales')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_policiales')} />
                                <DocCard label="Ant. Penales" url={formData.url_penales} onDelete={() => handleDeleteDoc('url_penales')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_penales')} />
                                <DocCard label="Acta Matrimonio" url={formData.url_acta_matrimonio} onDelete={() => handleDeleteDoc('url_acta_matrimonio')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_acta_matrimonio')} />
                                <DocCard label="DNI Esposa" url={formData.url_esposa_dni} onDelete={() => handleDeleteDoc('url_esposa_dni')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_esposa_dni')} />
                                <DocCard label="DNI Hijos" url={formData.url_hijos_dni} onDelete={() => handleDeleteDoc('url_hijos_dni')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_hijos_dni')} />
                                <DocCard label="Partida Nac. Hijos" url={formData.url_hijos_nacimiento} onDelete={() => handleDeleteDoc('url_hijos_nacimiento')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_hijos_nacimiento')} />
                                <DocCard label="Estudios Hijos" url={formData.url_constancia_estudios} onDelete={() => handleDeleteDoc('url_constancia_estudios')} isEditing={isEditing} onUpload={(f:File)=>handleAdminDocUpload(f, 'url_constancia_estudios')} />
                            </div>
                        </Section>
                        <Section title="Firma Registrada" icon={<PenTool size={18}/>}>
                             <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 flex justify-center">
                                {formData.url_firma ? (
                                    <img src={formData.url_firma} alt="Firma" className="max-h-24 object-contain" />
                                ) : <span className="text-slate-400 text-xs">Sin firma registrada</span>}
                             </div>
                        </Section>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                    {ficha.estado === 'completado' ? (
                        <button onClick={() => handleChangeStatus('pendiente')} disabled={loadingAction} className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors active:scale-95">
                            {loadingAction ? <Loader2 className="animate-spin" size={18}/> : <><Unlock size={18}/> REABRIR FICHA</>}
                        </button>
                    ) : (
                        <button onClick={() => handleChangeStatus('completado')} disabled={loadingAction} className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg active:scale-95">
                            {loadingAction ? <Loader2 className="animate-spin" size={18}/> : <><Lock size={18}/> VALIDAR Y CERRAR</>}</button>
                    )}
                    {isEditing && (
                        <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors active:scale-95">
                            {saving ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> GUARDAR CAMBIOS</>}</button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

function PdfPreviewModal({ pdfUrl, pdfFile, workerName, workerId, onClose }: { pdfUrl: string, pdfFile: File | null, workerName: string, workerId?: string, onClose: () => void }) {
    const supabase = createClient()
    const [recipientEmail, setRecipientEmail] = useState('')
    const [myEmail, setMyEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'uploading' | 'ready'>('idle')
    const [emlUrl, setEmlUrl] = useState<string | null>(null)

    const handleShareWhatsApp = async () => {
        if (!pdfFile) return
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
        if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) { try { await navigator.share({ files: [pdfFile], title: 'Documentos SSOMA' }); return } catch (e) { console.warn(e) } }
        const link = document.createElement('a'); link.href = pdfUrl; link.download = pdfFile.name; link.target = "_blank"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setTimeout(() => { window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, adjunto los documentos de *${workerName}*.`)}`, '_blank') }, 1000)
    }

    const prepareOutlookData = async () => {
        if (!recipientEmail || !recipientEmail.includes('@')) { toast.error("Falta el correo del obrero."); return; }
        if (!myEmail || !myEmail.includes('@')) { toast.error("Escribe tu correo para recibir la confirmación."); return; }
        
        setStatus('uploading');
        const toastId = toast.loading("Preparando...");

        try {
            const fileName = `legajo_${workerId || 'temp'}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage.from('documentos_temporales').upload(fileName, pdfFile as File);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documentos_temporales').getPublicUrl(fileName);
            const confirmLink = `${window.location.origin}/api/confirm-receipt?id=${workerId}&doc=legajo&admin_email=${encodeURIComponent(myEmail)}`;

            const subject = `Documentación Laboral - ${workerName}`;
            const body = 
`Estimado(a) colaborador(a):

Se adjunta el enlace para descargar su documentación laboral.

1. DESCARGAR DOCUMENTOS:
${publicUrl}

--------------------------------------------------
IMPORTANTE:
Por favor, confirme la recepción haciendo clic aquí:

2. CONFIRMAR RECEPCIÓN:
${confirmLink}
--------------------------------------------------

Atentamente,
RUAG System`;

            const emlContent = `To: ${recipientEmail}
Subject: ${subject}
X-Unsent: 1
Content-Type: text/plain; charset=UTF-8

${body}`;
            
            const blob = new Blob([emlContent], { type: 'message/rfc822' });
            const url = URL.createObjectURL(blob);
            setEmlUrl(url);

            setStatus('ready');
            toast.dismiss(toastId);
            toast.success("Listo.");

        } catch (error: any) {
            console.error(error);
            setStatus('idle');
            toast.error("Error: " + (error.message || "Verifica storage"), { id: toastId });
        }
    }

    const downloadAndOpenOutlook = () => {
        if (!emlUrl) return;
        const link = document.createElement('a'); link.href = emlUrl; link.download = `Enviar_a_${workerName.split(' ')[0]}.eml`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                
                <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileCheck size={24} className="text-emerald-500"/> Vista Previa</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <div className="flex-1 bg-slate-100 relative">
                    <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />
                </div>
                
                <div className="p-5 border-t bg-white flex flex-col gap-4 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Para (Obrero):</label>
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100"><Mail className="text-slate-400 ml-2" size={18}/><input type="email" placeholder="obrero@correo.com" className="flex-1 bg-transparent outline-none text-sm text-slate-700 font-medium" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} disabled={status !== 'idle'}/></div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Recibir confirmación en:</label>
                            <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-300"><div className="bg-indigo-200 text-indigo-700 p-1 rounded-md"><Zap size={14}/></div><input type="email" placeholder="ejemplo@tuempresa.com" className="flex-1 bg-transparent outline-none text-sm text-indigo-900 font-bold" value={myEmail} onChange={(e) => setMyEmail(e.target.value)} disabled={status !== 'idle'}/></div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button onClick={onClose} className="px-6 py-3.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cerrar</button>
                        <button onClick={handleShareWhatsApp} className="flex-1 py-3.5 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"><Share2 size={20}/> WhatsApp</button>
                        {status === 'idle' && (<button onClick={prepareOutlookData} disabled={!recipientEmail || !myEmail} className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"><Monitor size={20}/> Preparar Outlook</button>)}
                        {status === 'uploading' && (<button disabled className="flex-1 py-3.5 rounded-xl font-bold bg-blue-400 text-white flex items-center justify-center gap-2 cursor-wait"><Loader2 className="animate-spin" size={20}/> Generando...</button>)}
                        {status === 'ready' && (<button onClick={downloadAndOpenOutlook} className="flex-1 py-3.5 rounded-xl font-bold bg-blue-700 text-white hover:bg-blue-800 shadow-lg flex items-center justify-center gap-2 animate-pulse"><Download size={20}/> ABRIR OUTLOOK</button>)}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function Section({title, icon, children}: any) { return <div className="space-y-4 pt-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-slate-50"><span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</span> {title}</h3><div className="">{children}</div></div> }
function Grid({children}: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">{children}</div> }
function Field({label, name, val, edit, set, full, customChange, type="text"}: any) { return <div className={full ? 'md:col-span-2' : ''}><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide ml-1">{label}</label>{edit ? <input type={type} value={val||''} onChange={customChange ? (e)=>customChange(e.target.value) : (e)=>set((p:any)=>({...p,[name]:e.target.value}))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm font-medium text-slate-700"/> : <div className="font-medium text-slate-800 text-sm border-b border-slate-100 py-1.5 px-1 truncate min-h-[32px]">{val||<span className="text-slate-300 italic">Sin datos</span>}</div>}</div>}
function DocCard({label, url, onDelete, isEditing, onUpload}: any) { const fileRef = useRef<HTMLInputElement>(null); if(!url && !isEditing) return <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl opacity-60"><div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center"><FileText size={18}/></div><span className="text-xs font-bold text-slate-400">Sin archivo</span></div>; return (<div className="relative group">{url ? (<a href={url} target="_blank" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer active:scale-95"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm"><FileText size={20}/></div><span className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-700 pr-6">{label}</span></a>) : (<div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl border-dashed"><span className="text-xs font-bold text-slate-400">{label} (Vacío)</span></div>)}<div className="absolute top-2 right-2 flex gap-1">{isEditing && (<><input type="file" ref={fileRef} className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} /><button onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }} className="p-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-all z-10" title="Subir/Cambiar Archivo"><UploadCloud size={14}/></button></>)}{onDelete && isEditing && url && (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="p-1.5 bg-white border border-red-100 text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-all z-10" title="Eliminar documento"><Trash2 size={14}/></button>)}</div></div>) }

function PrintPreviewModal({ image, onClose }: { image: string, onClose: () => void }) {
    const handlePrint = () => { const iframe = document.createElement('iframe'); iframe.style.position = 'absolute'; iframe.width='0'; iframe.height='0'; iframe.style.border='none'; document.body.appendChild(iframe); const doc = iframe.contentWindow?.document; if (doc) { doc.open(); doc.write(`<html><body onload="window.print()"><img src="${image}" style="width:100%"/></body></html>`); doc.close(); setTimeout(() => document.body.removeChild(iframe), 5000); } };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}><div className="p-5 border-b flex justify-between items-center bg-white"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Printer size={20} className="text-blue-600"/> Vista Previa</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-8 bg-slate-50 flex justify-center"><div className="bg-white shadow-xl p-2 rounded-lg border border-slate-100"><img src={image} className="w-full h-auto max-w-[300px] object-contain" /></div></div><div className="p-5 border-t bg-white flex gap-3"><button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button><button onClick={handlePrint} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"><Printer size={18}/> Imprimir</button></div></motion.div></motion.div>) 
}

// --- NUEVO MODAL DE CONFIRMACIÓN PERSONALIZADO ---
function ConfirmModal({ isOpen, onClose, title, message, confirmText, confirmColor, icon, onConfirm }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full bg-slate-50 border border-slate-100 shadow-sm`}>
                        {icon || <AlertCircle size={32} className="text-amber-500" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">{message}</p>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 ${confirmColor}`}>{confirmText}</button>
                </div>
            </motion.div>
        </div>
    )
}