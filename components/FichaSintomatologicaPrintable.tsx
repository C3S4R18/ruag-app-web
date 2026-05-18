/* eslint-disable @next/next/no-img-element */
import { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerLastNamesFirstUpper, toPrintUppercase } from './printText'
import { PrintableA4, DocHeader, FilledLine, CheckBox } from './printable/_primitives'

/**
 * FOR-COVID-01 · EVALUACIÓN DE LA APTITUD PARA EL REGRESO O REINCORPORACIÓN
 * AL TRABAJO – DECLARACIÓN JURADA
 *
 * Replica del PDF oficial RUAG. Mantiene la matriz SI/NO derecha y la
 * lista de síntomas + grupos de riesgo + vacunación.
 */

const symptomRows = [
  { key: 'symptom_1', label: '1. Sensación de alza térmica, fiebre o malestar.' },
  { key: 'symptom_2', label: '2. Dolor de garganta, tos, estornudos o dificultad para respirar.' },
  { key: 'symptom_3', label: '3. Dolor de cabeza, diarrea o congestión nasal.' },
  { key: 'symptom_4', label: '4. Pérdida de gusto y/o del olfato.' },
  { key: 'symptom_5', label: '5. Contacto con un caso confirmado de COVID-19' },
]

const riskLeft = [
  { key: 'risk_mayor_65',   label: 'Mayor de 65 años' },
  { key: 'risk_renal',      label: 'Enfermedad renal crónica' },
  { key: 'risk_cardiaca',   label: 'Afecciones cardiacas' },
  { key: 'risk_obesidad',   label: 'Obesidad (IMC>30)' },
  { key: 'risk_trasplante', label: 'Receptor de trasplante de órganos' },
  { key: 'risk_hipertension', label: 'Hipertensión arterial' },
  { key: 'risk_down',       label: 'Síndrome de down' },
]

const riskRight = [
  { key: 'risk_cancer',   label: 'Cáncer' },
  { key: 'risk_pulmonar', label: 'Enfermedad Pulmonar crónica' },
  { key: 'risk_dm',       label: 'DM tipo 1 o 2' },
  { key: 'risk_inmuno',   label: 'Inmunosupresión' },
  { key: 'risk_cerebro',  label: 'Enfermedad cerebrovascular' },
  { key: 'risk_embarazo', label: 'Embarazo' },
  { key: 'risk_vih',      label: 'Infección por VIH' },
]

// Orden vertical de las filas de la matriz SI/NO
const matrixOrder = [
  ...symptomRows.map((row) => ({ type: 'yesno' as const, key: row.key })),
  { type: 'yesno' as const, key: 'medicacion_toma' },
  ...riskLeft.map((row) => ({ type: 'risk' as const, key: row.key })),
  ...riskRight.map((row) => ({ type: 'risk' as const, key: row.key })),
  { type: 'risk' as const, key: 'risk_otros' },
  { type: 'vaccine' as const, key: 'vacunas_dosis' },
]

const getDocData = (ficha: any) => ficha?.doc_states?.ficha_covid?.data || {}
const getSignatureUrl = (ficha: any) => ficha?.url_firma || ficha?.firma_url || ''
const getFullName = (ficha: any) => buildWorkerLastNamesFirstUpper(ficha)

const formatDate = (raw?: string) => {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('es-PE')
}

const hasMark = (value: any) =>
  value === true || value === 'si' || value === 'SI' || value === 'x' || value === 'X'

const yesNo = (value: any) => {
  if (value === 'si' || value === 'SI' || value === true) return { yes: true, no: false }
  if (value === 'no' || value === 'NO') return { yes: false, no: true }
  return { yes: false, no: false }
}

