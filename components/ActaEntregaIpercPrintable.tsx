import React, { forwardRef } from 'react'

export const ActaEntregaIpercPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { 
        width: '21cm', // A4 Vertical
        minHeight: '29.7cm', 
        backgroundColor: '#ffffff', 
        padding: '2.5cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        fontSize: '11px', 
        color: '#000000',
        boxSizing: 'border-box' as const,
        position: 'relative' as const
    },
    // Tabla Header
    headerTable: { 
        width: '100%', 
        borderCollapse: 'collapse' as const, 
        border: '1px solid #000',
        marginBottom: '40px' 
    },
    td: { 
        border: '1px solid #000', 
        padding: '5px', 
        textAlign: 'center' as const, 
        verticalAlign: 'middle' as const 
    },
    // Títulos de Header
    headerTitle: { 
        fontWeight: 'bold', 
        fontSize: '14px',
        lineHeight: '1.5'
    },
    // Campos Inline (Subrayados)
    inlineField: {
        display: 'inline-block',
        borderBottom: '1px solid #000',
        minWidth: '50px',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        padding: '0 10px',
        paddingBottom: '2px', // Espacio para que no toque la línea
        marginBottom: '-2px'  // Ajuste visual
    },
    // Párrafos del cuerpo
    paragraph: {
        textAlign: 'justify' as const,
        marginBottom: '20px',
        lineHeight: '1.8', // Espaciado cómodo
        fontSize: '12px'
    },
    // Sección de Firma
    signatureSection: {
        marginTop: '100px',
        marginLeft: '50px', // Indentación según imagen
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '30px'
    },
    signatureRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px'
    },
    signatureLabel: {
        fontWeight: 'bold',
        width: '60px'
    },
    signatureLine: {
        borderBottom: '1px solid #000',
        width: '250px',
        height: '20px', // Altura para firma/texto
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '5px' // Espacio para que no toque
    }
  }

  return (
    <div ref={ref} style={styles.page}>
        
        {/* HEADER */}
        <table style={styles.headerTable}>
            <tbody>
                <tr>
                    <td rowSpan={3} style={{...styles.td, width: '20%'}}>
                        <img src="/logo_ruag.png" alt="RUAG" style={{maxWidth: '100%', maxHeight: '60px', objectFit: 'contain'}} />
                    </td>
                    <td rowSpan={3} style={{...styles.td, width: '60%'}}>
                        <div style={styles.headerTitle}>ACTA DE ENTREGA DE IPERC</div>
                        <div style={{...styles.headerTitle, marginTop: '5px'}}>POR PUESTO DE TRABAJO</div>
                    </td>
                    <td style={{...styles.td, width: '20%', padding: 0, fontSize: '10px'}}>
                        <div style={{borderBottom: '1px solid #000', padding: '4px', textAlign: 'left'}}><strong>CÓDIGO:</strong> SG-FOR-112</div>
                        <div style={{borderBottom: '1px solid #000', padding: '4px', textAlign: 'left'}}><strong>REVISIÓN:</strong> 01</div>
                        <div style={{borderBottom: '1px solid #000', padding: '4px', textAlign: 'left'}}><strong>FECHA:</strong> 1/08/2024</div>
                        <div style={{padding: '4px', textAlign: 'left'}}><strong>PÁGINA:</strong> 01 / 01</div>
                    </td>
                </tr>
            </tbody>
        </table>

        {/* CUERPO DEL TEXTO */}
        <div style={styles.paragraph}>
            Yo, <span style={{...styles.inlineField, minWidth: '400px'}}>{ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}</span>, 
            identificado con DNI/CE/Pasaporte Nº <span style={{...styles.inlineField, minWidth: '150px'}}>{ficha.dni}</span>, 
            desempeño el cargo de <span style={{...styles.inlineField, minWidth: '250px'}}>{ficha.cargo || 'OPERARIO'}</span> en la empresa <span style={{...styles.inlineField, minWidth: '150px'}}>RUAG S.R.L.</span> para el proyecto <span style={{...styles.inlineField, minWidth: '200px'}}>{ficha.nombre_obra || 'OBRA CENTRAL'}</span>.
        </div>

        <div style={styles.paragraph}>
            Por medio de la presente declaro haber recibido copia de la Matriz de Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC) de mi puesto de trabajo de parte de RUAG S.R.L.
        </div>

        <div style={styles.paragraph}>
            A su vez declaro mi compromiso en leerla, y acatar responsablemente las medidas de control descritas en la misma.
        </div>

        <div style={styles.paragraph}>
            En conformidad con lo mencionado y recepción,
        </div>

        {/* SECCIÓN DE FIRMA */}
        <div style={styles.signatureSection}>
            
            <div style={styles.signatureRow}>
                <div style={styles.signatureLabel}>FIRMA:</div>
                <div style={styles.signatureLine}>
                    {/* Imagen de firma centrada y contenida */}
                    {ficha.firma_url && (
                        <img src={ficha.firma_url} alt="Firma" style={{maxHeight: '50px', maxWidth: '90%', objectFit: 'contain', marginBottom: '-10px'}} />
                    )}
                </div>
            </div>

            <div style={styles.signatureRow}>
                <div style={styles.signatureLabel}>DNI:</div>
                <div style={{...styles.signatureLine, alignItems: 'center'}}>
                    <span style={{fontWeight: 'bold', fontSize: '12px'}}>{ficha.dni}</span>
                </div>
            </div>

            <div style={styles.signatureRow}>
                <div style={styles.signatureLabel}>FECHA:</div>
                <div style={{...styles.signatureLine, alignItems: 'center'}}>
                    <span style={{fontWeight: 'bold', fontSize: '12px'}}>{fechaActual}</span>
                </div>
            </div>

        </div>

    </div>
  )
})

ActaEntregaIpercPrintable.displayName = 'ActaEntregaIpercPrintable'