import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField, FormFieldChangeEvent, FormFieldConfig, FormFieldTypes, FormTable, FormValidators } from 'src/components/forms/forms'
import { validateFormProps } from 'src/components/forms/formUtils'
import dayjs, { Dayjs } from 'dayjs'

interface DatePickerMockProps {
  id: string
  defaultValue: Dayjs | string | number | Date | null | undefined
  onChange: (value: string) => void
  onError: (error: string, value: unknown) => void
}

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, defaultValue, onChange, onError }: DatePickerMockProps) => {
    React.useEffect(() => {
      if (defaultValue != null && typeof (defaultValue as Dayjs).isValid === 'function' && !(defaultValue as Dayjs).isValid()) {
        onError('invalidDate', defaultValue)
      }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValue])
    return (
      <input
        id={id}
        type="date"
        defaultValue={defaultValue != null ? String(defaultValue) : ''}
        onChange={e => onChange(e.target.value)}
      />
    )
  },
}))

const baseProps: { onChange: (event: FormFieldChangeEvent) => void } = {
  onChange: vi.fn(),
}

describe('FormField - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Calendar Picker', () => {
    it('should render a required calendar picker control', () => {
      const props = {
        ...baseProps,
        type: FormFieldTypes.CALENDAR,
        id: 'releaseDate',
        title: 'Release Date',
        defaultValue: dayjs(),
        validators: [FormValidators.REQUIRED, FormValidators.DATEJS],
      }
      render(<FormField {...props} />)
      expect(document.getElementById('lbl_releaseDate')).toHaveTextContent('Release Date*')
    })

    it('should render an optional calendar picker control', () => {
      const props = {
        ...baseProps,
        type: FormFieldTypes.CALENDAR,
        id: 'optionalDate',
        title: 'Optional Date',
        defaultValue: dayjs('2024-11-15'),
        validators: [FormValidators.DATEJS],
      }
      render(<FormField {...props} />)
      expect(document.getElementById('lbl_optionalDate')).toHaveTextContent('Optional Date')
      expect(document.getElementById('lbl_optionalDate')).not.toHaveTextContent('*')
    })

    it('should render a calendar picker control initialized with an error', () => {
      const props = {
        ...baseProps,
        type: FormFieldTypes.CALENDAR,
        id: 'optionalDate',
        title: 'Optional Date',
        defaultValue: dayjs('Hello World!'),
        validators: [FormValidators.DATEJS],
      }
      render(<FormField {...props} />)
      expect(document.querySelector('.formField-optionalDate .error-message')).toHaveTextContent(FormValidators.DATEJS.msg)
    })

    it('initialized with a specific date shows label without required indicator', () => {
      const props = {
        ...baseProps,
        id: 'fixedDate',
        title: 'Fixed Date',
        type: FormFieldTypes.CALENDAR,
        defaultValue: '1970-01-01',
        validators: [FormValidators.DATEJS],
      }
      render(<FormField {...props} />)
      expect(document.getElementById('lbl_fixedDate')).toHaveTextContent('Fixed Date')
      expect(document.getElementById('lbl_fixedDate')).not.toHaveTextContent('*')
    })
  })

  describe('Validation', () => {
    it('should render required indicator', () => {
      const props = {
        ...baseProps,
        id: 'studyName',
        title: 'Study Name',
        validators: [FormValidators.REQUIRED],
      }
      render(<FormField {...props} />)
      expect(screen.getByText('Study Name*')).toBeInTheDocument()
    })

    it('should run custom validator when user inputs a value', () => {
      const validatorSpy = vi.spyOn(FormValidators.EMAIL, 'isValid')
      const props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validators: [FormValidators.EMAIL],
      }
      render(<FormField {...props} />)
      fireEvent.change(document.getElementById('dataCustodianEmail')!, { target: { value: 'a' } })
      expect(validatorSpy).toHaveBeenCalledWith('a')
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'dataCustodianEmail', value: 'a', isValid: false })
      validatorSpy.mockRestore()
    })

    it('should show error message with validator error message', () => {
      const props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validators: [FormValidators.EMAIL],
      }
      render(<FormField {...props} />)
      fireEvent.change(document.getElementById('dataCustodianEmail')!, { target: { value: 'a' } })
      expect(document.querySelector('.formField-dataCustodianEmail .error-message')).toHaveTextContent(FormValidators.EMAIL.msg)
    })

    it('updates external validation', () => {
      const onValidationChange = vi.fn()
      const props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validators: [FormValidators.EMAIL, FormValidators.REQUIRED],
        onValidationChange,
      }
      render(<FormField {...props} />)
      const input = document.getElementById('dataCustodianEmail')!

      fireEvent.change(input, { target: { value: 'a' } })
      expect(onValidationChange).toHaveBeenCalledWith({
        key: 'dataCustodianEmail',
        validation: { valid: false, failed: ['email'], messages: [FormValidators.EMAIL.msg] },
      })

      fireEvent.change(input, { target: { value: 'a@gmail.com' } })
      expect(onValidationChange).toHaveBeenCalledWith({ key: 'dataCustodianEmail', validation: { valid: true, failed: [], messages: [] } })

      fireEvent.change(input, { target: { value: '' } })
      expect(onValidationChange).toHaveBeenCalledWith({
        key: 'dataCustodianEmail',
        validation: { valid: false, failed: ['email', 'required'], messages: [FormValidators.EMAIL.msg, FormValidators.REQUIRED.msg] },
      })
    })

    it('can take external validation control', () => {
      const props = {
        ...baseProps,
        id: 'dataCustodianEmail',
        title: 'Data Custodian Email',
        validation: { valid: false, failed: ['required', 'email'] },
      }
      render(<FormField {...props} />)
      expect(document.querySelector('.formField-dataCustodianEmail .error-message')).toHaveTextContent(FormValidators.REQUIRED.msg)
      expect(document.querySelector('.formField-dataCustodianEmail .error-message')).toHaveTextContent(FormValidators.EMAIL.msg)
    })
  })

  describe('Form Control - Text Input Tests', () => {
    let props: FormFieldConfig

    beforeEach(() => {
      props = {
        ...baseProps,
        id: 'studyName',
        title: 'Study Name',
        validators: [FormValidators.REQUIRED],
      }
    })

    it('should render', () => {
      render(<FormField {...props} />)
      expect(document.querySelector('.formField-studyName')).toBeInTheDocument()
      expect(document.getElementById('lbl_studyName')).toHaveTextContent('Study Name')
      expect(document.getElementById('studyName')).toBeInTheDocument()
    })

    it('should run onChange event when user inputs values into form control', () => {
      const textToType = 'Dangerous Study'
      render(<FormField {...props} />)
      fireEvent.change(document.getElementById('studyName')!, { target: { value: textToType } })
      expect(document.getElementById('studyName')).toHaveValue(textToType)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'studyName', value: textToType, isValid: true })
    })

    it('should display error when text input is required, value is blank', () => {
      render(<FormField {...props} />)
      const input = document.getElementById('studyName')!
      fireEvent.change(input, { target: { value: 'hello' } })
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
      expect(input).toHaveValue('')
      expect(input).toHaveClass('errored')
      expect(document.getElementById('lbl_studyName')).toHaveClass('errored')
    })

    it('should display error when text input is required, but is dirty', () => {
      render(<FormField {...props} />)
      const input = document.getElementById('studyName')!
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(input).toHaveValue('')
      expect(input).toHaveClass('errored')
      expect(document.getElementById('lbl_studyName')).toHaveClass('errored')
    })

    it('should be disabled when the config declares it', () => {
      render(<FormField {...props} disabled={true} />)
      expect(document.getElementById('studyName')).toBeDisabled()
    })
  })

  describe('Form Control - Radio Group', () => {
    const radioProps = {
      ...baseProps,
      type: FormFieldTypes.RADIOGROUP,
      id: 'radioGroup',
      options: [
        { id: 'opt1', name: 'opt1', text: 'Option 1' },
        { id: 'opt2', name: 'opt2', text: 'Option 2' },
        { id: 'opt3', name: 'opt3', text: 'Option 3' },
      ],
    }

    it('should render', () => {
      render(<FormField {...radioProps} />)
      expect(document.getElementById('radioGroup_opt1')).toBeInTheDocument()
      expect(document.getElementById('radioGroup_opt2')).toBeInTheDocument()
      expect(document.getElementById('radioGroup_opt3')).toBeInTheDocument()
    })

    it('should able to check, only one at a time', () => {
      render(<FormField {...radioProps} />)
      const opt1 = document.getElementById('radioGroup_opt1') as HTMLInputElement
      const opt2 = document.getElementById('radioGroup_opt2') as HTMLInputElement
      const opt3 = document.getElementById('radioGroup_opt3') as HTMLInputElement

      expect(opt1).not.toBeChecked()
      expect(opt2).not.toBeChecked()
      expect(opt3).not.toBeChecked()

      fireEvent.click(opt1)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'radioGroup', value: 'opt1', isValid: true })
      expect(opt1).toBeChecked()
      expect(opt2).not.toBeChecked()
      expect(opt3).not.toBeChecked()

      fireEvent.click(opt2)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'radioGroup', value: 'opt2', isValid: true })
      expect(opt1).not.toBeChecked()
      expect(opt2).toBeChecked()
      expect(opt3).not.toBeChecked()

      fireEvent.click(opt3)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'radioGroup', value: 'opt3', isValid: true })
      expect(opt1).not.toBeChecked()
      expect(opt2).not.toBeChecked()
      expect(opt3).toBeChecked()
    })
  })

  describe('Form Control - MultiText', () => {
    const multiTextProps = {
      ...baseProps,
      id: 'dataCustodianEmail',
      title: 'Data Custodian Email',
      type: FormFieldTypes.MULTITEXT,
      validators: [FormValidators.EMAIL],
      defaultValue: [],
    }

    it('should render', () => {
      render(<FormField {...multiTextProps} />)
      expect(document.querySelector('.formField-dataCustodianEmail')).toBeInTheDocument()
      expect(document.getElementById('lbl_dataCustodianEmail')).toHaveTextContent('Data Custodian Email')
      expect(document.getElementById('dataCustodianEmail')).toBeInTheDocument()
    })

    it('should add email address', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      await user.type(document.getElementById('dataCustodianEmail')!, 'a@a.com{Enter}')
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'dataCustodianEmail', value: ['a@a.com'], isValid: true })
      expect(document.querySelector('.formField-dataCustodianEmail .pill')).toHaveTextContent('a@a.com')
    })

    it('should add multiple email addresses', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'a@a.com{Enter}')
      await user.type(input, 'b@b.com{Enter}')
      await user.type(input, 'c@c.com{Enter}')
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com', 'c@c.com'], isValid: true })
      const pills = document.querySelectorAll('.formField-dataCustodianEmail .pill')
      expect(pills[0]).toHaveTextContent('a@a.com')
      expect(pills[1]).toHaveTextContent('b@b.com')
      expect(pills[2]).toHaveTextContent('c@c.com')
    })

    it('should not add duplicate emails', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'a@a.com{Enter}')
      await user.type(input, 'a@a.com{Enter}')
      expect(baseProps.onChange).toHaveBeenCalledTimes(1)
      expect(input).toHaveValue('')
      expect(document.querySelectorAll('.formField-dataCustodianEmail .pill')).toHaveLength(1)
    })

    it('should not add invalid emails', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'not an email haha{Enter}')
      expect(baseProps.onChange).not.toHaveBeenCalled()
      expect(input).toHaveValue('not an email haha')
      expect(input).toHaveClass('errored')
    })

    it('should remove single on click', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      await user.type(document.getElementById('dataCustodianEmail')!, 'a@a.com{Enter}')
      const pill = document.querySelector('.formField-dataCustodianEmail .pill')!
      expect(pill).toBeInTheDocument()
      await user.click(pill)
      expect(document.querySelector('.formField-dataCustodianEmail .pill')).not.toBeInTheDocument()
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'dataCustodianEmail', value: [], isValid: true })
    })

    it('should remove [x, 1, 2] from array on click', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'a@a.com{Enter}')
      await user.type(input, 'b@b.com{Enter}')
      await user.type(input, 'c@c.com{Enter}')
      await user.click(document.querySelectorAll('.formField-dataCustodianEmail .pill')[0])
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'dataCustodianEmail', value: ['b@b.com', 'c@c.com'], isValid: true })
      const pills = document.querySelectorAll('.formField-dataCustodianEmail .pill')
      expect(pills[0]).toHaveTextContent('b@b.com')
      expect(pills[1]).toHaveTextContent('c@c.com')
    })

    it('should remove [0, x, 2] from array on click', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'a@a.com{Enter}')
      await user.type(input, 'b@b.com{Enter}')
      await user.type(input, 'c@c.com{Enter}')
      await user.click(document.querySelectorAll('.formField-dataCustodianEmail .pill')[1])
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'dataCustodianEmail', value: ['a@a.com', 'c@c.com'], isValid: true })
      const pills = document.querySelectorAll('.formField-dataCustodianEmail .pill')
      expect(pills[0]).toHaveTextContent('a@a.com')
      expect(pills[1]).toHaveTextContent('c@c.com')
    })

    it('should remove [0, 1, x] from array on click', async () => {
      const user = userEvent.setup()
      render(<FormField {...multiTextProps} />)
      const input = document.getElementById('dataCustodianEmail')!
      await user.type(input, 'a@a.com{Enter}')
      await user.type(input, 'b@b.com{Enter}')
      await user.type(input, 'c@c.com{Enter}')
      await user.click(document.querySelectorAll('.formField-dataCustodianEmail .pill')[2])
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'dataCustodianEmail', value: ['a@a.com', 'b@b.com'], isValid: true })
      const pills = document.querySelectorAll('.formField-dataCustodianEmail .pill')
      expect(pills[0]).toHaveTextContent('a@a.com')
      expect(pills[1]).toHaveTextContent('b@b.com')
    })
  })

  describe('Form Control - Slider Tests', () => {
    const sliderProps = {
      ...baseProps,
      id: 'publicVisibility',
      title: 'Public Visibility',
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SLIDER,
      description: `Please select if you would like your dataset
          to be publicly visible for the requesters to see and select
          for an access request`,
      toggleText: 'Visible',
    }

    it('should render', () => {
      render(<FormField {...sliderProps} />)
      expect(document.querySelector('.formField-publicVisibility')).toBeInTheDocument()
    })

    it('should run onChange event when user toggles the slider false', () => {
      render(<FormField {...sliderProps} />)
      const checkbox = document.getElementById('publicVisibility') as HTMLInputElement
      expect(checkbox).not.toBeChecked()
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'publicVisibility', value: true, isValid: true })
    })

    it('should run onChange event when user toggles the slider true', () => {
      render(<FormField {...sliderProps} />)
      const checkbox = document.getElementById('publicVisibility') as HTMLInputElement
      fireEvent.click(checkbox)
      fireEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'publicVisibility', value: false, isValid: true })
    })
  })

  describe('Form Control - Select Tests', () => {
    const selectOptions = [
      'Observational', 'Interventional', 'Descriptive',
      'Analytical', 'Prospective', 'Retrospective',
      'Case report', 'Case series', 'Cross-sectional',
      'Cohort study',
    ].map(opt => ({ displayName: opt, displayText: opt }))

    const selectProps = {
      ...baseProps,
      id: 'studyType',
      title: 'Study Type',
      type: FormFieldTypes.SELECT,
      selectOptions,
    }

    it('should render', () => {
      render(<FormField {...selectProps} />)
      expect(document.querySelector('.formField-studyType')).toBeInTheDocument()
      expect(screen.getByText('Study Type')).toBeInTheDocument()
      expect(document.getElementById('studyType')).toBeInTheDocument()
    })

    it('should allow user to search options', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} />)
      await user.type(screen.getByRole('combobox'), 'Obs')
      await user.click(await screen.findByText('Observational'))
      expect(baseProps.onChange).toHaveBeenCalledWith({
        key: 'studyType',
        value: { displayName: 'Observational', displayText: 'Observational' },
        isValid: true,
      })
    })

    it('should not allow user to select by entering a new option as freetext if creatable not set', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} />)
      await user.type(screen.getByRole('combobox'), 'asdf{Enter}')
      expect(baseProps.onChange).not.toHaveBeenCalled()
    })

    it('should allow user to select by entering a new option as freetext if creatable set', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} isCreatable={true} />)
      await user.type(screen.getByRole('combobox'), 'asdf{Enter}')
      expect(baseProps.onChange).toHaveBeenCalledWith({
        key: 'studyType',
        value: { key: 'asdf', displayText: 'asdf' },
        isValid: true,
      })
    })

    it('returns string when isString', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} selectOptions={['Observational', 'Other']} isCreatable={true} />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'Obs')
      await user.click(await screen.findByText('Observational'))
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'studyType', value: 'Observational', isValid: true })
      await user.type(input, 'asdf{Enter}')
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'studyType', value: 'asdf', isValid: true })
    })

    it('allows multiple selection', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} isMulti={true} />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'Obs')
      await user.click(await screen.findByText('Observational'))
      expect(baseProps.onChange).toHaveBeenCalledWith({
        key: 'studyType',
        value: [{ displayName: 'Observational', displayText: 'Observational' }],
        isValid: true,
      })
      await user.type(input, 'Prosp')
      await user.click(await screen.findByText('Prospective'))
      expect(baseProps.onChange).toHaveBeenLastCalledWith({
        key: 'studyType',
        value: [
          { displayName: 'Observational', displayText: 'Observational' },
          { displayName: 'Prospective', displayText: 'Prospective' },
        ],
        isValid: true,
      })
    })

    it('allows multiple selection with creatable', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} isMulti={true} isCreatable={true} />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'Obs')
      await user.click(await screen.findByText('Observational'))
      await user.type(input, 'asdf{Enter}')
      const onChangeMock = vi.mocked(baseProps.onChange)
      const lastCall = onChangeMock.mock.calls[onChangeMock.mock.calls.length - 1][0]
      expect(lastCall.key).toBe('studyType')
      expect(lastCall.isValid).toBe(true)
      const values = lastCall.value as { displayText: string }[]
      expect(values.map(v => v.displayText)).toContain('Observational')
      expect(values.map(v => v.displayText)).toContain('asdf')
    })

    it('allows multiple selection with string array', async () => {
      const user = userEvent.setup()
      render(<FormField {...selectProps} selectOptions={['Observational', 'Prospective', 'Other']} isMulti={true} isCreatable={true} />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'Obs')
      await user.click(await screen.findByText('Observational'))
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'studyType', value: ['Observational'], isValid: true })
      await user.type(input, 'Prosp')
      await user.click(await screen.findByText('Prospective'))
      expect(baseProps.onChange).toHaveBeenLastCalledWith({ key: 'studyType', value: ['Observational', 'Prospective'], isValid: true })
    })
  })

  describe('Form Table - Tests', () => {
    const tableProps = {
      ...baseProps,
      id: 'fileTypes',
      formFields: [
        {
          id: 'fileType',
          title: 'File Type',
          type: FormFieldTypes.SELECT,
          selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype'],
        },
        {
          id: 'functionalEquivalence',
          title: 'Functional Equivalence',
          placeholder: 'Type',
        },
        {
          id: 'numberOfParticipants',
          title: '# of Participants',
          placeholder: 'Number',
          type: FormFieldTypes.NUMBER,
        },
      ],
      defaultValue: [{}],
      enableAddingRow: true,
      addRowLabel: 'Add New Filetype',
    }

    it('should render', () => {
      render(<FormTable {...tableProps} />)
      expect(document.querySelector('.formField-fileTypes')).toBeInTheDocument()
      const labels = document.querySelectorAll('.formField-fileTypes .control-label')
      expect(labels[0]).toHaveTextContent('File Type')
      expect(labels[1]).toHaveTextContent('Functional Equivalence')
      expect(labels[2]).toHaveTextContent('# of Participants')
    })

    it('should update a row field', () => {
      render(<FormTable {...tableProps} />)
      fireEvent.change(document.getElementById('fileTypes-0-functionalEquivalence')!, { target: { value: 'hello' } })
      expect(document.getElementById('fileTypes-0-functionalEquivalence')).toHaveValue('hello')
      expect(baseProps.onChange).toHaveBeenCalledWith({
        key: 'fileTypes',
        value: [{ functionalEquivalence: 'hello' }],
        isValid: true,
      })
    })

    it('should add a new row', () => {
      render(<FormTable {...tableProps} />)
      expect(document.querySelectorAll('.control-label')).toHaveLength(3)
      fireEvent.click(document.getElementById('add-new-table-row-fileTypes')!)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'fileTypes', value: [{}, {}], isValid: true })
      expect(document.querySelectorAll('.formTable-row')).toHaveLength(3)
      expect(document.querySelectorAll('.control-label')).toHaveLength(3)
    })

    it('should be able to update the follow up rows', () => {
      render(<FormTable {...tableProps} />)
      fireEvent.click(document.getElementById('add-new-table-row-fileTypes')!)
      fireEvent.change(document.getElementById('fileTypes-1-functionalEquivalence')!, { target: { value: 'jello' } })
      expect(document.getElementById('fileTypes-1-functionalEquivalence')).toHaveValue('jello')
      expect(baseProps.onChange).toHaveBeenLastCalledWith({
        key: 'fileTypes',
        value: [{}, { functionalEquivalence: 'jello' }],
        isValid: true,
      })
    })

    it('should be able to delete rows', () => {
      render(<FormTable {...tableProps} />)
      fireEvent.click(document.getElementById('delete-table-row-fileTypes-0')!)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'fileTypes', value: [], isValid: true })
      expect(document.querySelectorAll('.formTable-row.formTable-data-row')).toHaveLength(0)
    })

    it('should not allow you to delete if minLength rows has been declared', () => {
      render(<FormTable {...tableProps} defaultValue={[{}, {}]} minLength={1} />)
      fireEvent.click(document.getElementById('delete-table-row-fileTypes-0')!)
      expect(baseProps.onChange).toHaveBeenCalledWith({ key: 'fileTypes', value: [{}], isValid: true })
      expect(document.querySelectorAll('.formTable-row.formTable-data-row')).toHaveLength(1)
      expect(document.getElementById('delete-table-row-fileTypes-0')).toBeDisabled()
    })

    it('should be able to override some style elements', () => {
      const customProps = {
        ...tableProps,
        styleProps: {
          enableAddingRowStyle: { display: 'flex', width: '100%', justifyContent: 'flex-start', marginTop: 10 },
          addingRowButtonClassName: 'button-complex-outlined-secondary',
          addRowButtonIconClassName: 'button-icon button-icon-circle-plus-outline',
          removeRowButtonIconClassName: 'button-icon button-icon-close',
        },
      }
      render(<FormTable {...customProps} />)
      fireEvent.change(document.getElementById('fileTypes-0-functionalEquivalence')!, { target: { value: 'hello' } })
      expect(document.getElementById('add-new-table-row-fileTypes')).toHaveClass('button-complex-outlined-secondary')
      expect(document.getElementById('add-new-table-row-fileTypes')!.querySelector('span')).toHaveClass('button-icon-circle-plus-outline')
      expect(document.getElementById('delete-table-row-fileTypes-0')!.querySelector('span')).toHaveClass('button-icon-close')
    })
  })

  describe('Prop validation', () => {
    it('should not allow mounting if unknown prop', () => {
      expect(() => validateFormProps({ asdf: 'asdf', id: 'example' })).toThrow(/unknown/)
    })

    it('errors if required prop not given', () => {
      expect(() => validateFormProps({ type: FormFieldTypes.TEXT })).toThrow(/id/)
    })

    it('errors based on custom validation', () => {
      expect(() => validateFormProps({
        id: 'example',
        type: {
          ...FormFieldTypes.TEXT,
          customPropValidation: () => { throw new Error('example failure') },
        },
      })).toThrow('example failure')
    })
  })
})
