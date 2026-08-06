import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import DACDatasetApprovalStatus from 'src/components/dac_dataset_table/DACDatasetApprovalStatus'
import { DatasetTerm } from 'src/types/model'

const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  Link: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void, id?: string, className?: string, to?: string, style?: React.CSSProperties }>) => (
    <a onClick={onClick} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: {
    updateApprovalStatus: vi.fn().mockResolvedValue({ dacApproval: true }),
  },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    deleteDataset: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  },
}))

vi.mock('src/components/modals/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ openState, title }: { openState: boolean, title: string }) =>
    openState ? <div data-testid="confirmation-dialog">{title}</div> : null,
}))

vi.mock('react-tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

const makeDataset = (overrides: Partial<DatasetTerm> = {}): DatasetTerm => ({
  datasetId: 1,
  createUserId: 1,
  createUserDisplayName: 'Admin',
  datasetIdentifier: 'DUOS-000001',
  deletable: false,
  datasetName: 'Test Dataset',
  participantCount: 10,
  dataLocation: 'AnVIL Workspace',
  url: 'https://example.com',
  dacId: 4,
  dacApproval: null as unknown as boolean,
  accessManagement: 'open',
  approvedUserIds: [],
  piName: 'PI Name',
  dataUse: { primary: [] },
  study: {
    description: 'Study desc',
    studyName: 'Test Study',
    studyId: 39,
    phsId: 'phs000001',
    phenotype: 'phenotype',
    species: 'human',
    piName: 'PI Name',
    dataSubmitterEmail: 'user@test.org',
    dataSubmitterId: 3351,
    dataCustodianEmail: ['custodian@test.org'],
    publicVisibility: true,
    dataTypes: ['WGS'],
  },
  submitter: { userId: 1, displayName: 'Admin', institution: { id: 1, name: 'MIT' } },
  updateUser: { userId: 1, displayName: 'Admin', institution: { id: 1, name: 'MIT' } },
  dac: { dacId: 4, dacName: 'DAC 0002', dacEmail: 'dac@test.org' },
  ...overrides,
})

describe('DACDatasetApprovalStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows APPROVE and REJECT buttons when dacApproval is null', () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset()} />)
    expect(screen.getByText('APPROVE')).toBeInTheDocument()
    expect(screen.getByText('REJECT')).toBeInTheDocument()
  })

  it('shows ACCEPTED when dacApproval is true', () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset({ dacApproval: true })} />)
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
    expect(screen.queryByText('APPROVE')).not.toBeInTheDocument()
  })

  it('shows REJECTED when dacApproval is false', () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset({ dacApproval: false })} />)
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
    expect(screen.queryByText('APPROVE')).not.toBeInTheDocument()
  })

  it('calls DAC.updateApprovalStatus with true when APPROVE is clicked', async () => {
    const { DAC } = await import('src/libs/ajax/DAC')
    render(<DACDatasetApprovalStatus dataset={makeDataset()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('APPROVE'))
    })
    await waitFor(() => expect(DAC.updateApprovalStatus).toHaveBeenCalledWith(4, 1, true))
  })

  it('calls DAC.updateApprovalStatus with false when REJECT is clicked', async () => {
    const { DAC } = await import('src/libs/ajax/DAC')
    render(<DACDatasetApprovalStatus dataset={makeDataset()} />)
    await act(async () => {
      fireEvent.click(screen.getByText('REJECT'))
    })
    await waitFor(() => expect(DAC.updateApprovalStatus).toHaveBeenCalledWith(4, 1, false))
  })

  it('shows edit link for accepted dataset with study', () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset({ dacApproval: true })} />)
    const editLink = document.querySelector('[id="1_edit"]')
    expect(editLink).toBeInTheDocument()
  })

  it('shows delete icon for deletable accepted dataset', () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset({ dacApproval: true, deletable: true })} />)
    const deleteLink = document.querySelector('[id="1_delete"]')
    expect(deleteLink).toBeInTheDocument()
  })

  it('shows confirmation dialog when delete is clicked', async () => {
    render(<DACDatasetApprovalStatus dataset={makeDataset({ dacApproval: true, deletable: true })} />)
    const deleteLink = document.querySelector('[id="1_delete"]')!
    await act(async () => {
      fireEvent.click(deleteLink)
    })
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
  })
})
