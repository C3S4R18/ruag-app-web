/* components/FichaPdf.tsx */
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Usamos fuentes estándar para evitar errores de descarga/CORS
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  subtitle: { fontSize: 10, color: '#64748b' },
  
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: 4, marginBottom: 6, textTransform: 'uppercase' },
  
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: '35%', fontSize: 9, color: '#64748b' },
  value: { width: '65%', fontSize: 9, color: '#000' },
  
  signature: { marginTop: 30, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ccc', width: 200, alignSelf: 'center', paddingTop: 5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#94a3b8' }
})

const Field = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
)

export const FichaDocument = ({ ficha }: { ficha: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>Ficha de Personal</Text>
            <Text style={styles.subtitle}>Registro de Datos del Trabajador</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text>ID: {ficha.id.slice(0,8)}</Text>
            <Text>Fecha: {new Date(ficha.updated_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Información Personal</Text>
        <Field label="Nombres Completos" value={`${ficha.apellido_paterno} ${ficha.apellido_materno}, ${ficha.nombres}`} />
        <Field label="DNI" value={ficha.dni} />
        <Field label="Fecha Nacimiento" value={ficha.fecha_nacimiento} />
        <Field label="Estado Civil" value={ficha.estado_civil} />
        <Field label="Celular" value={ficha.celular} />
        <Field label="Dirección" value={`${ficha.direccion}, ${ficha.distrito}, ${ficha.provincia}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Información Laboral</Text>
        <Field label="Obra Destino" value={ficha.nombre_obra} />
        <Field label="Cargo" value={ficha.cargo} />
        <Field label="Categoría" value={ficha.categoria} />
        <Field label="Fecha Ingreso" value={ficha.fecha_ingreso} />
        <Field label="Carnet RETCC" value={ficha.carnet_retcc} />
        <Field label="Vencimiento RETCC" value={ficha.fecha_vencimiento_retcc} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Datos Financieros y Previsionales</Text>
        <Field label="Régimen Pensión" value={ficha.sistema_pension} />
        <Field label="AFP / CUSPP" value={`${ficha.afp_nombre || ''} ${ficha.cuspp || ''}`} />
        <Field label="Banco" value={ficha.banco} />
        <Field label="N° Cuenta" value={ficha.numero_cuenta} />
        <Field label="CCI" value={ficha.cci} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Formación y Familia</Text>
        <Field label="Nivel Educativo" value={ficha.nivel_educacion} />
        <Field label="Profesión/Oficio" value={ficha.carrera} />
        <Field label="Esposa/Conviviente" value={ficha.esposa} />
        <Field label="Hijos" value={ficha.hijos} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Emergencia</Text>
        <Field label="Contacto" value={ficha.emergencia_nombre} />
        <Field label="Teléfono" value={ficha.emergencia_celular} />
      </View>

      <View style={styles.signature}>
         {/* Solo mostramos firma si existe */}
         {ficha.url_firma ? (
             <Image src={ficha.url_firma} style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 5 }} />
         ) : <Text>(Sin Firma Digital)</Text>}
         <Text style={{ fontWeight: 'bold' }}>{ficha.nombres} {ficha.apellido_paterno}</Text>
         <Text style={{ fontSize: 8 }}>Firma del Trabajador</Text>
      </View>

      <Text style={styles.footer}>
        Declaración Jurada: La información consignada es verdadera. RUAG Systems.
      </Text>
    </Page>
  </Document>
)