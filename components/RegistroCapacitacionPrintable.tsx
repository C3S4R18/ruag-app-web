import React, { forwardRef } from 'react'

export const RegistroCapacitacionPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  const docData = ficha.doc_states?.capacitacion?.data || {}

  const isChecked = (index: number, fallback = false) => {
    if (docData[`topic_${index}`] === undefined) return fallback
    return !!docData[`topic_${index}`]
  }

  const styles = {
    page: {
      width: '29.7cm',
      minHeight: '21cm',
      padding: '1.5cm',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#000000',
      boxSizing: 'border-box' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      border: '1px solid #000',
      marginBottom: '-1px',
    },
    cell: {
      border: '1px solid #000',
      padding: '4px 6px',
      verticalAlign: 'middle' as const,
      lineHeight: '1.2',
    },
    headerCell: {
      border: '1px solid #000',
      padding: '4px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      backgroundColor: '#ffffff',
      fontSize: '9px',
    },
    boldLabel: {
      fontWeight: 'bold',
      fontSize: '8px',
      marginBottom: '2px',
    },
    logo: {
      maxWidth: '100%',
      maxHeight: '50px',
      objectFit: 'contain' as const,
    },
    checkBox: {
      border: '1px solid #000',
      width: '12px',
      height: '12px',
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: '5px',
      verticalAlign: 'middle' as const,
      fontSize: '10px',
      fontWeight: 'bold',
      lineHeight: '1',
      flexShrink: 0,
    },
  }

  return (
    <div ref={ref} style={styles.page}>
      <table style={styles.table}>
        <tbody>
          <tr>
            <td rowSpan={4} style={{ ...styles.cell, width: '15%', textAlign: 'center' }}>
              <img src="/logo_ruag.png" alt="RUAG" style={styles.logo} />
              <div style={{ fontSize: '8px', marginTop: '2px' }}>construcción</div>
            </td>
            <td rowSpan={4} style={{ ...styles.cell, width: '70%', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              REGISTRO DE INDUCCIÓN, CAPACITACIÓN, ENTRENAMIENTO, SIMULACROS DE EMERGENCIA Y OTROS
            </td>
            <td style={{ ...styles.cell, width: '15%', fontSize: '8px', padding: '2px 4px' }}>
              <strong>CÓDIGO:</strong> SG-FOR-01
            </td>
          </tr>
          <tr>
            <td style={{ ...styles.cell, fontSize: '8px', padding: '2px 4px' }}>
              <strong>REVISIÓN:</strong> 01
            </td>
          </tr>
          <tr>
            <td style={{ ...styles.cell, fontSize: '8px', padding: '2px 4px' }}>
              <strong>FECHA:</strong> 04/01/2024
            </td>
          </tr>
          <tr>
            <td style={{ ...styles.cell, fontSize: '8px', padding: '2px 4px' }}>
              <strong>PÁGINA:</strong> 01/01
            </td>
          </tr>
        </tbody>
      </table>

      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, width: '20%', textAlign: 'center' }}>
              <div style={styles.boldLabel}>RAZÓN SOCIAL O DENOMINACIÓN SOCIAL:</div>
              <div>RUAG S.R.L. TDA.</div>
            </td>
            <td style={{ ...styles.cell, width: '15%', textAlign: 'center' }}>
              <div style={styles.boldLabel}>RUC</div>
              <div>20343680580</div>
            </td>
            <td style={{ ...styles.cell, width: '35%', textAlign: 'center' }}>
              <div style={styles.boldLabel}>DOMICILIO (Dirección, distrito, departamento, provincia)</div>
              <div>Av. Paseo de la Republica No 4956 Miraflores - Lima</div>
            </td>
            <td style={{ ...styles.cell, width: '15%', textAlign: 'center' }}>
              <div style={styles.boldLabel}>ACTIVIDAD ECONÓMICA:</div>
              <div>CONSTRUCCIÓN</div>
            </td>
            <td style={{ ...styles.cell, width: '15%', textAlign: 'center' }}>
              <div style={styles.boldLabel}>N° TRABAJADORES EN EL CENTRO LABORAL:</div>
              <div>{docData.cantidad_trabajadores || '________________'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, width: '12%' }}>
              <strong>INDUCCIÓN:</strong> <span style={styles.checkBox}>{isChecked(0) ? 'X' : ''}</span>
            </td>
            <td style={{ ...styles.cell, width: '15%' }}>
              <strong>CHARLA DE SEGURIDAD:</strong> <span style={styles.checkBox}>{isChecked(1) ? 'X' : ''}</span>
            </td>
            <td style={{ ...styles.cell, width: '15%' }}>
              <strong>ENTRENAMIENTO:</strong> <span style={styles.checkBox}>{isChecked(2) ? 'X' : ''}</span>
            </td>
            <td style={{ ...styles.cell, width: '20%' }}>
              <strong>SIMULACRO DE EMERGENCIA:</strong> <span style={styles.checkBox}>{isChecked(3) ? 'X' : ''}</span>
            </td>
            <td style={{ ...styles.cell, width: '15%' }}>
              <strong>CAPACITACIÓN:</strong> <span style={styles.checkBox}>{isChecked(4, true) ? 'X' : ''}</span>
            </td>
          </tr>

          <tr>
            <td colSpan={3} style={styles.cell}>
              <strong>OTROS (Especificar):</strong> {docData.otros_detalle || ''}
            </td>
            <td colSpan={2} style={styles.cell}>
              <strong>LUGAR:</strong> {docData.lugar || 'Oficina Ruag'}
            </td>
          </tr>

          <tr>
            <td colSpan={5} style={styles.cell}>
              <strong>TEMA:</strong> INDUCCIÓN GENERAL SSOMA
            </td>
          </tr>
        </tbody>
      </table>

      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, width: '20%' }}>
              <strong>FECHA:</strong> {docData.fecha || fechaActual}
            </td>
            <td style={{ ...styles.cell, width: '20%' }}>
              <strong>HORA INICIO:</strong> {docData.hora_inicio || ''}
            </td>
            <td style={{ ...styles.cell, width: '20%' }}>
              <strong>HORA FIN:</strong> {docData.hora_fin || ''}
            </td>
            <td style={{ ...styles.cell, width: '40%' }}>
              <strong>TOTAL HORAS:</strong> {docData.total_horas || '1.5 Hrs.'}
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ ...styles.cell, height: '40px', verticalAlign: 'top' }}>
              <strong>NOMBRE DEL CAPACITADOR O ENTRENADOR:</strong> {docData.capacitador_nombre || ''}
            </td>
            <td style={{ ...styles.cell, height: '40px', verticalAlign: 'top' }}>
              <strong>FIRMA</strong> {docData.capacitador_firma_texto ? `- ${docData.capacitador_firma_texto}` : ''}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...styles.table, marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ ...styles.headerCell, width: '5%' }}>N°</th>
            <th style={{ ...styles.headerCell, width: '35%' }}>APELLIDOS Y NOMBRES DE LOS CAPACITADOS:</th>
            <th style={{ ...styles.headerCell, width: '15%' }}>N° DNI</th>
            <th style={{ ...styles.headerCell, width: '25%' }}>ESPECIALIDAD/EMPRESA</th>
            <th style={{ ...styles.headerCell, width: '20%' }}>FIRMA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, textAlign: 'center' }}>1</td>
            <td style={styles.cell}>{ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}</td>
            <td style={{ ...styles.cell, textAlign: 'center' }}>{ficha.dni}</td>
            <td style={{ ...styles.cell, textAlign: 'center' }}>{ficha.cargo || 'OPERARIO'} / RUAG</td>
            <td style={{ ...styles.cell, padding: 0, height: '35px', textAlign: 'center' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ficha.firma_url ? (
                  <img src={ficha.firma_url} alt="Firma" style={{ maxHeight: '30px', maxWidth: '90%', objectFit: 'contain' }} />
                ) : null}
              </div>
            </td>
          </tr>

          {[...Array(15)].map((_, i) => (
            <tr key={i}>
              <td style={{ ...styles.cell, textAlign: 'center', height: '22px' }}>{i + 2}</td>
              <td style={styles.cell}></td>
              <td style={styles.cell}></td>
              <td style={styles.cell}></td>
              <td style={styles.cell}></td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ ...styles.table, marginTop: '5px' }}>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, height: '30px', verticalAlign: 'top' }}>
              <strong>OBSERVACIONES:</strong> {docData.observaciones || ''}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={styles.table}>
        <thead>
          <tr>
            <th colSpan={4} style={styles.headerCell}>RESPONSABLE DEL REGISTRO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...styles.cell, width: '15%' }}><strong>APELLIDOS Y NOMBRES:</strong></td>
            <td style={{ ...styles.cell, width: '35%' }}>{docData.responsable_nombre || ''}</td>
            <td style={{ ...styles.cell, width: '10%' }}><strong>FIRMA:</strong></td>
            <td style={{ ...styles.cell, width: '40%', height: '40px' }}>{docData.responsable_firma_texto || ''}</td>
          </tr>
          <tr>
            <td style={styles.cell}><strong>CARGO:</strong></td>
            <td style={styles.cell}>{docData.responsable_cargo || ''}</td>
            <td style={styles.cell}><strong>FECHA:</strong></td>
            <td style={styles.cell}>{docData.responsable_fecha || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

RegistroCapacitacionPrintable.displayName = 'RegistroCapacitacionPrintable'
