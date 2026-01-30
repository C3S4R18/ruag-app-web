import React, { forwardRef } from 'react'

export const EntregaEppPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const styles = {
    page: { 
        width: '29.7cm', 
        minHeight: '21cm', 
        backgroundColor: '#ffffff', 
        padding: '1.5cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        fontSize: '9px', 
        color: '#000000',
        boxSizing: 'border-box' as const,
        position: 'relative' as const
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        border: '1px solid #000',
        marginBottom: '-1px'
    },
    // CORRECCIÓN: Padding aumentado para centrar y despegar de las líneas
    cell: {
        border: '1px solid #000',
        padding: '6px 4px', 
        verticalAlign: 'middle' as const,
        textAlign: 'center' as const,
        lineHeight: '1.1',
        fontSize: '9px'
    },
    headerCell: {
        border: '1px solid #000',
        padding: '6px 4px',
        fontWeight: 'bold',
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
        backgroundColor: '#e5e5e5', 
        fontSize: '9px'
    },
    // Estilo para las celdas de la derecha (Código, Revisión...)
    metaCell: {
        borderBottom: '1px solid #000',
        padding: '5px', // AUMENTADO para que no tache el texto
        textAlign: 'left' as const,
        fontSize: '8px'
    },
    alignLeft: {
        textAlign: 'left' as const,
        paddingLeft: '8px'
    },
    logo: {
        maxWidth: '100%',
        maxHeight: '50px',
        objectFit: 'contain' as const
    }
  }

  const epps = [
      "BARBIQUEJO", "BOTAS CON PUNTA DE ACERO", "CASCO DE SEGURIDAD", "POLO", 
      "CHALECO REFLEXIVO DE SEGURIDAD", "LENTES CLAROS DE SEGURIDAD", "LENTES OSCUROS", 
      "TAPONES AUDITIVOS", "GUANTES ANTICORTE NIVEL 5", "GUANTES DE CUERO", 
      "GUANTES DE JEBE", "GUANTES PARA SOLDAR", "CARETA O PROTECTOR FACIAL", 
      "MASCARILLA DESECHABLE", "RESPIRADOR DOBLE VIA", "RESPIRADOR DE UNA VIA", 
      "ESCARPINES", "MANDIL DE SOLDADURA", "ZAPATOS DIELECTRICOS", 
      "OVEROL O UNIFORME", "OTROS"
  ]

  return (
    <div ref={ref} style={styles.page}>
        
        {/* HEADER */}
        <table style={styles.table}>
            <tbody>
                <tr>
                    <td rowSpan={4} style={{...styles.cell, width: '15%'}}>
                        <img src="/logo_ruag.png" alt="RUAG" style={styles.logo} />
                    </td>
                    <td rowSpan={4} style={{...styles.cell, width: '70%', fontWeight: 'bold', fontSize: '14px'}}>
                        CONTROL DE ENTREGA DE EPP POR TRABAJADOR
                    </td>
                    {/* Celdas de metadatos corregidas */}
                    <td style={{border:'1px solid #000', padding:0, width:'15%', verticalAlign:'top'}}>
                        <div style={styles.metaCell}><strong>CÓDIGO:</strong> SG-FOR-08</div>
                        <div style={styles.metaCell}><strong>REVISIÓN:</strong> 03</div>
                        <div style={styles.metaCell}><strong>FECHA:</strong> 12/12/2025</div>
                        <div style={{padding: '5px', textAlign: 'left', fontSize:'8px'}}><strong>PÁGINA:</strong> 01/01</div>
                    </td>
                </tr>
            </tbody>
        </table>

        {/* DATOS EMPLEADOR */}
        <div style={{border: '1px solid #000', backgroundColor:'#e5e5e5', fontSize:'9px', fontWeight:'bold', padding:'5px 8px', borderBottom:'none', marginTop: '10px'}}>
            DATOS DEL EMPLEADOR:
        </div>
        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={{...styles.headerCell, width: '25%'}}>RAZÓN SOCIAL O DENOMINACIÓN SOCIAL</th>
                    <th style={{...styles.headerCell, width: '15%'}}>RUC</th>
                    <th style={{...styles.headerCell, width: '35%'}}>DOMICILIO (Dirección, distrito, departamento, provincia)</th>
                    <th style={{...styles.headerCell, width: '10%'}}>ACTIVIDAD ECONÓMICA</th>
                    <th style={{...styles.headerCell, width: '15%'}}>Nº TRABAJADORES</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={styles.cell}>RUAG S.R.L. TDA.</td>
                    <td style={styles.cell}>20343680580</td>
                    <td style={styles.cell}>Av. Paseo de la Republica No 4956 , Miraflores - Lima</td>
                    <td style={styles.cell}>Construcción</td>
                    <td style={styles.cell}></td>
                </tr>
            </tbody>
        </table>

        {/* DATOS TRABAJADOR */}
        <table style={{...styles.table, marginTop: '5px'}}>
            <tbody>
                <tr>
                    <td style={{...styles.cell, width: '15%', backgroundColor:'#f2f2f2', fontWeight:'bold', ...styles.alignLeft}}>OBRA:</td>
                    <td style={{...styles.cell, width: '55%', ...styles.alignLeft}}>{ficha.nombre_obra || 'OBRA CENTRAL'}</td>
                    <td style={{...styles.cell, width: '10%', backgroundColor:'#f2f2f2', fontWeight:'bold'}}>CARGO:</td>
                    <td style={{...styles.cell, width: '20%'}}>{ficha.cargo || 'OPERARIO'}</td>
                </tr>
                <tr>
                    <td style={{...styles.cell, backgroundColor:'#f2f2f2', fontWeight:'bold', ...styles.alignLeft}}>TRABAJADOR:</td>
                    <td style={{...styles.cell, ...styles.alignLeft}}>{ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}</td>
                    <td style={{...styles.cell, backgroundColor:'#f2f2f2', fontWeight:'bold'}}>DNI:</td>
                    <td style={styles.cell}>{ficha.dni}</td>
                </tr>
                <tr>
                    <td style={{...styles.cell, backgroundColor:'#f2f2f2', fontWeight:'bold', ...styles.alignLeft}}>ESPECIALIDAD:</td>
                    <td colSpan={3} style={{...styles.cell, ...styles.alignLeft}}>{ficha.cargo}</td>
                </tr>
            </tbody>
        </table>

        {/* TABLA EPP */}
        <table style={{...styles.table, marginTop: '5px'}}>
            <thead>
                <tr>
                    <th rowSpan={2} style={{...styles.headerCell, width: '20%'}}>DESCRIPCION DEL ARTICULO</th>
                    <th colSpan={2} style={{...styles.headerCell, width: '20%'}}>1RA ENTREGA</th>
                    <th colSpan={2} style={{...styles.headerCell, width: '20%'}}>2DA ENTREGA</th>
                    <th colSpan={2} style={{...styles.headerCell, width: '20%'}}>3RA ENTREGA</th>
                    <th colSpan={2} style={{...styles.headerCell, width: '20%'}}>4TA ENTREGA</th>
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
                        <td style={{...styles.cell, textAlign: 'left', paddingLeft: '5px', fontSize: '8px', height: '22px'}}>{epp}</td>
                        <td style={styles.cell}></td><td style={styles.cell}></td>
                        <td style={styles.cell}></td><td style={styles.cell}></td>
                        <td style={styles.cell}></td><td style={styles.cell}></td>
                        <td style={styles.cell}></td><td style={styles.cell}></td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* RESPONSABLE */}
        <table style={{...styles.table, marginTop: '0'}}>
            <thead>
                <tr>
                    <th colSpan={2} style={styles.headerCell}>RESPONSABLE DEL REGISTRO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={{...styles.cell, width: '20%', fontWeight: 'bold', ...styles.alignLeft}}>Nombre:</td>
                    <td style={styles.cell}></td>
                </tr>
                <tr>
                    <td style={{...styles.cell, fontWeight: 'bold', ...styles.alignLeft}}>Cargo:</td>
                    <td style={styles.cell}></td>
                </tr>
                <tr>
                    <td style={{...styles.cell, fontWeight: 'bold', ...styles.alignLeft}}>Fecha:</td>
                    <td style={styles.cell}></td>
                </tr>
                <tr>
                    <td style={{...styles.cell, fontWeight: 'bold', height: '50px', ...styles.alignLeft}}>Firma:</td>
                    <td style={styles.cell}></td>
                </tr>
            </tbody>
        </table>
    </div>
  )
})
EntregaEppPrintable.displayName = 'EntregaEppPrintable'