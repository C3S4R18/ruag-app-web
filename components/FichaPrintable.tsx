import React, { forwardRef } from 'react'

const check = (valorReal: string | null, valorEsperado: string) => {
    return valorReal?.toLowerCase() === valorEsperado.toLowerCase() ? 'X' : ''
}

export const FichaPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  // --- ESTILOS EN LÍNEA (CSS PURO) PARA EVITAR ERROR "LAB" ---
  const styles = {
    container: {
        width: '21cm',
        minHeight: '29.7cm',
        backgroundColor: '#ffffff', // Blanco puro HEX
        padding: '2rem',
        margin: '0 auto',
        border: '2px solid #000000', // Negro puro HEX
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        boxSizing: 'border-box' as const
    },
    headerTitle: {
        fontSize: '1.5rem',
        fontWeight: 900,
        textTransform: 'uppercase' as const,
        lineHeight: 1.1,
        marginBottom: '1rem',
        color: '#000000'
    },
    box: {
        border: '1px solid #000000',
        padding: '2px 6px',
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        backgroundColor: '#ffffff'
    },
    sectionTitle: {
        backgroundColor: '#e5e7eb', // Gris claro HEX
        border: '1px solid #000000',
        textAlign: 'center' as const,
        fontWeight: 900,
        fontSize: '13px',
        textTransform: 'uppercase' as const,
        padding: '4px 0',
        marginTop: '10px',
        color: '#000000'
    },
    label: {
        fontWeight: 900,
        fontSize: '9px',
        marginRight: '6px',
        whiteSpace: 'nowrap' as const,
        color: '#000000'
    },
    value: {
        fontWeight: 'bold',
        fontSize: '11px',
        color: '#1e3a8a', // Azul oscuro HEX
        flex: 1,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    checkContainer: {
        width: '20px',
        height: '20px',
        border: '1px solid #000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        marginLeft: 'auto',
        backgroundColor: '#ffffff',
        color: '#000000'
    },
    // Grid Helpers (Simulación de Grid con Flex/CSS Grid nativo inline)
    gridRow: {
        display: 'flex',
        borderLeft: '1px solid #000000',
    },
    col: (width: string) => ({
        width: width,
        borderRight: '1px solid #000000',
        borderBottom: '1px solid #000000',
        boxSizing: 'border-box' as const
    })
  }

  const Field = ({ label, val, width = '100%' }: any) => (
    <div style={{ ...styles.col(width), ...styles.box }}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{val || ''}</span>
    </div>
  )

  const CheckField = ({ label, isChecked, width = '100%' }: any) => (
    <div style={{ ...styles.col(width), ...styles.box, justifyContent: 'space-between' }}>
      <span style={styles.label}>{label}</span>
      <div style={styles.checkContainer}>{isChecked ? 'X' : ''}</div>
    </div>
  )

  return (
    <div ref={ref} style={styles.container}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: '70%' }}>
             <h1 style={styles.headerTitle}>Ficha de Datos Personales<br/>Del Trabajador</h1>
             <div style={{ display: 'flex', border: '1px solid #000' }}>
                <div style={{ flex: 1, padding: '4px', borderRight: '1px solid #000' }}>
                    <span style={styles.label}>FECHA:</span> 
                    <span style={styles.value}>{new Date().toLocaleDateString()}</span>
                </div>
                <div style={{ flex: 1, padding: '4px' }}>
                    <span style={styles.label}>CÓDIGO:</span> 
                    <span style={styles.value}>{ficha.id ? ficha.id.slice(0,8).toUpperCase() : ''}</span>
                </div>
             </div>
        </div>
        <div style={{ width: '4cm', height: '5cm', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', marginLeft: '1rem' }}>
             {ficha.url_dni_frontal ? (
                <img src={ficha.url_dni_frontal} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} alt="Foto" />
             ) : (
                <span style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#9ca3af' }}>FOTO<br/>TAMAÑO<br/>CARNET</span>
             )}
        </div>
      </div>

      {/* I. DATOS GENERALES */}
      <div style={styles.sectionTitle}>I. DATOS GENERALES</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
         <div style={{ display: 'flex' }}>
            <Field label="APELLIDO PATERNO:" val={ficha.apellido_paterno} width="50%" />
            <Field label="APELLIDO MATERNO:" val={ficha.apellido_materno} width="50%" />
         </div>
         <div style={{ display: 'flex' }}>
            <Field label="NOMBRES:" val={ficha.nombres} width="100%" />
         </div>
         
         <div style={{ display: 'flex' }}>
             <div style={{ ...styles.col('100%'), ...styles.box, backgroundColor: '#f3f4f6', fontWeight: 900 }}>DOCUMENTO DE IDENTIDAD (Marcar con una X)</div>
         </div>
         <div style={{ display: 'flex' }}>
             <CheckField label="D.N.I." isChecked={true} width="20%" />
             <CheckField label="L.M." isChecked={false} width="20%" />
             <CheckField label="CARNET EXT." isChecked={false} width="20%" />
             <Field label="N° DOCUMENTO:" val={ficha.dni} width="40%" />
         </div>

         <div style={{ display: 'flex' }}>
            <Field label="FECHA DE NACIMIENTO:" val={ficha.fecha_nacimiento} width="30%" />
            <Field label="LUGAR DE NACIMIENTO (Distrito/Prov/Dpto):" val={`${ficha.distrito || ''} / ${ficha.provincia || ''}`} width="70%" />
         </div>

         <div style={{ display: 'flex' }}>
            <Field label="DIRECCIÓN ACTUAL:" val={ficha.direccion} width="100%" />
         </div>

         <div style={{ display: 'flex' }}>
            <Field label="DISTRITO:" val={ficha.distrito} width="33.33%" />
            <Field label="PROVINCIA:" val={ficha.provincia} width="33.33%" />
            <Field label="DEPARTAMENTO:" val={ficha.departamento} width="33.33%" />
         </div>
      </div>

      {/* II. DATOS LABORALES */}
      <div style={styles.sectionTitle}>II. DATOS LABORALES</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
         <div style={{ display: 'flex' }}>
            <Field label="FECHA DE INGRESO:" val={ficha.fecha_ingreso} width="30%" />
            <Field label="CARGO:" val={ficha.cargo} width="70%" />
         </div>
         <div style={{ display: 'flex' }}>
            <Field label="OBRA / CENTRO DE COSTO:" val={ficha.nombre_obra} width="100%" />
         </div>
      </div>

      {/* III. REGIMEN PENSIONARIO */}
      <div style={styles.sectionTitle}>III. RÉGIMEN PENSIONARIO</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
         <div style={{ display: 'flex' }}>
             <div style={{ ...styles.col('20%'), ...styles.box, backgroundColor: '#f3f4f6' }}>AFILIADO A:</div>
             <CheckField label="ONP" isChecked={check(ficha.sistema_pension, 'ONP') === 'X'} width="15%" />
             <CheckField label="AFP" isChecked={check(ficha.sistema_pension, 'AFP') === 'X'} width="15%" />
             <Field label="NOMBRE AFP:" val={ficha.afp_nombre} width="50%" />
         </div>
         <div style={{ display: 'flex' }}>
            <Field label="N° CUSPP:" val={ficha.cuspp} width="100%" />
         </div>
      </div>

       {/* IV. DATOS BANCARIOS */}
      <div style={styles.sectionTitle}>IV. DATOS BANCARIOS</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
         <div style={{ display: 'flex' }}>
            <Field label="BANCO:" val={ficha.banco} width="50%" />
            <CheckField label="AHORROS" isChecked={true} width="25%" />
            <CheckField label="CORRIENTE" isChecked={false} width="25%" />
         </div>
         <div style={{ display: 'flex' }}>
            <Field label="N° CUENTA:" val={ficha.numero_cuenta} width="50%" />
            <Field label="C.C.I.:" val={ficha.cci} width="50%" />
         </div>
      </div>

      {/* V. OTROS DATOS */}
      <div style={styles.sectionTitle}>V. OTROS DATOS</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
          <div style={{ ...styles.col('100%'), ...styles.box, backgroundColor: '#f3f4f6', fontWeight: 900 }}>ESTADO CIVIL</div>
          <div style={{ display: 'flex' }}>
            <CheckField label="SOLTERO" isChecked={check(ficha.estado_civil, 'Soltero') === 'X'} width="20%" />
            <CheckField label="CASADO" isChecked={check(ficha.estado_civil, 'Casado') === 'X'} width="20%" />
            <CheckField label="CONVIVIENTE" isChecked={check(ficha.estado_civil, 'Conviviente') === 'X'} width="20%" />
            <CheckField label="OTROS" isChecked={false} width="40%" />
          </div>
          
          <div style={{ display: 'flex' }}>
            <Field label="CELULAR:" val={ficha.celular} width="50%" />
            <Field label="E-MAIL:" val={ficha.correo} width="50%" />
          </div>
          <div style={{ display: 'flex' }}>
            <Field label="PROFESIÓN:" val={ficha.carrera} width="50%" />
            <Field label="GRADO INST:" val={ficha.nivel_educacion} width="50%" />
          </div>
      </div>

      {/* VI. EMERGENCIA */}
      <div style={styles.sectionTitle}>VI. EN CASO DE EMERGENCIA COMUNICARSE CON:</div>
      <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
         <div style={{ display: 'flex' }}>
            <Field label="NOMBRES:" val={ficha.emergencia_nombre} width="70%" />
            <Field label="TELÉFONO:" val={ficha.emergencia_celular} width="30%" />
         </div>
      </div>

      {/* VII. FAMILIA */}
      <div style={styles.sectionTitle}>VII. DATOS FAMILIARES</div>
      <div style={{ border: '1px solid #000', minHeight: '3cm', padding: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
        {ficha.esposa && <div style={{ marginBottom: '5px' }}>ESP/CONV: {ficha.esposa}</div>}
        {ficha.hijos && <div>HIJOS: {ficha.hijos}</div>}
        {!ficha.esposa && !ficha.hijos && <span style={{ color: '#9ca3af' }}>SIN REGISTROS FAMILIARES</span>}
      </div>

      {/* FIRMAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', color: '#000' }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
             <div style={{ borderBottom: '1px solid #000', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5px' }}>
                {ficha.url_firma && <img src={ficha.url_firma} crossOrigin="anonymous" style={{ height: '50px', objectFit: 'contain', filter: 'grayscale(100%)' }} alt="Firma" />}
             </div>
             <p style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '5px' }}>FIRMA DEL TRABAJADOR</p>
             <p style={{ fontSize: '10px' }}>DNI: {ficha.dni}</p>
        </div>
        <div style={{ textAlign: 'center', width: '40%' }}>
             <div style={{ borderBottom: '1px solid #000', height: '60px' }}></div>
             <p style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '5px' }}>V°B° RECURSOS HUMANOS</p>
             <p style={{ fontSize: '10px' }}>RUAG S.R.LTDA</p>
        </div>
      </div>

    </div>
  )
})

FichaPrintable.displayName = 'FichaPrintable'