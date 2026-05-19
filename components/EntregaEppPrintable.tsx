import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerLastNamesFirstUpper, getPrintObra, toPrintUppercase } from './printText'

const HEADER_DATE = '12/12/2025'

const EPP_ITEMS = [
  'BARBIQUEJO',
  'BOTAS CON PUNTA DE ACERO',
  'CASCO DE SEGURIDAD',
  'POLO',
  'CHALECO REFLEXIVO DE SEGURIDAD',
  'LENTES CLAROS DE SEGURIDAD',
  'LENTES OSCUROS',
  'TAPONES AUDITIVOS',
  'GUANTES ANTICORTE NIVEL 5',
  'GUANTES DE CUERO',
  'GUANTES DE JEBE',
  'GUANTES PARA SOLDAR',
  'CARETA O PROTECTOR FACIAL',
  'MASCARILLA DESECHABLE',
  'RESPIRADOR DOBLE VIA',
  'RESPIRADOR DE UNA VIA',
  'ESCARPINES',
  'MANDIL DE SOLDADURA',
  'ZAPATOS DIELECTRICOS',
  'OVEROL O UNIFORME',
  'OTROS',
]

function lineValue(value?: string) {
  return (value || '').trim()
}

function formatPrintDate(value?: string) {
  const raw = lineValue(value)
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return raw
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '297mm',
    minHeight: '210mm',
    padding: '3mm',
    background: '#fff',
    color: '#000',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  frame: {
    minHeight: '204mm',
    border: '1px solid #000',
    padding: '2.8mm',
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
    textAlign: 'center' as const,
    fontSize: '8.5px',
    lineHeight: 1.1,
  },
  titleCell: {
    border: '1px solid #000',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '14.2px',
    padding: '7px 10px',
    lineHeight: 1.1,
  },
  softHeader: {
    border: '1px solid #000',
    background: '#d9d9d9',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '8.2px',
    padding: '3px 4px',
    lineHeight: 1.1,
  },
  metaLabel: {
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    padding: '2px 4px',
    fontSize: '8px',
    fontWeight: 700,
    textAlign: 'left' as const,
  },
  metaValue: {
    borderBottom: '1px solid #000',
    padding: '2px 3px',
    fontSize: '8px',
    textAlign: 'center' as const,
  },
  topText: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: '17px',
    padding: '2px 6px 7px',
    fontSize: '9px',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },
  topTextCenter: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: '17px',
    padding: '2px 4px 7px',
    fontSize: '8.8px',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },
  articleCell: {
    border: '1px solid #000',
    padding: '1px 4px 5px',
    fontSize: '8.3px',
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
    lineHeight: 1.05,
    height: '7.35mm',
  },
  dataCell: {
    border: '1px solid #000',
    height: '7.35mm',
    padding: 0,
    verticalAlign: 'top' as const,
  },
  signatureCell: {
    border: '1px solid #000',
    height: '7.35mm',
    padding: '1px 2px',
    verticalAlign: 'top' as const,
  },
  signatureWrap: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '2px',
  },
}

