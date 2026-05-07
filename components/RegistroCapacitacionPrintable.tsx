import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import PrintableCheckbox from './PrintableCheckbox'
import { buildWorkerLastNamesFirstUpper, toPrintUppercase } from './printText'

export const RegistroCapacitacionPrintable = forwardRef<HTMLDivElement, { ficha: any }>(
  ({ ficha }, ref) => {
    if (!ficha) return null

    const today = new Date()
    const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${today.getFullYear()}`
    const docData = ficha.doc_states?.capacitacion?.data || {}

    const isChecked = (index: number, fallback = false) => {
      if (docData[`topic_${index}`] === undefined) return fallback
      return !!docData[`topic_${index}`]
    }

    const trabajadorNombre = buildWorkerLastNamesFirstUpper(ficha)
    const especialidadEmpresa = `${toPrintUppercase(ficha.cargo || 'OPERARIO')} / RUAG`

    const styles = {
      page: {
        width: '21cm',
        minHeight: '29.7cm',
        padding: '1cm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '8px',
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
        padding: '3px 4px',
        verticalAlign: 'middle' as const,
        lineHeight: 1.15,
      },
      headerCell: {
        border: '1px solid #000',
        padding: '4px',
        fontWeight: 700,
        textAlign: 'center' as const,
        fontSize: '8px',
        lineHeight: 1.1,
      },
      label: {
        fontWeight: 700,
        fontSize: '7px',
      },
      metaRow: {
        display: 'grid',
        gridTemplateColumns: '46% 54%',
        borderBottom: '1px solid #000',
      } as const,
      metaCell: {
        padding: '3px 4px',
        fontSize: '7px',
        lineHeight: 1.15,
      },
      metaLabel: {
        fontWeight: 700,
      },
      centered: {
        textAlign: 'center' as const,
      },
      lineValue: {
        display: 'inline-block',
        minWidth: '80px',
      },
      signatureCell: {
        height: '30px',
        padding: 0,
      },
      signatureWrap: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '5px',
      },
      responsibleLine: {
        height: '32px',
      },
    }

    const blankRows = Array.from({ length: 25 }, (_, index) => index + 2)

    return (
      <div ref={ref} style={styles.page}>
        <style>{`
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        `}</style>

        <table style={styles.table}>
          <tbody>
            <tr>
              <td rowSpan={4} style={{ ...styles.cell, width: '17%', textAlign: 'center', padding: '4px' }}>
                <img src="/logo_ruag.png" alt="RUAG" style={{ maxWidth: '100%', maxHeight: '52px', objectFit: 'contain' }} />
              </td>
              <td rowSpan={4} style={{ ...styles.cell, width: '66%', textAlign: 'center', fontWeight: 700, fontSize: '9px', lineHeight: 1.2 }}>
                REGISTRO DE INDUCCION, CAPACITACION, ENTRENAMIENTO, SIMULACROS DE EMERGENCIA Y OTROS
              </td>
              <td style={{ ...styles.cell, width: '17%', padding: 0 }}>
                <div style={styles.metaRow}>
                  <div style={{ ...styles.metaCell, ...styles.metaLabel, borderRight: '1px solid #000' }}>CODIGO:</div>
                  <div style={styles.metaCell}>SG-FOR-01</div>
                </div>
                <div style={styles.metaRow}>
                  <div style={{ ...styles.metaCell, ...styles.metaLabel, borderRight: '1px solid #000' }}>REVISION:</div>
                  <div style={styles.metaCell}>01</div>
                </div>
                <div style={styles.metaRow}>
                  <div style={{ ...styles.metaCell, ...styles.metaLabel, borderRight: '1px solid #000' }}>FECHA:</div>
                  <div style={styles.metaCell}>04/01/2024</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '46% 54%' }}>
                  <div style={{ ...styles.metaCell, ...styles.metaLabel, borderRight: '1px solid #000' }}>PAGINA:</div>
                  <div style={styles.metaCell}>01/01</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '22%', ...styles.centered }}>
                <div style={styles.label}>RAZON SOCIAL O DENOMINACION SOCIAL:</div>
                <div>RUAG S.R.L TDA.</div>
              </td>
              <td style={{ ...styles.cell, width: '14%', ...styles.centered }}>
                <div style={styles.label}>RUC</div>
                <div>20343680580</div>
              </td>
              <td style={{ ...styles.cell, width: '30%', ...styles.centered }}>
                <div style={styles.label}>DOMICILIO (Direccion, distrito, departamento, provincia)</div>
                <div>Av. Paseo de la Republica No 4956 Miraflores - Lima</div>
              </td>
              <td style={{ ...styles.cell, width: '18%', ...styles.centered }}>
                <div style={styles.label}>ACTIVIDAD ECONOMICA:</div>
                <div>CONSTRUCCION</div>
              </td>
              <td style={{ ...styles.cell, width: '16%', ...styles.centered }}>
                <div style={styles.label}>N° TRABAJADORES EN EL CENTRO LABORAL:</div>
                <div>{docData.cantidad_trabajadores || ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, width: '17%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <strong>INDUCCION:</strong>
                  <PrintableCheckbox checked={isChecked(0)} size={14} fontSize={10} />
                </div>
              </td>
              <td style={{ ...styles.cell, width: '17%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <strong>CHARLA DE SEGURIDAD:</strong>
                  <PrintableCheckbox checked={isChecked(1)} size={14} fontSize={10} />
                </div>
              </td>
              <td style={{ ...styles.cell, width: '19%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <strong>ENTRENAMIENTO:</strong>
                  <PrintableCheckbox checked={isChecked(2)} size={14} fontSize={10} />
                </div>
              </td>
              <td style={{ ...styles.cell, width: '23%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <strong>SIMULACRO DE EMERGENCIA:</strong>
                  <PrintableCheckbox checked={isChecked(3)} size={14} fontSize={10} />
                </div>
              </td>
              <td style={{ ...styles.cell, width: '24%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <strong>CAPACITACION:</strong>
                  <PrintableCheckbox checked={isChecked(4, true)} size={14} fontSize={10} />
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={styles.cell}>
                <strong>OTROS (Especificar):</strong> {docData.otros_detalle || ''}
              </td>
              <td colSpan={2} style={styles.cell}>
                <strong>LUGAR:</strong> {docData.lugar || ''}
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={styles.cell}>
                <strong>TEMA:</strong> {docData.tema || 'INDUCCION GENERAL SSOMA'}
              </td>
            </tr>
            <tr>
              <td style={styles.cell}>
                <strong>FECHA:</strong> {docData.fecha || fechaActual}
              </td>
              <td style={styles.cell}>
                <strong>HORA INICIO:</strong> {docData.hora_inicio || ''}
              </td>
              <td style={styles.cell}>
                <strong>HORA FIN:</strong> {docData.hora_fin || ''}
              </td>
              <td colSpan={2} style={styles.cell}>
                <strong>TOTAL HORAS:</strong> {docData.total_horas || ''}
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ ...styles.cell, height: '34px' }}>
                <strong>NOMBRE DEL CAPACITADOR O ENTRENADOR:</strong> {docData.capacitador_nombre || ''}
              </td>
              <td colSpan={2} style={{ ...styles.cell, ...styles.signatureCell }}>
                <div style={styles.signatureWrap}>
                  {ficha.firma_url ? (
                    <NormalizedSignatureImage
                      src={ficha.firma_url}
                      alt="Firma"
                      style={{ maxHeight: '24px', maxWidth: '78%', objectFit: 'contain' }}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '8px' }}>
          <thead>
            <tr>
              <th style={{ ...styles.headerCell, width: '5%' }}>N°</th>
              <th style={{ ...styles.headerCell, width: '40%' }}>APELLIDOS Y NOMBRES DE LOS CAPACITADOS:</th>
              <th style={{ ...styles.headerCell, width: '16%' }}>N° DNI</th>
              <th style={{ ...styles.headerCell, width: '20%' }}>ESPECIALIDAD/EMPRESA</th>
              <th style={{ ...styles.headerCell, width: '19%' }}>FIRMA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, textAlign: 'center', height: '21px' }}>1</td>
              <td style={styles.cell}>{trabajadorNombre}</td>
              <td style={{ ...styles.cell, textAlign: 'center' }}>{ficha.dni}</td>
              <td style={{ ...styles.cell, textAlign: 'center' }}>{especialidadEmpresa}</td>
              <td style={{ ...styles.cell, ...styles.signatureCell }}>
                <div style={styles.signatureWrap}>
                  {ficha.firma_url ? (
                    <NormalizedSignatureImage
                      src={ficha.firma_url}
                      alt="Firma"
                      style={{ maxHeight: '24px', maxWidth: '78%', objectFit: 'contain' }}
                    />
                  ) : null}
                </div>
              </td>
            </tr>

            {blankRows.map((rowNumber) => (
              <tr key={rowNumber}>
                <td style={{ ...styles.cell, textAlign: 'center', height: '21px' }}>{rowNumber}</td>
                <td style={styles.cell}></td>
                <td style={styles.cell}></td>
                <td style={styles.cell}></td>
                <td style={styles.cell}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ ...styles.table, marginTop: '4px' }}>
          <tbody>
            <tr>
              <td style={{ ...styles.cell, height: '26px' }}>
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
              <td style={{ ...styles.cell, width: '17%' }}><strong>APELLIDOS Y NOMBRES:</strong></td>
              <td style={{ ...styles.cell, width: '43%' }}>{docData.responsable_nombre || ''}</td>
              <td style={{ ...styles.cell, width: '10%' }}><strong>FIRMA:</strong></td>
              <td style={{ ...styles.cell, width: '30%', ...styles.responsibleLine }}></td>
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
  }
)

RegistroCapacitacionPrintable.displayName = 'RegistroCapacitacionPrintable'
