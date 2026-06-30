import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NIHICWebform from 'src/pages/NIHicWebform'

vi.mock('src/libs/utils', () => ({
  searchOntologies: vi.fn().mockResolvedValue([]),
}))

vi.mock('src/components/era_commons/ERACommonsUtils', () => ({
  nihAccountLabel: vi.fn().mockReturnValue(React.createElement('span', { 'data-testid': 'account-label' }, 'NIH Account')),
}))

vi.mock('src/components/PageHeading', () => ({
  PageHeading: ({ title, id }: { title: string, id: string }) =>
    React.createElement('h1', { 'data-testid': 'page-heading', id }, title),
}))

vi.mock('src/components/RadioButton', () => ({
  RadioButton: ({ id, label, onClick }: { id: string, label: string, onClick?: () => void }) =>
    React.createElement('input', { 'type': 'radio', id, 'aria-label': label, onClick }),
}))

vi.mock('react-select', () => ({
  default: ({ inputId, placeholder }: { inputId?: string, placeholder?: string }) =>
    React.createElement('input', { 'id': inputId, placeholder, 'data-testid': 'select' }),
}))

vi.mock('react-select/async', () => ({
  default: ({ inputId, placeholder }: { inputId?: string, placeholder?: string }) =>
    React.createElement('input', { 'id': inputId, placeholder, 'data-testid': 'async-select' }),
}))

vi.mock('src/libs/theme', () => ({
  Styles: { PAGE: {} },
  Theme: {
    palette: {
      primary: '#1f3b50',
      secondary: '#00609f',
      background: {
        secondary: 'rgba(0, 96, 159, 0.1)',
        highlighted: 'rgba(193,107,12, 0.1)',
      },
    },
  },
}))

vi.mock('src/images/icon_dataset_add.png', () => ({ default: 'icon_dataset_add.png' }))
vi.mock('src/images/era-commons-logo.png', () => ({ default: 'era-commons-logo.png' }))
vi.mock('src/assets/Data_Provider_Agreement.pdf', () => ({ default: 'Data_Provider_Agreement.pdf' }))

describe('NIHICWebform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page heading', () => {
    render(<NIHICWebform />)
    const heading = screen.getByTestId('page-heading')
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'nih-ic-webform')
  })

  it('renders the consent group name input', () => {
    render(<NIHICWebform />)
    expect(document.getElementById('consentGroupName')).toBeInTheDocument()
  })

  it('renders primary use radio buttons', () => {
    render(<NIHICWebform />)
    expect(screen.getByRole('radio', { name: /General Research Use/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Health\/Medical\/Biomedical/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Disease-related studies/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Populations, Origins, Ancestry/i })).toBeInTheDocument()
  })

  it('renders secondary use checkboxes', () => {
    render(<NIHICWebform />)
    expect(screen.getByLabelText('No methods development or validation studies (NMDS)')).toBeInTheDocument()
    expect(screen.getByLabelText('Genetic Studies Only (GSO)')).toBeInTheDocument()
    expect(screen.getByLabelText('Publication Required (PUB)')).toBeInTheDocument()
    expect(screen.getByLabelText('Collaboration Required (COL)')).toBeInTheDocument()
    expect(screen.getByLabelText('Non-Profit Use Only (NPU)')).toBeInTheDocument()
  })

  it('adds a consent group when Add Consent Group link is clicked', () => {
    render(<NIHICWebform />)
    const nameInput = document.getElementById('consentGroupName') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Test Consent Group' } })

    fireEvent.click(screen.getByText('Add Consent Group'))

    expect(screen.getByText('Test Consent Group')).toBeInTheDocument()
  })

  it('clears the consent name field after adding a consent group', () => {
    render(<NIHICWebform />)
    const nameInput = document.getElementById('consentGroupName') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'My Group' } })

    fireEvent.click(screen.getByText('Add Consent Group'))

    expect(nameInput).toHaveValue('')
  })

  it('renders consent group details after adding', () => {
    render(<NIHICWebform />)
    const nameInput = document.getElementById('consentGroupName') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Group A' } })
    fireEvent.click(screen.getByText('Add Consent Group'))

    expect(screen.getByText('Group A')).toBeInTheDocument()
    expect(screen.getByText('Consent Group 1')).toBeInTheDocument()
  })

  it('renders submission timeline radio buttons', () => {
    render(<NIHICWebform />)
    expect(screen.getByRole('radio', { name: /within 3 months/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /by batches/i })).toBeInTheDocument()
  })

  it('renders the NIH account label', () => {
    render(<NIHICWebform />)
    expect(screen.getByTestId('account-label')).toBeInTheDocument()
  })

  it('renders without crashing (smoke test)', () => {
    render(<NIHICWebform />)
    expect(document.body).toBeInTheDocument()
  })

  it('renders multicenter study radio buttons', () => {
    render(<NIHICWebform />)
    expect(document.getElementById('multicenter_yes')).toBeInTheDocument()
    expect(document.getElementById('multicenter_no')).toBeInTheDocument()
  })
})
