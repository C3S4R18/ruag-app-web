import React, { forwardRef } from 'react'

export const ActaDerechoSaberPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const styles = {
    page: { width: '21cm', minHeight: '29.7cm', backgroundColor: '#fff', padding: '2cm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '10px' },
    header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' },
    title: { fontWeight: 'bold', fontSize: '14px', textAlign: 'center' as const },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' },
    item: { borderBottom: '1px solid #ccc' },
    list: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' },
    listItem: { display: 'flex', gap: '5px', fontSize: '9px' },
    footer: { marginTop: '40px', display: 'flex', justifyContent: 'space-around' }
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
            <div style={styles.title}>ACTA DE DERECHO A SABER<br/><span style={{fontSize:'10px'}}>SG-FOR-110</span></div>
            <div>Fecha: {fechaActual}</div>
        </div>

        <div style={styles.grid}>
            <div style={styles.item}><strong>TRABAJADOR:</strong> {ficha.nombres} {ficha.apellido_paterno}</div>
            <div style={styles.item}><strong>DNI:</strong> {ficha.dni}</div>
            <div style={styles.item}><strong>CARGO:</strong> {ficha.cargo}</div>
            <div style={styles.item}><strong>OBRA:</strong> {ficha.nombre_obra}</div>
        </div>

        <p style={{textAlign: 'justify', marginBottom: '15px'}}>
            A través de esta acta declaro haber sido informado acerca de todos los riesgos que entrañan las labores que desarrollaré en mi trabajo, así como las medidas preventivas.
        </p>

        <div style={styles.list}>
            {risks.map((r, i) => (
                <div key={i} style={styles.listItem}>
                    <div style={{border:'1px solid #000', width:'10px', height:'10px', display:'flex', justifyContent:'center'}}>X</div>
                    {i+1}. {r}
                </div>
            ))}
        </div>

        <div style={styles.footer}>
            <div style={{textAlign: 'center'}}>
                <div style={{height: '60px', display:'flex', alignItems:'end', justifyContent:'center'}}>
                    {ficha.firma_url ? <img src={ficha.firma_url} style={{height:'50px'}}/> : null}
                </div>
                <div style={{borderTop: '1px solid #000', width: '150px', paddingTop: '5px'}}>
                    <strong>FIRMA TRABAJADOR</strong><br/>DNI: {ficha.dni}
                </div>
            </div>
            <div style={{textAlign: 'center'}}>
                <div style={{height: '60px', display:'flex', alignItems:'end', justifyContent:'center'}}>
                    {/* Huella */}
                    {ficha.huella_url ? <img src={ficha.huella_url} style={{height:'60px'}}/> : <div style={{width:'40px', height:'50px', border:'1px solid #ccc'}}></div>}
                </div>
                <div style={{borderTop: '1px solid #000', width: '150px', paddingTop: '5px'}}>
                    <strong>HUELLA DIGITAL</strong>
                </div>
            </div>
        </div>
    </div>
  )
})
ActaDerechoSaberPrintable.displayName = 'ActaDerechoSaberPrintable'