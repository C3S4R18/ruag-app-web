import React, { forwardRef } from 'react'

export const EntregaEppPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const styles = {
    page: { 
        width: '21cm', 
        minHeight: '29.7cm', 
        backgroundColor: '#fff', 
        padding: '2cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        fontSize: '10px', 
        color: '#000',
        display: 'flex',
        flexDirection: 'column' as const,
        boxSizing: 'border-box' as const
    },
    header: {
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #000',
        paddingBottom: '10px'
    },
    logo: { 
        color: '#d97706', 
        fontWeight: 'bold', 
        fontSize: '18px' 
    },
    title: {
        textAlign: 'center' as const, 
        fontWeight: 'bold', 
        fontSize: '14px', 
        marginBottom: '25px',
        textDecoration: 'underline'
    },
    // Estilo "Encima de la línea"
    fieldRow: {
        display: 'flex',
        alignItems: 'flex-end',
        marginBottom: '10px',
        gap: '10px'
    },
    label: {
        fontWeight: 'bold',
        minWidth: 'fit-content'
    },
    inlineInput: {
        borderBottom: '1px dotted #000',
        flex: 1,
        textAlign: 'center' as const,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        paddingBottom: '2px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const
    },
    // Tabla EPPs
    tableContainer: {
        marginTop: '20px',
        marginBottom: '20px'
    },
    table: { 
        width: '100%', 
        borderCollapse: 'collapse' as const, 
        border: '1px solid #000' 
    },
    td: { 
        border: '1px solid #000', 
        padding: '4px',
        verticalAlign: 'middle'
    },
    th: { 
        border: '1px solid #000', 
        padding: '5px', 
        fontWeight: 'bold', 
        textAlign: 'center' as const, 
        backgroundColor: '#f5f5f5',
        fontSize: '9px'
    },
    // Footer al final
    footer: {
        marginTop: 'auto',
        paddingTop: '20px'
    },
    signatureBox: {
        border: '1px solid #000', 
        padding: '5px', 
        width: '220px',
        height: '90px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'space-between'
    }
  }

  const epps = [
      "BARBIQUEJO", "BOTAS PUNTA ACERO", "CASCO SEGURIDAD", "POLO MANGALARGA", "CHALECO REFLEXIVO", 
      "LENTES CLAROS", "LENTES OSCUROS", "TAPONES AUDITIVOS", "GUANTES ANTICORTE", 
      "GUANTES CUERO", "GUANTES JEBE", "RESPIRADOR", "UNIFORME / OVEROL"
  ]

  return (
    <div ref={ref} style={styles.page}>
        {/* HEADER */}
        <div style={styles.header}>
            <div style={styles.logo}>RUAG <span style={{fontSize:'12px', color:'#000'}}>CONSTRUCCIÓN</span></div>
            <div style={{textAlign:'right', fontSize: '9px'}}>
                <strong>CÓDIGO:</strong> SG-FOR-08 <br/> 
                <strong>REV:</strong> 03
            </div>
        </div>

        <div style={styles.title}>
            CONTROL DE ENTREGA DE EPP POR TRABAJADOR
        </div>

        {/* DATOS GENERALES (Estilo Input) */}
        <div style={{marginBottom: '20px'}}>
            <div style={styles.fieldRow}>
                <span style={styles.label}>EMPLEADOR:</span>
                <span style={styles.inlineInput}>RUAG S.R.L.</span>
                <span style={styles.label}>RUC:</span>
                <span style={{...styles.inlineInput, flex: '0 0 150px'}}>20343680580</span>
            </div>
            
            <div style={styles.fieldRow}>
                <span style={styles.label}>DIRECCIÓN:</span>
                <span style={styles.inlineInput}>Av. Paseo de la República 4956, Miraflores</span>
            </div>

            <div style={styles.fieldRow}>
                <span style={styles.label}>TRABAJADOR:</span>
                <span style={styles.inlineInput}>
                    {ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}
                </span>
                <span style={styles.label}>DNI:</span>
                <span style={{...styles.inlineInput, flex: '0 0 120px'}}>
                    {ficha.dni}
                </span>
            </div>

            <div style={styles.fieldRow}>
                <span style={styles.label}>CARGO:</span>
                <span style={styles.inlineInput}>
                    {ficha.cargo || 'OPERARIO'}
                </span>
                <span style={styles.label}>OBRA:</span>
                <span style={styles.inlineInput}>
                    {ficha.nombre_obra || 'OBRA CENTRAL'}
                </span>
            </div>
        </div>

        {/* TABLA EPP */}
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.th, width: '30%'}} rowSpan={2}>DESCRIPCIÓN DEL ARTÍCULO</th>
                        <th style={styles.th} colSpan={2}>1RA ENTREGA</th>
                        <th style={styles.th} colSpan={2}>2DA ENTREGA</th>
                        <th style={styles.th} colSpan={2}>3RA ENTREGA</th>
                    </tr>
                    <tr>
                        <th style={styles.th}>FECHA</th><th style={styles.th}>FIRMA</th>
                        <th style={styles.th}>FECHA</th><th style={styles.th}>FIRMA</th>
                        <th style={styles.th}>FECHA</th><th style={styles.th}>FIRMA</th>
                    </tr>
                </thead>
                <tbody>
                    {epps.map((epp, i) => (
                        <tr key={i}>
                            <td style={styles.td}>{epp}</td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                        </tr>
                    ))}
                    {/* Filas vacías extra */}
                    {[...Array(3)].map((_, i) => (
                        <tr key={`empty-${i}`}>
                            <td style={{...styles.td, height: '20px'}}></td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                            <td style={styles.td}></td><td style={styles.td}></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* FOOTER & FIRMA */}
        <div style={styles.footer}>
            <div style={styles.signatureBox}>
                <div style={{textAlign:'center', width: '100%', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '5px', fontSize: '9px', fontWeight: 'bold'}}>
                    FIRMA TRABAJADOR
                </div>
                <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
                     {ficha.firma_url ? (
                         <img src={ficha.firma_url} style={{maxHeight:'60px', maxWidth: '90%', objectFit: 'contain'}} alt="Firma"/>
                     ) : (
                         <span style={{color: '#ccc', fontSize: '9px'}}>Pendiente</span>
                     )}
                </div>
            </div>
        </div>
    </div>
  )
})
EntregaEppPrintable.displayName = 'EntregaEppPrintable'