import { validateFormProps, customSelectPropValidation, customRadioPropValidation, getKey } from 'src/components/forms/formUtils'

interface MockFormType {
  requiredProps?: string[]
  optionalProps?: string[]
  customPropValidation?: () => void
}

const mockFormType: MockFormType = {
  requiredProps: ['value'],
  optionalProps: ['placeholder'],
}

describe('formUtils', () => {
  describe('validateFormProps', () => {
    it('validates props with all required fields present', () => {
      const props = {
        id: 'test-id',
        value: 'test-value',
        type: mockFormType,
      }

      expect(() => validateFormProps(props as Record<string, unknown>)).to.not.throw()
    })

    it('throws error when required prop is missing', () => {
      const props = {
        id: 'test-id',
        type: mockFormType, // Missing 'value' which is required
      }

      expect(() => validateFormProps(props as Record<string, unknown>)).to.throw('prop value is required')
    })

    it('throws error when unknown prop is passed', () => {
      const props = {
        id: 'test-id',
        value: 'test-value',
        type: mockFormType,
        unknownProp: 'should-fail',
      }

      expect(() => validateFormProps(props as Record<string, unknown>)).to.throw('unknown prop unknownProp')
    })

    it('includes common required props in validation', () => {
      const props = {
        value: 'test-value',
        type: mockFormType, // Missing 'id' which is a common required prop
      }

      expect(() => validateFormProps(props as Record<string, unknown>)).to.throw('prop id is required')
    })

    it('includes common optional props in validation', () => {
      const props = {
        id: 'test-id',
        value: 'test-value',
        type: mockFormType,
        name: 'test-name', // common optional prop
        disabled: true, // common optional prop
      }

      expect(() => validateFormProps(props as Record<string, unknown>)).to.not.throw()
    })

    it('calls customPropValidation if provided on type', () => {
      let customValidationCalled = false

      const customType = {
        requiredProps: [],
        optionalProps: [],
        customPropValidation: () => {
          customValidationCalled = true
        },
      }

      const props = {
        id: 'test-id',
        type: customType,
      }

      validateFormProps(props as Record<string, unknown>)

      expect(customValidationCalled).to.equal(true)
    })

    it('uses default TEXT type when type not provided', () => {
      const props = {
        id: 'test-id',
        // type not provided
      }

      // Should not throw because default TEXT type should be used
      expect(() => validateFormProps(props as Record<string, unknown>)).to.not.throw()
    })
  })

  describe('customSelectPropValidation', () => {
    it('validates sync select with string array options', () => {
      const props = {
        isAsync: false,
        selectOptions: ['option1', 'option2'],
      }

      expect(() => customSelectPropValidation(props)).to.not.throw()
    })

    it('validates sync select with object array options', () => {
      const props = {
        isAsync: false,
        selectOptions: [
          { displayText: 'Option 1' },
          { displayText: 'Option 2' },
        ],
      }

      expect(() => customSelectPropValidation(props)).to.not.throw()
    })

    it('throws error when selectOptions missing in sync mode', () => {
      const props = {
        isAsync: false,
      }

      expect(() => customSelectPropValidation(props)).to.throw('must specify \'selectOptions\' in select form fields')
    })

    it('throws error when selectOptions is not an array', () => {
      const props = {
        isAsync: false,
        selectOptions: 'not-an-array',
      }

      expect(() => customSelectPropValidation(props)).to.throw('prop \'selectOptions\' must be an array')
    })

    it('throws error when string array contains non-string value', () => {
      const props = {
        isAsync: false,
        selectOptions: ['option1', 123],
      }

      expect(() => customSelectPropValidation(props)).to.throw('all values in \'selectOptions\' must be string typed')
    })

    it('throws error when object array missing displayText', () => {
      const props = {
        isAsync: false,
        selectOptions: [
          { displayText: 'Option 1' },
          { noDisplayText: 'Option 2' },
        ],
      }

      expect(() => customSelectPropValidation(props)).to.throw('every value in \'selectOptions\' needs a \'displayText\' field')
    })

    it('validates async select with loadOptions function', () => {
      const props = {
        isAsync: true,
        loadOptions: (_term: string) => Promise.resolve([]),
      }

      expect(() => customSelectPropValidation(props)).to.not.throw()
    })

    it('throws error when loadOptions missing in async mode', () => {
      const props = {
        isAsync: true,
      }

      expect(() => customSelectPropValidation(props)).to.throw('must specify \'loadOptions\' if select is async')
    })

    it('accepts undefined isAsync as sync mode', () => {
      const props = {
        isAsync: undefined,
        selectOptions: ['option1'],
      }

      expect(() => customSelectPropValidation(props)).to.not.throw()
    })

    it('accepts null isAsync as sync mode', () => {
      const props = {
        isAsync: null,
        selectOptions: ['option1'],
      }

      expect(() => customSelectPropValidation(props)).to.not.throw()
    })
  })

  describe('customRadioPropValidation', () => {
    it('validates radio options with required name and text fields', () => {
      const props = {
        options: [
          { name: 'option1', text: 'Option 1' },
          { name: 'option2', text: 'Option 2' },
        ],
      }

      expect(() => customRadioPropValidation(props)).to.not.throw()
    })

    it('throws error when options is not an array', () => {
      const props = {
        options: 'not-an-array',
      }

      expect(() => customRadioPropValidation(props)).to.throw('\'options\' prop must be an array.')
    })

    it('throws error when option missing name field', () => {
      const props = {
        options: [
          { name: 'option1', text: 'Option 1' },
          { text: 'Option 2' }, // Missing name
        ],
      }

      expect(() => customRadioPropValidation(props)).to.throw('each option in \'options\' prop must have a \'name\' field')
    })

    it('throws error when option missing text field', () => {
      const props = {
        options: [
          { name: 'option1', text: 'Option 1' },
          { name: 'option2' }, // Missing text
        ],
      }

      expect(() => customRadioPropValidation(props)).to.throw('each option in \'options\' prop must have a \'text\' field')
    })

    it('allows additional properties on radio options', () => {
      const props = {
        options: [
          { name: 'option1', text: 'Option 1', value: 1, disabled: false },
          { name: 'option2', text: 'Option 2', value: 2 },
        ],
      }

      expect(() => customRadioPropValidation(props)).to.not.throw()
    })

    it('throws error when options array is empty but field is missing', () => {
      const props = {
        options: [{}],
      }

      expect(() => customRadioPropValidation(props)).to.throw('each option in \'options\' prop must have a \'name\' field')
    })
  })

  describe('getKey', () => {
    it('returns name when both name and id are provided', () => {
      const key = getKey({ name: 'fieldName', id: 'field-id' })

      expect(key).to.equal('fieldName')
    })

    it('returns id when name is not provided', () => {
      const key = getKey({ name: undefined, id: 'field-id' })

      expect(key).to.equal('field-id')
    })

    it('returns name even when it is an empty string', () => {
      const key = getKey({ name: '', id: 'field-id' })

      expect(key).to.equal('')
    })

    it('returns name when id is provided but name is prioritized', () => {
      const key = getKey({ name: 'myFieldName', id: 'myFieldId' })

      expect(key).to.equal('myFieldName')
    })

    it('handles undefined name gracefully', () => {
      const key = getKey({ id: 'fallback-id', name: undefined })

      expect(key).to.equal('fallback-id')
    })
  })
})
