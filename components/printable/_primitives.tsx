/* eslint-disable @next/next/no-img-element */
import React from 'react'

/* ────────────────────────────────────────────────────────────────────
 * PRIMITIVOS COMPARTIDOS — Documentos imprimibles RUAG
 *
 * Objetivo: que todos los documentos (web obrero, app móvil preview,
 * admin SSOMA preview, impresión final) se vean **idénticos** a los PDFs
 * oficiales de la empresa.
 *
 * Reglas de diseño:
 *   1. El texto del usuario va CENTRADO encima de la línea (no pegado).
 *   2. La "X" de los checks va CENTRADA dentro del cuadro.
 *   3. Header oficial: caja a la izquierda con logo RUAG, columna central
 *      con SISTEMA DE GESTIÓN INTEGRADOS + título, columna derecha con
 *      CÓDIGO / REVISIÓN / FECHA / PÁGINA.
 *   4. Hoja A4 vertical (210x297mm) por default.
 * ──────────────────────────────────────────────────────────────────── */

interface PrintableA4Props {
  children: React.ReactNode
  className?: string
  /** Padding interno (default ajustado al margen de los oficiales). */
  padding?: string
  /** Si quieres que NO genere page-break después (ej. continúa otra hoja). */
  noBreakAfter?: boolean
}

