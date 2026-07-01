import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DataAccessRequest, { DataAccessRequestProps } from 'src/pages/dar_application/DataAccessRequest'
import type { Dataset, DataUse, DuosUser } from 'src/types/model'

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: (props: { id?: string }) => React.createElement('input', { 'data-testid': `date-picker-${props.id}`, 'readOnly': true }),
}))

vi.mock('react-select/async', () => ({
  default: (props: { id?: string, placeholder?: string }) => React.createElement('input', {
    'data-testid': `async-select-${props.id}`,
    'placeholder': props.placeholder,
    'readOnly': true,
  }),
}))

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaas: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: {
    getDatasetDaaSnapshots: vi.fn(),
    getAutoCompleteOT: vi.fn(),
    downloadDARDocument: vi.fn(),
  },
}))

import { DAA } from 'src/libs/ajax/DAA'
import { DAR } from 'src/libs/ajax/DAR'

const makeDataset = (dataUse: DataUse = {}, datasetId = 1): Dataset => ({
  name: 'Test Dataset',
  datasetId,
  createUserId: 1,
  createUser: {} as DuosUser,
  createDate: new Date('2026-01-01'),
  dacId: 1,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: {} as Dataset['study'],
  alias: datasetId,
  datasetIdentifier: `DUOS-${datasetId}`,
  dataUse: { generalUse: true, ...dataUse },
})

const baseFormData = (): DataAccessRequestProps['formData'] => ({
  projectTitle: 'Sample Project',
  rus: 'Sample RUS',
  nonTechRus: 'Sample summary',
  diseases: undefined,
  hmb: undefined,
  poa: undefined,
  methods: undefined,
  otherText: '',
  ontologies: [],
  irbDocumentName: undefined,
  irbDocumentLocation: undefined,
  irbProtocolExpiration: undefined,
  collaborationLetterName: undefined,
  gsoAcknowledgement: false,
  pubAcknowledgement: false,
  dsAcknowledgement: false,
})

const baseProps = (): DataAccessRequestProps => ({
  formFieldChange: vi.fn(),
  batchFormFieldChange: vi.fn(),
  formData: baseFormData(),
  datasets: [makeDataset()],
  dataUseTranslations: [],
  updateUploadedIrbDocument: vi.fn(),
  updateCollaborationLetter: vi.fn(),
  setSelectedDatasets: vi.fn(),
  validation: {},
  readOnlyMode: false,
  includeInstructions: true,
  formValidationChange: vi.fn(),
  referenceId: 'ref-1',
})

const renderDataAccessRequest = async (overrides: Partial<DataAccessRequestProps> = {}) => {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<DataAccessRequest {...baseProps()} {...overrides} />)
  })
  return result!
}

describe('DataAccessRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DAA.getDaas).mockResolvedValue([])
    vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([])
  })

  it('renders the project title and RUS fields with their default values', async () => {
    await renderDataAccessRequest()

    expect(screen.getByText('2.1 Select Dataset(s)')).toBeInTheDocument()
    expect((document.getElementById('projectTitle') as HTMLInputElement).value).toBe('Sample Project')
    expect((document.getElementById('rus') as HTMLTextAreaElement).value).toBe('Sample RUS')
  })

  it('calls formFieldChange when editing the project title', async () => {
    const formFieldChange = vi.fn()
    await renderDataAccessRequest({ formFieldChange })

    fireEvent.change(document.getElementById('projectTitle')!, { target: { value: 'New Title' } })

    expect(formFieldChange).toHaveBeenCalledWith({ key: 'projectTitle', value: 'New Title' })
  })

  it('shows the ontologies select when diseases is true', async () => {
    await renderDataAccessRequest({ formData: { ...baseFormData(), diseases: true } })

    expect(document.getElementById('hmb')).toBeNull()
    expect(screen.getByTestId('async-select-ontologies')).toBeInTheDocument()
  })

  it('shows the hmb question when diseases is false', async () => {
    await renderDataAccessRequest({ formData: { ...baseFormData(), diseases: false } })

    expect(screen.queryByTestId('async-select-ontologies')).toBeNull()
    expect(document.getElementById('hmb')).not.toBeNull()
    expect(document.getElementById('poa')).toBeNull()
  })

  it('cascades through hmb, poa, and methods as each is answered "no"', async () => {
    await renderDataAccessRequest({
      formData: { ...baseFormData(), diseases: false, hmb: false, poa: false },
    })

    expect(document.getElementById('methods')).not.toBeNull()
    expect(document.getElementById('otherText')).toBeNull()
  })

  it('shows the free-text field once methods is answered "no"', async () => {
    await renderDataAccessRequest({
      formData: { ...baseFormData(), diseases: false, hmb: false, poa: false, methods: false },
    })

    expect(document.getElementById('otherText')).not.toBeNull()
  })

  it('marks diseases/hmb/poa/methods false and other true when methods is answered "no"', async () => {
    const batchFormFieldChange = vi.fn()
    await renderDataAccessRequest({
      batchFormFieldChange,
      formData: { ...baseFormData(), diseases: false, hmb: false, poa: false },
    })

    fireEvent.click(document.getElementById('methods_no')!)

    expect(batchFormFieldChange).toHaveBeenCalledWith({
      diseases: false,
      hmb: false,
      poa: false,
      methods: false,
      other: true,
    })
  })

  it('does not render the IRB approval or collaboration letter sections when not required', async () => {
    await renderDataAccessRequest()

    expect(document.getElementById('irbDocument')).toBeNull()
    expect(document.getElementById('collaborationLetter')).toBeNull()
  })

  it('renders the IRB approval upload section when a dataset requires it', async () => {
    await renderDataAccessRequest({
      datasets: [makeDataset({ ethicsApprovalRequired: true })],
    })

    expect(document.getElementById('irbDocument')).not.toBeNull()
    expect(screen.getByTestId('date-picker-irbProtocolExpiration')).toBeInTheDocument()
  })

  it('renders the collaboration letter upload section when a dataset requires it', async () => {
    await renderDataAccessRequest({
      datasets: [makeDataset({ collaboratorRequired: true })],
    })

    expect(document.getElementById('collaborationLetter')).not.toBeNull()
  })

  it('shows a download link for an already-uploaded IRB document in read-only mode and downloads it on click', async () => {
    await renderDataAccessRequest({
      readOnlyMode: true,
      datasets: [makeDataset({ ethicsApprovalRequired: true })],
      formData: {
        ...baseFormData(),
        irbDocumentName: 'approval.pdf',
        irbDocumentLocation: 's3://bucket/approval.pdf',
      },
    })

    const downloadButton = screen.getByRole('button', { name: /download irb document/i })
    fireEvent.click(downloadButton)

    expect(DAR.downloadDARDocument).toHaveBeenCalledWith('ref-1', 'irbDocument', 'approval.pdf')
  })
})
