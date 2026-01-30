import React, { forwardRef } from 'react'

export const EntregaEppPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const styles = {
    page: { width: '21cm', minHeight: '29.7cm', backgroundColor: '#fff', padding: '1.5cm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#000' },
    table: { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #000', marginBottom: '10px' },
    td: { border: '1px solid #000', padding: '3px' },
    th: { border: '1px solid #000', padding: '3px', fontWeight: 'bold', textAlign: 'center' as const, backgroundColor: '#eee' },
    logo: { color: '#d97706', fontWeight: 'bold', fontSize: '14px' },
    headerInfo: { marginBottom: '10px' }
  }

  const epps = [
      "BARBIQUEJO", "BOTAS PUNTA ACERO", "CASCO SEGURIDAD", "POLO", "CHALECO REFLEXIVO", 
      "LENTES CLAROS", "LENTES OSCUROS", "TAPONES AUDITIVOS", "GUANTES ANTICORTE", 
      "GUANTES CUERO", "GUANTES JEBE", "RESPIRADOR", "UNIFORME"
  ]

  return (
    <div ref={ref} style={styles.page}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <div style={styles.logo}>RUAG - CONSTRUCCIÓN</div>
            <div style={{textAlign:'right'}}><strong>CÓDIGO:</strong> SG-FOR-08 <br/> <strong>REV:</strong> 03</div>
        </div>

        <div style={{textAlign:'center', fontWeight:'bold', fontSize:'14px', marginBottom:'15px'}}>
            CONTROL DE ENTREGA DE EPP POR TRABAJADOR
        </div>

        <table style={styles.table}>
            <tbody>
                <tr>
                    <td style={styles.td}><strong>EMPLEADOR:</strong> RUAG S.R.L.</td>
                    <td style={styles.td}><strong>RUC:</strong> 20343680580</td>
                </tr>
                <tr>
                    <td style={styles.td} colSpan={2}><strong>DIRECCIÓN:</strong> Av. Paseo de la República 4956, Miraflores</td>
                </tr>
                <tr>
                    <td style={styles.td}><strong>TRABAJADOR:</strong> {ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}</td>
                    <td style={styles.td}><strong>DNI:</strong> {ficha.dni}</td>
                </tr>
                <tr>
                    <td style={styles.td}><strong>CARGO:</strong> {ficha.cargo}</td>
                    <td style={styles.td}><strong>OBRA:</strong> {ficha.nombre_obra}</td>
                </tr>
            </tbody>
        </table>

        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th} rowSpan={2}>DESCRIPCIÓN DEL ARTÍCULO</th>
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
            </tbody>
        </table>

        <div style={{marginTop: '20px', border: '1px solid #000', padding: '10px', width: '200px'}}>
            <div style={{textAlign:'center', marginBottom: '5px'}}><strong>FIRMA TRABAJADOR</strong></div>
            <div style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                 {ficha.firma_url ? <img src={ficha.firma_url} style={{maxHeight:'50px'}}/> : ''}
            </div>
        </div>
    </div>
  )
})
EntregaEppPrintable.displayName = 'EntregaEppPrintable'