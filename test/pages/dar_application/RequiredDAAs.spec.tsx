import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import RequiredDAAs from 'src/pages/dar_application/RequiredDAAs'
import type { DAAObject, DuosUser, Dataset, FileStorageObject } from 'src/types/model'

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaaFileById: vi.fn(),
  },
}))

import { DAA } from 'src/libs/ajax/DAA'

const makeFso = (fileName: string): FileStorageObject => ({
  fileStorageObjectId: 1,
  entityId: 'entity-1',
  fileName,
  category: 'irbCollaborationLetter',
  mediaType: 'application/pdf',
  createUserId: 3,
  createDate: new Date().getDate(),
})

const makeDaa = ({ daaId, dacId, fileName }: { daaId: number, dacId: number, fileName: string }): DAAObject => ({
  daaId,
  createUserId: 3,
  createDate: new Date().toISOString(),
  updateUserId: 3,
  updateDate: new Date().toISOString(),
  initialDacId: dacId,
  file: makeFso(fileName),
  dacs: [{ dacId, dacName: `DAC ${dacId}`, name: `DAC ${dacId}` }],
})

const makeDataset = ({ datasetId, dacId }: { datasetId: number, dacId?: number }): Dataset => ({
  name: `Dataset ${datasetId}`,
  datasetId,
  createUserId: 1,
  createUser: {} as DuosUser,
  createDate: new Date('2026-05-01'),
  dacId: dacId as number,
  translatedDataUse: 'General Use',
  deletable: true,
  properties: [],
  study: {} as Dataset['study'],
  alias: datasetId,
  datasetIdentifier: `DUOS-${String(datasetId).padStart(6, '0')}`,
  dataUse: {},
})

describe('RequiredDAAs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a download button and agreement text when a dataset matches a DAA', () => {
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const dataset = makeDataset({ datasetId: 1, dacId: 2 })
    render(<RequiredDAAs datasets={[dataset]} daas={[daa]} agreementText="Agree to the terms below" />)
    expect(screen.getByText('Agree to the terms below')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /test-agreement/i })).toBeInTheDocument()
  })

  it('strips the file extension from the displayed name', () => {
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const dataset = makeDataset({ datasetId: 1, dacId: 2 })
    render(<RequiredDAAs datasets={[dataset]} daas={[daa]} />)
    expect(screen.getByRole('button', { name: /test-agreement/i })).toBeInTheDocument()
    expect(screen.queryByText(/test-agreement\.pdf/i)).not.toBeInTheDocument()
  })

  it('renders nothing when a dataset has no dacId', () => {
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const dataset = makeDataset({ datasetId: 1, dacId: undefined })
    render(<RequiredDAAs datasets={[dataset]} daas={[daa]} agreementText="Agree to the terms below" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText('Agree to the terms below')).not.toBeInTheDocument()
  })

  it('renders nothing when no DAA matches the dataset dacId', () => {
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const dataset = makeDataset({ datasetId: 1, dacId: 999 })
    render(<RequiredDAAs datasets={[dataset]} daas={[daa]} agreementText="Agree to the terms below" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders one button per unique DAA file even with multiple matching datasets', () => {
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const datasetOne = makeDataset({ datasetId: 1, dacId: 2 })
    const datasetTwo = makeDataset({ datasetId: 2, dacId: 2 })
    render(<RequiredDAAs datasets={[datasetOne, datasetTwo]} daas={[daa]} />)
    expect(screen.getAllByRole('button', { name: /test-agreement/i })).toHaveLength(1)
  })

  it('renders a button for each distinct DAA across multiple datasets', () => {
    const daaOne = makeDaa({ daaId: 1, dacId: 2, fileName: 'first-agreement.pdf' })
    const daaTwo = makeDaa({ daaId: 2, dacId: 3, fileName: 'second-agreement.pdf' })
    const datasetOne = makeDataset({ datasetId: 1, dacId: 2 })
    const datasetTwo = makeDataset({ datasetId: 2, dacId: 3 })
    render(<RequiredDAAs datasets={[datasetOne, datasetTwo]} daas={[daaOne, daaTwo]} />)
    expect(screen.getByRole('button', { name: /first-agreement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /second-agreement/i })).toBeInTheDocument()
  })

  it('calls DAA.getDaaFileById with the daaId and filename without extension when the download button is clicked', async () => {
    const user = userEvent.setup()
    const daa = makeDaa({ daaId: 1, dacId: 2, fileName: 'test-agreement.pdf' })
    const dataset = makeDataset({ datasetId: 1, dacId: 2 })
    render(<RequiredDAAs datasets={[dataset]} daas={[daa]} />)
    await user.click(screen.getByRole('button', { name: /test-agreement/i }))
    expect(DAA.getDaaFileById).toHaveBeenCalledWith(1, 'test-agreement')
  })
})
