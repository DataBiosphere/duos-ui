import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataUseAcknowledgements } from 'src/pages/dar_application/DataUseAcknowlegements'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'

const defaultProps = {
  title: 'Data Use Acknowledgements',
  datasets: [],
  dataUseTranslations: [],
  formData: {} as FormState,
  readOnlyMode: false,
  includeInstructions: true,
  onChange: vi.fn(),
  onValidationChange: vi.fn(),
  validation: {},
}

const mountComponent = (customProps = {}) =>
  render(<DataUseAcknowledgements {...defaultProps} {...customProps} />)

beforeEach(() => {
  defaultProps.onChange = vi.fn()
  defaultProps.onValidationChange = vi.fn()
})

afterEach(() => vi.clearAllMocks())

describe('DataUseAcknowledgements Component', () => {
  it('renders the component with default props', () => {
    const { container } = mountComponent()
    expect(container.querySelector('.data-use-acknowledgements')).toBeInTheDocument()
  })

  it('renders the GSO acknowledgement field when needed', () => {
    const { container } = mountComponent({ datasets: [{ dataUse: { geneticStudiesOnly: true } }] })
    expect(container.querySelector('#gsoAcknowledgement')).toBeInTheDocument()
  })

  it('renders the PUB acknowledgement field when needed', () => {
    const { container } = mountComponent({ datasets: [{ dataUse: { publicationResults: true } }] })
    expect(container.querySelector('#pubAcknowledgement')).toBeInTheDocument()
  })

  it('renders the DS acknowledgement field when needed', () => {
    const { container } = mountComponent({ dataUseTranslations: ['DS', 'DS2'] })
    expect(container.querySelector('#dsAcknowledgement')).toBeInTheDocument()
  })

  it('does not render fields when conditions are not met', () => {
    const { container } = mountComponent()
    expect(container.querySelector('#gsoAcknowledgement')).not.toBeInTheDocument()
    expect(container.querySelector('#pubAcknowledgement')).not.toBeInTheDocument()
    expect(container.querySelector('#dsAcknowledgement')).not.toBeInTheDocument()
  })

  it('calls onChange when a checkbox is toggled', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({
      datasets: [{ dataUse: { geneticStudiesOnly: true } }],
      onChange,
    })
    await user.click(container.querySelector('input[type="checkbox"]')!)
    expect(onChange).toHaveBeenCalled()
  })

  it('disables fields in read-only mode', () => {
    const { container } = mountComponent({
      datasets: [{ dataUse: { geneticStudiesOnly: true } }],
      readOnlyMode: true,
    })
    expect(container.querySelector('input[type="checkbox"]')).toBeDisabled()
  })
})
