import {
  ArrowLeftRight, BadgeCheck, Camera, Images, Mic, Paperclip, Video, Volume2, VolumeX, Baby, Bell, Briefcase, Building, Building2, CalendarClock,
  ChartColumn, Circle, CircleCheck, CircleUser, ClipboardCheck, ClipboardList, Contact,
  FileDown, FilePen, FileSearch, FileSpreadsheet, FileUp, Files, Fingerprint, FolderArchive,
  FolderOpen, GraduationCap, HardHat, Heart, HeartHandshake, HeartPulse, IdCard, KeyRound,
  Landmark, LayoutDashboard, LifeBuoy, ListFilter, LoaderCircle, Lock, LogOut, Mail,
  MessageCircle, MessagesSquare, Pencil, PenLine, Phone, PhoneCall, Presentation, Printer,
  RotateCcw, ShieldCheck, Sparkles, Stethoscope, UserCog, UserMinus, UserPlus, UserRound,
  UsersRound, UserX, type LucideIcon,
} from 'lucide-react'

/**
 * Íconos vectoriales que reemplazan a los GIF y animaciones Lottie.
 * Se indexan por el nombre del archivo que antes se usaba (sin carpeta,
 * extensión, guiones ni mayúsculas), así los componentes viejos siguen
 * pasando el mismo `name` / `src` sin cambios.
 */
const ICONOS: Record<string, LucideIcon> = {
  // Panel admin
  dashboardgeneral: LayoutDashboard,
  staff: Building2,
  gestionrrhh: UsersRound,
  tramavidaley: HeartPulse,
  historialcesados: UserX,
  registrossig: ClipboardList,
  reporteestadistico: ChartColumn,
  subirdocumentos: FileUp,
  tramasctr: ShieldCheck,
  centrodocumental: FolderOpen,
  gestionssoma: HardHat,
  cargamasivadata: FileSpreadsheet,
  centrodecosto: Building,
  biometria: Fingerprint,
  firma: PenLine,
  administradores: UserCog,
  centrodenotificaciones: Bell,
  gestionbeneficios: HeartHandshake,
  editarficha: FilePen,
  descargarpdf: FileDown,
  capacitacion: Presentation,
  alertamedica: Stethoscope,
  verdocumentossubidos: FileSearch,
  vencimientosia: Sparkles,
  vencimientodocumentos: CalendarClock,
  valido: BadgeCheck,
  reabrio: RotateCcw,
  movio: ArrowLeftRight,
  ceso: UserMinus,
  edito: Pencil,
  estaimprimiendo: Printer,
  filtrar: ListFilter,
  sonidoon: Volume2,
  sonidooff: VolumeX,
  cerrarsesion: LogOut,
  chatdeadmins: MessagesSquare,
  chatcontrabajador: MessageCircle,
  clave: KeyRound,
  supportdev: LifeBuoy,
  leyendoconia: LoaderCircle,
  reanalizar: Sparkles,

  // Portal del obrero y ficha
  misregistros: ClipboardCheck,
  archivosssoma: FolderArchive,
  miperfil: CircleUser,
  chat: MessageCircle,
  actualizarficha: FilePen,
  personal: UserRound,
  datosbancarios: Landmark,
  familia: UsersRound,
  esposa: Heart,
  hijos: Baby,
  laboral: Briefcase,
  formacionacademica: GraduationCap,
  docs: Files,
  check: CircleCheck,
  contactoemergencia: PhoneCall,

  // Chat
  galeria: Images,
  camara: Camera,
  video: Video,
  adjuntar: Paperclip,
  grabaraudio: Mic,

  // Login / registro
  dniregistro: IdCard,
  correosesion: Mail,
  contrasena: Lock,
  creatucuenta: UserPlus,
  telefonoregistro: Phone,
  apellidopaterno: Contact,
  apellidomaterno: Contact,
}

/** "/admin/centro-de-costo.gif" → "centrodecosto"; "misRegistros" → "misregistros". */
function clave(nombre: string) {
  const base = nombre.split('/').pop() ?? nombre
  return base.replace(/\.(gif|json|png|webp)$/i, '').replace(/[-_\s]/g, '').toLowerCase()
}

export function iconoPara(nombre: string): LucideIcon {
  return ICONOS[clave(nombre)] ?? Circle
}

export default function AppIcon({
  name,
  size = 20,
  className = '',
  strokeWidth = 1.9,
}: {
  name: string
  size?: number
  className?: string
  strokeWidth?: number
}) {
  const Icono = iconoPara(name)
  const gira = clave(name) === 'leyendoconia'
  return (
    <Icono
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      className={`shrink-0 ${gira ? 'animate-spin' : ''} ${className}`}
    />
  )
}
