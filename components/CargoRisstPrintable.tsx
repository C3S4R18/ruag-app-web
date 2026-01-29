import React, { forwardRef } from 'react'

export const CargoRisstPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()}`
  const lugar = "LIMA" 

  const styles = {
    page: {
        width: '21cm',
        minHeight: '29.7cm',
        backgroundColor: '#ffffff',
        padding: '2.5cm 2cm',
        margin: '0 auto',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        boxSizing: 'border-box' as const,
        position: 'relative' as const
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginBottom: '20px',
        border: '1px solid #000000'
    },
    td: {
        border: '1px solid #000000',
        padding: '5px',
        verticalAlign: 'middle',
        textAlign: 'center' as const
    },
    logoText: {
        fontWeight: 'bold',
        fontSize: '18px',
        color: '#d97706'
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: '12px',
        textAlign: 'center' as const
    },
    metaText: {
        fontSize: '10px',
        textAlign: 'left' as const,
        lineHeight: 1.4
    },
    mainTitle: {
        textAlign: 'center' as const,
        fontWeight: 'bold',
        textDecoration: 'underline',
        fontSize: '14px',
        marginTop: '30px',
        marginBottom: '30px'
    },
    bodyText: {
        fontSize: '12px',
        textAlign: 'justify' as const,
        lineHeight: 1.6,
        marginBottom: '15px'
    },
    // CORRECCIÓN: Estilo de línea de input mejorado
    inputLine: {
        display: 'inline-block',
        borderBottom: '1px dotted #000000',
        minWidth: '150px',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        paddingLeft: '10px',
        paddingRight: '10px',
        fontFamily: 'Arial, sans-serif', // Fuente distinta para diferenciar datos
        fontSize: '13px'
    },
    footerGrid: {
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '15px',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'baseline',
        marginBottom: '10px'
    },
    label: {
        minWidth: '140px', // Ancho fijo para alinear
        fontWeight: 'bold'
    },
    valueText: {
        flex: 1,
        borderBottom: '1px dotted #000',
        paddingLeft: '10px',
        fontFamily: 'Arial, sans-serif',
        textTransform: 'uppercase' as const,
        fontSize: '13px'
    },
    signatureBox: {
        marginTop: '10px',
        border: '1px solid #000000',
        height: '90px',
        width: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const
    }
  }

  return (
    <div ref={ref} style={styles.page}>
      
      {/* HEADER TIPO TABLA */}
      <table style={styles.table}>
        <tbody>
            <tr>
                <td style={{...styles.td, width: '20%'}}>
                    <div style={styles.logoText}>RUAG</div>
                    <div style={{fontSize: '8px'}}>construcción</div>
                </td>
                <td style={{...styles.td, width: '60%'}}>
                    <div style={styles.headerTitle}>SISTEMA DE GESTIÓN INTEGRADOS</div>
                    <div style={{fontSize: '14px', fontWeight: 'bold', marginTop: '5px'}}>REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO</div>
                </td>
                <td style={{...styles.td, width: '20%', padding: '0'}}>
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}>
                        <strong>CÓDIGO:</strong> SG-RIT-01
                    </div>
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}>
                        <strong>REVISIÓN:</strong> 01
                    </div>
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}>
                        <strong>FECHA:</strong> 04/01/2024
                    </div>
                    <div style={{...styles.metaText, padding: '2px 5px'}}>
                        <strong>PÁGINA:</strong> 54 de 54
                    </div>
                </td>
            </tr>
        </tbody>
      </table>

      {/* TITULOS */}
      <div style={styles.mainTitle}>
        ANEXO N° 3 COMPROMISO<br/>
        REGLAMENTO INTERNO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
      </div>

      <div style={{...styles.mainTitle, fontSize: '12px', textDecoration: 'none'}}>
        RECEPCIÓN DEL REGLAMENTO Y COMPROMISO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
      </div>

      {/* CUERPO - Usamos flex para alinear Lugar y Fecha */}
      <div style={{...styles.bodyText, display: 'flex', justifyContent: 'flex-end', gap: '20px'}}>
        <div>
            Lugar: <span style={styles.inputLine}>{lugar}</span>
        </div>
        <div>
            Fecha: <span style={styles.inputLine}>{fechaActual}</span>
        </div>
      </div>

      <div style={styles.bodyText}>
        He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente de RUAG SRL, comprendo las disposiciones allí establecidas y me comprometo a cumplirlas siendo éstas condición de empleo.
      </div>

      <div style={styles.bodyText}>
        Así mismo, ratifico mi Compromiso con el cumplimiento de la Política de Seguridad, Salud Ocupacional y Medio Ambiente establecidos por RUAG SRL.
      </div>

      <div style={{...styles.bodyText, marginTop: '30px', fontWeight: 'bold', textDecoration: 'underline'}}>
        FAVOR, ESCRIBIR CON LETRA IMPRENTA Y CLARA.
      </div>

      {/* FOOTER - ALINEACIÓN PERFECTA DE CAMPOS */}
      <div style={styles.footerGrid}>
          
          <div style={styles.inputGroup}>
              <span style={styles.label}>Nombres y Apellidos:</span>
              <span style={styles.valueText}>
                  {ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}
              </span>
          </div>

          <div style={styles.inputGroup}>
              <span style={styles.label}>D.N.I.:</span>
              <span style={styles.valueText}>
                  {ficha.dni}
              </span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '30px'}}>
              <div>
                  <div style={{marginBottom: '5px'}}>Firma:</div>
                  <div style={styles.signatureBox}>
                      {ficha.url_firma ? (
                          <img src={ficha.url_firma} crossOrigin="anonymous" style={{width: '180px', height: '80px', objectFit: 'contain'}} />
                      ) : (
                          <span style={{fontSize: '10px', color: '#ccc'}}>Firma Digital</span>
                      )}
                  </div>
              </div>

              <div>
                  <div style={{marginBottom: '5px'}}>Huella Digital:</div>
                  <div style={{...styles.signatureBox, width: '90px', height: '110px'}}>
                      {/* Espacio vacío para huella */}
                  </div>
              </div>
          </div>

      </div>

    </div>
  )
})

CargoRisstPrintable.displayName = 'CargoRisstPrintable'