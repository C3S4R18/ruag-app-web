import React, { forwardRef } from 'react'

export const InduccionHombreNuevoPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { width: '21cm', minHeight: '29.7cm', backgroundColor: '#fff', padding: '2cm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '11px' },
    headerTable: { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #000', marginBottom: '20px' },
    td: { border: '1px solid #000', padding: '5px' },
    title: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' as const },
    logo: { color: '#d97706', fontWeight: 'bold', fontSize: '18px' },
    section: { marginBottom: '15px' },
    checkboxGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '8px' },
    checkItem: { display: 'flex', gap: '10px' },
    box: { width: '12px', height: '12px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' },
    signatureArea: { marginTop: '50px', display: 'flex', justifyContent: 'space-between' },
    sigBox: { width: '45%', borderTop: '1px solid #000', textAlign: 'center' as const, paddingTop: '5px' },
    imgSig: { height: '60px', objectFit: 'contain' as const, marginBottom: '-10px' }
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
                <td style={{...styles.td, width: '20%', textAlign: 'center'}}><div style={styles.logo}>RUAG</div></td>
                <td style={{...styles.td, width: '60%', textAlign: 'center'}}><div style={styles.title}>INDUCCIÓN HOMBRE NUEVO</div></td>
                <td style={{...styles.td, width: '20%', fontSize: '9px'}}>
                    <div>CÓDIGO: SG-FOR-06</div>
                    <div>REVISIÓN: 01</div>
                    <div>FECHA: 04/01/2024</div>
                </td>
            </tr>
        </tbody>
      </table>

      <div style={{marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
          <div><strong>NOMBRE:</strong> {ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}</div>
          <div><strong>DNI:</strong> {ficha.dni}</div>
          <div><strong>FECHA INGRESO:</strong> {fechaActual}</div>
          <div><strong>OCUPACIÓN:</strong> {ficha.cargo || 'OPERARIO'}</div>
      </div>

      <div style={styles.section}>
          <div style={{fontWeight: 'bold', marginBottom: '10px', textDecoration: 'underline'}}>TEMAS TRATADOS:</div>
          <div style={styles.checkboxGrid}>
              {topics.map((t, i) => (
                  <div key={i} style={styles.checkItem}>
                      <div style={styles.box}>X</div>
                      <div>{t}</div>
                  </div>
              ))}
          </div>
      </div>

      <div style={styles.signatureArea}>
          <div style={{width: '45%', textAlign: 'center'}}>
              <div style={{height: '70px', display: 'flex', alignItems: 'end', justifyContent: 'center'}}>
                  {ficha.firma_url ? <img src={ficha.firma_url} style={styles.imgSig}/> : null}
              </div>
              <div style={styles.sigBox}>
                  <strong>Firma del Trabajador</strong><br/>
                  DNI: {ficha.dni}
              </div>
          </div>
          <div style={{width: '45%', textAlign: 'center'}}>
               <div style={{height: '70px'}}></div>
               <div style={styles.sigBox}>
                  <strong>V°B° Supervisor SSOMA</strong>
               </div>
          </div>
      </div>
    </div>
  )
})
InduccionHombreNuevoPrintable.displayName = 'InduccionHombreNuevoPrintable'