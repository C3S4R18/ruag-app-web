/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, getPrintObra, toPrintUppercase, getSignatureDate } from './printText'
import { PrintableA4, DocHeader, FilledLine } from './printable/_primitives'

export const ActaEntregaIpercPrintable = forwardRef(({ ficha }: { ficha: any }, ref: React.Ref<HTMLDivElement>) => {
  if (!ficha) return null

  const fechaActual = getSignatureDate(ficha)

  const nombres = buildWorkerFullNameUpper(ficha)
  const dni = ficha?.dni ?? ''
  const cargo = toPrintUppercase(ficha?.cargo || 'OPERARIO')
  const empresa = 'RUAG S.R.L.'
  const proyecto = toPrintUppercase(getPrintObra(ficha) || ficha?.nombre_obra || '')
  const firmaUrl = ficha?.firma_url || ficha?.url_firma || ''

  return (
    <div ref={ref}>
      <PrintableA4 padding="px-[16mm] py-[12mm]">
        <div className="min-h-[272mm] flex flex-col">
          <DocHeader
            banner=""
            title={`ACTA DE ENTREGA DE IPERC\nPOR PUESTO DE TRABAJO`}
            code="SG-FOR-112"
            revision="01"
            date="1/08/2024"
            page="01 / 01"
          />

          <div className="mt-12 text-[12px] leading-[2.1]">
            <div className="flex items-end gap-2">
              <span className="shrink-0">Yo,</span>
              <FilledLine value={nombres} width="flex-1" align="center" />
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="shrink-0">identificado con DNI/CE/Pasaporte</span>
              <span className="shrink-0">N°</span>
              <FilledLine value={dni} width="w-[340px]" align="center" />
              <span className="shrink-0">,</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="shrink-0">desempeño el cargo de</span>
              <FilledLine value={cargo} width="w-[320px]" align="center" />
              <span className="shrink-0">en la</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="shrink-0">empresa</span>
              <FilledLine value={empresa} width="w-[220px]" align="center" />
              <span className="shrink-0">para el proyecto</span>
              <FilledLine value={proyecto} width="flex-1" align="center" />
              <span className="shrink-0">.</span>
            </div>

            <p className="mt-10 text-justify leading-[1.95]">
              Por medio de la presente declaro haber recibido copia de la Matriz de
              Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC) de mi
              puesto de trabajo de parte de RUAG S.R.L.
            </p>

            <p className="mt-6 text-justify leading-[1.95]">
              A su vez declaro mi compromiso en leerla, y acatar responsablemente las medidas
              de control descritas en la misma.
            </p>

            <p className="mt-6">En conformidad con lo mencionado y recepción,</p>
          </div>

          <div className="mt-auto pt-16 space-y-9">
            <div className="flex items-end gap-3">
              <span className="font-bold text-[12px] w-[90px]">FIRMA:</span>
              <div className="w-[330px] flex flex-col">
                <div className="h-[54px] flex items-end justify-center">
                  {firmaUrl ? (
                    <NormalizedSignatureImage
                      src={firmaUrl}
                      alt="Firma"
                      style={{ maxWidth: '90%', maxHeight: '42px', objectFit: 'contain' }}
                    />
                  ) : null}
                </div>
                <div className="w-full h-px bg-black" />
              </div>
            </div>

            <div className="flex items-end gap-3">
              <span className="font-bold text-[12px] w-[90px]">DNI:</span>
              <FilledLine value={dni} width="w-[330px]" align="center" />
            </div>

            <div className="flex items-end gap-3">
              <span className="font-bold text-[12px] w-[90px]">FECHA:</span>
              <FilledLine value={fechaActual} width="w-[330px]" align="center" />
            </div>
          </div>
        </div>
      </PrintableA4>
    </div>
  )
})

ActaEntregaIpercPrintable.displayName = 'ActaEntregaIpercPrintable'
