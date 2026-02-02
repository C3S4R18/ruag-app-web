/* components/FichaPdf.tsx */
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// --- ESTILOS OPTIMIZADOS PARA UNA SOLA PÁGINA ---
const styles = StyleSheet.create({
  page: { 
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 35,
    fontFamily: 'Helvetica', 
    fontSize: 8, 
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
  
  // HEADER
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 10, 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#0f172a',
    paddingBottom: 8
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain',
    marginRight: 15
  },
  headerContent: {
    flexGrow: 1,
    flexDirection: 'column'
  },
  brandTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  docTitle: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  metaBox: {
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 10
  },
  metaText: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 1
  },

  // SECCIONES
  section: { 
    marginBottom: 8, 
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 2
  },
  sectionHeader: { 
    backgroundColor: '#f1f5f9', 
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1'
  },
  sectionTitle: { 
    fontSize: 8, 
    fontWeight: 'bold', 
    color: '#0f172a',
    textTransform: 'uppercase' 
  },
  sectionBody: {
    padding: 6,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  // CAMPOS
  fieldContainer: {
    width: '33.33%', 
    marginBottom: 4,
    paddingRight: 4
  },
  fieldHalf: {
    width: '50%', 
    marginBottom: 4,
    paddingRight: 4
  },
  fieldFull: {
    width: '100%',
    marginBottom: 4
  },
  label: { 
    fontSize: 6, 
    color: '#64748b', 
    textTransform: 'uppercase',
    marginBottom: 1,
    fontWeight: 'bold'
  },
  value: { 
    fontSize: 8, 
    color: '#0f172a',
    fontWeight: 'normal' // Corregido para tipos estándar
  },

  // FIRMA (Compacta)
  signatureSection: {
    marginTop: 15,
    alignItems: 'center',
    width: '100%'
  },
  signatureBox: {
    width: 180,
    alignItems: 'center',
    paddingTop: 5
  },
  signatureImg: {
    width: 100,
    height: 45,
    objectFit: 'contain',
    marginBottom: -5
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    marginTop: 2,
    marginBottom: 2
  },
  signatureName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  signatureLabel: {
    fontSize: 6,
    color: '#64748b',
    textTransform: 'uppercase'
  },

  // FOOTER
  footer: { 
    position: 'absolute', 
    bottom: 20, 
    left: 35, 
    right: 35, 
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 6,
    color: '#94a3b8'
  }
})

// --- HELPERS ---
const safeJsonParse = (str: any) => {
    if (typeof str === 'object' && str !== null) return str;
    try { return JSON.parse(str); } catch (e) { return null; }
}

