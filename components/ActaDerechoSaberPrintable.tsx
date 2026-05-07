import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import PrintableCheckbox from './PrintableCheckbox'
import { buildWorkerLastNamesFirstUpper, getPrintObra, toPrintUppercase } from './printText'

const HEADER_DATE = '1/08/2024'

const RISKS = [
  'Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA',
  'Reglamento Interno de Seguridad.',
  'Politicas de Seguridad y Salud Ocupacional y Medio Ambiente.',
  'Organizacion del sistema de gestion de la seguridad y salud en el trabajo en la obra.',
  'Derechos y obligaciones de los/las trabajadores/as y supervisores/as.',
  'Conceptos basicos de seguridad y salud en el trabajo.',
  'Reglas de transito (de ser aplicable a la obra).',
  'Conceptos basicos de seguridad y salud en el trabajo.',
  'Plan de Seguridad y Salud Ocupacional, Plan de Prevencion Ambiental.',
  'Reconocimiento del area de trabajo.',
  'Elementos de proteccion personal, tipos requeridos, manejo correcto, obligatoriedad y protecciones colectivas.',
  'Control de Emergencias, Incendios, Uso de Extintores, Primeros Auxilios, Atencion de lesionados.',
  'Procedimiento Trabajo en Altura, Procedimientos de Trabajo Seguro, uso correcto de arnes de seguridad.',
  'Superficies de Trabajo; andamios, escaleras, plataformas, elevadores de personas, etc.',
  'Manejo de materiales; maniobras, trabajo con equipos de levante (Tirford, tecles, estrobos, etc.).',
  'Riesgos electricos, equipos energizados.',
  'Esmeril angular; uso seguro.',
  'Oxicorte; uso, riesgos y medidas preventivas.',
  'Cilindros de Gases Comprimidos; manejo, almacenamiento y transporte.',
  'Trabajos de soldadura.',
  'Excavaciones, Entibaciones, Fortificaciones y Taludes.',
  'Vaciado de Concreto.',
  'Housekeeping (Orden y Aseo).',
  'Codigo de colores y senalizacion.',
  'Exposicion a Ruidos, polvo y vibraciones.',
  'Desplazamientos por areas de trabajo.',
  'Higiene Personal, Recomendaciones.',
  'Control, Manejo, uso y transporte de sustancias peligrosas.',
  'Sistemas de bloqueos y uso de Tarjeta de Seguridad.',
  'Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.',
  'Combustibles; Manejo, Almacenamiento y Transporte.',
  'Cambio de conducta, Autocuidado, Reconocimiento, Sanciones, Contacto Personal.',
  'Prohibicion de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.',
  'Identificacion de Aspectos e Impactos Ambientales.',
  'Sobre Riesgos Ambientales, Manejo de residuos.',
  'Equipos Radioactivos.',
  'Preparacion y respuesta ante emergencias.',
  'Trabajos de alto riesgo.',
]

function formatDate(raw?: string) {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString('es-PE')
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    padding: '8mm',
    background: '#fff',
    color: '#000',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  frame: {
    minHeight: '281mm',
    border: '1px solid #000',
    padding: '6mm 6mm 5mm',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
  },
  cell: {
    border: '1px solid #000',
    padding: '3px 5px',
    verticalAlign: 'middle' as const,
    fontSize: '9px',
    lineHeight: 1.15,
  },
  labelCell: {
    border: '1px solid #000',
    padding: '3px 5px',
    verticalAlign: 'middle' as const,
    fontSize: '9px',
    lineHeight: 1.1,
    fontWeight: 700,
    background: '#f4f4f4',
    width: '21%',
  },
  valueCell: {
    border: '1px solid #000',
    padding: '2px 7px 5px',
    verticalAlign: 'top' as const,
    fontSize: '10px',
    lineHeight: 1.1,
    textTransform: 'uppercase' as const,
  },
  logoCell: {
    width: '20%',
    textAlign: 'center' as const,
    padding: '4px',
  },
  titleTop: {
    border: '1px solid #000',
    borderBottom: 'none',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '10px',
    background: '#f0f0f0',
    padding: '4px 8px',
  },
  titleBottom: {
    border: '1px solid #000',
    borderTop: 'none',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '16px',
    padding: '6px 8px',
    lineHeight: 1.15,
  },
  metaLabel: {
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    padding: '3px 5px',
    fontWeight: 700,
    fontSize: '8px',
    textAlign: 'left' as const,
  },
  metaValue: {
    borderBottom: '1px solid #000',
    padding: '3px 4px',
    fontSize: '8px',
    textAlign: 'center' as const,
  },
  sectionTitle: {
    border: '1px solid #000',
    borderTop: 'none',
    background: '#d8d8d8',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '10px',
    padding: '4px 6px',
  },
  paragraph: {
    fontSize: '9.6px',
    lineHeight: 1.25,
    textAlign: 'justify' as const,
    margin: '8px 2px 10px',
  },
  listRow: {
    height: '6.3mm',
  },
  checkboxCell: {
    width: '26px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    padding: 0,
  },
  riskTextCell: {
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    padding: '2px 7px',
    fontSize: '8.75px',
    lineHeight: 1.15,
    verticalAlign: 'middle' as const,
  },
  expositorNote: {
    fontSize: '8px',
    fontStyle: 'italic' as const,
    marginTop: '3px',
    marginBottom: '2px',
  },
  signatureBoxWrap: {
    minHeight: '89px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  signatureArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '4px 8px 2px',
  },
  signatureLine: {
    borderTop: '1px solid #000',
    textAlign: 'center' as const,
    fontSize: '8px',
    fontWeight: 700,
    paddingTop: '2px',
    margin: '0 14px 5px',
  },
}

