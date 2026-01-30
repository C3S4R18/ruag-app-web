import React, { forwardRef } from 'react'

export const ActaDerechoSaberPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    // Aumentamos padding y definimos flex para distribuir mejor el alto
    page: { 
        width: '21cm', 
        minHeight: '29.7cm', 
        backgroundColor: '#fff', 
        padding: '2.5cm', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        fontSize: '12px', // Letra más grande
        display: 'flex',
        flexDirection: 'column' as const,
        boxSizing: 'border-box' as const
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        borderBottom: '2px solid #000', 
        paddingBottom: '15px', 
        marginBottom: '25px' // Más espacio abajo
    },
    title: { 
        fontWeight: 'bold', 
        fontSize: '16px', // Título más grande
        textAlign: 'center' as const 
    },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '15px', // Más separación entre datos
        marginBottom: '25px',
        fontSize: '13px'
    },
    item: { 
        borderBottom: '1px solid #ccc',
        paddingBottom: '3px'
    },
    paragraph: {
        textAlign: 'justify' as const, 
        marginBottom: '20px',
        lineHeight: '1.5', // Mejor interlineado
        fontSize: '13px'
    },
    list: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px', // Más espacio entre items de la lista
        flex: 1 // Para que ocupe espacio disponible si es necesario
    },
    listItem: { 
        display: 'flex', 
        gap: '8px', 
        fontSize: '11px', // Lista un poco más grande
        alignItems: 'center'
    },
    box: {
        border: '1px solid #000', 
        width: '12px', 
        height: '12px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontSize: '10px',
        flexShrink: 0
    },
    // Footer con marginTop auto para irse al final de la hoja
    footer: { 
        marginTop: 'auto', 
        paddingTop: '40px',
        display: 'flex', 
        justifyContent: 'space-around' 
    },
    sigContainer: {
        textAlign: 'center' as const,
        width: '200px'
    },
    sigLine: {
        borderTop: '1px solid #000', 
        width: '100%', 
        paddingTop: '5px',
        marginTop: '5px',
        fontWeight: 'bold'
    },
    sigImageContainer: {
        height: '70px', 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        marginBottom: '5px'
    }
  }

  const risks = [
      "Ley de Accidentes 29783", "Reglamento Interno Seguridad", "Políticas SSOMA", "Organización Sistema Gestión",
      "Derechos y Obligaciones", "Conceptos Básicos SST", "Reglas de Tránsito", "Plan SST / Ambiental",
      "Reconocimiento Área Trabajo", "EPPs y Protecciones Colectivas", "Control Emergencias / Extintores",
      "Trabajos en Altura / Arnés", "Andamios y Escaleras", "Manejo Materiales / Izaje", "Riesgos Eléctricos",
      "Uso Esmeril Angular", "Oxicorte", "Gases Comprimidos", "Soldadura", "Excavaciones / Zanjas",
      "Vaciado Concreto", "Orden y Aseo (Housekeeping)", "Código Colores", "Ruido / Polvo / Vibración",
      "Higiene Personal", "Sustancias Peligrosas", "Bloqueo / Tarjeta Seguridad", "Maquinaria Pesada",
      "Combustibles", "Alcohol y Drogas", "Aspectos Ambientales"
  ]

  return (
    <div ref={ref} style={styles.page}>
        <div style={styles.header}>
            <div><strong>RUAG</strong><br/>CONSTRUCCIÓN</div>
            <div style={styles.title}>ACTA DE DERECHO A SABER<br/><span style={{fontSize:'12px', fontWeight: 'normal'}}>SG-FOR-110</span></div>
            <div style={{alignSelf: 'center'}}><strong>Fecha:</strong> {fechaActual}</div>
        </div>

        <div style={styles.grid}>
            <div style={styles.item}><strong>TRABAJADOR:</strong> {ficha.nombres} {ficha.apellido_paterno}</div>
            <div style={styles.item}><strong>DNI:</strong> {ficha.dni}</div>
            <div style={styles.item}><strong>CARGO:</strong> {ficha.cargo}</div>
            <div style={styles.item}><strong>OBRA:</strong> {ficha.nombre_obra}</div>
        </div>

        <p style={styles.paragraph}>
            A través de esta acta declaro haber sido informado acerca de todos los riesgos que entrañan las labores que desarrollaré en mi trabajo, así como las medidas preventivas que debo tomar para hacer de esto un método seguro de trabajo, además aquellos aspectos ambientales que tengan relación con mi puesto y área de trabajo.
        </p>

        <div style={styles.list}>
            {risks.map((r, i) => (
                <div key={i} style={styles.listItem}>
                    <div style={styles.box}>X</div>
                    <span>{i+1}. {r}</span>
                </div>
            ))}
        </div>

        <div style={styles.footer}>
            <div style={styles.sigContainer}>
                <div style={styles.sigImageContainer}>
                    {ficha.firma_url ? <img src={ficha.firma_url} style={{maxHeight:'65px', maxWidth: '100%'}}/> : null}
                </div>
                <div style={styles.sigLine}>
                    FIRMA TRABAJADOR<br/>
                    <span style={{fontWeight: 'normal', fontSize: '11px'}}>DNI: {ficha.dni}</span>
                </div>
            </div>
            <div style={styles.sigContainer}>
                <div style={styles.sigImageContainer}>
                    {ficha.huella_url ? 
                        <img src={ficha.huella_url} style={{maxHeight:'65px', maxWidth: '100%'}}/> 
                        : 
                        <div style={{width:'45px', height:'60px', border:'1px dashed #ccc', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#999'}}>Huella</div>
                    }
                </div>
                <div style={styles.sigLine}>
                    HUELLA DIGITAL
                </div>
            </div>
        </div>
    </div>
  )
})
ActaDerechoSaberPrintable.displayName = 'ActaDerechoSaberPrintable'