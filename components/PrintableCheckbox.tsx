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
      <span
        style={{
          display: 'inline-flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          transform: 'translateY(-0.5px)',
        }}
      >
        {checked ? 'X' : ''}
      </span>
    </span>
  )
}
