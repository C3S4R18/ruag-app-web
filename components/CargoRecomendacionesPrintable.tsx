import { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    padding: '14mm 16mm',
    boxSizing: 'border-box',
  },
  header: {
    border: '1px solid #111',
    display: 'grid',
    gridTemplateColumns: '1.2fr 3fr 1.4fr',
  },
  cell: {
    borderRight: '1px solid #111',
    minHeight: 86,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
  },
  titleBlock: {
    textAlign: 'center',
    lineHeight: 1.35,
  },
  titleSmall: {
    fontSize: 11,
    fontWeight: 800,
  },
  titleLarge: {
    fontSize: 17,
    fontWeight: 800,
    marginTop: 4,
  },
  meta: {
    display: 'grid',
    gridTemplateRows: 'repeat(4, 1fr)',
    minHeight: 86,
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
  paragraph: {
    fontSize: 14,
    lineHeight: 1.9,
    textAlign: 'justify',
  },
  lineText: {
    display: 'inline-block',
    borderBottom: '1px solid #111',
    minWidth: 120,
    textAlign: 'center',
    padding: '0 8px 2px',
    fontWeight: 700,
  },
  footer: {
    marginTop: 60,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 30,
  },
  signatureWrap: {
    flex: 1,
    textAlign: 'center',
  },
  signatureBox: {
    minHeight: 68,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #111',
    paddingTop: 8,
    fontWeight: 700,
  },
  thumb: {
    width: 130,
    height: 120,
    border: '1px solid #111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: 12,
    overflow: 'hidden',
  },
}

const getFullName = (ficha: any) => [ficha?.nombres, ficha?.apellido_paterno, ficha?.apellido_materno].filter(Boolean).join(' ').trim()
const getDocData = (ficha: any) => ficha?.doc_states?.rec_sst?.data || {}
const getSignatureUrl = (ficha: any) => ficha?.url_firma || ficha?.firma_url || ''
const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function splitDate(raw?: string) {
  const value = raw ? new Date(raw) : new Date()
  if (Number.isNaN(value.getTime())) return { city: 'Lima', day: '', month: '', year: '2026' }
  return {
    city: 'Lima',
    day: String(value.getDate()),
    month: months[value.getMonth()],
    year: String(value.getFullYear()),
  }
}

export const CargoRecomendacionesPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  const docData = getDocData(ficha)
  const fullName = getFullName(ficha)
  const dni = ficha?.dni || ''
  const signatureUrl = getSignatureUrl(ficha)
  const huellaUrl = ficha?.huella_url || ''
  const dateParts = splitDate(docData.fecha_documento)

  return (
    <div ref={ref} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.cell}>
          <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: 58, objectFit: 'contain' }} />
        </div>
        <div style={styles.cell}>
          <div style={styles.titleBlock}>
            <div style={styles.titleSmall}>SISTEMA DE GESTION INTEGRADOS</div>
            <div style={styles.titleLarge}>RECOMENDACIONES DE SEGURIDAD Y SALUD EN EL TRABAJO</div>
            <div style={{ ...styles.titleSmall, marginTop: 8 }}>CARGO DE RECEPCION</div>
          </div>
        </div>
        <div style={{ ...styles.cell, borderRight: 'none', padding: 0 }}>
          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>CODIGO</div>
              <div style={styles.metaValue}>SG-EST-24</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>REVISION</div>
              <div style={styles.metaValue}>01</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>FECHA</div>
              <div style={styles.metaValue}>04/01/2025</div>
            </div>
            <div style={{ ...styles.metaRow, borderBottom: 'none' }}>
              <div style={styles.metaLabel}>PAGINA</div>
              <div style={styles.metaValue}>11 de 11</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, fontSize: 13.5, textAlign: 'center', fontWeight: 700 }}>
        (Articulo 35 inciso c) de la Ley N° 29783 / Articulo 30 del DS N° 005-2012-TR
      </div>

      <div style={{ marginTop: 28 }}>
        <p style={styles.paragraph}>
          Yo, <span style={{ ...styles.lineText, minWidth: 280 }}>{fullName}</span>, trabajador de RUAG S.R.L.,
          identificado con Documento Nacional de Identidad o Carnet de Extranjeria N°
          <span style={styles.lineText}>{dni}</span>, declaro que he recibido una copia de las
          "Recomendaciones de Seguridad y Salud en el Trabajo", comprometiendome a hacer lectura y asumir con
          responsabilidad todas las recomendaciones en el documento, asi como respetar y cumplir los
          procedimientos y otras disposiciones de seguridad y salud en el trabajo que disponga la empresa.
        </p>
      </div>

      <div style={{ marginTop: 40, fontSize: 14 }}>
        {dateParts.city}, <span style={styles.lineText}>{dateParts.day}</span> de <span style={styles.lineText}>{dateParts.month}</span> del <span style={styles.lineText}>{dateParts.year}</span>
      </div>

      <div style={styles.footer}>
        <div style={styles.signatureWrap}>
          <div style={styles.signatureBox}>
            {signatureUrl ? (
              <NormalizedSignatureImage src={signatureUrl} alt="Firma" style={{ maxWidth: '82%', maxHeight: 48, objectFit: 'contain' }} />
            ) : null}
          </div>
          <div style={styles.signatureLine}>Firma</div>
        </div>
        <div style={styles.thumb}>
          {huellaUrl ? (
            <img src={huellaUrl} alt="Huella" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <span>Huella Digital</span>
          )}
        </div>
      </div>
    </div>
  )
})

CargoRecomendacionesPrintable.displayName = 'CargoRecomendacionesPrintable'
