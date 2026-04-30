import { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerLastNamesFirstUpper, toPrintUppercase } from './printText'

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    padding: '14mm 14mm 16mm',
    boxSizing: 'border-box',
  },
  header: {
    border: '1px solid #111',
    display: 'grid',
    gridTemplateColumns: '1.2fr 3fr 1.4fr',
  },
  cell: {
    borderRight: '1px solid #111',
    minHeight: 92,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
  },
  titleWrap: {
    textAlign: 'center',
    lineHeight: 1.25,
  },
  title: {
    fontSize: 17,
    fontWeight: 800,
  },
  meta: {
    display: 'grid',
    gridTemplateRows: 'repeat(4, 1fr)',
    minHeight: 92,
  },
  metaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderBottom: '1px solid #111',
    fontSize: 10,
  },
  metaLabel: {
    padding: '4px 6px',
    borderRight: '1px solid #111',
    background: '#f3f4f6',
    fontWeight: 700,
  },
  metaValue: {
    padding: '4px 6px',
    textAlign: 'center',
  },
  lineFieldWrap: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr 0.8fr',
    gap: 12,
    marginTop: 18,
  },
  lineField: {
    fontSize: 12,
  },
  lineLabel: {
    display: 'block',
    fontWeight: 700,
    marginBottom: 6,
  },
  lineValue: {
    display: 'block',
    borderBottom: '1px solid #111',
    minHeight: 20,
    paddingBottom: 4,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: 18,
    fontSize: 11.5,
  },
  th: {
    border: '1px solid #111',
    background: '#f3f4f6',
    padding: '6px 8px',
    textAlign: 'center' as const,
    fontWeight: 700,
  },
  td: {
    border: '1px solid #111',
    padding: '6px 8px',
    verticalAlign: 'top' as const,
  },
  check: {
    textAlign: 'center' as const,
    fontWeight: 800,
    fontSize: 13,
  },
  riskGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 8,
  },
  riskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11.5,
  },
  square: {
    width: 14,
    height: 14,
    border: '1px solid #111',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 11,
  },
  footer: {
    marginTop: 18,
    fontSize: 12.5,
    lineHeight: 1.7,
  },
  footerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginTop: 22,
    alignItems: 'end',
  },
  signatureBox: {
    minHeight: 62,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 12,
  },
  signatureLine: {
    borderTop: '1px solid #111',
    paddingTop: 8,
    textAlign: 'center' as const,
    fontWeight: 700,
  },
}

const symptomLabels = [
  'Sensacion de alza termica, fiebre o malestar.',
  'Dolor de garganta, tos, estornudos o dificultad para respirar.',
  'Dolor de cabeza, diarrea o congestion nasal.',
  'Perdida de gusto y/o del olfato.',
  'Contacto con un caso confirmado de COVID-19.',
]

const riskLabels = [
  ['risk_mayor_65', 'Mayor de 65 anos'],
  ['risk_cancer', 'Cancer'],
  ['risk_renal', 'Enfermedad renal cronica'],
  ['risk_pulmonar', 'Enfermedad pulmonar cronica'],
  ['risk_cardiaca', 'Afecciones cardiacas'],
  ['risk_dm', 'DM tipo 1 o 2'],
  ['risk_obesidad', 'Obesidad (IMC > 30)'],
  ['risk_inmuno', 'Inmunosupresion'],
  ['risk_trasplante', 'Receptor de trasplante de organos'],
  ['risk_cerebro', 'Enfermedad cerebrovascular'],
  ['risk_hipertension', 'Hipertension arterial'],
  ['risk_down', 'Sindrome de Down'],
  ['risk_embarazo', 'Embarazo'],
  ['risk_vih', 'Infeccion por VIH'],
]

const getDocData = (ficha: any) => ficha?.doc_states?.ficha_covid?.data || {}
const getSignatureUrl = (ficha: any) => ficha?.url_firma || ficha?.firma_url || ''
const getFullName = (ficha: any) => buildWorkerLastNamesFirstUpper(ficha)
const formatDate = (raw?: string) => {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('es-PE')
}
const mark = (value?: string | boolean) => {
  if (value === true || value === 'si') return 'X'
  return ''
}

