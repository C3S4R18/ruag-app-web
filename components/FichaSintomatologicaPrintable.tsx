import { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerLastNamesFirstUpper, toPrintUppercase } from './printText'

const HEADER_DATE = '4/01/2024'

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    color: '#000',
    fontFamily: 'Arial, sans-serif',
    padding: '18mm 18mm 14mm',
    boxSizing: 'border-box',
  },
  headerTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
  },
  headerCell: {
    border: '1px solid #000',
    verticalAlign: 'middle' as const,
  },
  logoCell: {
    width: '18%',
    padding: '6px 4px',
    textAlign: 'center' as const,
  },
  titleCell: {
    width: '57%',
    padding: '6px 10px',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '9px',
    lineHeight: 1.16,
    letterSpacing: 0.1,
  },
  metaCell: {
    width: '25%',
    padding: 0,
  },
  metaTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
  },
  metaLabel: {
    width: '43%',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    padding: '4px 6px',
    fontWeight: 700,
    fontSize: '8px',
    textAlign: 'left' as const,
  },
  metaValue: {
    borderBottom: '1px solid #000',
    padding: '4px 2px',
    fontSize: '8px',
    textAlign: 'center' as const,
  },
  fieldsWrap: {
    marginTop: '16mm',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 1fr 0.75fr',
    columnGap: '10px',
    marginBottom: '13px',
    alignItems: 'end',
  },
  fieldRowTwo: {
    display: 'grid',
    gridTemplateColumns: '1.45fr 1fr',
    columnGap: '12px',
    marginBottom: '26px',
    alignItems: 'end',
  },
  field: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: '8px',
    alignItems: 'end',
  },
  fieldLabel: {
    fontSize: '10px',
    whiteSpace: 'nowrap' as const,
  },
  fieldLine: {
    borderBottom: '1px solid #000',
    minHeight: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    padding: '0 3px 6px',
    fontSize: '9px',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    overflow: 'hidden',
  },
  intro: {
    marginTop: '22mm',
    marginBottom: '10px',
    fontSize: '10px',
    lineHeight: 1.2,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 42mm',
    columnGap: '10px',
    alignItems: 'start',
  },
  leftPane: {
    fontSize: '10px',
    lineHeight: 1.18,
  },
  symptomRow: {
    height: '22px',
    display: 'flex',
    alignItems: 'center',
  },
  medicationRow: {
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  riskTitle: {
    marginTop: '2px',
    marginBottom: '4px',
  },
  riskGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '16px',
  },
  riskColumn: {
    display: 'grid',
    gridAutoRows: '16px',
    rowGap: 0,
    fontSize: '10px',
    lineHeight: 1.1,
  },
  riskRowLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  othersRow: {
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
  },
  vaccineRow: {
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
  },
  matrixHead: {
    border: '1px solid #000',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '10px',
    height: '20px',
    verticalAlign: 'middle' as const,
  },
  matrixCell: {
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    height: '22px',
    padding: 0,
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
  },
  matrixCellSmall: {
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    height: '16px',
    padding: 0,
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
  },
  mark: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '11px',
    lineHeight: 1,
  },
  footerText: {
    marginTop: '16mm',
    fontSize: '10px',
  },
  footerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '44px',
    marginTop: '18mm',
    alignItems: 'end',
  },
  footerLabel: {
    fontSize: '10px',
    marginBottom: '8px',
  },
  footerLine: {
    borderBottom: '1px solid #000',
    minHeight: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '0 3px 6px',
    fontSize: '9px',
    lineHeight: 1,
  },
  signatureArea: {
    minHeight: '42px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
}

const symptomRows = [
  { key: 'symptom_1', label: '1. Sensacion de alza termica, fiebre o malestar.' },
  { key: 'symptom_2', label: '2. Dolor de garganta, tos, estornudos o dificultad para respirar.' },
  { key: 'symptom_3', label: '3. Dolor de cabeza, diarrea o congestion nasal.' },
  { key: 'symptom_4', label: '4. Perdida de gusto y/o del olfato.' },
  { key: 'symptom_5', label: '5. Contacto con un caso confirmado de COVID-19' },
]

