import React, { forwardRef } from 'react'

export const CargoRisstPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  const lugar = "LIMA" 

  const styles = {
    page: {
        width: '21cm',
        minHeight: '29.7cm',
        backgroundColor: '#ffffff',
        padding: '2cm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        boxSizing: 'border-box' as const,
        position: 'relative' as const
    },
    headerTable: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginBottom: '20px',
        border: '1px solid #000'
    },
    td: {
        border: '1px solid #000',
        padding: '5px',
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
        fontSize: '10px'
    },
    logoCell: {
        width: '20%',
        border: '1px solid #000',
        padding: '5px',
        textAlign: 'center' as const
    },
    titleCell: {
        width: '60%',
        border: '1px solid #000',
        fontWeight: 'bold',
        fontSize: '12px',
        textAlign: 'center' as const
    },
    mainBorder: {
        border: '2px solid #ef4444', // ROJO
        padding: '30px',
        marginTop: '20px',
        minHeight: '800px', 
        position: 'relative' as const
    },
    mainTitle: {
        textAlign: 'center' as const,
        fontWeight: 'bold',
        fontSize: '12px',
        marginBottom: '40px',
        lineHeight: '1.5'
    },
    bodyText: {
        textAlign: 'justify' as const,
        fontSize: '12px',
        lineHeight: '2', 
        marginBottom: '40px'
    },
    // CORRECCIÓN: Estilo para Lugar y Fecha (inline-block + padding)
    inlineField: {
        display: 'inline-block',
        borderBottom: '1px dotted #000',
        minWidth: '120px',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        paddingBottom: '2px', // Separa el texto de la línea
        marginLeft: '5px'
    },
    fieldSection: {
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px'
    },
    fieldRow: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px'
    },
    label: {
        fontSize: '12px',
        marginBottom: '2px'
    },
    valueLine: {
        borderBottom: '1px dotted #000',
        minHeight: '25px',
        fontSize: '13px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        paddingLeft: '10px',
        paddingBottom: '4px',
        display: 'flex',
        alignItems: 'flex-end'
    },
    signatureSection: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '50px',
        alignItems: 'flex-end'
    },
    signatureContainer: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-end'
    },
    fingerprintContainer: {
        width: '120px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '5px'
    },
    fingerprintBox: {
        width: '90px',
        height: '110px',
        border: '1px solid #000',
        borderRadius: '8px', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    }
  }

  return (
    <div ref={ref} style={styles.page}>
      
      {/* 1. HEADER TABLE */}
      <table style={styles.headerTable}>
        <tbody>
            <tr>
                <td style={styles.logoCell}>
                    {/* Asegúrate de que logo_ruag.png esté en la carpeta public */}
                    <img src="/logo_ruag.png" alt="RUAG" style={{maxWidth: '100%', maxHeight: '50px', objectFit: 'contain'}} />
                </td>
                <td style={styles.titleCell}>
                    <div>SISTEMA DE GESTIÓN INTEGRADOS</div>
                    <div style={{marginTop: '5px', fontSize: '13px'}}>REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO</div>
                </td>
                <td style={styles.td}>
                    <div style={{textAlign: 'left', fontSize: '9px'}}>
                        <div style={{borderBottom: '1px solid #000', padding: '2px'}}><strong>CÓDIGO:</strong> SG-RIT-01</div>
                        <div style={{borderBottom: '1px solid #000', padding: '2px'}}><strong>REVISIÓN:</strong> 01</div>
                        <div style={{borderBottom: '1px solid #000', padding: '2px'}}><strong>FECHA:</strong> 04/01/2024</div>
                        <div style={{padding: '2px'}}><strong>PÁGINA:</strong> 54 de 54</div>
                    </div>
                </td>
            </tr>
        </tbody>
      </table>

      {/* TITULO CENTRAL */}
      <div style={{textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px'}}>
          ANEXO N° 3 COMPROMISO
      </div>

      {/* 2. CONTENEDOR ROJO PRINCIPAL */}
      <div style={styles.mainBorder}>
          
          <div style={styles.mainTitle}>
              REGLAMENTO INTERNO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE<br/><br/>
              RECEPCIÓN DEL REGLAMENTO Y COMPROMISO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
          </div>

          {/* CUERPO DEL TEXTO */}
          <div style={styles.bodyText}>
              {/* LUGAR Y FECHA CORREGIDOS */}
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline'}}>
                  <div>Lugar: <span style={styles.inlineField}>{lugar}</span></div>
                  <div>Fecha: <span style={styles.inlineField}>{fechaActual}</span></div>
              </div>
              
              He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente de RUAG SRL, comprendo las disposiciones allí establecidas y me comprometo a cumplirlas siendo éstas condición de empleo.<br/>
              
              Así mismo, ratifico mi Compromiso con el cumplimiento de la Política de Seguridad, Salud Ocupacional y Medio Ambiente establecidos por RUAG SRL. FAVOR, ESCRIBIR CON LETRA IMPRENTA Y CLARA.
          </div>

          {/* CAMPOS DE LLENADO */}
          <div style={styles.fieldSection}>
              
              {/* Nombres y Apellidos */}
              <div style={styles.fieldRow}>
                  <div style={styles.label}>Nombres y Apellidos</div>
                  <div style={styles.valueLine}>
                      {ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}
                  </div>
              </div>

              {/* DNI */}
              <div style={styles.fieldRow}>
                  <div style={styles.label}>D.N.I.</div>
                  <div style={{...styles.valueLine, width: '50%'}}>
                      {ficha.dni}
                  </div>
              </div>

              {/* FIRMA Y HUELLA */}
              <div style={styles.signatureSection}>
                  
                  {/* Firma */}
                  <div style={styles.signatureContainer}>
                      <div style={{height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '5px', overflow:'hidden'}}>
                          {ficha.firma_url && (
                              <img src={ficha.firma_url} alt="Firma" style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}} />
                          )}
                      </div>
                      <div style={{borderTop: '1px dotted #000', paddingTop: '5px', fontSize: '12px'}}>
                          Firma
                      </div>
                  </div>

                  {/* Huella */}
                  <div style={styles.fingerprintContainer}>
                      <div style={styles.fingerprintBox}>
                          {ficha.huella_url && (
                              <img src={ficha.huella_url} alt="Huella" style={{maxHeight: '90%', maxWidth: '90%', objectFit: 'contain'}} />
                          )}
                      </div>
                      <div style={{fontSize: '12px'}}>Huella Digital</div>
                  </div>

              </div>

          </div>

      </div>

    </div>
  )
})

CargoRisstPrintable.displayName = 'CargoRisstPrintable'