import React, { CSSProperties } from 'react'
import { merge } from 'src/utils/NodashUtil'

interface RadioButtonProps {
  id?: string
  name?: string
  value?: string | number | readonly string[]
  defaultChecked?: boolean
  onClick?: React.MouseEventHandler<HTMLInputElement>
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  style?: CSSProperties
  label?: string
  description?: React.ReactNode
}

const DESCRIPTION_STYLE: CSSProperties = {
  marginLeft: '.25rem',
  fontWeight: 'normal',
}

export const RadioButton = (props: Readonly<RadioButtonProps>) => {
  const { id, name, value, defaultChecked, onClick, onChange, disabled, style, label, description } = props

  const basicWrapperStyle: CSSProperties = {
    fontSize: 15,
    lineHeight: '2rem',
    color: '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
  }

  const basicUnchecked: CSSProperties = {
    fontSize: 15,
    lineHeight: '1.5rem',
    color: '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
    position: 'absolute',
    top: 0,
    left: 0,
    height: 20,
    width: 20,
    backgroundColor: 'white',
    borderRadius: '50%',
    border: '1px solid #999999',
  }

  const basicLabelStyle: CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#603B9B',
    fontSize: 15,
    fontWeight: '500',
  }

  const wrapperStyle: CSSProperties = style ? merge({}, basicWrapperStyle, style) : basicWrapperStyle
  const uncheckedStyle: CSSProperties = style ? merge({}, basicUnchecked, style) : basicUnchecked
  const checkedStyle: CSSProperties = merge({}, uncheckedStyle, {
    boxShadow: 'rgb(0, 0, 0) 0 0 0 1px',
    backgroundColor: '#2196F3',
    border: '2px solid white',
  })
  const labelStyle: CSSProperties = style ? merge({}, basicLabelStyle, style) : basicLabelStyle

  return (
    <div style={style}>
      <label htmlFor={id} style={wrapperStyle}>
        <div style={{ float: 'left' }}>
          <input
            id={id}
            type="radio"
            name={name}
            value={value}
            checked={defaultChecked}
            onClick={onClick}
            disabled={disabled}
            onChange={onChange ?? (() => {})}
          />
          <span style={defaultChecked ? checkedStyle : uncheckedStyle} />
        </div>
        <div style={{ marginLeft: '3rem' }}>
          <span style={labelStyle}>{label}</span>
          <span style={DESCRIPTION_STYLE}>{description}</span>
        </div>
      </label>
    </div>
  )
}