const riskLeft = [
  { key: 'risk_mayor_65', label: 'Mayor de 65 anos' },
  { key: 'risk_renal', label: 'Enfermedad renal cronica' },
  { key: 'risk_cardiaca', label: 'Afecciones cardiacas' },
  { key: 'risk_obesidad', label: 'Obesidad (IMC>30)' },
  { key: 'risk_trasplante', label: 'Receptor de trasplante de organos' },
  { key: 'risk_hipertension', label: 'Hipertension arterial' },
  { key: 'risk_down', label: 'Sindrome de down' },
]

const riskRight = [
  { key: 'risk_cancer', label: 'Cancer' },
  { key: 'risk_pulmonar', label: 'Enfermedad Pulmonar cronica' },
  { key: 'risk_dm', label: 'DM tipo 1 o 2' },
  { key: 'risk_inmuno', label: 'Inmunosupresion' },
  { key: 'risk_cerebro', label: 'Enfermedad cerebrovascular' },
  { key: 'risk_embarazo', label: 'Embarazo' },
  { key: 'risk_vih', label: 'Infeccion por VIH' },
]

const matrixOrder = [
  ...symptomRows.map((row) => ({ type: 'yesno' as const, key: row.key })),
  { type: 'yesno' as const, key: 'medicacion_toma' },
  ...riskLeft.map((row) => ({ type: 'risk' as const, key: row.key })),
  ...riskRight.map((row) => ({ type: 'risk' as const, key: row.key })),
  { type: 'risk' as const, key: 'risk_otros' },
  { type: 'vaccine' as const, key: 'vacunas_dosis' },
]

const getDocData = (ficha: any) => ficha?.doc_states?.ficha_covid?.data || {}
const getSignatureUrl = (ficha: any) => ficha?.url_firma || ficha?.firma_url || ''
const getFullName = (ficha: any) => buildWorkerLastNamesFirstUpper(ficha)

const formatDate = (raw?: string) => {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('es-PE')
}

const hasMark = (value: any) => value === true || value === 'si' || value === 'SI' || value === 'x' || value === 'X'