export const ActaDerechoSaberPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  if (!ficha) return null

  const docData = ficha.doc_states?.acta_derecho?.data || {}
  const workerName = buildWorkerLastNamesFirstUpper(ficha)
  const obra = getPrintObra(ficha)
  const especialidad = toPrintUppercase(ficha.cargo || ficha.categoria || 'OPERARIO')
  const categoria = toPrintUppercase(ficha.categoria || 'OPERARIO')
  const firmaUrl = ficha.firma_url || ficha.url_firma || ''

  return (
    <div ref={ref} style={styles.page}>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      <div style={styles.frame}>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td rowSpan={3} style={{ ...styles.cell, ...styles.logoCell }}>
                <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '64px', objectFit: 'contain' }} />
              </td>
              <td style={styles.titleTop}>SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE</td>
              <td rowSpan={3} style={{ ...styles.cell, width: '21%', padding: 0 }}>
                <table style={styles.table}>
                  <tbody>
                    <tr>
                      <td style={styles.metaLabel}>Codigo</td>
                      <td style={styles.metaValue}>SG-FOR-110</td>
                    </tr>
                    <tr>
                      <td style={styles.metaLabel}>Revision</td>
                      <td style={styles.metaValue}>0</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.metaLabel, borderBottom: 'none' }}>Fecha</td>
                      <td style={{ ...styles.metaValue, borderBottom: 'none' }}>{HEADER_DATE}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={styles.titleBottom}>ACTA DE DERECHO A SABER</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, padding: '0', borderTop: 'none', height: '0' }}></td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '-1px' }}>
          <tbody>
            <tr>
              <td style={styles.labelCell}>OBRA:</td>
              <td style={styles.valueCell}>{obra}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>EMPRESA:</td>
              <td style={styles.valueCell}>RUAG S.R.L.</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>NOMBRE DEL TRABAJADOR:</td>
              <td style={styles.valueCell}>{workerName}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>DNI:</td>
              <td style={styles.valueCell}>{ficha.dni || ''}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>ESPECIALIDAD:</td>
              <td rowSpan={4} style={{ ...styles.cell, width: '35%', padding: 0 }}>
                <div style={styles.signatureBoxWrap}>
                  <div style={styles.signatureArea}>
                    {firmaUrl ? (
                      <NormalizedSignatureImage
                        src={firmaUrl}
                        alt="Firma del trabajador"
                        style={{ maxWidth: '78%', maxHeight: '58px', objectFit: 'contain' }}
                      />
                    ) : null}
                  </div>
                  <div style={styles.signatureLine}>FIRMA DEL TRABAJADOR</div>
                </div>
              </td>
              <td style={styles.valueCell}>{especialidad}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>CATEGORIA:</td>
              <td style={styles.valueCell}>{categoria}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>FECHA:</td>
              <td style={styles.valueCell}>{formatDate(docData.fecha_documento)}</td>
            </tr>
            <tr>
              <td style={styles.labelCell}>DURACION DE LA CHARLA:</td>
              <td style={styles.valueCell}>1.5 Hrs.</td>
            </tr>
          </tbody>
        </table>

        <div style={styles.sectionTitle}>ACTA DE DERECHO A SABER</div>

        <p style={styles.paragraph}>
          A traves de esta acta declaro haber sido informado acerca de todos los riesgos que entranan las labores que
          desarrollare en mi trabajo, asi como las medidas preventivas que debo tomar para hacer de esto un metodo
          seguro de trabajo, ademas aquellos aspectos ambientales que tengan relacion con mi puesto y area de trabajo.
        </p>

        <table style={styles.table}>
          <tbody>
            {RISKS.map((risk, index) => (
              <tr key={risk} style={styles.listRow}>
                <td style={styles.checkboxCell}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <PrintableCheckbox checked={Boolean(docData[`topic_${index}`])} size={13} fontSize={11} />
                  </div>
                </td>
                <td style={styles.riskTextCell}>
                  <strong>{index + 1}.-</strong> {risk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.expositorNote}>Para ser llenado por el Expositor</div>
        <table style={{ ...styles.table, marginTop: 0 }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ ...styles.sectionTitle, borderTop: '1px solid #000' }}>EXPOSITOR (SSOMA)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.labelCell, width: '15%' }}>NOMBRE</td>
              <td style={{ ...styles.valueCell, height: '10mm' }}></td>
            </tr>
            <tr>
              <td style={styles.labelCell}>CARGO</td>
              <td style={{ ...styles.valueCell, height: '10mm' }}></td>
            </tr>
            <tr>
              <td style={styles.labelCell}>FIRMA</td>
              <td style={{ ...styles.valueCell, height: '13mm' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})

ActaDerechoSaberPrintable.displayName = 'ActaDerechoSaberPrintable'
