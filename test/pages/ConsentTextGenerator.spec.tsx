import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ConsentTextGenerator from 'src/pages/ConsentTextGenerator'
import { Notifications } from 'src/libs/utils'
import { DataUseTranslation } from 'src/libs/dataUseTranslation'

vi.mock('react-select/async', () => ({
  default: ({
    isDisabled,
    placeholder,
  }: {
    isDisabled: boolean
    placeholder: string
  }) =>
    React.createElement('div', { 'data-testid': 'async-select', 'data-disabled': String(isDisabled) },
      React.createElement('input', { placeholder, 'aria-label': 'disease search' })),
}))

vi.mock('src/components/RadioButton', () => ({
  RadioButton: ({
    value,
    onClick,
    label,
  }: {
    value: string
    onClick: () => void
    label: string
  }) =>
    React.createElement('button', { 'type': 'button', 'data-value': value, onClick }, label),
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/libs/dataUseTranslation', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/dataUseTranslation')>()
  return {
    ...actual,
    DataUseTranslation: {
      ...actual.DataUseTranslation,
      translateDataUseRestrictions: vi.fn().mockResolvedValue([]),
    },
  }
})

vi.mock('src/libs/theme', () => ({
  Styles: {
    PAGE: {},
    TITLE: {},
    SMALL: {},
    MEDIUM: {},
    MEDIUM_DESCRIPTION: {},
    TABLE: { TABLE_TEXT_BUTTON: {} },
  },
}))

describe('ConsentTextGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByText('Consent Text Generator')).toBeInTheDocument()
  })

  it('renders the intro text mentioning DUO', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByText('Data Use Ontology (DUO)')).toBeInTheDocument()
  })

  it('renders all four research type radio buttons', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByRole('button', { name: /General Research Use \(GRU\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Health\/Medical\/Biomedical Use \(HMB\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Disease-related studies \(DS\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Other Use/ })).toBeInTheDocument()
  })

  it('renders all seven additional constraint checkboxes', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByLabelText('No methods development or validation studies (NMDS)')).toBeInTheDocument()
    expect(screen.getByLabelText('Genetic Studies Only (GSO)')).toBeInTheDocument()
    expect(screen.getByLabelText('Publication Required (PUB)')).toBeInTheDocument()
    expect(screen.getByLabelText('Collaboration Required (COL)')).toBeInTheDocument()
    expect(screen.getByLabelText('Ethics Approval Required (IRB)')).toBeInTheDocument()
    expect(screen.getByLabelText('Geographic Restriction (GS-)')).toBeInTheDocument()
    expect(screen.getByLabelText('Non-Profit Use Only (NPU)')).toBeInTheDocument()
  })

  it('renders the Generate button', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
  })

  it('shows an error when Generate is clicked with no research type selected', () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Please complete question 1' })
  })

  it('does not call translateDataUseRestrictions when no research type is selected', () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(DataUseTranslation.translateDataUseRestrictions).not.toHaveBeenCalled()
  })

  it('calls translateDataUseRestrictions with generalUse when GRU is selected', async () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /General Research Use \(GRU\)/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    })
    expect(DataUseTranslation.translateDataUseRestrictions).toHaveBeenCalledWith(
      expect.objectContaining({ generalUse: true }),
    )
  })

  it('calls translateDataUseRestrictions with hmbResearch when HMB is selected', async () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Health\/Medical\/Biomedical Use \(HMB\)/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    })
    expect(DataUseTranslation.translateDataUseRestrictions).toHaveBeenCalledWith(
      expect.objectContaining({ hmbResearch: true }),
    )
  })

  it('renders the disease select disabled by default', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByTestId('async-select')).toHaveAttribute('data-disabled', 'true')
  })

  it('enables the disease select when DS is selected', () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Disease-related studies \(DS\)/ }))
    expect(screen.getByTestId('async-select')).toHaveAttribute('data-disabled', 'false')
  })

  it('renders the other textarea disabled by default', () => {
    render(<ConsentTextGenerator />)
    expect(screen.getByPlaceholderText('Please specify if selected (max. 512 characters)')).toBeDisabled()
  })

  it('enables the other textarea when Other Use is selected', () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Other Use/ }))
    expect(screen.getByPlaceholderText('Please specify if selected (max. 512 characters)')).not.toBeDisabled()
  })

  it('shows an error when Other is selected but no text is entered', () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Other Use/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Please complete question 1' })
  })

  it('calls translateDataUseRestrictions when Other Use is selected with text', async () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Other Use/ }))
    const textarea = screen.getByPlaceholderText('Please specify if selected (max. 512 characters)')
    fireEvent.blur(textarea, { target: { value: 'For educational use only' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    })
    expect(DataUseTranslation.translateDataUseRestrictions).toHaveBeenCalled()
  })

  it('passes nmds=true to translateDataUseRestrictions when NMDS is checked', async () => {
    render(<ConsentTextGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /General Research Use \(GRU\)/ }))
    fireEvent.click(screen.getByLabelText('No methods development or validation studies (NMDS)'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    })
    expect(DataUseTranslation.translateDataUseRestrictions).toHaveBeenCalledWith(
      expect.objectContaining({ methodsResearch: true }),
    )
  })
})
