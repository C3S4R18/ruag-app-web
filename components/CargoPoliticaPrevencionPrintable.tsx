/* eslint-disable @next/next/no-img-element */
import React from 'react'

export const CargoPoliticaPrevencionPrintable = ({ ficha }: { ficha: any }) => {
  const today = new Date()
  const day = today.getDate()
  const month = today.toLocaleString('es-ES', { month: 'long' })
  const year = today.getFullYear()

  return (
    <div
      className="w-[210mm] h-[297mm] bg-white p-12 mx-auto relative font-sans text-sm leading-relaxed box-border"
      style={{
        pageBreakAfter: 'always',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      <div className="border border-black flex mb-16 h-20">
        <div className="w-32 border-r border-black flex items-center justify-center p-2">
          <span className="font-bold text-xs text-black">Versión 01</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-2 border-r border-black text-black">
          <span className="text-[10px] font-bold mb-1">POLÍTICA</span>
          <span className="font-bold text-center text-sm leading-tight">
            DE PREVENCIÓN Y SANCIÓN DEL
            <br />
            HOSTIGAMIENTO SEXUAL LABORAL
          </span>
        </div>

        <div className="w-48 flex items-center justify-center p-2">
          <img src="/logo_ruag.png" alt="RUAG" className="h-10 object-contain" />
        </div>
      </div>

      <div className="text-center font-bold text-base mb-16 uppercase text-black">
        CARGO
      </div>

      <div className="space-y-10 text-base px-2 text-black">
        <div className="flex items-end w-full leading-8">
          <span className="whitespace-nowrap mr-2">Yo</span>
          <div className="flex-1 border-b border-black text-center font-bold uppercase px-2 pb-1">
            {ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}
          </div>
          <span className="whitespace-nowrap ml-2 mr-2">, identificado con DNI</span>
          <div className="w-32 border-b border-black text-center font-bold pb-1">
            {ficha.dni}
          </div>
          <span className="whitespace-nowrap ml-1">,</span>
        </div>

        <div className="flex items-end w-full leading-8">
          <span className="whitespace-nowrap mr-2">colaborador de RUAG S.R.L., ocupando el cargo de</span>
          <div className="flex-1 border-b border-black text-center font-bold uppercase px-2 pb-1">
            {ficha.cargo || 'OPERARIO'}
          </div>
          <span className="whitespace-nowrap ml-2">, declaro lo siguiente:</span>
        </div>

        <div className="pl-10 space-y-4 mt-8 pr-4 text-black">
          <div className="flex gap-4">
            <span className="font-bold">1.</span>
            <p className="text-justify">Haber recibido la Política de Prevención y Sanción del Hostigamiento Sexual Laboral.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-bold">2.</span>
            <p className="text-justify">Haber leído y entendido el contenido de la Política de Prevención y Sanción del Hostigamiento Sexual Laboral.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-bold">3.</span>
            <p className="text-justify">Encontrarme conforme con todos sus términos.</p>
          </div>
        </div>
      </div>

      <div className="mt-20 px-2 text-base flex items-end text-black">
        <span>Lima, </span>
        <div className="w-16 border-b border-black text-center mx-2 pb-1">{day}</div>
        <span> de </span>
        <div className="w-32 border-b border-black text-center mx-2 capitalize pb-1">{month}</div>
        <span>.</span>
        <span className="ml-1"> de 20</span>
        <div className="w-10 border-b border-black text-center pb-1">{year.toString().slice(-2)}</div>
        <span>.</span>
      </div>

      <div className="mt-28 px-4 flex justify-between items-end text-black">
        <div className="flex flex-col w-64">
          <div className="h-24 w-full flex items-end justify-center overflow-hidden mb-2">
            {ficha.firma_url && (
              <img
                src={ficha.firma_url}
                alt="Firma"
                className="max-h-20 max-w-[85%] object-contain"
              />
            )}
          </div>
          <div className="border-t border-black w-full pt-2 text-center">
            <p className="font-bold text-sm">Firma</p>
            <p className="font-bold text-sm">Huella dactilar</p>
          </div>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center mr-10">
          {ficha.huella_url ? (
            <div className="border border-black p-1 bg-white">
              <img
                src={ficha.huella_url}
                alt="Huella"
                className="h-28 w-20 object-contain mix-blend-multiply opacity-90"
              />
            </div>
          ) : (
            <div className="w-20 h-28 border border-black bg-white flex items-center justify-center text-xs text-gray-400 rounded">
              Huella
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
