import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import {
  FormInputGeneric,
  FormInputTextarea,
  FormInputMultiText,
  FormInputSelect,
  FormInputRadioGroup,
  FormInputYesNoRadioGroup,
  FormInputCheckbox,
  FormInputSlider,
  FormInputFile,
  type FormComponentConfig,
  type Validation,
} from 'src/components/forms/formComponents'

vi.mock('src/components/forms/formValidation', () => ({
  isValid: (v: Validation | undefined) => v?.valid !== false,
  validateFormValue: vi.fn(() => ({ valid: true })),
  validationMessage: (id: string) => `Error: ${id}`,
}))

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, onChange }: { id: string, onChange: (v: string) => void }) => (
    <input data-testid={`date-picker-${id}`} onChange={e => onChange(e.target.value)} />
  ),
}))

vi.mock('src/components/RadioButton', () => ({
  RadioButton: ({ id, description, onClick, disabled }: { id: string, description: string, onClick: () => void, disabled?: boolean }) => (
    <button data-testid={`radio-${id}`} onClick={onClick} disabled={disabled}>{description}</button>
  ),
}))

vi.mock('src/components/forms/forms', () => ({
  FormField: ({ id, placeholder }: { id: string, placeholder: string }) => (
    <input data-testid={`form-field-${id}`} placeholder={placeholder} readOnly />
  ),
}))

vi.mock('react-select', () => ({
  default: ({ id, onChange, options, value, placeholder, isDisabled }: {
    id: string
    onChange: (v: unknown) => void
    options: Array<{ key: string, displayText: string }>
    value: unknown
    placeholder: string
    isDisabled?: boolean
  }) => (
    <select
      data-testid={`select-${id}`}
      disabled={isDisabled}
      onChange={e => onChange(options?.find(o => o.key === e.target.value) ?? null)}
      value={(value as { key: string } | null)?.key ?? ''}
    >
      <option value="">{placeholder}</option>
      {options?.map(o => <option key={o.key} value={o.key}>{o.displayText}</option>)}
    </select>
  ),
}))

const baseConfig = (overrides: Partial<FormComponentConfig> = {}): FormComponentConfig => ({
  id: 'test-field',
  formValue: '',
  setFormValue: vi.fn(),
  setValidation: vi.fn(),
  ...overrides,
})

