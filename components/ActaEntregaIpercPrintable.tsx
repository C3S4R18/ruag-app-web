import React, { forwardRef } from 'react'

export const ActaEntregaIpercPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { 
        width: '21cm', 
        minHeight: '29.7cm', 
        backgroundColor: '#fff', 
        padding: '2.5cm 3cm', // Márgenes más amplios
        margin: '0 auto', 
        fontFamily: '"Times New Roman", serif', 
        fontSize: '12px', 
        color: '#000', 
        display: 'flex', // Flex para distribuir verticalmente
        flexDirection: 'column' as const,
        boxSizing: 'border-box' as const
    },
    header: { 
        border: '1px solid #000', 
        padding: '10px 20px', 
        marginBottom: '40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    logo: { 
        color: '#d97706', 
        fontWeight: 'bold', 
        fontSize: '24px' 
    },
    headerMeta: {
        textAlign: 'right' as const,
        fontSize: '10px',
        lineHeight: 1.4
    },
    title: { 
        fontSize: '18px', 
        fontWeight: 'bold', 
        textAlign: 'center' as const, 
        textDecoration: 'underline', 
        marginBottom: '50px',
        letterSpacing: '1px'
    },
    body: { 
        lineHeight: 2.5, // Interlineado amplio para que no se vea junto
        textAlign: 'justify' as const, 
        fontSize: '14px' 
    },
    // Estilo para datos "encima de la línea"
    inlineInput: {
        display: 'inline-block',
        borderBottom: '1px dotted #000',
        minWidth: '150px', // Ancho mínimo para líneas cortas
        textAlign: 'center' as const,
        fontWeight: 'bold',
        padding: '0 10px',
        margin: '0 5px',
        fontFamily: 'Arial, sans-serif', // Fuente diferente para simular llenado
        fontSize: '13px'
    },
    // Footer empujado al final
    footer: { 
        marginTop: 'auto', // Esto hace que ocupe toda la hoja
        paddingBottom: '20px',
        display: 'flex', 
        flexDirection: 'column' as const, 
        gap: '20px' 
    },
    sigSection: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '30px',
        gap: '20px'
    },
    sigContainer: {
        textAlign: 'center' as const,
        width: '220px'
    },
    sigImageContainer: {
        height: '80px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: '5px',
        borderBottom: '1px solid #000'
    },
    sigLabel: {
        fontWeight: 'bold',
        fontSize: '12px',
        marginTop: '5px'
    }
  }

  return (
    <div ref={ref} style={styles.page}>
        {/* ENCABEZADO */}
        <div style={styles.header}>
            <div style={styles.logo}>RUAG</div>
            <div style={styles.headerMeta}>
                <strong>CÓDIGO:</strong> SG-FOR-112<br/>
                <strong>VERSIÓN:</strong> 01<br/>
                <strong>FECHA:</strong> 01/08/2024
            </div>
        </div>

        {/* TÍTULO */}
        <div style={styles.title}>ACTA DE ENTREGA DE IPERC POR PUESTO DE TRABAJO</div>

        {/* CUERPO DEL TEXTO CON CAMPOS EN LÍNEA */}
        <div style={styles.body}>
            Yo, 
            <span style={{...styles.inlineInput, minWidth: '300px'}}>
                {ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}
            </span>, 
            identificado con DNI/CE N° 
            <span style={styles.inlineInput}>
                {ficha.dni}
            </span>, 
            quien desempeño el cargo de 
            <span style={styles.inlineInput}>
                {ficha.cargo || 'OPERARIO'}
            </span> 
            en la empresa <strong> RUAG S.R.L.</strong> para el proyecto 
            <span style={{...styles.inlineInput, minWidth: '200px'}}>
                {ficha.nombre_obra || 'OBRA CENTRAL'}
            </span>.
            <br/>
            Por medio de la presente declaro haber recibido copia de la <strong>Matriz de Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC)</strong> 
            correspondiente a mi puesto de trabajo.
            <br/>
            A su vez, declaro mi compromiso en leerla, comprenderla y acatar responsablemente las medidas de control descritas en la misma para salvaguardar mi integridad y la de mis compañeros.
            <br/>
            En conformidad con lo mencionado y recepción, firmo el presente documento.
        </div>

        {/* PIE DE PÁGINA (Al final de la hoja) */}
        <div style={styles.footer}>
            <div style={{fontSize: '14px'}}>
                <strong>FECHA:</strong> <span style={styles.inlineInput}>{fechaActual}</span>
            </div>
            
            <div style={styles.sigSection}>
                {/* FIRMA */}
                <div style={styles.sigContainer}>
                    <div style={styles.sigImageContainer}>
                        {ficha.firma_url ? (
                            <img src={ficha.firma_url} style={{maxHeight:'70px', maxWidth: '90%'}} alt="Firma"/>
                        ) : null}
                    </div>
                    <div style={styles.sigLabel}>FIRMA DEL TRABAJADOR</div>
                    <div style={{fontSize: '11px'}}>DNI: {ficha.dni}</div>
                </div>

                {/* HUELLA */}
                <div style={{...styles.sigContainer, width: '120px'}}>
                    <div style={{...styles.sigImageContainer, border: '1px solid #000', height: '100px', alignItems: 'center'}}>
                        {ficha.huella_url ? (
                            <img src={ficha.huella_url} style={{maxHeight:'90px', maxWidth: '90%'}} alt="Huella"/>
                        ) : (
                            <span style={{color:'#ccc', fontSize:'10px'}}>HUELLA</span>
                        )}
                    </div>
                    <div style={styles.sigLabel}>HUELLA DIGITAL</div>
                </div>
            </div>
        </div>
    </div>
  )
})
ActaEntregaIpercPrintable.displayName = 'ActaEntregaIpercPrintable'