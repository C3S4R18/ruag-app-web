import { forwardRef } from 'react'

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    padding: '18mm 16mm',
    boxSizing: 'border-box',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 3fr 1.4fr',
    border: '1px solid #111',
  },
  cell: {
    borderRight: '1px solid #111',
    minHeight: 78,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
  },
  meta: {
    display: 'grid',
    gridTemplateRows: 'repeat(4, 1fr)',
    minHeight: 78,
  },
  metaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderBottom: '1px solid #111',
    fontSize: 10,
  },
  metaLabel: {
    padding: '4px 6px',
    fontWeight: 700,
    borderRight: '1px solid #111',
    background: '#f3f4f6',
  },
  metaValue: {
    padding: '4px 6px',
    textAlign: 'center',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
  },
  body: {
    marginTop: 36,
    fontSize: 15,
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  signatureWrap: {
    marginTop: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
  },
  signatureBox: {
    width: 260,
    minHeight: 74,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  signatureLine: {
    width: 320,
    borderTop: '1px solid #111',
    paddingTop: 8,
    textAlign: 'center',
    fontWeight: 700,
  },
  footerRow: {
    marginTop: 28,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: 700,
  },
  footerValue: {
    display: 'inline-block',
    minWidth: 200,
    borderBottom: '1px solid #111',
    paddingBottom: 4,
    marginLeft: 8,
    textAlign: 'center',
  },
  thumbBox: {
    width: 130,
    height: 120,
    border: '1px solid #111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#6b7280',
    overflow: 'hidden',
  },
}

function getFullName(ficha: any) {
  return [ficha?.nombres, ficha?.apellido_paterno, ficha?.apellido_materno].filter(Boolean).join(' ').trim()
}

function getDocData(ficha: any) {
  return ficha?.doc_states?.acta_acatamiento?.data || {}
}

function getSignatureUrl(ficha: any) {
  return ficha?.url_firma || ficha?.firma_url || ''
}

function getDateValue(raw?: string) {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString('es-PE')
}

export const ActaAcatamientoPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  const docData = getDocData(ficha)
  const fullName = getFullName(ficha)
  const dni = ficha?.dni || ''
  const signatureUrl = getSignatureUrl(ficha)
  const huellaUrl = ficha?.huella_url || ''
  const fecha = getDateValue(docData.fecha_documento)

  return (
    <div ref={ref} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.cell}>
          <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: 58, objectFit: 'contain' }} />
        </div>
        <div style={styles.cell}>
          <div style={styles.titleBlock}>
            <div style={styles.subtitle}>SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE</div>
            <div style={styles.title}>ACTA DE ACATAMIENTO</div>
          </div>
        </div>
        <div style={{ ...styles.cell, borderRight: 'none', padding: 0 }}>
          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>CODIGO</div>
              <div style={styles.metaValue}>SG-FOR-111</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>REVISION</div>
              <div style={styles.metaValue}>00</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>FECHA</div>
              <div style={styles.metaValue}>01/08/2024</div>
            </div>
            <div style={{ ...styles.metaRow, borderBottom: 'none' }}>
              <div style={styles.metaLabel}>PAGINA</div>
              <div style={styles.metaValue}>1 de 1</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.body}>
        <p>
          Yo, <strong>{fullName || '.............................................................'}</strong>, identificado con DNI N°
          <strong> {dni || '........................'}</strong>, me comprometo a cumplir con las disposiciones de
          seguridad establecidas en el Reglamento Interno de Seguridad y Salud en el Trabajo.
        </p>
        <p>
          Asi mismo, ratifico mi compromiso con el cumplimiento de los estandares, procedimientos,
          instructivos y normas de Seguridad, Salud Ocupacional y Medio Ambiente de la empresa RUAG S.R.L.
        </p>
      </div>

      <div style={styles.signatureWrap}>
        <div style={styles.signatureBox}>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Firma" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : null}
        </div>
        <div style={styles.signatureLine}>Firma</div>
      </div>

      <div style={styles.footerRow}>
        <div style={{ flex: 1 }}>
          <span style={styles.footerLabel}>Fecha:</span>
          <span style={styles.footerValue}>{fecha}</span>
        </div>
        <div style={styles.thumbBox}>
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

ActaAcatamientoPrintable.displayName = 'ActaAcatamientoPrintable'
