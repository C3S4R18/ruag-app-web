/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerLastNamesFirstUpper, getPrintObra, toPrintUppercase } from './printText'
import { PrintableA4, CheckBox } from './printable/_primitives'

/**
 * SG-FOR-110 · ACTA DE DERECHO A SABER
 *
 * Replica del PDF oficial RUAG. Tabla de datos + cuadro de firma a la derecha,
 * texto declarativo y los 38 temas con checkbox + tabla "EXPOSITOR (SSOMA)" al pie.
 */

const HEADER_DATE = '1/08/2024'

const RISKS = [
  'Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA',
  'Reglamento Interno de Seguridad.',
  'Políticas de Seguridad y Salud Ocupacional y Medio Ambiente.',
  'Organización del sistema de gestión de la seguridad y salud en el trabajo en la obra.',
  'Derechos y obligaciones de los/las trabajadores/as y supervisores/as.',
  'Conceptos básicos de seguridad y salud en el trabajo.',
  'Reglas de tránsito (de ser aplicable a la obra).',
  'Conceptos básicos de seguridad y salud en el trabajo.',
  'Plan de Seguridad y Salud Ocupacional, Plan de Prevención Ambiental.',
  'Reconocimiento del área de trabajo.',
  'Elementos de protección personal, tipos requeridos, manejo correcto, obligatoriedad y protecciones colectivas.',
  'Control de Emergencias, Incendios, Uso de Extintores, Primeros Auxilios, Atención de lesionados.',
  'Procedimiento Trabajo en Altura, Procedimientos de Trabajo Seguro, uso correcto de arnés de seguridad.',
  'Superficies de Trabajo; andamios, escaleras, plataformas, elevadores de personas, etc.',
  'Manejo de materiales; maniobras, trabajo con equipos de levante (Tirford, tecles, estrobos, etc.).',
  'Riesgos eléctricos, equipos energizados.',
  'Esmeril angular; uso seguro.',
  'Oxicorte; uso, riesgos y medidas preventivas.',
  'Cilindros de Gases Comprimidos; manejo, almacenamiento y transporte.',
  'Trabajos de soldadura.',
  'Excavaciones, Entibaciones, Fortificaciones y Taludes.',
  'Vaciado de Concreto.',
  'Housekeeping (Orden y Aseo).',
  'Código de colores y señalización.',
  'Exposición a Ruidos, polvo y vibraciones.',
  'Desplazamientos por áreas de trabajo.',
  'Higiene Personal, Recomendaciones.',
  'Control, Manejo, uso y transporte de sustancias peligrosas.',
  'Sistemas de bloqueos y uso de Tarjeta de Seguridad.',
  'Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.',
  'Combustibles; Manejo, Almacenamiento y Transporte.',
  'Cambio de conducta, Autocuidado, Reconocimiento, Sanciones, Contacto Personal.',
  'Prohibición de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.',
  'Identificación de Aspectos e Impactos Ambientales.',
  'Sobre Riesgos Ambientales, Manejo de residuos.',
  'Equipos Radioactivos.',
  'Preparación y respuesta ante emergencias.',
  'Trabajos de alto riesgo.',
]

function formatDate(raw?: string) {
  if (!raw) return new Date().toLocaleDateString('es-PE')
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString('es-PE')
}

