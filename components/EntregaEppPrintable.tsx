import React, { forwardRef } from 'react'
import { buildWorkerLastNamesFirstUpper, getPrintObra, toPrintUppercase } from './printText'

export const EntregaEppPrintable = forwardRef<HTMLDivElement, { ficha: any }>(
  ({ ficha }, ref) => {
    if (!ficha) return null
    const docData = ficha.doc_states?.epp?.data || {}

    const trabajador = buildWorkerLastNamesFirstUpper(ficha)
    const cargo = toPrintUppercase(ficha.cargo || 'OPERARIO')
    const especialidad = cargo
    const obra = getPrintObra(ficha)

    const styles = {
      page: {
        width: '29.7cm',
        minHeight: '21cm',
        backgroundColor: '#ffffff',
        padding: '8mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9.5px',
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
        padding: '5px 6px',
        verticalAlign: 'middle' as const,
        textAlign: 'center' as const,
        lineHeight: 1.2,
        fontSize: '9.5px',
      },
      headerCell: {
        border: '1px solid #000',
        padding: '5px 4px',
        fontWeight: 700,
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
        backgroundColor: '#e5e5e5',
        fontSize: '9px',
      },
      metaWrap: {
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        minHeight: '72px',
        height: '100%',
      },
      metaRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid #000',
        fontSize: '8px',
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
      alignLeft: {
        textAlign: 'left' as const,
        paddingLeft: '6px',
      },
      logo: {
        maxWidth: '100%',
        maxHeight: '42px',
        objectFit: 'contain' as const,
      },
    }

    const epps = [
      'BARBIQUEJO',
      'BOTAS CON PUNTA DE ACERO',
      'CASCO DE SEGURIDAD',
      'POLO',
      'CHALECO REFLEXIVO DE SEGURIDAD',
      'LENTES CLAROS DE SEGURIDAD',
      'LENTES OSCUROS',
      'TAPONES AUDITIVOS',
      'GUANTES ANTICORTE NIVEL 5',
      'GUANTES DE CUERO',
      'GUANTES DE JEBE',
      'GUANTES PARA SOLDAR',
      'CARETA O PROTECTOR FACIAL',
      'MASCARILLA DESECHABLE',
      'RESPIRADOR DOBLE VIA',
      'RESPIRADOR DE UNA VIA',
      'ESCARPINES',
      'MANDIL DE SOLDADURA',
      'ZAPATOS DIELECTRICOS',
      'OVEROL O UNIFORME',
      'OTROS',
    ]

    return (
      <div ref={ref} style={styles.page}>
        <style>{`
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
        `}</style>

        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '15%' }}>
                <img src="/logo_ruag.png" alt="RUAG" style={styles.logo} />
              </td>
              <td style={{ ...styles.cell, width: '70%', fontWeight: 700, fontSize: '13px' }}>
                CONTROL DE ENTREGA DE EPP POR TRABAJADOR
              </td>
              <td style={{ border: '1px solid #000', padding: 0, width: '15%', verticalAlign: 'middle' }}>
                <div style={styles.metaWrap}>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>CÓDIGO</div>
                    <div style={styles.metaValue}>SG-FOR-08</div>
                  </div>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>REVISIÓN</div>
                    <div style={styles.metaValue}>03</div>
                  </div>
                  <div style={styles.metaRow}>
                    <div style={styles.metaLabel}>FECHA</div>
                    <div style={styles.metaValue}>12/12/2025</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '8px', alignItems: 'center' }}>
                    <div style={styles.metaLabel}>PÁGINA</div>
                    <div style={styles.metaValue}>01/01</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ border: '1px solid #000', backgroundColor: '#e5e5e5', fontSize: '9px', fontWeight: 700, padding: '4px 8px', borderBottom: 'none', marginTop: '6px' }}>
          DATOS DEL EMPLEADOR:
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.headerCell, width: '25%' }}>RAZÓN SOCIAL O DENOMINACIÓN SOCIAL</th>
              <th style={{ ...styles.headerCell, width: '15%' }}>RUC</th>
              <th style={{ ...styles.headerCell, width: '35%' }}>DOMICILIO (Dirección, distrito, departamento, provincia)</th>
              <th style={{ ...styles.headerCell, width: '10%' }}>ACTIVIDAD ECONÓMICA</th>
              <th style={{ ...styles.headerCell, width: '15%' }}>N° TRABAJADORES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.cell}>RUAG S.R.L. TDA.</td>
              <td style={styles.cell}>20343680580</td>
              <td style={styles.cell}>Av. Paseo de la Republica No 4956, Miraflores - Lima</td>
              <td style={styles.cell}>CONSTRUCCIÓN</td>
              <td style={styles.cell}>{docData.cantidad_trabajadores || ''}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '4px' }}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '15%', backgroundColor: '#f2f2f2', fontWeight: 700, ...styles.alignLeft }}>OBRA:</td>
              <td style={{ ...styles.cell, width: '55%', ...styles.alignLeft }}>{obra}</td>
              <td style={{ ...styles.cell, width: '10%', backgroundColor: '#f2f2f2', fontWeight: 700 }}>CARGO:</td>
              <td style={{ ...styles.cell, width: '20%' }}>{cargo}</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, backgroundColor: '#f2f2f2', fontWeight: 700, ...styles.alignLeft }}>TRABAJADOR:</td>
              <td style={{ ...styles.cell, ...styles.alignLeft }}>{trabajador}</td>
              <td style={{ ...styles.cell, backgroundColor: '#f2f2f2', fontWeight: 700 }}>DNI:</td>
              <td style={styles.cell}>{ficha.dni}</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, backgroundColor: '#f2f2f2', fontWeight: 700, ...styles.alignLeft }}>ESPECIALIDAD:</td>
              <td colSpan={3} style={{ ...styles.cell, ...styles.alignLeft }}>{especialidad}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '4px' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...styles.headerCell, width: '20%' }}>DESCRIPCIÓN DEL ARTÍCULO</th>
              <th colSpan={2} style={{ ...styles.headerCell, width: '20%' }}>1RA ENTREGA</th>
              <th colSpan={2} style={{ ...styles.headerCell, width: '20%' }}>2DA ENTREGA</th>
              <th colSpan={2} style={{ ...styles.headerCell, width: '20%' }}>3RA ENTREGA</th>
              <th colSpan={2} style={{ ...styles.headerCell, width: '20%' }}>4TA ENTREGA</th>
            </tr>
            <tr>
              <th style={styles.headerCell}>FECHA</th><th style={styles.headerCell}>FIRMA</th>
              <th style={styles.headerCell}>FECHA</th><th style={styles.headerCell}>FIRMA</th>
              <th style={styles.headerCell}>FECHA</th><th style={styles.headerCell}>FIRMA</th>
              <th style={styles.headerCell}>FECHA</th><th style={styles.headerCell}>FIRMA</th>
            </tr>
          </thead>
          <tbody>
            {epps.map((epp, i) => (
              <tr key={i}>
                <td style={{ ...styles.cell, textAlign: 'left', paddingLeft: '6px', fontSize: '8px', height: '20px' }}>{epp}</td>
                {[1, 2, 3, 4].map((delivery) => {
                  const dateValue = docData[`epp_${i}_delivery_${delivery}_date`] || ''
                  return (
                    <React.Fragment key={`${i}-${delivery}`}>
                      <td style={styles.cell}>{dateValue}</td>
                      <td style={styles.cell}></td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '0' }}>
          <thead>
            <tr>
              <th colSpan={2} style={styles.headerCell}>RESPONSABLE DEL REGISTRO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '20%', fontWeight: 700, ...styles.alignLeft }}>Nombre:</td>
              <td style={styles.cell}>{toPrintUppercase(docData.responsable_nombre || '')}</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, fontWeight: 700, ...styles.alignLeft }}>Cargo:</td>
              <td style={styles.cell}>{toPrintUppercase(docData.responsable_cargo || '')}</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, fontWeight: 700, ...styles.alignLeft }}>Fecha:</td>
              <td style={styles.cell}>{docData.responsable_fecha || ''}</td>
            </tr>
            <tr>
              <td style={{ ...styles.cell, fontWeight: 700, height: '28px', ...styles.alignLeft }}>Firma:</td>
              <td style={styles.cell}></td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
)

EntregaEppPrintable.displayName = 'EntregaEppPrintable'
