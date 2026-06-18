/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, toPrintUppercase, getSignatureDate } from './printText'
import { PrintableA4, DocHeader, FilledLine, CheckBox } from './printable/_primitives'

/**
 * SG-FOR-06 · INDUCCIÓN HOMBRE NUEVO
 *
 * Replica del PDF oficial RUAG. Datos del trabajador en cabecera + 11
 * temas con checkbox + fecha + firmas (trabajador y supervisor SST).
 */
export const InduccionHombreNuevoPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const docData = ficha.doc_states?.induccion?.data || {}

  const fechaActual = getSignatureDate(ficha)

  const nombres = buildWorkerFullNameUpper(ficha)
  const dni = ficha.dni ?? ''
  const cargo = toPrintUppercase(ficha.cargo || 'OPERARIO')

  const topics = [
    'Política de Seguridad y Salud en el Trabajo.',
    'Organización del sistema de gestión de la seguridad y salud en el trabajo.',
    'Reglamento interno de Seguridad y Salud en el trabajo.',
    'Derecho y obligaciones de los trabajadores (as) y supervisores (as).',
    'Conceptos básicos de la seguridad y salud en el trabajo.',
    'Reglas de Tránsito (de ser aplicables a la obra).',
    'Trabajos de alto riesgo.',
    'Código de Colores y Señalización.',
    'Control de sustancias peligrosas.',
    'Preparación y respuesta ante emergencias.',
    'Equipos de protección personal y protecciones colectivas.',
  ]

  return (
    <div ref={ref}>
      <PrintableA4>
        <DocHeader
          banner=""
          title="INDUCCIÓN HOMBRE NUEVO"
          code="SG-FOR-06"
          revision="01"
          date="4/01/2024"
          page="01 / 01"
        />

        {/* DATOS DEL TRABAJADOR */}
        <div className="mt-10 px-2 space-y-4 text-[12px]">
          <div className="flex items-end gap-3">
            <span className="font-bold shrink-0">NOMBRE:</span>
            <FilledLine value={nombres} width="flex-1" align="center" />
            <span className="font-bold shrink-0 ml-4">DNI:</span>
            <FilledLine value={dni} width="w-[140px]" align="center" />
          </div>

          <div className="flex items-end gap-3">
            <span className="font-bold shrink-0">FECHA DE INGRESO:</span>
            <FilledLine value={fechaActual} width="flex-1" align="center" />
            <span className="font-bold shrink-0 ml-4">OCUPACIÓN/CARGO:</span>
            <FilledLine value={cargo} width="w-[220px]" align="center" />
          </div>
        </div>

        {/* LISTA DE TEMAS CON CHECKBOX */}
        <div className="mt-10 px-4 space-y-3 text-[12px]">
          {topics.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-[2px]">
                <CheckBox checked={!!docData[`topic_${i}`]} size={14} />
              </span>
              <span className="leading-snug">{t}</span>
            </div>
          ))}
        </div>

        {/* FECHA AL PIE */}
        <div className="mt-12 text-right pr-8 text-[12px]">
          <span className="font-semibold">Fecha:</span>{' '}
          <span className="inline-block min-w-[140px] border-b border-black pb-0.5 text-center">
            {fechaActual}
          </span>
        </div>

        {/* FIRMAS */}
        <div className="mt-20 grid grid-cols-2 gap-12 px-4">
          <div className="flex flex-col items-center">
            <div className="h-[68px] w-full flex items-end justify-center overflow-hidden">
              {ficha.firma_url && (
                <NormalizedSignatureImage
                  src={ficha.firma_url}
                  alt="Firma"
                  style={{ maxHeight: '54px', maxWidth: '82%', objectFit: 'contain' }}
                />
              )}
            </div>
            <div className="border-t border-black w-full pt-1 text-center text-[11px] font-bold">
              Firma del Trabajador.
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-[68px] w-full" />
            <div className="border-t border-black w-full pt-1 text-center text-[11px] font-bold leading-snug">
              V°B° del Supervisor de Seguridad y
              <br />
              Salud en el Trabajo o Prevencionista de Riesgos
            </div>
          </div>
        </div>
      </PrintableA4>
    </div>
  )
})

InduccionHombreNuevoPrintable.displayName = 'InduccionHombreNuevoPrintable'