export const ActaDerechoSaberPrintable = forwardRef<HTMLDivElement, { ficha: any }>(({ ficha }, ref) => {
  if (!ficha) return null

  const docData = ficha.doc_states?.acta_derecho?.data || {}
  const workerName = buildWorkerLastNamesFirstUpper(ficha)
  const obra = toPrintUppercase(getPrintObra(ficha) || '')
  const especialidad = toPrintUppercase(ficha.cargo || ficha.categoria || 'OPERARIO')
  const categoria = toPrintUppercase(ficha.categoria || 'OPERARIO')
  const firmaUrl = ficha.firma_url || ficha.url_firma || ''
  const dni = ficha.dni || ''
  const fecha = formatDate(docData.fecha_documento)

  return (
    <div ref={ref}>
      <PrintableA4 padding="px-[10mm] py-[8mm]">
        <div className="border border-black p-[6mm]">
          {/* HEADER */}
          <table className="w-full border-collapse table-fixed">
            <tbody>
              <tr>
                <td rowSpan={3} className="border border-black w-[20%] p-1 text-center align-middle bg-white">
                  <img src="/logo_ruag.png" alt="RUAG" className="max-w-full max-h-[60px] object-contain mx-auto" />
                </td>
                <td className="border border-l border-r border-t border-black text-center font-bold text-[10px] bg-[#f0f0f0] py-1 px-2">
                  SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE
                </td>
                <td rowSpan={3} className="border border-black w-[22%] p-0 align-top">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border-r border-b border-black px-2 py-1 font-bold text-[9px] bg-white">Código</td>
                        <td className="border-b border-black px-2 py-1 text-[9px] text-center">SG-FOR-110</td>
                      </tr>
                      <tr>
                        <td className="border-r border-b border-black px-2 py-1 font-bold text-[9px] bg-white">Revisión</td>
                        <td className="border-b border-black px-2 py-1 text-[9px] text-center">0</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black px-2 py-1 font-bold text-[9px] bg-white">Fecha</td>
                        <td className="px-2 py-1 text-[9px] text-center">{HEADER_DATE}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td className="border border-l border-r border-b border-black text-center font-bold text-[15px] py-1.5">
                  ACTA DE DERECHO A SABER
                </td>
              </tr>
              <tr>
                <td className="p-0 h-0 border-0" />
              </tr>
            </tbody>
          </table>

          {/* DATOS + FIRMA DEL TRABAJADOR (firma en la columna derecha) */}
          <table className="w-full border-collapse table-fixed -mt-px">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[43%]" />
              <col className="w-[35%]" />
            </colgroup>
            <tbody>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">OBRA:</td>
                <td className="border border-black text-[10px] uppercase px-2 py-1" colSpan={2}>{obra}</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">EMPRESA:</td>
                <td className="border border-black text-[10px] uppercase px-2 py-1" colSpan={2}>RUAG S.R.L.</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">NOMBRE DEL TRABAJADOR:</td>
                <td className="border border-black text-[10px] uppercase px-2 py-1" colSpan={2}>{workerName}</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">DNI:</td>
                <td className="border border-black text-[10px] px-2 py-1" colSpan={2}>{dni}</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">ESPECIALIDAD:</td>
                <td className="border border-black text-[10px] uppercase px-2 py-1">{especialidad}</td>
                <td rowSpan={4} className="border border-black p-0 align-top">
                  <div className="flex flex-col justify-between min-h-[100px]">
                    <div className="flex-1 flex items-end justify-center px-2 pt-1">
                      {firmaUrl ? (
                        <NormalizedSignatureImage
                          src={firmaUrl}
                          alt="Firma del trabajador"
                          style={{ maxWidth: '78%', maxHeight: '58px', objectFit: 'contain' }}
                        />
                      ) : null}
                    </div>
                    <div className="border-t border-black text-center font-bold text-[8.5px] py-1 mx-3">
                      FIRMA DEL TRABAJADOR
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">CATEGORÍA:</td>
                <td className="border border-black text-[10px] uppercase px-2 py-1">{categoria}</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">FECHA:</td>
                <td className="border border-black text-[10px] px-2 py-1">{fecha}</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">DURACIÓN DE LA CHARLA:</td>
                <td className="border border-black text-[10px] px-2 py-1">1.5 Hrs.</td>
              </tr>
            </tbody>
          </table>

          {/* Banner ACTA DERECHO A SABER */}
          <div className="border-l border-r border-b border-black bg-[#d8d8d8] text-center font-bold text-[10px] py-1">
            ACTA DERECHO A SABER
          </div>

          {/* Texto declarativo */}
          <p className="text-[9.5px] leading-[1.35] text-justify mt-2 mb-2">
            A través de esta acta declaro haber sido informado acerca de todos los riesgos que entrañan las labores que
            desarrollaré en mi trabajo, así como las medidas preventivas que debo tomar para hacer de esto un método
            seguro de trabajo, además aquellos aspectos ambientales que tengan relación con mi puesto y área de trabajo.
          </p>

          {/* Lista de 38 ítems con checkbox */}
          <table className="w-full border-collapse table-fixed">
            <tbody>
              {RISKS.map((risk, index) => (
                <tr key={index} className="h-[6.2mm]">
                  <td className="border-l border-r border-b border-black w-[26px] p-0 text-center align-middle">
                    <div className="flex items-center justify-center h-full">
                      <CheckBox checked={Boolean(docData[`topic_${index}`])} size={12} />
                    </div>
                  </td>
                  <td className="border-r border-b border-black text-[8.8px] leading-[1.15] px-2 py-0.5 align-middle">
                    <strong>{index + 1}.-</strong> {risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Para ser llenado por el Expositor */}
          <div className="italic text-[8px] mt-1 mb-0.5">Para ser llenado por el Expositor</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th colSpan={2} className="border border-black bg-[#d8d8d8] text-center font-bold text-[10px] py-1">
                  EXPOSITOR (SSOMA)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1 w-[15%]">NOMBRE</td>
                <td className="border border-black text-[10px] px-2 py-1 h-[10mm]" />
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">CARGO</td>
                <td className="border border-black text-[10px] px-2 py-1 h-[10mm]" />
              </tr>
              <tr>
                <td className="border border-black bg-[#f4f4f4] font-bold text-[9px] px-2 py-1">FIRMA</td>
                <td className="border border-black text-[10px] px-2 py-1 h-[13mm]" />
              </tr>
            </tbody>
          </table>
        </div>
      </PrintableA4>
    </div>
  )
})

ActaDerechoSaberPrintable.displayName = 'ActaDerechoSaberPrintable'
