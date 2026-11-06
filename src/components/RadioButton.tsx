import React, { CSSProperties } from 'react'
import { merge } from 'src/utils/NodashUtil'
import 'src/components/forms/formTheme.css'

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

  const basicLabelStyle: CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#603B9B',
    fontSize: 15,
    fontWeight: '500',
  }

  const wrapperStyle: CSSProperties = style ? merge({}, basicWrapperStyle, style) : basicWrapperStyle
  const labelStyle: CSSProperties = style ? merge({}, basicLabelStyle, style) : basicLabelStyle

  return (
    <div style={style}>
      <label htmlFor={id} style={wrapperStyle} aria-label={label}>
        {/* The circle is drawn by formTheme.css from the input's own :checked/:disabled/:focus-visible state. */}
        <span className="radio-button-input" style={{ float: 'left' }}>
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
          <span className="radio-button-dot" />
        </span>
        <div style={{ marginLeft: '3rem' }}>
          <span style={labelStyle}>{label}</span>
          <span style={DESCRIPTION_STYLE}>{description}</span>
        </div>
      </label>
    </div>
  )
}
