import React from 'react'

const styles = {
  customStyle: {
    padding: '25px 15px',
    width: '100%',
  },
}

export interface NumberInputProps {
  id: string
  name?: string
  title: string
  placeholder?: string
  defaultValue?: number
  required?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  inputRef?: React.Ref<HTMLInputElement>
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  name = id,
  title,
  placeholder = 'Number',
  defaultValue,
  required = true,
  onChange = () => {},
  inputRef,
}) => {
  const [hasError, setHasError] = React.useState(false)
  const [fieldValue, setFieldValue] = React.useState<string>(defaultValue?.toString() || '')

  const validateInput = (input: string) => {
    if (input.trim() === '') {
      setHasError(required)
      return
    }
    const isValidNumber = !isNaN(Number(input)) && isFinite(Number(input))
    setHasError(!isValidNumber)
  }

  const onChangeDefault = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    setFieldValue(inputValue)
    validateInput(inputValue)
    onChange(event)
  }

  return (
    <>
      <label className={`control-label ${hasError && 'errored'}`} htmlFor={id}>{title}{required && '*'}</label>
      <br />
      <input
        className={`form-control ${hasError && 'errored'}`}
        type="number"
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        style={styles.customStyle}
        value={fieldValue}
        onChange={onChangeDefault}
        // because type="number" non-numeric characters will not trigger onChange, so also use onBlur
        onBlur={onChangeDefault}
        ref={inputRef}
      />
      {hasError && (
        <>
          <div className="error-message fadein">
            <span className="glyphicon glyphicon-play" />
            <div>Please enter a valid number</div>
          </div>
        </>
      )}
    </>
  )
}

export default NumberInput