export const EntregaEppPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  if (!ficha) return null

  const docData = ficha.doc_states?.epp?.data || {}
  const firmaUrl = ficha.firma_url || ficha.url_firma || ''
  const trabajador = buildWorkerLastNamesFirstUpper(ficha)
  const cargo = toPrintUppercase(ficha.cargo || 'OPERARIO')
  const especialidad = cargo
  const obra = toPrintUppercase(docData.obra || getPrintObra(ficha))

  return (
    <div ref={ref} style={styles.page}>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
      `}</style>

      <div style={styles.frame}>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '14%', padding: '3px' }}>
                <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '56px', objectFit: 'contain' }} />
              </td>
              <td style={styles.titleCell}>CONTROL DE ENTREGA DE EPP POR TRABAJADOR</td>
              <td style={{ ...styles.cell, width: '15%', padding: 0 }}>
                <table style={styles.table}>
                  <tbody>
                    <tr>
                      <td style={styles.metaLabel}>CODIGO:</td>
                      <td style={styles.metaValue}>SG-FOR-08</td>
                    </tr>
                    <tr>
                      <td style={styles.metaLabel}>REVISION:</td>
                      <td style={styles.metaValue}>03</td>
                    </tr>
                    <tr>
                      <td style={styles.metaLabel}>FECHA:</td>
                      <td style={styles.metaValue}>{HEADER_DATE}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.metaLabel, borderBottom: 'none' }}>PAGINA:</td>
                      <td style={{ ...styles.metaValue, borderBottom: 'none' }}>01/01</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ ...styles.softHeader, borderTop: 'none', textAlign: 'left', paddingLeft: '8px' }}>DATOS DEL EMPLEADOR:</div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.softHeader, width: '24%' }}>RAZON SOCIAL O DENOMINACION SOCIAL</th>
              <th style={{ ...styles.softHeader, width: '13%' }}>RUC</th>
              <th style={{ ...styles.softHeader, width: '34%' }}>DOMICILIO (Direccion, distrito, departamento, provincia)</th>
              <th style={{ ...styles.softHeader, width: '10%' }}>ACTIVIDAD ECONOMICA</th>
              <th style={{ ...styles.softHeader, width: '19%' }}>N° TRABAJADORES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.cell}>RUAG S.R.L. TDA.</td>
              <td style={styles.cell}>20343680580</td>
              <td style={styles.cell}>Av. Paseo de la Republica No 4956, Miraflores - Lima</td>
              <td style={styles.cell}>CONSTRUCCION</td>
              <td style={styles.cell}>{docData.cantidad_trabajadores || ''}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '-1px' }}>
          <tbody>
            <tr>
              <td style={{ ...styles.softHeader, width: '12%', textAlign: 'left', paddingLeft: '6px' }}>OBRA:</td>
              <td style={{ ...styles.cell, width: '48%', textAlign: 'left', padding: 0 }}><div style={styles.topText}>{obra}</div></td>
              <td style={{ ...styles.softHeader, width: '9%' }}>CARGO:</td>
              <td style={{ ...styles.cell, width: '16%', padding: 0 }}><div style={styles.topTextCenter}>{cargo}</div></td>
              <td style={{ ...styles.softHeader, width: '6%' }}>DNI:</td>
              <td style={{ ...styles.cell, width: '9%', padding: 0 }}><div style={styles.topTextCenter}>{ficha.dni || ''}</div></td>
            </tr>
            <tr>
              <td style={{ ...styles.softHeader, textAlign: 'left', paddingLeft: '6px' }}>TRABAJADOR:</td>
              <td style={{ ...styles.cell, textAlign: 'left', padding: 0 }}><div style={styles.topText}>{trabajador}</div></td>
              <td style={{ ...styles.softHeader }}>ESPECIALIDAD:</td>
              <td colSpan={3} style={{ ...styles.cell, textAlign: 'left', padding: 0 }}><div style={styles.topText}>{especialidad}</div></td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '-1px' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...styles.softHeader, width: '19%' }}>DESCRIPCION DEL ARTICULO</th>
              <th colSpan={2} style={styles.softHeader}>1RA ENTREGA</th>
              <th colSpan={2} style={styles.softHeader}>2DA ENTREGA</th>
              <th colSpan={2} style={styles.softHeader}>3RA ENTREGA</th>
              <th colSpan={2} style={styles.softHeader}>4TA ENTREGA</th>
            </tr>
            <tr>
              <th style={styles.softHeader}>FECHA</th>
              <th style={styles.softHeader}>FIRMA</th>
              <th style={styles.softHeader}>FECHA</th>
              <th style={styles.softHeader}>FIRMA</th>
              <th style={styles.softHeader}>FECHA</th>
              <th style={styles.softHeader}>FIRMA</th>
              <th style={styles.softHeader}>FECHA</th>
              <th style={styles.softHeader}>FIRMA</th>
            </tr>
          </thead>
          <tbody>
            {EPP_ITEMS.map((item, rowIndex) => (
              <tr key={item}>
                <td style={styles.articleCell}>{item}</td>
                {[1, 2, 3, 4].map((delivery) => {
                  const dateValue = formatPrintDate(docData[`epp_${rowIndex}_delivery_${delivery}_date`])
                  return (
                    <React.Fragment key={`${rowIndex}-${delivery}`}>
                      <td style={styles.dataCell}>
                        <div style={styles.topTextCenter}>{dateValue}</div>
                      </td>
                      <td style={styles.signatureCell}>
                        <div style={styles.signatureWrap}>
                          {dateValue && firmaUrl ? (
                            <NormalizedSignatureImage
                              src={firmaUrl}
                              alt="Firma de conformidad"
                              style={{ maxWidth: '86%', maxHeight: '16px', objectFit: 'contain' }}
                            />
                          ) : null}
                        </div>
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '-1px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={styles.softHeader}>RESPONSABLE DEL REGISTRO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.softHeader, width: '13%', textAlign: 'left', paddingLeft: '6px' }}>Nombre:</td>
              <td style={{ ...styles.cell, padding: 0 }}><div style={styles.topText}>{toPrintUppercase(docData.responsable_nombre || '')}</div></td>
            </tr>
            <tr>
              <td style={{ ...styles.softHeader, textAlign: 'left', paddingLeft: '6px' }}>Cargo:</td>
              <td style={{ ...styles.cell, padding: 0 }}><div style={styles.topText}>{toPrintUppercase(docData.responsable_cargo || '')}</div></td>
            </tr>
            <tr>
              <td style={{ ...styles.softHeader, textAlign: 'left', paddingLeft: '6px' }}>Fecha:</td>
              <td style={{ ...styles.cell, padding: 0 }}><div style={styles.topText}>{formatPrintDate(docData.responsable_fecha)}</div></td>
            </tr>
            <tr>
              <td style={{ ...styles.softHeader, textAlign: 'left', paddingLeft: '6px' }}>Firma:</td>
              <td style={{ ...styles.cell, height: '11mm' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})

EntregaEppPrintable.displayName = 'EntregaEppPrintable'