// CORRECCIÓN FINAL: Eliminamos maxLines/numberOfLines para evitar errores TS y permitir wrap de texto
const Field = ({ label, value, width = '33.33%' }: { label: string, value: any, width?: string }) => (
  <View style={{ width: width, marginBottom: 4, paddingRight: 4 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value ? String(value).toUpperCase() : '-'}</Text>
  </View>
)

export const FichaDocument = ({ ficha }: { ficha: any }) => {
  const esposaData = safeJsonParse(ficha.esposa);
  const hijosData = safeJsonParse(ficha.hijos);
  
  let hijosTexto = 'SIN HIJOS';
  if (Array.isArray(hijosData) && hijosData.length > 0) {
      hijosTexto = hijosData.map((h: any) => `${h.nombres} (${h.fecha_nacimiento})`).join(', ');
  }

  let esposaTexto = 'SOLTERO(A)';
  if (esposaData && (esposaData.nombres || esposaData.paterno)) {
      esposaTexto = `${esposaData.nombres} ${esposaData.paterno} (DNI: ${esposaData.dni})`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER CON LOGO */}
        <View style={styles.header}>
          {/* Asegúrate de que el archivo logo_ruag.png esté en la carpeta /public */}
          <Image src="/logo_ruag.png" style={styles.logo} />
          
          <View style={styles.headerContent}>
              <Text style={styles.brandTitle}>RUAG SYSTEMS</Text>
              <Text style={styles.docTitle}>Registro Único de Personal</Text>
          </View>
          
          <View style={styles.metaBox}>
              <Text style={styles.metaText}>ID: {ficha.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.metaText}>REGISTRO: {new Date(ficha.created_at).toLocaleDateString()}</Text>
              <Text style={styles.metaText}>ESTADO: {ficha.estado ? ficha.estado.toUpperCase() : '-'}</Text>
          </View>
        </View>

        {/* 1. PERSONAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>1. Información Personal</Text></View>
          <View style={styles.sectionBody}>
            <Field label="Apellidos Paterno" value={ficha.apellido_paterno} />
            <Field label="Apellido Materno" value={ficha.apellido_materno} />
            <Field label="Nombres" value={ficha.nombres} />
            
            <Field label="DNI / C.E." value={ficha.dni} />
            <Field label="Fecha Nacimiento" value={ficha.fecha_nacimiento} />
            <Field label="Estado Civil" value={ficha.estado_civil} />
            
            <Field label="Celular" value={ficha.celular} />
            <Field label="Correo Electrónico" value={ficha.correo} width="66.66%" />
            
            <Field label="Dirección" value={ficha.direccion} width="100%" />
            <Field label="Distrito" value={ficha.distrito} />
            <Field label="Provincia" value={ficha.provincia} />
            <Field label="Departamento" value="LIMA" />
          </View>
        </View>

        {/* 2. LABORAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>2. Información Laboral</Text></View>
          <View style={styles.sectionBody}>
            <Field label="Proyecto / Obra" value={ficha.nombre_obra} width="50%" />
            <Field label="Fecha Ingreso" value={ficha.fecha_ingreso} width="50%" />
            
            <Field label="Cargo" value={ficha.cargo} />
            <Field label="Categoría" value={ficha.categoria} />
            <Field label="Nivel Educativo" value={ficha.nivel_educacion} />
            
            <Field label="Profesión / Oficio" value={ficha.carrera} width="50%" />
            <Field label="Carnet RETCC" value={ficha.carnet_retcc} width="50%" />
          </View>
        </View>

        {/* 3. FINANCIERO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>3. Datos Financieros</Text></View>
          <View style={styles.sectionBody}>
            <Field label="Régimen Pensión" value={ficha.sistema_pension} width="50%" />
            <Field label="Nombre AFP / CUSPP" value={`${ficha.afp_nombre || ''} ${ficha.cuspp || ''}`} width="50%" />
            
            <Field label="Banco" value={ficha.banco} />
            <Field label="Número de Cuenta" value={ficha.numero_cuenta} width="66.66%" />
            <Field label="Código Interbancario (CCI)" value={ficha.cci} width="100%" />
          </View>
        </View>

        {/* 4. FAMILIA Y EMERGENCIA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>4. Datos Familiares y Emergencia</Text></View>
          <View style={styles.sectionBody}>
            <Field label="Cónyuge" value={esposaTexto} width="100%" />
            <Field label="Hijos" value={hijosTexto} width="100%" />
            <View style={{ width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 }} />
            <Field label="Contacto Emergencia" value={ficha.emergencia_nombre} width="50%" />
            <Field label="Teléfono Emergencia" value={ficha.emergencia_celular} width="50%" />
          </View>
        </View>

        {/* FIRMA */}
        <View style={styles.signatureSection}>
           <View style={styles.signatureBox}>
             {/* Imagen de la firma si existe */}
             {ficha.url_firma ? (
                 <Image src={ficha.url_firma} style={styles.signatureImg} />
             ) : (
                 <View style={{height: 40, justifyContent: 'center'}}><Text style={{fontSize: 7, color: '#ccc'}}>(Firma Digital Pendiente)</Text></View>
             )}
             
             <View style={styles.signatureLine} />
             <Text style={styles.signatureName}>{ficha.nombres} {ficha.apellido_paterno}</Text>
             <Text style={styles.signatureLabel}>DNI: {ficha.dni}</Text>
           </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Declaración Jurada: La información consignada es verdadera.</Text>
          <Text style={styles.footerText}>Generado por RUAG Systems</Text>
        </View>

      </Page>
    </Document>
  )
}