describe('formComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('FormInputGeneric', () => {
    it('renders with the provided id and value', () => {
      render(<FormInputGeneric {...baseConfig({ formValue: 'hello' })} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('hello')
      expect(input).toHaveAttribute('id', 'test-field')
    })

    it('calls setFormValue on change', async () => {
      const setFormValue = vi.fn()
      render(<FormInputGeneric {...baseConfig({ setFormValue })} />)
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })
      })
      expect(setFormValue).toHaveBeenCalledWith('new value')
    })

    it('renders as disabled when disabled is true', () => {
      render(<FormInputGeneric {...baseConfig({ disabled: true })} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('applies errored class when validation fails', () => {
      render(<FormInputGeneric {...baseConfig({ validation: { valid: false, failed: ['required'] } })} />)
      expect(screen.getByRole('textbox')).toHaveClass('errored')
    })

    it('calls onChange callback with key and value', async () => {
      const onChange = vi.fn()
      render(<FormInputGeneric {...baseConfig({ onChange, name: 'myField' })} />)
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
      })
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'myField', value: 'abc' }))
    })
  })

  describe('FormInputTextarea', () => {
    it('renders a textarea with the given value', () => {
      render(<FormInputTextarea {...baseConfig({ formValue: 'multi\nline' })} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveValue('multi\nline')
    })

    it('calls setFormValue on change', async () => {
      const setFormValue = vi.fn()
      render(<FormInputTextarea {...baseConfig({ setFormValue })} />)
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated' } })
      })
      expect(setFormValue).toHaveBeenCalledWith('updated')
    })

    it('respects rows and maxLength props', () => {
      render(<FormInputTextarea {...baseConfig({ rows: 5, maxLength: 200 })} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
      expect(textarea).toHaveAttribute('maxlength', '200')
    })
  })

  describe('FormInputMultiText', () => {
    it('renders existing pills from formValue', () => {
      render(<FormInputMultiText {...baseConfig({ formValue: ['tag1', 'tag2'] })} />)
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
    })

    it('adds a new pill on Enter keypress', async () => {
      const setFormValue = vi.fn()
      render(<FormInputMultiText {...baseConfig({ formValue: [], setFormValue })} />)
      const input = screen.getByRole('textbox')
      await act(async () => {
        fireEvent.change(input, { target: { value: 'newtag' } })
        fireEvent.keyUp(input, { code: 'Enter' })
      })
      expect(setFormValue).toHaveBeenCalledWith(['newtag'])
    })

    it('removes a pill when clicked', async () => {
      const setFormValue = vi.fn()
      render(<FormInputMultiText {...baseConfig({ formValue: ['a', 'b'], setFormValue })} />)
      const pillA = screen.getByText('a').closest('button')!
      await act(async () => {
        fireEvent.click(pillA)
      })
      expect(setFormValue).toHaveBeenCalledWith(['b'])
    })

    it('does not add duplicate pills', async () => {
      const setFormValue = vi.fn()
      render(<FormInputMultiText {...baseConfig({ formValue: ['existing'], setFormValue })} />)
      const input = screen.getByRole('textbox')
      await act(async () => {
        fireEvent.change(input, { target: { value: 'existing' } })
        fireEvent.keyUp(input, { code: 'Enter' })
      })
      expect(setFormValue).not.toHaveBeenCalled()
    })
  })

  describe('FormInputSelect', () => {
    const selectOptions = [
      { key: 'opt1', displayText: 'Option 1' },
      { key: 'opt2', displayText: 'Option 2' },
    ]

    it('renders select with options', () => {
      render(<FormInputSelect {...baseConfig({ selectOptions, formValue: null })} />)
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<FormInputSelect {...baseConfig({ selectOptions, formValue: null, disabled: true })} />)
      const select = screen.getByTestId('select-test-field')
      expect(select).toBeDisabled()
    })
  })

  describe('FormInputRadioGroup', () => {
    const options = [
      { id: 'a', name: 'option_a', text: 'Option A' },
      { id: 'b', name: 'option_b', text: 'Option B' },
    ]

    it('renders all radio options', () => {
      render(<FormInputRadioGroup {...baseConfig({ options, formValue: null })} />)
      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('Option B')).toBeInTheDocument()
    })

    it('calls setFormValue with option name when radio is clicked', async () => {
      const setFormValue = vi.fn()
      render(<FormInputRadioGroup {...baseConfig({ options, formValue: null, setFormValue })} />)
      await act(async () => {
        fireEvent.click(screen.getByText('Option A'))
      })
      expect(setFormValue).toHaveBeenCalledWith('option_a')
    })
  })

  describe('FormInputYesNoRadioGroup', () => {
    it('renders Yes and No radio buttons', () => {
      render(<FormInputYesNoRadioGroup {...baseConfig({ formValue: null })} />)
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    it('calls setFormValue with true when Yes is clicked', async () => {
      const setFormValue = vi.fn()
      render(<FormInputYesNoRadioGroup {...baseConfig({ setFormValue, formValue: null })} />)
      await act(async () => {
        fireEvent.click(screen.getByText('Yes'))
      })
      expect(setFormValue).toHaveBeenCalledWith(true)
    })

    it('calls setFormValue with false when No is clicked', async () => {
      const setFormValue = vi.fn()
      render(<FormInputYesNoRadioGroup {...baseConfig({ setFormValue, formValue: null })} />)
      await act(async () => {
        fireEvent.click(screen.getByText('No'))
      })
      expect(setFormValue).toHaveBeenCalledWith(false)
    })
  })

  describe('FormInputCheckbox', () => {
    it('renders a checkbox with the given checked state', () => {
      render(<FormInputCheckbox {...baseConfig({ formValue: true, toggleText: 'Accept terms' })} />)
      expect(screen.getByRole('checkbox')).toBeChecked()
      expect(screen.getByText('Accept terms')).toBeInTheDocument()
    })

    it('calls setFormValue on change', async () => {
      const setFormValue = vi.fn()
      render(<FormInputCheckbox {...baseConfig({ formValue: false, setFormValue, toggleText: 'Check me' })} />)
      await act(async () => {
        fireEvent.click(screen.getByRole('checkbox'))
      })
      expect(setFormValue).toHaveBeenCalledWith(true)
    })

    it('renders as disabled when disabled is true', () => {
      render(<FormInputCheckbox {...baseConfig({ formValue: false, disabled: true, toggleText: 'Disabled' })} />)
      expect(screen.getByRole('checkbox')).toBeDisabled()
    })
  })

  describe('FormInputSlider', () => {
    it('renders a checkbox (slider) with toggle text', () => {
      render(<FormInputSlider {...baseConfig({ formValue: false, toggleText: 'Enable feature' })} />)
      expect(screen.getAllByText('Enable feature').length).toBeGreaterThan(0)
    })

    it('calls setFormValue when slider is toggled', async () => {
      const setFormValue = vi.fn()
      render(<FormInputSlider {...baseConfig({ formValue: false, setFormValue, toggleText: 'Toggle' })} />)
      const checkbox = document.querySelector('input[type="checkbox"]')!
      await act(async () => {
        fireEvent.click(checkbox)
      })
      expect(setFormValue).toHaveBeenCalledWith(true)
    })
  })

  describe('FormInputFile', () => {
    it('renders file label and filename input', async () => {
      await act(async () => {
        render(<FormInputFile {...baseConfig({ formValue: undefined })} />)
      })
      expect(screen.getByText('Upload a file')).toBeInTheDocument()
      expect(screen.getByTestId('form-field-test-field_fileName')).toBeInTheDocument()
    })

    it('hides file label when hideInput is true', async () => {
      await act(async () => {
        render(<FormInputFile {...baseConfig({ formValue: undefined, hideInput: true })} />)
      })
      expect(screen.queryByText('Upload a file')).not.toBeInTheDocument()
    })

    it('hides filename bar when hideTextBar is true', async () => {
      await act(async () => {
        render(<FormInputFile {...baseConfig({ formValue: undefined, hideTextBar: true })} />)
      })
      expect(screen.queryByTestId('form-field-test-field_fileName')).not.toBeInTheDocument()
    })

    it('calls setFormValue when file is selected', async () => {
      const setFormValue = vi.fn()
      await act(async () => {
        render(<FormInputFile {...baseConfig({ formValue: undefined, setFormValue })} />)
      })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const mockFile = new File(['content'], 'report.pdf', { type: 'application/pdf' })
      await act(async () => {
        fireEvent.change(input, { target: { files: [mockFile] } })
      })
      await waitFor(() => expect(setFormValue).toHaveBeenCalledWith(mockFile))
    })
  })
})
