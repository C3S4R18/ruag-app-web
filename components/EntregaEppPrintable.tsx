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

// Una sola tabla de 9 columnas (col1 = descripción/label, col2-9 = 4 entregas
// × fecha/firma). Todas las secciones usan colSpan para encajar en esta grilla.
// Así los bordes son una sola malla negra continua, sin solapamientos ni el
// efecto "tachado" que daban las tablas apiladas con margin negativo.
const B = '1px solid #000'
const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '297mm',
    minHeight: '210mm',
    padding: '4mm',
    background: '#fff',
    color: '#000',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  cell: {
    border: B,
    padding: '3px 5px',
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: '8.5px',
    lineHeight: 1.15,
  },
  cellLeft: {
    border: B,
    padding: '1px 6px',
    verticalAlign: 'middle',
    textAlign: 'left',
    fontSize: '8.3px',
    lineHeight: 1.1,
    textTransform: 'uppercase',
    height: '5.4mm',
  },
  label: {
    border: B,
    background: '#d9d9d9',
    padding: '3px 6px',
    verticalAlign: 'middle',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '8px',
    lineHeight: 1.15,
  },
  labelCenter: {
    border: B,
    background: '#d9d9d9',
    padding: '3px 4px',
    verticalAlign: 'middle',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '8px',
    lineHeight: 1.15,
  },
  title: {
    border: B,
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '14px',
    padding: '6px 10px',
    lineHeight: 1.15,
  },
  metaLabel: {
    border: B,
    padding: '1.5px 4px',
    fontSize: '7.5px',
    fontWeight: 700,
    textAlign: 'left',
    width: '55%',
  },
  metaValue: {
    border: B,
    padding: '1.5px 4px',
    fontSize: '7.5px',
    textAlign: 'center',
  },
  dataCell: {
    border: B,
    height: '5.4mm',
    padding: 0,
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: '8px',
  },
  sigWrap: {
    width: '100%',
    height: '5.4mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
      <style>{`@page { size: A4 landscape; margin: 0; }`}</style>

      <table style={styles.table}>
        {/* 9 columnas: descripción + 4 entregas (fecha/firma) */}
        <colgroup>
          <col style={{ width: '19%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10.5%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10.5%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10.5%' }} />
          <col style={{ width: '9.5%' }} />
          <col style={{ width: '10.5%' }} />
        </colgroup>
        <tbody>
          {/* CABECERA: logo | título | meta */}
          <tr>
            <td style={{ ...styles.cell, padding: '4px' }}>
              <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '52px', objectFit: 'contain' }} />
            </td>
            <td colSpan={6} style={styles.title}>CONTROL DE ENTREGA DE EPP POR TRABAJADOR</td>
            <td colSpan={2} style={{ ...styles.cell, padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={styles.metaLabel}>CÓDIGO:</td><td style={styles.metaValue}>SG-FOR-08</td></tr>
                  <tr><td style={styles.metaLabel}>REVISIÓN:</td><td style={styles.metaValue}>03</td></tr>
                  <tr><td style={styles.metaLabel}>FECHA:</td><td style={styles.metaValue}>{HEADER_DATE}</td></tr>
                  <tr><td style={{ ...styles.metaLabel, borderBottom: 'none' }}>PÁGINA:</td><td style={{ ...styles.metaValue, borderBottom: 'none' }}>01/01</td></tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* DATOS DEL EMPLEADOR */}
          <tr><td colSpan={9} style={styles.label}>DATOS DEL EMPLEADOR:</td></tr>
          <tr>
            <td colSpan={2} style={styles.labelCenter}>RAZÓN SOCIAL O DENOMINACIÓN SOCIAL</td>
            <td style={styles.labelCenter}>RUC</td>
            <td colSpan={3} style={styles.labelCenter}>DOMICILIO (Dirección, distrito, departamento, provincia)</td>
            <td style={styles.labelCenter}>ACTIVIDAD ECONÓMICA</td>
            <td colSpan={2} style={styles.labelCenter}>Nº TRABAJADORES</td>
          </tr>
          <tr>
            <td colSpan={2} style={styles.cell}>RUAG S.R.L. TDA.</td>
            <td style={styles.cell}>20343680580</td>
            <td colSpan={3} style={styles.cell}>Av. Paseo de la República No 4956, Miraflores - Lima</td>
            <td style={styles.cell}>CONSTRUCCIÓN</td>
            <td colSpan={2} style={styles.cell}>{docData.cantidad_trabajadores || ''}</td>
          </tr>

          {/* OBRA / CARGO / DNI */}
          <tr>
            <td style={styles.label}>OBRA:</td>
            <td colSpan={4} style={styles.cellLeft}>{obra}</td>
            <td style={styles.label}>CARGO:</td>
            <td style={styles.cell}>{cargo}</td>
            <td style={styles.label}>DNI:</td>
            <td style={styles.cell}>{ficha.dni || ''}</td>
          </tr>
          {/* TRABAJADOR / ESPECIALIDAD */}
          <tr>
            <td style={styles.label}>TRABAJADOR:</td>
            <td colSpan={4} style={styles.cellLeft}>{trabajador}</td>
            <td style={styles.label}>ESPECIALIDAD:</td>
            <td colSpan={3} style={styles.cellLeft}>{especialidad}</td>
          </tr>

          {/* CABECERA TABLA EPP */}
          <tr>
            <td rowSpan={2} style={styles.labelCenter}>DESCRIPCIÓN DEL ARTÍCULO</td>
            <td colSpan={2} style={styles.labelCenter}>1RA ENTREGA</td>
            <td colSpan={2} style={styles.labelCenter}>2DA ENTREGA</td>
            <td colSpan={2} style={styles.labelCenter}>3RA ENTREGA</td>
            <td colSpan={2} style={styles.labelCenter}>4TA ENTREGA</td>
          </tr>
          <tr>
            <td style={styles.labelCenter}>FECHA</td>
            <td style={styles.labelCenter}>FIRMA</td>
            <td style={styles.labelCenter}>FECHA</td>
            <td style={styles.labelCenter}>FIRMA</td>
            <td style={styles.labelCenter}>FECHA</td>
            <td style={styles.labelCenter}>FIRMA</td>
            <td style={styles.labelCenter}>FECHA</td>
            <td style={styles.labelCenter}>FIRMA</td>
          </tr>

          {/* FILAS EPP */}
          {EPP_ITEMS.map((item, rowIndex) => (
            <tr key={item}>
              <td style={styles.cellLeft}>{item}</td>
              {[1, 2, 3, 4].map((delivery) => {
                const dateValue = formatPrintDate(docData[`epp_${rowIndex}_delivery_${delivery}_date`])
                return (
                  <React.Fragment key={`${rowIndex}-${delivery}`}>
                    <td style={styles.dataCell}>{dateValue}</td>
                    <td style={styles.dataCell}>
                      {dateValue && firmaUrl ? (
                        <div style={styles.sigWrap}>
                          <NormalizedSignatureImage src={firmaUrl} alt="Firma" style={{ maxWidth: '86%', maxHeight: '16px', objectFit: 'contain' }} />
                        </div>
                      ) : null}
                    </td>
                  </React.Fragment>
                )
              })}
            </tr>
          ))}

          {/* RESPONSABLE DEL REGISTRO */}
          <tr><td colSpan={9} style={styles.labelCenter}>RESPONSABLE DEL REGISTRO</td></tr>
          <tr>
            <td style={styles.label}>Nombre:</td>
            <td colSpan={8} style={styles.cellLeft}>{toPrintUppercase(docData.responsable_nombre || '')}</td>
          </tr>
          <tr>
            <td style={styles.label}>Cargo:</td>
            <td colSpan={8} style={styles.cellLeft}>{toPrintUppercase(docData.responsable_cargo || '')}</td>
          </tr>
          <tr>
            <td style={styles.label}>Fecha:</td>
            <td colSpan={8} style={styles.cellLeft}>{formatPrintDate(docData.responsable_fecha)}</td>
          </tr>
          <tr>
            <td style={styles.label}>Firma:</td>
            <td colSpan={8} style={{ ...styles.cell, height: '11mm' }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

EntregaEppPrintable.displayName = 'EntregaEppPrintable'