export const FichaSintomatologicaPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  const docData = getDocData(ficha)
  const fullName = getFullName(ficha)
  const dni = ficha?.dni || ''
  const areaTrabajo = toPrintUppercase(docData.area_trabajo || ficha?.cargo || '')
  const direccion = toPrintUppercase(docData.direccion_domicilio || ficha?.direccion || '')
  const celular = docData.celular || ficha?.celular || ficha?.telefono || ''
  const firma = getSignatureUrl(ficha)
  const fecha = formatDate(docData.fecha_documento)

  return (
    <div ref={ref}>
      <PrintableA4>
        <DocHeader
          banner=""
          title="EVALUACIÓN DE LA APTITUD PARA EL REGRESO O REINCORPORACIÓN AL TRABAJO – DECLARACIÓN JURADA"
          code="FOR-COVID-01"
          revision="01"
          date="4/01/2024"
          page="01 / 01"
        />

        {/* DATOS DEL TRABAJADOR */}
        <div className="mt-10 space-y-4">
          <div className="grid grid-cols-[1.8fr_1fr_0.75fr] gap-4 items-end">
            <FieldGroup label="Apellidos y Nombres:" value={fullName} />
            <FieldGroup label="Área de trabajo:" value={areaTrabajo} />
            <FieldGroup label="DNI:" value={dni} />
          </div>
          <div className="grid grid-cols-[1.45fr_1fr] gap-4 items-end pb-3">
            <FieldGroup label="Dirección Domicilio:" value={direccion} />
            <FieldGroup label="Número (Celular):" value={celular} />
          </div>
        </div>

        {/* INTRO */}
        <div className="text-[11.5px] mt-6 mb-3">
          En los últimos 10 días calendario ha tenido alguno de los síntomas siguientes:
        </div>

        {/* CONTENIDO: izquierda lista, derecha matriz SI/NO */}
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          {/* LISTA IZQUIERDA */}
          <div className="text-[11px]">
            {symptomRows.map((row) => (
              <div key={row.key} className="h-[22px] flex items-center">{row.label}</div>
            ))}

            <div className="h-[22px] flex items-center mt-1">
              6. Está tomando alguna medicación (detallar cuál o cuáles):
            </div>

            <div className="mt-1">
              <div className="h-[18px] flex items-center font-medium">
                7. Pertenece a algún Grupo de Riesgo para COVID-19.
              </div>
              <div className="grid grid-cols-2 gap-x-6 mt-1">
                <div>
                  {riskLeft.map((row) => (
                    <div key={row.key} className="h-[18px] flex items-center">{row.label}</div>
                  ))}
                </div>
                <div>
                  {riskRight.map((row) => (
                    <div key={row.key} className="h-[18px] flex items-center">{row.label}</div>
                  ))}
                </div>
              </div>
              <div className="h-[18px] flex items-center mt-1">Otros*</div>
              <div className="h-[18px] flex items-center mt-1">
                8. Estado de vacunación para SARS-Cov-2 (# de dosis)
              </div>
            </div>
          </div>

          {/* MATRIZ DERECHA SI / NO */}
          <div className="w-[120px]">
            <table className="w-full border-collapse table-fixed">
              <tbody>
                <tr>
                  <td className="border border-black text-center font-bold text-[10px] h-[20px]">SÍ</td>
                  <td className="border border-black text-center font-bold text-[10px] h-[20px]">NO</td>
                </tr>
                {matrixOrder.map((row, index) => {
                  if (row.type === 'yesno') {
                    const m = yesNo(docData[row.key])
                    const rowH = index < 6 ? 'h-[22px]' : 'h-[18px]'
                    return (
                      <tr key={`${row.type}-${row.key}`}>
                        <td className={`border-l border-r border-b border-black p-0 ${rowH} text-center align-middle`}>
                          {m.yes && <CheckBoxInline />}
                        </td>
                        <td className={`border-l border-r border-b border-black p-0 ${rowH} text-center align-middle`}>
                          {m.no && <CheckBoxInline />}
                        </td>
                      </tr>
                    )
                  }
                  if (row.type === 'risk') {
                    return (
                      <tr key={`${row.type}-${row.key}`}>
                        <td className="border-l border-r border-b border-black p-0 h-[18px] text-center align-middle">
                          {hasMark(docData[row.key]) && <CheckBoxInline />}
                        </td>
                        <td className="border-l border-r border-b border-black p-0 h-[18px] text-center align-middle" />
                      </tr>
                    )
                  }
                  // vaccine row
                  return (
                    <tr key={`${row.type}-${row.key}`}>
                      <td className="border-l border-r border-b border-black p-0 h-[18px] text-center align-middle text-[10px] font-semibold">
                        {docData.vacunas_dosis || ''}
                      </td>
                      <td className="border-l border-r border-b border-black p-0 h-[18px] text-center align-middle" />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-[11px] mt-8">
          He recibido explicación del objetivo de esta evaluación y he respondido con la verdad
        </div>

        <div className="grid grid-cols-2 gap-x-12 mt-10 items-end">
          <div>
            <div className="text-[11px] mb-2">Fecha:</div>
            <FilledLine value={fecha} align="center" />
          </div>
          <div>
            <div className="text-[11px] mb-2">Firma del trabajador:</div>
            <div className="min-h-[42px] flex items-end justify-center">
              {firma ? (
                <NormalizedSignatureImage
                  src={firma}
                  alt="Firma"
                  style={{ maxWidth: '82%', maxHeight: '38px', objectFit: 'contain' }}
                />
              ) : null}
            </div>
            <div className="border-b border-black w-full" />
          </div>
        </div>

        {/* Asterisk de aclaración */}
        <p className="text-[9.5px] italic text-stone-700 mt-8 leading-snug">
          * Si tiene una condición distinta a las listadas, especifíquela en "Otros".
        </p>
      </PrintableA4>
    </div>
  )
})

FichaSintomatologicaPrintable.displayName = 'FichaSintomatologicaPrintable'

/* Helpers internos */
function FieldGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] mb-0.5">{label}</div>
      <FilledLine value={value} fontSize="text-[11px]" align="center" />
    </div>
  )
}

/** Una X centrada perfectamente dentro de la celda SI/NO. */
function CheckBoxInline() {
  return (
    <span className="inline-flex items-center justify-center w-full h-full font-bold text-[12px] leading-none">
      X
    </span>
  )
}
