import React, { forwardRef } from 'react'

export const RegistroCapacitacionPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { width: '29.7cm', minHeight: '21cm', backgroundColor: '#fff', padding: '2cm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box' as const, position: 'relative' as const }, // HORIZONTAL
    table: { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #000', marginBottom: '10px' },
    td: { border: '1px solid #000', padding: '4px', fontSize: '10px', verticalAlign: 'middle' },
    th: { border: '1px solid #000', padding: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#f0f0f0', textAlign: 'center' as const },
    logo: { color: '#d97706', fontWeight: 'bold', fontSize: '16px' },
    title: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' as const },
    input: { borderBottom: '1px dotted #000', padding: '0 5px', display: 'inline-block', minWidth: '20px' }
  }

  return (
    <div ref={ref} style={styles.page}>
      {/* HEADER */}
      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={{...styles.td, width: '15%', textAlign: 'center'}}>
                <div style={styles.logo}>RUAG</div>
                <div style={{fontSize:'8px'}}>construcción</div>
            </td>
            <td style={{...styles.td, width: '70%', textAlign: 'center'}}>
                <div style={styles.title}>REGISTRO DE INDUCCIÓN, CAPACITACIÓN, ENTRENAMIENTO, SIMULACROS DE EMERGENCIA Y OTROS</div>
            </td>
            <td style={{...styles.td, width: '15%'}}>
                <div><strong>CÓDIGO:</strong> SG-FOR-01</div>
                <div><strong>REVISIÓN:</strong> 01</div>
                <div><strong>FECHA:</strong> 04/01/2024</div>
                <div><strong>PÁGINA:</strong> 01/01</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* DATOS EMPRESA */}
      <table style={styles.table}>
        <tbody>
            <tr>
                <td style={styles.td}><strong>RAZÓN SOCIAL:</strong> RUAG S.R.L.</td>
                <td style={styles.td}><strong>RUC:</strong> 20343680580</td>
                <td style={styles.td}><strong>DOMICILIO:</strong> Av. Paseo de la República N° 4956 Miraflores</td>
            </tr>
            <tr>
                <td style={styles.td}><strong>ACTIVIDAD ECONÓMICA:</strong> CONSTRUCCIÓN</td>
                <td style={styles.td} colSpan={2}><strong>N° TRABAJADORES:</strong> ________________</td>
            </tr>
        </tbody>
      </table>

      {/* TIPO DE EVENTO */}
      <div style={{fontSize: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
          <span>INDUCCIÓN [ ]</span>
          <span>CHARLA DE SEGURIDAD [ ]</span>
          <span>ENTRENAMIENTO [ ]</span>
          <span>SIMULACRO [ ]</span>
          <span>CAPACITACIÓN [X]</span>
          <span>OTROS: _______________</span>
      </div>

      <div style={{fontSize: '10px', marginBottom: '10px', border: '1px solid #000', padding: '5px'}}>
          <strong>TEMA:</strong> INDUCCIÓN GENERAL SSOMA <br/>
          <strong>EXPOSITOR:</strong> __________________________________________________ <strong>FECHA:</strong> {fechaActual} <strong>HORA:</strong> ___________
      </div>

      {/* LISTA ASISTENTES (Solo llenamos la fila 1 con el trabajador actual) */}
      <table style={styles.table}>
        <thead>
            <tr>
                <th style={styles.th}>N°</th>
                <th style={styles.th}>APELLIDOS Y NOMBRES</th>
                <th style={styles.th}>DNI</th>
                <th style={styles.th}>CARGO / EMPRESA</th>
                <th style={styles.th}>FIRMA</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style={{...styles.td, textAlign: 'center'}}>1</td>
                <td style={styles.td}>{ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}</td>
                <td style={{...styles.td, textAlign: 'center'}}>{ficha.dni}</td>
                <td style={styles.td}>{ficha.cargo || 'OPERARIO'} / RUAG</td>
                <td style={{...styles.td, textAlign: 'center', height: '40px'}}>
                    {ficha.firma_url ? <img src={ficha.firma_url} style={{height: '30px', objectFit: 'contain'}} /> : ''}
                </td>
            </tr>
            {/* Filas vacías para rellenar el formato */}
            {[...Array(15)].map((_, i) => (
                <tr key={i}>
                    <td style={{...styles.td, textAlign: 'center'}}>{i + 2}</td>
                    <td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td>
                </tr>
            ))}
        </tbody>
      </table>

      <div style={{fontSize: '10px', marginTop: '20px'}}>
          <strong>OBSERVACIONES:</strong> _________________________________________________________________________________
      </div>
    </div>
  )
})
RegistroCapacitacionPrintable.displayName = 'RegistroCapacitacionPrintable'