export const FichaSintomatologicaPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  const docData = getDocData(ficha)
  const fullName = getFullName(ficha)
  const dni = ficha?.dni || ''
  const areaTrabajo = toPrintUppercase(docData.area_trabajo || ficha?.cargo || '')
  const direccion = toPrintUppercase(docData.direccion_domicilio || ficha?.direccion || '')
  const celular = docData.celular || ficha?.celular || ficha?.telefono || ''
  const firma = getSignatureUrl(ficha)
  const fecha = formatDate(docData.fecha_documento)

  return (
    <div ref={ref} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.cell}>
          <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: 58, objectFit: 'contain' }} />
        </div>
        <div style={styles.cell}>
          <div style={styles.titleWrap}>
            <div style={styles.title}>EVALUACION DE LA APTITUD PARA EL REGRESO O REINCORPORACION AL TRABAJO</div>
            <div style={{ ...styles.title, marginTop: 4 }}>DECLARACION JURADA</div>
          </div>
        </div>
        <div style={{ ...styles.cell, borderRight: 'none', padding: 0 }}>
          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>CODIGO</div>
              <div style={styles.metaValue}>FOR-COVID-01</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>REVISION</div>
              <div style={styles.metaValue}>01</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>FECHA</div>
              <div style={styles.metaValue}>04/01/2024</div>
            </div>
            <div style={{ ...styles.metaRow, borderBottom: 'none' }}>
              <div style={styles.metaLabel}>PAGINA</div>
              <div style={styles.metaValue}>01 / 01</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.lineFieldWrap}>
        <div style={styles.lineField}>
          <span style={styles.lineLabel}>Apellidos y Nombres:</span>
          <span style={styles.lineValue}>{fullName}</span>
        </div>
        <div style={styles.lineField}>
          <span style={styles.lineLabel}>Area de trabajo:</span>
          <span style={styles.lineValue}>{areaTrabajo}</span>
        </div>
        <div style={styles.lineField}>
          <span style={styles.lineLabel}>DNI:</span>
          <span style={styles.lineValue}>{dni}</span>
        </div>
      </div>

      <div style={{ ...styles.lineFieldWrap, gridTemplateColumns: '2fr 1fr' }}>
        <div style={styles.lineField}>
          <span style={styles.lineLabel}>Direccion domicilio:</span>
          <span style={styles.lineValue}>{direccion}</span>
        </div>
        <div style={styles.lineField}>
          <span style={styles.lineLabel}>Numero (celular):</span>
          <span style={styles.lineValue}>{celular}</span>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left' }}>En los ultimos 10 dias calendario ha tenido alguno de los sintomas siguientes:</th>
            <th style={styles.th}>SI</th>
            <th style={styles.th}>NO</th>
          </tr>
        </thead>
        <tbody>
          {symptomLabels.map((label, index) => {
            const yes = docData[`symptom_${index + 1}`] === 'si'
            const no = docData[`symptom_${index + 1}`] === 'no'
            return (
              <tr key={label}>
                <td style={styles.td}>{`${index + 1}. ${label}`}</td>
                <td style={{ ...styles.td, ...styles.check }}>{yes ? 'X' : ''}</td>
                <td style={{ ...styles.td, ...styles.check }}>{no ? 'X' : ''}</td>
              </tr>
            )
          })}
          <tr>
            <td style={styles.td}>6. Esta tomando alguna medicacion (detallar cual o cuales): {docData.medicacion_detalle || ''}</td>
            <td style={{ ...styles.td, ...styles.check }}>{docData.medicacion_toma === 'si' ? 'X' : ''}</td>
            <td style={{ ...styles.td, ...styles.check }}>{docData.medicacion_toma === 'no' ? 'X' : ''}</td>
          </tr>
          <tr>
            <td style={styles.td}>
              <div>7. Pertenece a algun grupo de riesgo para COVID-19.</div>
              <div style={styles.riskGrid}>
                {riskLabels.map(([key, label]) => (
                  <div key={key} style={styles.riskItem}>
                    <span style={styles.square}>{mark(docData[key])}</span>
                    <span>{label}</span>
                  </div>
                ))}
                <div style={styles.riskItem}>
                  <span style={styles.square}>{docData.risk_otros ? 'X' : ''}</span>
                  <span>Otros: {docData.risk_otros || ''}</span>
                </div>
              </div>
            </td>
            <td style={{ ...styles.td, ...styles.check }}>{docData.grupo_riesgo === 'si' ? 'X' : ''}</td>
            <td style={{ ...styles.td, ...styles.check }}>{docData.grupo_riesgo === 'no' ? 'X' : ''}</td>
          </tr>
          <tr>
            <td style={styles.td}>8. Estado de vacunacion para SARS-Cov-2 (# de dosis): {docData.vacunas_dosis || ''}</td>
            <td style={{ ...styles.td, ...styles.check }} colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      <div style={styles.footer}>
        He recibido explicacion del objetivo de esta evaluacion y he respondido con la verdad.
        <div style={styles.footerRow}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Fecha: {fecha}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Firma del trabajador:</div>
            <div style={styles.signatureBox}>
              {firma ? <NormalizedSignatureImage src={firma} alt="Firma" style={{ maxWidth: '82%', maxHeight: 46, objectFit: 'contain' }} /> : null}
            </div>
            <div style={styles.signatureLine}>Conformidad digital</div>
          </div>
        </div>
      </div>
    </div>
  )
})

FichaSintomatologicaPrintable.displayName = 'FichaSintomatologicaPrintable'
