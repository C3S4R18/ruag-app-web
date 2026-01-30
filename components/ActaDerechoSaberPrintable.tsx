import React, { forwardRef } from 'react'

export const ActaDerechoSaberPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null
  
  const docData = ficha.doc_states?.acta_derecho?.data || {}
  const fechaEmision = "01/08/2024" 

  // --- ESTILOS CORREGIDOS ---
  const styles = {
    page: {
      width: '21cm',
      minHeight: '29.7cm',
      padding: '1.5cm',
      margin: '0 auto',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '8px', 
      color: '#000',
      boxSizing: 'border-box' as const,
    },
    // Tabla general
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      borderSpacing: 0,
      marginBottom: '5px',
    },
    // Celdas básicas (Bordes explícitos para evitar error de React)
    cell: {
      border: '1px solid #000',
      padding: '2px 4px',
      verticalAlign: 'middle' as const,
      lineHeight: '1.1',
    },
    // Celdas de cabecera gris
    headerGray: {
      backgroundColor: '#d9d9d9',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      border: '1px solid #000',
      padding: '4px',
      verticalAlign: 'middle' as const,
    },
    // Celdas de etiquetas (Labels)
    labelCell: {
      backgroundColor: '#f2f2f2',
      fontWeight: 'bold',
      width: '110px',
      border: '1px solid #000',
      padding: '2px 4px',
      verticalAlign: 'middle' as const,
    },
    // Celdas de valor (Datos)
    valueCell: {
      textTransform: 'uppercase' as const,
      border: '1px solid #000',
      padding: '2px 4px',
      verticalAlign: 'middle' as const,
    },
    // Estilo específico para el Título Grande (sin borde inferior para simular unión)
    titleCellTop: {
      backgroundColor: '#d9d9d9',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      borderTop: '1px solid #000',
      borderLeft: '1px solid #000',
      borderRight: '1px solid #000',
      borderBottom: 'none', // Sin borde abajo
      padding: '4px',
      fontSize: '10px'
    },
    titleCellBottom: {
      backgroundColor: '#d9d9d9',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      borderTop: 'none', // Sin borde arriba
      borderLeft: '1px solid #000',
      borderRight: '1px solid #000',
      borderBottom: '1px solid #000',
      padding: '4px',
      fontSize: '14px'
    },
    // Lista
    listItem: {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '2px',
        fontSize: '8px'
    },
    checkbox: {
        width: '10px',
        height: '10px',
        border: '1px solid #000',
        marginRight: '5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '9px',
        fontWeight: 'bold',
        flexShrink: 0
    }
  }

  // Lista de 38 puntos
  const risks = [
      "Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA",
      "Reglamento Interno de Seguridad.",
      "Políticas de Seguridad y Salud Ocupacional y Medio Ambiente.",
      "Organización del sistema de gestión de la seguridad y salud en el trabajo en la obra.",
      "Derechos y obligaciones de los/las trabajadores/as y supervisores/as.",
      "Conceptos básicos de seguridad y salud en el trabajo.",
      "Reglas de tránsito (de ser aplicable a la obra).",
      "Conceptos básicos de seguridad y salud en el trabajo (Repaso).",
      "Plan de Seguridad y Salud Ocupacional, Plan de Prevención Ambiental",
      "Reconocimiento del área de trabajo.",
      "Elementos de protección personal, tipos requeridos, manejo correcto, Obligatoriedad y protecciones colectivas.",
      "Control de Emergencias, Incendios, Uso de Extintores, Primeros Auxilios, Atención de lesionados.",
      "Procedimiento Trabajo en Altura, Procedimientos de Trabajo Seguro, uso correcto de arnés de seguridad.",
      "Superficies de Trabajo; andamios, escaleras, plataformas, elevadores de personas, etc.",
      "Manejo de materiales; maniobras, trabajo con equipos de levante (Tirford, tecles, estrobos, etc.).",
      "Riesgos eléctricos, equipos energizados.",
      "Esmeril angular; uso seguro.",
      "Oxicorte; uso, riesgos y medidas preventivas.",
      "Cilindros de Gases Comprimidos; manejo, almacenamiento y transporte.",
      "Trabajos de soldadura.",
      "Excavaciones, Entibaciones, Fortificaciones y Taludes.",
      "Vaciado de Concreto.",
      "Housekeeping (Orden y Aseo).",
      "Código de colores y señalización.",
      "Exposición a Ruidos, polvo y vibraciones.",
      "Desplazamientos por áreas de trabajo.",
      "Higiene Personal, Recomendaciones.",
      "Control, Manejo, uso y transporte de sustancias peligrosas.",
      "Sistemas de bloqueos y uso de Tarjeta de Seguridad.",
      "Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.",
      "Combustibles; Manejo, Almacenamiento y Transporte.",
      "Cambio de conducta, Autocuidado, Reconocimiento, Sanciones, Contacto Personal.",
      "Prohibición de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.",
      "Identificación de Aspectos e Impactos Ambientales.",
      "Sobre Riesgos Ambientales, Manejo de residuos.",
      "Equipos Radioactivos.",
      "Preparación y respuesta ante emergencias.",
      "Trabajos de alto riesgo."
  ]

  return (
    <div ref={ref} style={styles.page}>
      
      {/* 1. HEADER */}
      <table style={styles.table}>
        <tbody>
          <tr>
            <td rowSpan={3} style={{...styles.cell, width: '18%', textAlign: 'center', padding: '2px'}}>
                <img src="/logo_ruag.png" alt="RUAG" style={{maxWidth: '100%', maxHeight: '50px', objectFit: 'contain'}} />
            </td>
            {/* Usamos estilo explícito sin mezclar border y borderBottom */}
            <td colSpan={2} style={styles.titleCellTop}>
                SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
            </td>
            <td style={styles.labelCell}>Código</td>
            <td style={{...styles.cell, textAlign: 'center', width: '70px'}}>SG-FOR-110</td>
          </tr>
          <tr>
            <td colSpan={2} rowSpan={2} style={styles.titleCellBottom}>
                ACTA DE DERECHO A SABER
            </td>
            <td style={styles.labelCell}>Revisión</td>
            <td style={{...styles.cell, textAlign: 'center'}}>0</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Fecha</td>
            <td style={{...styles.cell, textAlign: 'center'}}>{fechaEmision}</td>
          </tr>
        </tbody>
      </table>

      {/* 2. DATOS DEL TRABAJADOR Y FIRMA */}
      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={styles.labelCell}>OBRA:</td>
            <td colSpan={3} style={styles.valueCell}>{ficha.nombre_obra || 'OBRA CENTRAL'}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>EMPRESA:</td>
            <td colSpan={3} style={styles.valueCell}>RUAG S.R.L.</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>NOMBRE DEL TRABAJADOR:</td>
            <td colSpan={3} style={styles.valueCell}>
                {ficha.apellido_paterno} {ficha.apellido_materno}, {ficha.nombres}
            </td>
          </tr>
          <tr>
            <td style={styles.labelCell}>DNI:</td>
            <td colSpan={3} style={styles.valueCell}>{ficha.dni}</td>
          </tr>
          
          {/* BLOQUE DE FIRMA CORREGIDO */}
          <tr>
            <td style={styles.labelCell}>ESPECIALIDAD:</td>
            <td style={styles.valueCell}>{ficha.cargo}</td>
            
            {/* CELDA DE FIRMA: RowSpan 4, contenido alineado al fondo */}
            <td rowSpan={4} colSpan={2} style={{border: '1px solid #000', padding: 0, verticalAlign: 'bottom', width: '35%'}}>
                <div style={{
                    height: '100%', 
                    minHeight: '90px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    width: '100%'
                }}>
                    {/* Imagen de firma (si existe) */}
                    {ficha.firma_url && (
                        <div style={{flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2px', width: '100%'}}>
                            <img 
                                src={ficha.firma_url} 
                                alt="Firma" 
                                style={{
                                    maxHeight: '60px', // Altura máxima controlada
                                    maxWidth: '90%',   // Ancho máximo controlado
                                    objectFit: 'contain' 
                                }} 
                            />
                        </div>
                    )}
                    
                    {/* Línea y Texto */}
                    <div style={{width: '80%', borderTop: '1px solid #000', paddingTop: '2px', marginBottom: '5px', textAlign: 'center'}}>
                        <span style={{fontSize: '7px', fontWeight: 'bold'}}>FIRMA DEL TRABAJADOR</span>
                    </div>
                </div>
            </td>
          </tr>
          <tr>
            <td style={styles.labelCell}>CATEGORIA:</td>
            <td style={styles.valueCell}>OPERARIO</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>FECHA:</td>
            <td style={styles.valueCell}>{new Date().toLocaleDateString('es-PE')}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>DURACIÓN DE LA CHARLA:</td>
            <td style={styles.valueCell}>1.5 Hrs.</td>
          </tr>
        </tbody>
      </table>

      {/* 3. CUERPO DEL ACTA */}
      <div style={{border: '1px solid #000', marginBottom: '5px'}}>
          <div style={{
              backgroundColor: '#d9d9d9', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              padding: '4px', 
              borderBottom: '1px solid #000',
              fontSize: '10px'
          }}>
            ACTA DERECHO A SABER
          </div>
          <div style={{padding: '5px 8px'}}>
            <p style={{textAlign: 'justify', margin: '5px 0 8px 0', lineHeight: '1.3', fontSize: '9px'}}>
                A través de esta acta declaro haber sido informado acerca de todos los riesgos que entrañan las labores que desarrollaré en mi trabajo, así como las medidas preventivas que debo tomar para hacer de esto un método seguro de trabajo, además aquellos aspectos ambientales que tengan relación con mi puesto y área de trabajo.
            </p>
            
            {/* LISTA DE ITEMS */}
            <div>
                {risks.map((r, i) => (
                    <div key={i} style={styles.listItem}>
                        <div style={styles.checkbox}>
                            {docData[`topic_${i}`] ? 'X' : ''}
                        </div>
                        <div style={{flex: 1}}>
                            <strong>{i+1}.- </strong> {r}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* 4. FOOTER (EXPOSITOR) */}
      <div style={{fontSize: '7px', fontStyle: 'italic', marginBottom: '2px'}}>
      </div>
      <table style={styles.table}>
        <thead>
            <tr>
                <th colSpan={2} style={styles.headerGray}>EXPOSITOR (SSOMA)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style={{...styles.labelCell, width: '100px'}}>NOMBRE</td>
                <td style={{...styles.cell, height: '18px'}}></td>
            </tr>
            <tr>
                <td style={styles.labelCell}>CARGO</td>
                <td style={{...styles.cell, height: '18px'}}></td>
            </tr>
            <tr>
                <td style={styles.labelCell}>FIRMA</td>
                <td style={{...styles.cell, height: '35px'}}></td>
            </tr>
        </tbody>
      </table>

    </div>
  )
})
ActaDerechoSaberPrintable.displayName = 'ActaDerechoSaberPrintable'