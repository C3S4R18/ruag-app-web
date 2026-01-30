import React, { forwardRef } from 'react'

export const CargoRisstPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')} / ${(today.getMonth() + 1).toString().padStart(2, '0')} / ${today.getFullYear()}`
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
    // Estilo para datos rellenados (Lugar/Fecha)
    inlineData: {
        display: 'inline-block',
        borderBottom: '1px dotted #000000',
        minWidth: '100px',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        padding: '0 10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px'
    },
    // FOOTER
    footerGrid: {
        marginTop: '50px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    // NUEVO ESTILO: Dato encima de la línea
    fieldContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        marginBottom: '5px'
    },
    label: {
        minWidth: '140px',
        paddingBottom: '5px' 
    },
    valueContainer: {
        flex: 1,
        borderBottom: '1px dotted #000',
        textAlign: 'center' as const,
        paddingBottom: '2px' // Espacio entre texto y linea
    },
    valueText: {
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fontSize: '14px',
        textTransform: 'uppercase' as const,
        color: '#000'
    },
    // BIOMETRÍA
    biometriaContainer: {
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '40px',
        alignItems: 'flex-end'
    },
    signatureBox: {
        border: '1px solid #000000',
        height: '100px',
        width: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        backgroundColor: '#fff'
    },
    fingerprintBox: {
        border: '1px solid #000000',
        height: '120px',
        width: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        backgroundColor: '#fff'
    },
    biometriaImg: {
        maxWidth: '90%',
        maxHeight: '90%',
        objectFit: 'contain' as const
    },
    placeholderText: {
        fontSize: '10px',
        color: '#ccc',
        textTransform: 'uppercase' as const
    }
  }

  return (
    <div ref={ref} style={styles.page}>
      
      {/* HEADER */}
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
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}><strong>CÓDIGO:</strong> SG-RIT-01</div>
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}><strong>REVISIÓN:</strong> 01</div>
                    <div style={{...styles.metaText, borderBottom: '1px solid #000', padding: '2px 5px'}}><strong>FECHA:</strong> 04/01/2024</div>
                    <div style={{...styles.metaText, padding: '2px 5px'}}><strong>PÁGINA:</strong> 54 de 54</div>
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

      {/* CUERPO */}
      <div style={{...styles.bodyText, display: 'flex', justifyContent: 'flex-end', gap: '20px'}}>
        <div>Lugar: <span style={styles.inlineData}>{lugar}</span></div>
        <div>Fecha: <span style={styles.inlineData}>{fechaActual}</span></div>
      </div>

      <div style={styles.bodyText}>
        He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente de RUAG SRL, comprendo las disposiciones allí establecidas y me comprometo a cumplirlas siendo éstas condición de empleo.
      </div>

      <div style={styles.bodyText}>
        Así mismo, ratifico mi Compromiso con el cumplimiento de la Política de Seguridad, Salud Ocupacional y Medio Ambiente establecidos por RUAG SRL.
      </div>

      <div style={{...styles.bodyText, marginTop: '30px', fontWeight: 'bold', textDecoration: 'underline'}}>
      </div>

      {/* FOOTER DATOS (Diseño: Dato ENCIMA de la línea) */}
      <div style={styles.footerGrid}>
          
          <div style={styles.fieldContainer}>
              <span style={styles.label}>Nombres y Apellidos:</span>
              <div style={styles.valueContainer}>
                  <span style={styles.valueText}>
                      {ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}
                  </span>
              </div>
          </div>

          <div style={styles.fieldContainer}>
              <span style={styles.label}>D.N.I.:</span>
              <div style={styles.valueContainer}>
                  <span style={styles.valueText}>
                      {ficha.dni}
                  </span>
              </div>
          </div>

          <div style={styles.fieldContainer}>
              <span style={styles.label}>Cargo:</span>
              <div style={styles.valueContainer}>
                  <span style={styles.valueText}>
                      {ficha.cargo || 'OPERARIO'}
                  </span>
              </div>
          </div>

          {/* ZONA DE FIRMA Y HUELLA AUTOMÁTICA */}
          <div style={styles.biometriaContainer}>
              <div>
                  <div style={{marginBottom: '5px', textAlign: 'center'}}>Firma:</div>
                  <div style={styles.signatureBox}>
                      {/* Detecta firma_url (base64 o url) */}
                      {ficha.firma_url ? (
                          <img src={ficha.firma_url} style={styles.biometriaImg} alt="Firma Digital" />
                      ) : (
                          <span style={styles.placeholderText}>Firma Pendiente</span>
                      )}
                  </div>
              </div>

              <div>
                  <div style={{marginBottom: '5px', textAlign: 'center'}}>Huella Digital:</div>
                  <div style={styles.fingerprintBox}>
                      {/* Detecta huella_url (base64 o url) */}
                      {ficha.huella_url ? (
                          <img src={ficha.huella_url} style={styles.biometriaImg} alt="Huella Digital" />
                      ) : (
                          <span style={styles.placeholderText}>Huella</span>
                      )}
                  </div>
              </div>
          </div>

      </div>

    </div>
  )
})

CargoRisstPrintable.displayName = 'CargoRisstPrintable'