const yesNo = (value: any) => {
  if (value === 'si' || value === 'SI' || value === true) return { yes: 'X', no: '' }
  if (value === 'no' || value === 'NO') return { yes: '', no: 'X' }
  return { yes: '', no: '' }
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
      <table style={styles.headerTable}>
        <tbody>
          <tr>
            <td style={{ ...styles.headerCell, ...styles.logoCell }}>
              <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '56px', objectFit: 'contain' }} />
            </td>
            <td style={{ ...styles.headerCell, ...styles.titleCell }}>
              EVALUACION DE LA APTITUD PARA EL REGRESO O
              <br />
              REINCORPORACION AL TRABAJO - DECLARACION
              <br />
              JURADA
            </td>
            <td style={{ ...styles.headerCell, ...styles.metaCell }}>
              <table style={styles.metaTable}>
                <tbody>
                  <tr>
                    <td style={styles.metaLabel}>CODIGO:</td>
                    <td style={styles.metaValue}>FOR-COVID-01</td>
                  </tr>
                  <tr>
                    <td style={styles.metaLabel}>REVISION:</td>
                    <td style={styles.metaValue}>01</td>
                  </tr>
                  <tr>
                    <td style={styles.metaLabel}>FECHA:</td>
                    <td style={styles.metaValue}>{HEADER_DATE}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.metaLabel, borderBottom: 'none' }}>PAGINA:</td>
                    <td style={{ ...styles.metaValue, borderBottom: 'none' }}>01 / 01</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={styles.fieldsWrap}>
        <div style={styles.fieldRow}>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Apellidos y Nombres:</div>
            <div style={styles.fieldLine}>{fullName}</div>
          </div>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Area de trabajo:</div>
            <div style={styles.fieldLine}>{areaTrabajo}</div>
          </div>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>DNI:</div>
            <div style={styles.fieldLine}>{dni}</div>
          </div>
        </div>

        <div style={styles.fieldRowTwo}>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Direccion Domicilio:</div>
            <div style={styles.fieldLine}>{direccion}</div>
          </div>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Numero (Celular):</div>
            <div style={styles.fieldLine}>{celular}</div>
          </div>
        </div>
      </div>

      <div style={styles.intro}>
        En los ultimos 10 dias calendario ha tenido alguno de los sintomas siguientes:
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.leftPane}>
          {symptomRows.map((row) => (
            <div key={row.key} style={styles.symptomRow}>{row.label}</div>
          ))}

          <div style={styles.medicationRow}>
            6. Esta tomando alguna medicacion (detallar cual o cuales):
          </div>

          <div style={{ minHeight: '232px' }}>
            <div style={styles.riskTitle}>7. Pertenece a algun Grupo de Riesgo para COVID-19.</div>
            <div style={styles.riskGrid}>
              <div style={styles.riskColumn}>
                {riskLeft.map((row) => (
                  <div key={row.key} style={styles.riskRowLabel}>{row.label}</div>
                ))}
              </div>
              <div style={styles.riskColumn}>
                {riskRight.map((row) => (
                  <div key={row.key} style={styles.riskRowLabel}>{row.label}</div>
                ))}
              </div>
            </div>
            <div style={styles.othersRow}>Otros*</div>
            <div style={styles.vaccineRow}>8. Estado de vacunacion para SARS-Cov-2 (# de dosis)</div>
          </div>
        </div>

        <table style={styles.matrixTable}>
          <tbody>
            <tr>
              <td style={styles.matrixHead}>SI</td>
              <td style={styles.matrixHead}>NO</td>
            </tr>

            {matrixOrder.map((row, index) => {
              if (row.type === 'yesno') {
                const marks = yesNo(docData[row.key])
                const cellStyle = index < 6 ? styles.matrixCell : styles.matrixCellSmall
                return (
                  <tr key={`${row.type}-${row.key}`}>
                    <td style={cellStyle}><div style={styles.mark}>{marks.yes}</div></td>
                    <td style={cellStyle}><div style={styles.mark}>{marks.no}</div></td>
                  </tr>
                )
              }

              if (row.type === 'risk') {
                return (
                  <tr key={`${row.type}-${row.key}`}>
                    <td style={styles.matrixCellSmall}><div style={styles.mark}>{hasMark(docData[row.key]) ? 'X' : ''}</div></td>
                    <td style={styles.matrixCellSmall}><div style={styles.mark}></div></td>
                  </tr>
                )
              }

              return (
                <tr key={`${row.type}-${row.key}`}>
                  <td style={styles.matrixCellSmall}><div style={styles.mark}>{docData.vacunas_dosis || ''}</div></td>
                  <td style={styles.matrixCellSmall}><div style={styles.mark}></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.footerText}>
        He recibido explicacion del objetivo de esta evaluacion y he respondido con la verdad
      </div>

      <div style={styles.footerRow}>
        <div>
          <div style={styles.footerLabel}>Fecha:</div>
          <div style={styles.footerLine}>{fecha}</div>
        </div>
        <div>
          <div style={styles.footerLabel}>Firma del trabajador:</div>
          <div style={styles.signatureArea}>
            {firma ? (
              <NormalizedSignatureImage
                src={firma}
                alt="Firma"
                style={{ maxWidth: '82%', maxHeight: '38px', objectFit: 'contain' }}
              />
            ) : null}
          </div>
          <div style={styles.footerLine}></div>
        </div>
      </div>
    </div>
  )
})

FichaSintomatologicaPrintable.displayName = 'FichaSintomatologicaPrintable'
