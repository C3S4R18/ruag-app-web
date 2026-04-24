/* eslint-disable @next/next/no-img-element */
import React from 'react'
import NormalizedSignatureImage from './NormalizedSignatureImage'

export const CargoRitPrintable = ({ ficha }: { ficha: any }) => {
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
      <div className="flex mb-12 border border-black">
        <div className="w-24 flex items-center justify-center p-2 border-r border-black">
          <span className="font-bold text-xs text-black">Versión 01</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-2 font-bold text-center text-base border-r border-black text-black">
          REGLAMENTO INTERNO DE
          <br />
          TRABAJO
        </div>

        <div className="w-40 flex items-center justify-center p-2">
          <img src="/logo_ruag.png" alt="RUAG" className="h-12 object-contain" />
        </div>
      </div>

      <div className="text-center font-bold text-lg mb-12 uppercase decoration-black underline-offset-4 text-black">
        CARGO
      </div>

      <div className="space-y-8 text-base text-justify px-4 text-black">
        <p className="leading-8">
          Yo, <span className="font-bold uppercase px-2">{ficha.nombres} {ficha.apellido_paterno} {ficha.apellido_materno}</span>,
          identificado con DNI N° <span className="font-bold px-2">{ficha.dni}</span>,
          colaborador de RUAG S.R.L., ocupando el cargo de <span className="font-bold uppercase px-2">{ficha.cargo || 'OPERARIO'}</span>,
          declaro lo siguiente:
        </p>

        <div className="pl-8 space-y-6 mt-8">
          <div className="flex gap-4">
            <span className="font-bold">1.</span>
            <p>Haber recibido el Reglamento Interno de Trabajo.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-bold">2.</span>
            <p>Haber leído y entendido el contenido del Reglamento Interno de Trabajo.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-bold">3.</span>
            <p>Encontrarme conforme con todos sus términos.</p>
          </div>
        </div>
      </div>

      <div className="mt-16 px-4 text-base text-black">
        Lima, <span className="inline-block w-12 text-center border-b border-black">{day}</span> de <span className="inline-block w-32 text-center border-b border-black capitalize">{month}</span> de 20<span className="inline-block w-10 text-center border-b border-black">{year.toString().slice(-2)}</span>.
      </div>

      <div className="mt-28 flex justify-center items-end relative text-black">
        <div className="flex flex-col items-center w-64">
          <div className="h-24 w-full flex items-end justify-center overflow-hidden mb-2">
            {ficha.firma_url && (
              <NormalizedSignatureImage
                src={ficha.firma_url}
                alt="Firma"
                style={{ maxHeight: '56px', maxWidth: '82%', objectFit: 'contain' }}
              />
            )}
          </div>

          <div className="border-t border-black w-full pt-2 text-center">
            <p className="font-bold text-sm">Firma y Huella dactilar</p>
          </div>
        </div>

        {ficha.huella_url ? (
          <div className="absolute right-10 bottom-0 border border-black p-1 bg-white">
            <img
              src={ficha.huella_url}
              alt="Huella"
              className="h-28 w-20 object-contain mix-blend-multiply opacity-90"
            />
          </div>
        ) : (
          <div className="absolute right-10 bottom-0 w-20 h-28 border border-black bg-white flex items-center justify-center text-xs text-gray-400">
            Huella
          </div>
        )}
      </div>
    </div>
  )
}
