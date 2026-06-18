import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, getSignatureDate } from './printText'

export const CargoRisstPrintable = forwardRef<HTMLDivElement, { ficha: any }>(
  ({ ficha }, ref) => {
    if (!ficha) return null

    const fechaActual = getSignatureDate(ficha)
    const lugar = 'OFICINA CENTRAL'
    const fullName = buildWorkerFullNameUpper(ficha)

    const styles = {
      page: {
        width: '21cm',
        minHeight: '29.7cm',
        backgroundColor: '#ffffff',
        padding: '16mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        boxSizing: 'border-box' as const,
      },
      headerTable: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        border: '1px solid #000',
        marginBottom: '12px',
      },
      td: {
        border: '1px solid #000',
        padding: '4px',
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
        fontSize: '10px',
      },
      logoCell: {
        width: '19%',
        border: '1px solid #000',
        padding: '4px',
        textAlign: 'center' as const,
      },
      titleCell: {
        width: '63%',
        border: '1px solid #000',
        fontWeight: 700,
        fontSize: '12px',
        textAlign: 'center' as const,
        lineHeight: 1.3,
      },
      metaWrap: {
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        height: '100%',
        minHeight: '86px',
      },
      metaRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid #000',
        fontSize: '9px',
        alignItems: 'center',
      },
      metaLabel: {
        borderRight: '1px solid #000',
        padding: '3px 4px',
        fontWeight: 700,
        textAlign: 'left' as const,
      },
      metaValue: {
        padding: '3px 4px',
        textAlign: 'center' as const,
      },
      mainBorder: {
        border: '1px solid #000',
        padding: '20px 24px 24px',
        minHeight: '235mm',
        boxSizing: 'border-box' as const,
        display: 'flex',
        flexDirection: 'column' as const,
      },
      mainTitle: {
        textAlign: 'center' as const,
        fontWeight: 700,
        fontSize: '12px',
        marginBottom: '20px',
        lineHeight: 1.5,
      },
      bodyText: {
        textAlign: 'justify' as const,
        fontSize: '12px',
        lineHeight: 1.9,
        marginBottom: '26px',
      },
      inlineField: {
        display: 'inline-block',
        borderBottom: '1px dotted #000',
        minWidth: '150px',
        textAlign: 'center' as const,
        fontWeight: 700,
        padding: '0 8px 6px',
        marginLeft: '5px',
        textTransform: 'uppercase' as const,
        lineHeight: 1,
      },
      fieldSection: {
        marginTop: '34px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '18px',
        flex: 1,
      },
      fieldRow: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
      },
      label: {
        fontSize: '12px',
        marginBottom: '2px',
      },
      valueLine: {
        borderBottom: '1px dotted #000',
        minHeight: '28px',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        paddingLeft: '10px',
        paddingTop: '0',
        paddingBottom: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        lineHeight: 1,
      },
      signatureSection: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 'auto',
        alignItems: 'flex-end',
        paddingTop: '36px',
      },
      signatureContainer: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-end',
      },
      fingerprintContainer: {
        width: '120px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '8px',
        marginBottom: '2px',
      },
      fingerprintBox: {
        width: '90px',
        height: '110px',
        border: '1px solid #000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
    }

    return (
      <div ref={ref} style={styles.page}>
        <table style={styles.headerTable}>
          <tbody>
            <tr>
              <td style={styles.logoCell}>
                <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }} />
              </td>
              <td style={styles.titleCell}>
                <div>SISTEMA DE GESTION INTEGRADOS</div>
                <div style={{ marginTop: '5px', fontSize: '13px' }}>REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO</div>
              </td>
              <td style={{ ...styles.td, width: '18%', padding: 0 }}>
                <div style={styles.metaWrap}>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>CÓDIGO:</div>
                    <div style={styles.metaValue}>SG-RIT-01</div>
                  </div>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>REVISIÓN:</div>
                    <div style={styles.metaValue}>01</div>
                  </div>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>FECHA:</div>
                    <div style={styles.metaValue}>04/01/2024</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '9px', alignItems: 'center' }}>
                    <div style={styles.metaLabel}>PÁGINA:</div>
                    <div style={styles.metaValue}>54 de 54</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px', marginBottom: '10px' }}>
          ANEXO N° 3 COMPROMISO
        </div>

        <div style={styles.mainBorder}>
          <div style={styles.mainTitle}>
            REGLAMENTO INTERNO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
            <br />
            <br />
            RECEPCION DEL REGLAMENTO Y COMPROMISO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
          </div>

          <div style={styles.bodyText}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline' }}>
              <div>
                Lugar: <span style={styles.inlineField}>{lugar}</span>
              </div>
              <div>
                Fecha: <span style={styles.inlineField}>{fechaActual}</span>
              </div>
            </div>

            He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente de RUAG SRL, comprendo las disposiciones alli establecidas y me comprometo a cumplirlas siendo estas condicion de empleo.
            <br />
            <br />
            Asi mismo, ratifico mi Compromiso con el cumplimiento de la Politica de Seguridad, Salud Ocupacional y Medio Ambiente establecidos por RUAG SRL. FAVOR, ESCRIBIR CON LETRA IMPRENTA Y CLARA.
          </div>

          <div style={styles.fieldSection}>
            <div style={styles.fieldRow}>
              <div style={styles.label}>Nombres y Apellidos</div>
              <div style={styles.valueLine}>{fullName}</div>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.label}>D.N.I.</div>
              <div style={{ ...styles.valueLine, width: '50%' }}>{ficha.dni}</div>
            </div>

            <div style={styles.signatureSection}>
              <div style={styles.signatureContainer}>
                <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '5px', overflow: 'hidden' }}>
                  {ficha.firma_url && (
                    <NormalizedSignatureImage src={ficha.firma_url} alt="Firma" style={{ maxHeight: '46px', maxWidth: '80%', objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ borderTop: '1px dotted #000', paddingTop: '5px', fontSize: '12px' }}>Firma</div>
              </div>

              <div style={styles.fingerprintContainer}>
                <div style={styles.fingerprintBox}>
                  {ficha.huella_url && (
                    <img src={ficha.huella_url} alt="Huella" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ fontSize: '12px' }}>Huella Digital</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

CargoRisstPrintable.displayName = 'CargoRisstPrintable'
