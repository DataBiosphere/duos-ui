import React, { useState } from 'react'
import { DuosDatePicker } from 'src/components/DuosDatePicker'
import type { DateValidationError } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'

type MountPickerOverrides = {
  defaultValue?: Dayjs | string | null
  onChange?: Cypress.Agent<sinon.SinonSpy>
  onError?: Cypress.Agent<sinon.SinonSpy>
  readOnly?: boolean
}

const mountPicker = (overrides: MountPickerOverrides = {}) => {
  const onChange = overrides.onChange ?? cy.spy().as('onChange')
  const onError = overrides.onError ?? cy.spy().as('onError')

  const TestWrapper = () => {
    const [value, setValue] = useState<Dayjs | string | null>(overrides.defaultValue ?? '2026-04-30')

    return (
      <DuosDatePicker
        inputFormat="YYYY-MM-DD"
        defaultValue={value}
        onChange={(nextValue) => {
          onChange(nextValue)
          setValue(nextValue ?? null)
        }}
        onError={(error: DateValidationError | null, nextValue: Dayjs | string | undefined) => {
          onError(error, nextValue)
        }}
        readOnly={overrides.readOnly ?? false}
      />
    )
  }

  cy.mount(<TestWrapper />)

  return { onChange, onError }
}

describe('DuosDatePicker', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.viewport(1280, 900)
  })

  it('renders a formatted initial value from a string default', () => {
    mountPicker({ defaultValue: '2026-04-30' })

    cy.get('input.MuiPickersInputBase-input').should('have.value', '2026-04-30')
  })

  it('propagates the selected date using the configured format', () => {
    const { onChange } = mountPicker({ defaultValue: '2026-04-30' })

    cy.get('button[aria-label*="Choose date"]').click()
    cy.contains('button', /^15$/).click()
    cy.contains('button', 'Select').click()

    cy.wrap(onChange).should('have.been.calledWith', '2026-04-15')
    cy.get('input.MuiPickersInputBase-input').should('have.value', '2026-04-15')
  })

  it('renders the input as read-only when requested', () => {
    mountPicker({ defaultValue: '2026-04-30', readOnly: true })

    cy.get('input.MuiPickersInputBase-input').should('have.attr', 'readonly')
  })
})
