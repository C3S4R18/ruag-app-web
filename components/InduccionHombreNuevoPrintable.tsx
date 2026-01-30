import React, { forwardRef } from 'react'

export const InduccionHombreNuevoPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { 
        width: '21cm', 
        minHeight: '29.7cm', 
        backgroundColor: '#fff', 
        padding: '2.5cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        color: '#000', 
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column' as const,
        boxSizing: 'border-box' as const
    },
    headerTable: { 
        width: '100%', 
        borderCollapse: 'collapse' as const, 
        border: '1px solid #000', 
        marginBottom: '30px' 
    },
    td: { 
        border: '1px solid #000', 
        padding: '8px' 
    },
    title: { 
        fontSize: '16px', 
        fontWeight: 'bold', 
        textAlign: 'center' as const 
    },
    logo: { 
        color: '#d97706', 
        fontWeight: 'bold', 
        fontSize: '20px' 
    },
    // Estilo para datos "encima de la línea"
    inlineInput: {
        display: 'inline-block',
        borderBottom: '1px dotted #000',
        minWidth: '150px',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        padding: '0 10px',
        marginLeft: '5px',
        marginRight: '15px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        textTransform: 'uppercase' as const
    },
    row: {
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap' as const
    },
    section: { 
        marginTop: '20px',
        marginBottom: '20px',
        flex: 1 // Para que ocupe espacio si sobra
    },
    checkboxGrid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '12px', // Más espacio entre items
        marginTop: '15px'
    },
    checkItem: { 
        display: 'flex', 
        gap: '10px',
        alignItems: 'center'
    },
    box: { 
        width: '14px', 
        height: '14px', 
        border: '1px solid #000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '10px',
        fontWeight: 'bold'
    },
    // Footer al final de la página
    signatureArea: { 
        marginTop: 'auto', 
        paddingTop: '40px',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    sigContainer: {
        width: '40%', 
        textAlign: 'center' as const
    },
    sigBox: { 
        borderTop: '1px solid #000', 
        paddingTop: '5px',
        marginTop: '5px'
    },
    imgSig: { 
        height: '70px', 
        objectFit: 'contain' as const, 
        marginBottom: '-5px' 
    }
  }

  const topics = [
      "Política de Seguridad y Salud en el Trabajo.",
      "Organización del sistema de gestión de la seguridad y salud.",
      "Reglamento interno de Seguridad y Salud en el trabajo.",
      "Derecho y obligaciones de los trabajadores y supervisores.",
      "Conceptos básicos de la seguridad y salud en el trabajo.",
      "Reglas de Tránsito (de ser aplicables a la obra).",
      "Trabajos de alto riesgo.",
      "Código de Colores y Señalización.",
      "Control de sustancias peligrosas.",
      "Preparación y respuesta ante emergencias.",
      "Equipos de protección personal y protecciones colectivas."
  ]

  return (
    <div ref={ref} style={styles.page}>
      <table style={styles.headerTable}>
        <tbody>
            <tr>
                <td style={{...styles.td, width: '20%', textAlign: 'center'}}>
                    <div style={styles.logo}>RUAG</div>
                    <div style={{fontSize:'9px', letterSpacing: '2px'}}>CONSTRUCCIÓN</div>
                </td>
                <td style={{...styles.td, width: '60%', textAlign: 'center'}}>
                    <div style={styles.title}>INDUCCIÓN HOMBRE NUEVO</div>
                </td>
                <td style={{...styles.td, width: '20%', fontSize: '10px'}}>
                    <div><strong>CÓDIGO:</strong> SG-FOR-06</div>
                    <div><strong>REVISIÓN:</strong> 01</div>
                    <div><strong>FECHA:</strong> 04/01/2024</div>
                </td>
            </tr>
        </tbody>
      </table>

      {/* DATOS DEL TRABAJADOR */}
      <div style={{marginBottom: '30px'}}>
          <div style={styles.row}>
              <strong>NOMBRE:</strong> 
              <span style={{...styles.inlineInput, flex: 1, textAlign: 'left'}}>
                  {ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}
              </span>
          </div>
          
          <div style={styles.row}>
              <div style={{flex: 1}}>
                  <strong>DNI:</strong> 
                  <span style={styles.inlineInput}>{ficha.dni}</span>
              </div>
              <div style={{flex: 1}}>
                  <strong>FECHA DE INGRESO:</strong> 
                  <span style={styles.inlineInput}>{fechaActual}</span>
              </div>
          </div>

          <div style={styles.row}>
              <strong>OCUPACIÓN / CARGO:</strong> 
              <span style={{...styles.inlineInput, minWidth: '300px', textAlign: 'left'}}>
                  {ficha.cargo || 'OPERARIO'}
              </span>
          </div>
      </div>

      {/* TEMAS TRATADOS */}
      <div style={styles.section}>
          <div style={{fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline'}}>TEMAS TRATADOS:</div>
          <div style={styles.checkboxGrid}>
              {topics.map((t, i) => (
                  <div key={i} style={styles.checkItem}>
                      <div style={styles.box}>X</div>
                      <div>{t}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* FIRMAS (Al final de la hoja) */}
      <div style={styles.signatureArea}>
          <div style={styles.sigContainer}>
              <div style={{height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                  {ficha.firma_url ? <img src={ficha.firma_url} style={styles.imgSig} alt="Firma"/> : null}
              </div>
              <div style={styles.sigBox}>
                  <strong>Firma del Trabajador</strong><br/>
                  <span style={{fontSize: '10px'}}>DNI: {ficha.dni}</span>
              </div>
          </div>
          
          <div style={styles.sigContainer}>
               <div style={{height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                   {/* Espacio para sello/firma del supervisor */}
               </div>
               <div style={styles.sigBox}>
                  <strong>V°B° Supervisor SSOMA</strong><br/>
                  <span style={{fontSize: '10px'}}>Prevencionista de Riesgos</span>
               </div>
          </div>
      </div>
    </div>
  )
})
InduccionHombreNuevoPrintable.displayName = 'InduccionHombreNuevoPrintable'