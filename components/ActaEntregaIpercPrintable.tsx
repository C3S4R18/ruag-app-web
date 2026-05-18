/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, getPrintObra, toPrintUppercase } from './printText'
import { PrintableA4, DocHeader, FilledLine } from './printable/_primitives'

/**
 * SG-FOR-112 · ACTA DE ENTREGA DE IPERC POR PUESTO DE TRABAJO
 *
 * Replica del PDF oficial RUAG. Texto declarativo con campos rellenables
 * (nombres, DNI/CE/Pasaporte, cargo, empresa, proyecto, fecha y firma).
 */
export const ActaEntregaIpercPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const today = new Date()
  const fechaActual = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  const nombres = buildWorkerFullNameUpper(ficha)
  const dni = ficha?.dni ?? ''
  const cargo = toPrintUppercase(ficha?.cargo || 'OPERARIO')
  const empresa = 'RUAG S.R.L.'
  const proyecto = toPrintUppercase(getPrintObra(ficha) || ficha?.nombre_obra || '')

  return (
    <div ref={ref}>
      <PrintableA4>
        <DocHeader
          banner=""
          title={`ACTA DE ENTREGA DE IPERC\nPOR PUESTO DE TRABAJO`}
          code="SG-FOR-112"
          revision="01"
          date="1/08/2024"
          page="01 / 01"
        />

        {/* Texto declarativo principal */}
        <div className="mt-10 px-2 text-[12px] leading-[1.95] text-justify">
          <div className="flex items-end gap-2">
            <span className="shrink-0">Yo,</span>
            <FilledLine value={nombres} width="flex-1" align="center" />
          </div>

          <div className="flex items-end gap-2 mt-3 flex-wrap">
            <span className="shrink-0">identificado con DNI/CE/Pasaporte N°</span>
            <FilledLine value={dni} width="w-[300px]" align="center" />
            <span>,</span>
          </div>

          <div className="flex items-end gap-2 mt-3 flex-wrap">
            <span className="shrink-0">desempeño el cargo de</span>
            <FilledLine value={cargo} width="w-[280px]" align="center" />
            <span>en la</span>
          </div>

          <div className="flex items-end gap-2 mt-3 flex-wrap">
            <span className="shrink-0">empresa</span>
            <FilledLine value={empresa} width="w-[240px]" align="center" />
            <span>para el proyecto</span>
          </div>

          <div className="flex items-end gap-2 mt-3">
            <FilledLine value={proyecto} width="flex-1" align="center" />
            <span className="shrink-0">.</span>
          </div>

          <p className="mt-6">
            Por medio de la presente declaro haber recibido copia de la Matriz de
            Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC) de mi
            puesto de trabajo de parte de RUAG S.R.L.
          </p>

          <p className="mt-4">
            A su vez declaro mi compromiso en leerla, y acatar responsablemente las medidas
            de control descritas en la misma.
          </p>

          <p className="mt-4">En conformidad con lo mencionado y recepción,</p>
        </div>

        {/* Bloque firma + DNI + Fecha */}
        <div className="mt-16 px-2 space-y-7">
          <div className="flex items-end gap-3">
            <span className="font-bold text-[12px] w-[80px]">FIRMA:</span>
            <div className="w-[280px] flex flex-col">
              <div className="h-[48px] flex items-end justify-center">
                {ficha?.firma_url && (
                  <NormalizedSignatureImage
                    src={ficha.firma_url}
                    alt="Firma"
                    style={{ maxWidth: '90%', maxHeight: '44px', objectFit: 'contain' }}
                  />
                )}
              </div>
              <div className="w-full h-px bg-black" />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <span className="font-bold text-[12px] w-[80px]">DNI:</span>
            <FilledLine value={dni} width="w-[280px]" align="center" />
          </div>

          <div className="flex items-end gap-3">
            <span className="font-bold text-[12px] w-[80px]">FECHA:</span>
            <FilledLine value={fechaActual} width="w-[280px]" align="center" />
          </div>
        </div>
      </PrintableA4>
    </div>
  )
})

ActaEntregaIpercPrintable.displayName = 'ActaEntregaIpercPrintable'
