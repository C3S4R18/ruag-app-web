import { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, getPrintObra, toPrintUppercase } from './printText'

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    padding: '16mm',
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
  titleWrap: {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 18,
    lineHeight: 1.35,
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
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  lineText: {
    display: 'inline-block',
    borderBottom: '1px solid #111',
    padding: '1px 8px 3px 8px',
    minWidth: 80,
    textAlign: 'center',
    fontWeight: 700,
    lineHeight: 1.05,
  },
  signatures: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 28,
    marginTop: 70,
  },
  signatureCol: {
    textAlign: 'center',
    fontSize: 13,
  },
  signatureBox: {
    height: 64,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 10,
  },
  signatureLine: {
    borderTop: '1px solid #111',
    paddingTop: 8,
    fontWeight: 700,
  },
}

const getFullName = (ficha: any) => buildWorkerFullNameUpper(ficha)
const getDocData = (ficha: any) => ficha?.doc_states?.acta_emo?.data || {}
const getSignatureUrl = (ficha: any) => ficha?.url_firma || ficha?.firma_url || ''
const formatDate = (raw?: string) => {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString('es-PE')
}

export const ActaEntregaResultadosEmoPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  const docData = getDocData(ficha)
  const fullName = getFullName(ficha)
  const dni = ficha?.dni || ''
  const cargo = toPrintUppercase(docData.cargo || ficha?.cargo || 'OPERARIO')
  const area = toPrintUppercase(docData.area || ficha?.area || '')
  const sedeObra = toPrintUppercase(docData.sede_obra || getPrintObra(ficha))
  const fechaEvaluacion = formatDate(docData.fecha_evaluacion)
  const fechaDocumento = formatDate(docData.fecha_documento)
  const colaboradorFirma = getSignatureUrl(ficha)
  const medicoFirmaTexto = docData.medico_ocupacional || 'Medico Ocupacional'

  return (
    <div ref={ref} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.cell}>
          <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: 58, objectFit: 'contain' }} />
        </div>
        <div style={styles.cell}>
          <div style={styles.titleWrap}>
            ACTA DE ENTREGA DE RESULTADOS
            <br />
            EXAMEN MEDICO OCUPACIONAL
          </div>
        </div>
        <div style={{ ...styles.cell, borderRight: 'none', padding: 0 }}>
          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>CODIGO</div>
              <div style={styles.metaValue}>SG-FOR-114</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>REVISION</div>
              <div style={styles.metaValue}>00</div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaLabel}>FECHA</div>
              <div style={styles.metaValue}>08/01/2024</div>
            </div>
            <div style={{ ...styles.metaRow, borderBottom: 'none' }}>
              <div style={styles.metaLabel}>PAGINA</div>
              <div style={styles.metaValue}>01 / 01</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 48 }}>
        <p style={styles.paragraph}>
          Yo, <span style={{ ...styles.lineText, minWidth: 280 }}>{fullName}</span> identificado con DNI/CE/Pasaporte N°
          <span style={styles.lineText}>{dni}</span>, con el cargo de
          <span style={{ ...styles.lineText, minWidth: 140 }}>{cargo}</span> en el area de
          <span style={{ ...styles.lineText, minWidth: 140 }}>{area}</span> y sede/obra
          <span style={{ ...styles.lineText, minWidth: 170 }}>{sedeObra}</span>.
        </p>

        <p style={styles.paragraph}>
          Por medio de la presente declaro que he sido informado por el medico ocupacional de la empresa
          sobre mi condicion de salud, soy conocedor y entendi los diagnosticos consignados en la evaluacion
          medica ocupacional con fecha <span style={{ ...styles.lineText, minWidth: 140 }}>{fechaEvaluacion}</span>,
          dando conformidad a la R.M 312-2011 TR.
        </p>

        <p style={styles.paragraph}>
          Asi mismo, me comprometo a seguir las recomendaciones e indicaciones medicas para conservar mi
          estado de salud en las labores que realizo para RUAG S.R.L.
        </p>
      </div>

      <div style={styles.signatures}>
        <div style={styles.signatureCol}>
          <div style={styles.signatureBox} />
          <div style={styles.signatureLine}>{medicoFirmaTexto}</div>
        </div>
        <div style={styles.signatureCol}>
          <div style={styles.signatureBox}>
            {colaboradorFirma ? (
              <NormalizedSignatureImage src={colaboradorFirma} alt="Firma colaborador" style={{ maxWidth: '82%', maxHeight: 48, objectFit: 'contain' }} />
            ) : null}
          </div>
          <div style={styles.signatureLine}>Firma Colaborador</div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>DNI: {dni}</div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>FECHA: {fechaDocumento}</div>
        </div>
      </div>
    </div>
  )
})

ActaEntregaResultadosEmoPrintable.displayName = 'ActaEntregaResultadosEmoPrintable'
