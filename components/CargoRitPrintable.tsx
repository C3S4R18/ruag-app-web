/* eslint-disable @next/next/no-img-element */
import React from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'
import { buildWorkerFullNameUpper, getSignatureDate } from './printText'
import { PrintableA4, DocHeader, FilledLine, FingerprintBox } from './printable/_primitives'

/**
 * SG-RIT-01 · ANEXO N° 3 · COMPROMISO
 * Recepción del Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente
 * de RUAG SRL.
 *
 * Replica fiel del PDF oficial entregado por SSOMA.
 */
export const CargoRitPrintable = ({ ficha }: { ficha: any }) => {
  const fechaActual = getSignatureDate(ficha)

  const nombres = buildWorkerFullNameUpper(ficha)
  const dni = ficha?.dni ?? ''

  return (
    <PrintableA4>
      <DocHeader
        banner="SISTEMA DE GESTIÓN INTEGRADOS"
        title="REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO"
        code="SG-RIT-01"
        revision="01"
        date="4/01/2024"
        page="54 de 54"
        annex="ANEXO N° 3 COMPROMISO"
      />

      {/* Marco principal del compromiso */}
      <div className="border border-black mt-3 mx-4 p-6 min-h-[210mm] relative">
        <div className="text-center font-bold text-[12.5px] leading-snug">
          <p>REGLAMENTO INTERNO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO</p>
          <p>AMBIENTE</p>
          <p className="mt-3">RECEPCIÓN DEL REGLAMENTO Y COMPROMISO DE SEGURIDAD, SALUD</p>
          <p>OCUPACIONAL Y MEDIO AMBIENTE</p>
        </div>

        <div className="mt-12 text-[12px] text-justify leading-[1.8]">
          <div className="flex items-end gap-2 mb-4">
            <span className="shrink-0">Lugar:</span>
            <FilledLine value="LIMA" width="flex-1" />
            <span className="shrink-0">Fecha:</span>
            <FilledLine value={fechaActual} width="w-[120px]" />
          </div>

          <p className="mb-2">
            He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio
            Ambiente de RUAG SRL, comprendo las disposiciones allí establecidas y me
            comprometo a cumplirlas siendo éstas condición de empleo.
          </p>
          <p className="mb-2">
            Así mismo, ratifico mi Compromiso con el cumplimiento de la Política de Seguridad,
            Salud Ocupacional y
          </p>
          <p>
            Medio Ambiente establecidos por RUAG SRL. FAVOR, ESCRIBIR CON LETRA
            IMPRENTA Y CLARA.
          </p>
        </div>

        {/* Datos del trabajador */}
        <div className="mt-14 space-y-7 text-[12px]">
          <div>
            <p className="font-semibold mb-1">Nombres y Apellidos</p>
            <FilledLine value={nombres} width="w-full" align="left" />
          </div>

          <div className="w-[260px]">
            <FilledLine value={dni} align="left" />
            <p className="font-semibold mt-1">D.N.I.</p>
          </div>
        </div>

        {/* Firma + huella */}
        <div className="mt-12 flex justify-between items-end pr-2">
          <div className="w-[55%]">
            <div className="h-[80px] flex items-end justify-start mb-1">
              {ficha?.firma_url && (
                <NormalizedSignatureImage
                  src={ficha.firma_url}
                  alt="Firma"
                  style={{ maxHeight: '70px', maxWidth: '70%', objectFit: 'contain' }}
                />
              )}
            </div>
            <FilledLine value="" empty />
            <p className="font-semibold mt-1">Firma</p>
          </div>

          <FingerprintBox src={ficha?.huella_url} />
        </div>
      </div>
    </PrintableA4>
  )
}
