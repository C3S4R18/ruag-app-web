import React from 'react'

type PrintableCheckboxProps = {
  checked?: boolean
  size?: number
  fontSize?: number
  style?: React.CSSProperties
}

export default function PrintableCheckbox({
  checked = false,
  size = 12,
  fontSize = 10,
  style,
}: PrintableCheckboxProps) {
  return (
    <span
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '1px solid #000',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        lineHeight: 1,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        textAlign: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      {checked ? 'X' : ''}
    </span>
  )
}
