import React, { forwardRef } from 'react'

export const ActaEntregaIpercPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { width: '21cm', minHeight: '29.7cm', backgroundColor: '#fff', padding: '3cm 2.5cm', margin: '0 auto', fontFamily: '"Times New Roman", serif', fontSize: '12px', color: '#000', position: 'relative' as const },
    header: { border: '1px solid #000', padding: '10px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { color: '#d97706', fontWeight: 'bold', fontSize: '20px' },
    title: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' as const, textDecoration: 'underline', marginBottom: '40px' },
    body: { lineHeight: 2, textAlign: 'justify' as const, fontSize: '14px' },
    boldInput: { fontWeight: 'bold', textDecoration: 'underline' },
    footer: { marginTop: '80px', display: 'flex', flexDirection: 'column' as const, gap: '15px' },
    sigBox: { border: '1px solid #000', width: '200px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }
  }

  return (
    <div ref={ref} style={styles.page}>
        <div style={styles.header}>
            <div style={styles.logo}>RUAG</div>
            <div style={{textAlign: 'right', fontSize: '10px'}}>
                <strong>CÓDIGO:</strong> SG-FOR-112<br/>
                <strong>VERSIÓN:</strong> 01<br/>
                <strong>FECHA:</strong> 01/08/2024
            </div>
        </div>

        <div style={styles.title}>ACTA DE ENTREGA DE IPERC POR PUESTO DE TRABAJO</div>

        <div style={styles.body}>
            Yo, <span style={styles.boldInput}>{ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}</span>, 
            identificado con DNI/CE N° <span style={styles.boldInput}>{ficha.dni}</span>, 
            quien desempeño el cargo de <span style={styles.boldInput}>{ficha.cargo || 'OPERARIO'}</span> en la empresa 
            <strong> RUAG S.R.L.</strong> para el proyecto <span style={styles.boldInput}>{ficha.nombre_obra || 'OBRA CENTRAL'}</span>.
            <br/><br/>
            Por medio de la presente declaro haber recibido copia de la <strong>Matriz de Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC)</strong> 
            correspondiente a mi puesto de trabajo.
            <br/><br/>
            A su vez, declaro mi compromiso en leerla, comprenderla y acatar responsablemente las medidas de control descritas en la misma para salvaguardar mi integridad y la de mis compañeros.
            <br/><br/>
            En conformidad con lo mencionado y recepción, firmo el presente documento.
        </div>

        <div style={styles.footer}>
            <div>
                <strong>FECHA:</strong> {fechaActual}
            </div>
            
            <div style={{display: 'flex', gap: '50px', marginTop: '20px'}}>
                <div>
                    <div style={{marginBottom: '5px'}}><strong>FIRMA:</strong></div>
                    <div style={styles.sigBox}>
                        {ficha.firma_url ? <img src={ficha.firma_url} style={{maxWidth:'90%', maxHeight:'90%'}}/> : <span style={{color:'#ccc'}}>Firma</span>}
                    </div>
                </div>
                <div>
                    <div style={{marginBottom: '5px'}}><strong>HUELLA:</strong></div>
                    <div style={{...styles.sigBox, width: '100px'}}>
                        {ficha.huella_url ? <img src={ficha.huella_url} style={{maxWidth:'90%', maxHeight:'90%'}}/> : <span style={{color:'#ccc'}}>Huella</span>}
                    </div>
                </div>
            </div>
            
            <div style={{marginTop: '10px'}}>
                <strong>DNI:</strong> {ficha.dni}
            </div>
        </div>
    </div>
  )
})
ActaEntregaIpercPrintable.displayName = 'ActaEntregaIpercPrintable'