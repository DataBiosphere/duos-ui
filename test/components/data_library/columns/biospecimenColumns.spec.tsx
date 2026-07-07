import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeRenderCellHelper } from './columnTestUtils'
import { makeBiospecimenColumns } from 'src/components/data_library/columns/biospecimenColumns'
import { BiospecimenAsset } from 'src/types/library'
import { BioSpecimenType, BioSpecimenPreservationMethod, Sex } from 'src/types/model'

const makeRow = (overrides: Partial<BiospecimenAsset> = {}): BiospecimenAsset => ({
  biospecimenId: 'BS-001',
  studyId: 1,
  studyName: 'Test Study',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  sex: Sex.FEMALE,
  age: 45,
  organization: 'Test Biobank',
  ...overrides,
})

const renderCell = makeRenderCellHelper<BiospecimenAsset>(makeBiospecimenColumns, makeRow)

describe('makeBiospecimenColumns — Study Name column', () => {
  it('renders a link with the study name', () => {
    renderCell('studyName', 'Alzheimer Research Study', { studyId: 42 })
    expect(screen.getByText('Alzheimer Research Study')).toBeInTheDocument()
  })

  it('links to /studies/:studyId', () => {
    const { container } = renderCell('studyName', 'Alzheimer Research Study', { studyId: 42 })
    expect(container.querySelector('a[href="/studies/42"]')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when studyName is absent', () => {
    const { container } = renderCell('studyName', '', { studyId: 1 })
    expect(container).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — Biospecimen ID column', () => {
  it('renders the biospecimen ID text', () => {
    renderCell('biospecimenId', 'BS-12345')
    expect(screen.getByText('BS-12345')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when biospecimenId is absent', () => {
    const { container } = renderCell('biospecimenId', '')
    expect(container).toBeInTheDocument()
  })

  it('wraps long biospecimen IDs with tooltip and ellipsis', () => {
    const longId = 'VERY-LONG-BIOSPECIMEN-ID-WITH-MANY-CHARACTERS'
    renderCell('biospecimenId', longId)
    expect(screen.getByText(longId)).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — Specimen Type column', () => {
  it('renders specimen type in title case', () => {
    renderCell('specimenType', 'BLOOD')
    expect(screen.getByText('Blood')).toBeInTheDocument()
  })

  it('handles underscores in enum values', () => {
    renderCell('specimenType', 'FRESH_FROZEN')
    expect(screen.getByText('Fresh Frozen')).toBeInTheDocument()
  })

  it('renders an empty cell when specimenType is absent', () => {
    const { container } = renderCell('specimenType', '')
    expect(container).toBeInTheDocument()
  })

  it('converts multiple underscores correctly', () => {
    renderCell('specimenType', 'NORMAL_ADJACENT')
    expect(screen.getByText('Normal Adjacent')).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — Donor ID column', () => {
  it('renders the donor ID text', () => {
    renderCell('donorId', 'DONOR-9876')
    expect(screen.getByText('DONOR-9876')).toBeInTheDocument()
  })

  it('renders an empty cell gracefully when donorId is absent', () => {
    const { container } = renderCell('donorId', '')
    expect(container).toBeInTheDocument()
  })

  it('wraps long donor IDs with tooltip and ellipsis', () => {
    const longDonorId = 'VERY-LONG-DONOR-IDENTIFICATION-STRING'
    renderCell('donorId', longDonorId)
    expect(screen.getByText(longDonorId)).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — Date Of Collection column', () => {
  it('renders the date of collection', () => {
    renderCell('dateOfCollection', '2023-05-15')
    expect(screen.getByText('2023-05-15')).toBeInTheDocument()
  })

  it('renders an empty cell when dateOfCollection is absent', () => {
    const { container } = renderCell('dateOfCollection', '')
    expect(container).toBeInTheDocument()
  })

  it('renders various date formats correctly', () => {
    renderCell('dateOfCollection', '2024-01-01')
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — column structure', () => {
  it('returns 5 column definitions', () => {
    expect(makeBiospecimenColumns()).toHaveLength(5)
  })

  it('defines expected fields in correct order', () => {
    const fields = makeBiospecimenColumns().map(c => c.field)
    expect(fields).toEqual(['studyName', 'biospecimenId', 'specimenType', 'donorId', 'dateOfCollection'])
  })

  it('sets appropriate widths and flex values', () => {
    const cols = makeBiospecimenColumns()
    const studyNameCol = cols.find(c => c.field === 'studyName')!
    const biospecimenIdCol = cols.find(c => c.field === 'biospecimenId')!
    expect(studyNameCol.flex).toBe(1)
    expect(studyNameCol.minWidth).toBe(150)
    expect(biospecimenIdCol.flex).toBe(1)
    expect(biospecimenIdCol.minWidth).toBe(150)
  })

  it('sets fixed widths for specimen type and donor ID columns', () => {
    const cols = makeBiospecimenColumns()
    const specimenTypeCol = cols.find(c => c.field === 'specimenType')!
    const donorIdCol = cols.find(c => c.field === 'donorId')!
    const dateOfCollectionCol = cols.find(c => c.field === 'dateOfCollection')!
    expect(specimenTypeCol.width).toBe(150)
    expect(donorIdCol.flex).toBe(1)
    expect(dateOfCollectionCol.width).toBe(150)
  })
})

describe('makeBiospecimenColumns — tooltip and text ellipsis', () => {
  it('applies ellipsis styling to biospecimen ID', () => {
    renderCell('biospecimenId', 'VERY-LONG-BIOSPECIMEN-IDENTIFIER')
    expect(screen.getByText('VERY-LONG-BIOSPECIMEN-IDENTIFIER')).toBeInTheDocument()
  })

  it('shows tooltip on hover for biospecimen ID', async () => {
    const user = userEvent.setup()
    renderCell('biospecimenId', 'BS-12345-LONG')
    await user.hover(screen.getByText('BS-12345-LONG'))
    expect(await screen.findByRole('tooltip')).toBeInTheDocument()
  })
})

describe('makeBiospecimenColumns — accessibility', () => {
  it('renders headers with proper labels', () => {
    const cols = makeBiospecimenColumns()
    const headers = cols.map(c => c.headerName)
    expect(headers).toContain('Study Name')
    expect(headers).toContain('Biospecimen ID')
    expect(headers).toContain('Specimen Type')
    expect(headers).toContain('Donor ID')
    expect(headers).toContain('Date Of Collection')
  })
})