/** Contenedor A4 estándar de los documentos RUAG. */
export function PrintableA4({
  children,
  className = '',
  padding = 'px-[18mm] py-[14mm]',
  noBreakAfter = false,
}: PrintableA4Props) {
  return (
    <div
      className={`w-[210mm] min-h-[297mm] bg-white mx-auto relative font-sans text-[12px] leading-[1.5] text-black box-border ${padding} ${className}`}
      style={{
        pageBreakAfter: noBreakAfter ? 'auto' : 'always',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {children}
    </div>
  )
}

interface DocHeaderProps {
  /** Texto del banner gris superior (ej. "SISTEMA DE GESTIÓN INTEGRADOS"). */
  banner?: string
  /** Título principal centro (ej. "REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO"). */
  title: string
  /** Subtítulo opcional bajo el título. */
  subtitle?: string
  /** Código del documento (ej. "SG-RIT-01"). */
  code: string
  /** Revisión (ej. "01"). */
  revision?: string | number
  /** Fecha (ej. "4/01/2024"). */
  date?: string
  /** Página (ej. "54 de 54" o "01 / 01"). */
  page?: string
  /** Path del logo. */
  logo?: string
  /** Anota algo bajo el header (ej. "ANEXO N° 3 COMPROMISO"). */
  annex?: string
}

/** Header oficial RUAG: caja con logo + título central + metadata derecha. */
export function DocHeader({
  banner = 'SISTEMA DE GESTIÓN INTEGRADOS',
  title,
  subtitle,
  code,
  revision,
  date,
  page,
  logo = '/logo_ruag.png',
  annex,
}: DocHeaderProps) {
  return (
    <>
      <div className="border border-black grid grid-cols-[110px_1fr_180px] text-[11px]">
        {/* Logo */}
        <div className="border-r border-black flex items-center justify-center p-1.5 bg-white">
          <img src={logo} alt="RUAG" className="h-[44px] object-contain" />
        </div>
        {/* Banner + título */}
        <div className="border-r border-black flex flex-col">
          {banner && (
            <div className="border-b border-black text-center font-bold py-1 px-2 uppercase">
              {banner}
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center text-center font-bold uppercase px-2 py-1.5 leading-tight whitespace-pre-line">
            <span>{title}</span>
            {subtitle && <span className="mt-0.5">{subtitle}</span>}
          </div>
        </div>
        {/* Metadata: filas CÓDIGO / REVISIÓN / FECHA / PÁGINA */}
        <div className="grid grid-cols-[80px_1fr] text-[10.5px]">
          <div className="border-b border-r border-black font-bold uppercase px-2 py-1 bg-white">Código:</div>
          <div className="border-b border-black px-2 py-1 text-center">{code}</div>

          {revision !== undefined && (
            <>
              <div className="border-b border-r border-black font-bold uppercase px-2 py-1 bg-white">Revisión:</div>
              <div className="border-b border-black px-2 py-1 text-center">
                {String(revision).padStart(2, '0')}
              </div>
            </>
          )}
          {date && (
            <>
              <div className="border-b border-r border-black font-bold uppercase px-2 py-1 bg-white">Fecha:</div>
              <div className="border-b border-black px-2 py-1 text-center">{date}</div>
            </>
          )}
          {page && (
            <>
              <div className="border-r border-black font-bold uppercase px-2 py-1 bg-white">Página:</div>
              <div className="px-2 py-1 text-center">{page}</div>
            </>
          )}
        </div>
      </div>

      {annex && (
        <div className="text-center font-bold uppercase text-[12px] mt-5 mb-3">
          {annex}
        </div>
      )}
    </>
  )
}

interface FilledLineProps {
  /** Valor a imprimir (en mayúsculas si quieres, lo controlas tú). */
  value?: string | number | null
  /** Ancho del campo. Acepta tailwind class (`w-32`, `w-full`) o estilo. */
  width?: string
  /** Tamaño de fuente del valor. */
  fontSize?: string
  /** Si true, deja la línea sin valor (solo subrayado para escribir a mano). */
  empty?: boolean
  /** Espaciado adicional para separar del label. */
  className?: string
  /** Alineación del valor sobre la línea (default center). */
  align?: 'left' | 'center' | 'right'
}

/**
 * Línea para llenar (input visual). El valor va CENTRADO encima de la línea,
 * separado del subrayado para que no se "pegue" como en los Printables viejos.
 */
export function FilledLine({
  value,
  width = 'flex-1',
  fontSize = 'text-[12px]',
  empty = false,
  className = '',
  align = 'center',
}: FilledLineProps) {
  const printedValue = empty ? '' : (value ?? '').toString()
  const justify =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
  return (
    <span
      className={`inline-flex flex-col ${width} ${className}`}
      style={{ minHeight: '24px' }}
    >
      <span
        className={`inline-flex ${justify} ${fontSize} font-semibold tracking-wide leading-tight pb-[5px] px-1`}
        style={{ minHeight: '18px' }}
      >
        {printedValue}
      </span>
      <span className="block border-b border-black w-full" />
    </span>
  )
}

interface InlineLabeledFieldProps {
  label: string
  value?: string | number | null
  /** Ancho relativo del valor. */
  valueWidth?: string
  fontSize?: string
  empty?: boolean
  uppercase?: boolean
  /** Espaciado al final del bloque. */
  className?: string
}

/** Combinación etiqueta + línea con valor centrado, sobre una sola fila. */
export function InlineField({
  label,
  value,
  valueWidth = 'flex-1',
  fontSize = 'text-[12px]',
  empty = false,
  uppercase = false,
  className = '',
}: InlineLabeledFieldProps) {
  const printed = empty ? '' : (value ?? '').toString()
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className={`shrink-0 font-semibold ${fontSize}`}>{label}</span>
      <FilledLine
        value={uppercase ? printed.toUpperCase() : printed}
        width={valueWidth}
        fontSize={fontSize}
        empty={empty}
      />
    </div>
  )
}

interface CheckBoxProps {
  checked?: boolean
  /** Lado del cuadro en px (default 14). */
  size?: number
  /** Carácter de marca (default 'X'). */
  mark?: string
  /** Color del cuadro. */
  borderColor?: string
}

/**
 * Cuadro de check con la "X" PERFECTAMENTE CENTRADA cuando está marcado.
 * Usado tanto en la previa de pantalla como en la impresión.
 */
export function CheckBox({
  checked = false,
  size = 14,
  mark = 'X',
  borderColor = 'border-black',
}: CheckBoxProps) {
  return (
    <span
      className={`inline-flex items-center justify-center align-middle border ${borderColor} bg-white text-black font-bold leading-none select-none print:bg-white`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: Math.round(size * 0.78),
      }}
    >
      {checked && <span style={{ marginTop: -1 }}>{mark}</span>}
    </span>
  )
}

interface SignatureBoxProps {
  /** URL de la firma (si existe). */
  src?: string | null
  /** Etiqueta debajo (ej. "Firma del Trabajador"). */
  label?: string
  /** Ancho de la firma. */
  width?: string
  /** Alto del recuadro. */
  height?: string
  /** Class extra. */
  className?: string
}

/** Bloque de firma reutilizable: imagen centrada encima, línea + etiqueta debajo. */
export function SignatureBox({
  src,
  label,
  width = 'w-[220px]',
  height = 'h-[80px]',
  className = '',
}: SignatureBoxProps) {
  return (
    <div className={`flex flex-col items-center ${width} ${className}`}>
      <div className={`${height} w-full flex items-end justify-center overflow-hidden`}>
        {src && (
          <img
            src={src}
            alt={label ?? 'Firma'}
            style={{ maxHeight: '70%', maxWidth: '90%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div className="border-t border-black w-full pt-1 text-center text-[11px] font-semibold">
        {label}
      </div>
    </div>
  )
}

interface FingerprintBoxProps {
  src?: string | null
  width?: string
  height?: string
  label?: string
  className?: string
}

/** Cuadro para huella digital (con o sin imagen). */
export function FingerprintBox({
  src,
  width = 'w-[100px]',
  height = 'h-[120px]',
  label = 'Huella Digital',
  className = '',
}: FingerprintBoxProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`${width} ${height} border border-black bg-white flex items-center justify-center overflow-hidden`}>
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-w-full max-h-full object-contain mix-blend-multiply opacity-90"
          />
        ) : null}
      </div>
      <span className="text-[11px] mt-1 text-center">{label}</span>
    </div>
  )
}
