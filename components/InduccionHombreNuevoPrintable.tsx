import React, { forwardRef } from 'react'

export const InduccionHombreNuevoPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  // Extraemos la data guardada o usamos un objeto vacío si no existe
  const docData = ficha.doc_states?.induccion?.data || {}
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { 
        width: '21cm', 
        minHeight: '29.7cm', 
        backgroundColor: '#fff', 
        padding: '2cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        color: '#000', 
        fontSize: '10px',
        display: 'flex',
        flexDirection: 'column' as const,
        boxSizing: 'border-box' as const,
        position: 'relative' as const
    },
    // Tabla Header
    headerTable: { 
        width: '100%', 
        borderCollapse: 'collapse' as const, 
        border: '1px solid #000', 
        marginBottom: '30px' 
    },
    td: { 
        border: '1px solid #000', 
        padding: '5px',
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const
    },
    title: { 
        fontSize: '14px', 
        fontWeight: 'bold', 
        textAlign: 'center' as const 
    },
    // Datos del trabajador
    row: {
        display: 'flex',
        marginBottom: '12px',
        alignItems: 'flex-end', 
        fontSize: '11px'
    },
    label: {
        fontWeight: 'bold',
        marginRight: '5px',
        minWidth: 'fit-content'
    },
    valueLine: {
        flex: 1,
        borderBottom: '1px dotted #000',
        paddingLeft: '10px',
        paddingBottom: '2px', // Espacio para que no se pegue
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        minHeight: '16px'
    },
    // Lista de Checks
    checkboxList: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px'
    },
    checkItem: {
        display: 'flex',
        alignItems: 'center', 
        gap: '10px',
        fontSize: '11px'
    },
    box: {
        width: '14px',
        height: '14px',
        border: '1px solid #000',
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',     
        fontSize: '10px',
        fontWeight: 'bold',
        flexShrink: 0
    },
    // Estilo específico para la Fecha al pie (CORREGIDO)
    dateField: {
        display: 'inline-block',
        borderBottom: '1px solid #000',
        padding: '0 10px',
        paddingBottom: '3px', // Separación clave para que no tache el texto
        fontWeight: 'bold',
        minWidth: '100px',
        textAlign: 'center' as const
    },
    // Firmas al pie
    signatureSection: {
        marginTop: 'auto', 
        paddingTop: '50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    sigContainer: {
        width: '40%',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-end'
    },
    sigLine: {
        borderTop: '1px dotted #000',
        paddingTop: '5px',
        fontWeight: 'bold',
        fontSize: '10px'
    },
    sigImageContainer: {
        height: '70px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '5px',
        overflow: 'hidden'
    }
  }

  const topics = [
      "Política de Seguridad y Salud en el Trabajo.",
      "Organización del sistema de gestión de la seguridad y salud en el trabajo.",
      "Reglamento interno de Seguridad y Salud en el trabajo.",
      "Derecho y obligaciones de los trabajadores (as) y supervisores (as).",
      "Conceptos básicos de la seguridad y salud en el trabajo.",
      "Reglas de Transito (de ser aplicables a la obra).",
      "Trabajos de alto riesgo.",
      "Código de Colores y Señalización.",
      "Control de sustancias peligrosas.",
      "Preparación y respuesta ante emergencias.",
      "Equipos de protección personal y protecciones colectivas."
  ]

  return (
    <div ref={ref} style={styles.page}>
      
      {/* 1. HEADER */}
      <table style={styles.headerTable}>
        <tbody>
            <tr>
                <td style={{...styles.td, width: '20%'}}>
                    <img src="/logo_ruag.png" alt="RUAG" style={{maxWidth: '100%', maxHeight: '50px', objectFit: 'contain'}} />
                </td>
                <td style={{...styles.td, width: '55%'}}>
                    <div style={styles.title}>INDUCCIÓN HOMBRE NUEVO</div>
                </td>
                <td style={{...styles.td, width: '25%', padding: 0}}>
                    <div style={{display:'flex', borderBottom:'1px solid #000'}}>
                        <div style={{width:'50%', borderRight:'1px solid #000', padding:'2px', textAlign:'left', fontWeight:'bold', fontSize:'9px'}}>CÓDIGO:</div>
                        <div style={{width:'50%', padding:'2px', fontSize:'9px'}}>SG-FOR-06</div>
                    </div>
                    <div style={{display:'flex', borderBottom:'1px solid #000'}}>
                        <div style={{width:'50%', borderRight:'1px solid #000', padding:'2px', textAlign:'left', fontWeight:'bold', fontSize:'9px'}}>REVISIÓN:</div>
                        <div style={{width:'50%', padding:'2px', fontSize:'9px'}}>01</div>
                    </div>
                    <div style={{display:'flex', borderBottom:'1px solid #000'}}>
                        <div style={{width:'50%', borderRight:'1px solid #000', padding:'2px', textAlign:'left', fontWeight:'bold', fontSize:'9px'}}>FECHA:</div>
                        <div style={{width:'50%', padding:'2px', fontSize:'9px'}}>04/01/2024</div>
                    </div>
                    <div style={{display:'flex'}}>
                        <div style={{width:'50%', borderRight:'1px solid #000', padding:'2px', textAlign:'left', fontWeight:'bold', fontSize:'9px'}}>PÁGINA:</div>
                        <div style={{width:'50%', padding:'2px', fontSize:'9px'}}>01 / 01</div>
                    </div>
                </td>
            </tr>
        </tbody>
      </table>

      {/* 2. DATOS DEL TRABAJADOR */}
      <div style={{marginBottom: '30px', paddingLeft: '10px', paddingRight: '10px'}}>
          <div style={styles.row}>
              <div style={styles.label}>NOMBRE:</div>
              <div style={styles.valueLine}>{ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}</div>
              <div style={{...styles.label, marginLeft: '20px'}}>DNI:</div>
              <div style={{...styles.valueLine, flex: '0 0 120px'}}>{ficha.dni}</div>
          </div>
          
          <div style={styles.row}>
              <div style={styles.label}>FECHA DE INGRESO:</div>
              <div style={styles.valueLine}>{fechaActual}</div>
              <div style={{...styles.label, marginLeft: '20px'}}>OCUPACION/CARGO:</div>
              <div style={{...styles.valueLine, flex: '0 0 200px'}}>{ficha.cargo || 'OPERARIO'}</div>
          </div>
      </div>

      {/* 3. LISTA DE TEMAS (CHECKS) */}
      <div style={{paddingLeft: '20px', paddingRight: '20px'}}>
          <div style={styles.checkboxList}>
              {topics.map((t, i) => (
                  <div key={i} style={styles.checkItem}>
                      <div style={styles.box}>
                          {/* Lectura de datos guardados */}
                          {docData[`topic_${i}`] ? 'X' : ''}
                      </div>
                      <div>{t}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* 4. FECHA AL PIE (CORREGIDO) */}
      <div style={{marginTop: '40px', textAlign: 'right', paddingRight: '40px', fontSize: '11px'}}>
          Fecha: <span style={styles.dateField}>{fechaActual}</span>
      </div>

      {/* 5. FIRMAS */}
      <div style={styles.signatureSection}>
          
          {/* Firma Trabajador */}
          <div style={styles.sigContainer}>
              <div style={styles.sigImageContainer}>
                  {ficha.firma_url && (
                      <img 
                        src={ficha.firma_url} 
                        alt="Firma" 
                        style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}} 
                      />
                  )}
              </div>
              <div style={styles.sigLine}>
                  Firma del Trabajador.
              </div>
          </div>
          
          {/* Firma Supervisor */}
          <div style={styles.sigContainer}>
               <div style={styles.sigImageContainer}>
                   {/* Espacio para firma del supervisor */}
               </div>
               <div style={styles.sigLine}>
                  V°B° del Supervisor de Seguridad y<br/>
                  Salud en el Trabajo o Prevencionista de Riesgos
               </div>
          </div>

      </div>

    </div>
  )
})
InduccionHombreNuevoPrintable.displayName = 'InduccionHombreNuevoPrintable'