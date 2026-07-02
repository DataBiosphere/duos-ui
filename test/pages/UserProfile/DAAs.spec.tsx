import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import DAAs from 'src/pages/user_profile/DAAs'
import { DAAObject, DacObject, FileStorageObject } from 'src/types/model'

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaaFileById: vi.fn(),
  },
}))

import { DAA } from 'src/libs/ajax/DAA'

const fso: FileStorageObject = {
  fileStorageObjectId: 1,
  entityId: 'entity-1',
  fileName: 'test-agreement.pdf',
  category: 'irbCollaborationLetter',
  mediaType: 'application/pdf',
  createUserId: 3,
  createDate: new Date().getDate(),
}

const daa: DAAObject = {
  daaId: 1,
  createUserId: 3,
  createDate: new Date().toISOString(),
  updateUserId: 3,
  updateDate: new Date().toISOString(),
  initialDacId: 1,
  file: fso,
  dacs: [],
}

const issuedBy = 'Test Signing Official'
const issuedOn = '2024-06-15T00:00:00.000Z'

describe('DAAs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a download button for each DAA showing the filename without extension', () => {
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    expect(screen.getByRole('button', { name: /test-agreement/i })).toBeInTheDocument()
  })

  it('strips the file extension from the displayed name', () => {
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    expect(screen.getByRole('button', { name: /test-agreement/i })).toBeInTheDocument()
    expect(screen.queryByText(/test-agreement\.pdf/i)).not.toBeInTheDocument()
  })

  it('renders "Issued by", the issuedBy name, and the formatted date', () => {
    const formattedDate = new Date(issuedOn).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    expect(screen.getByText('Issued by')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(issuedBy))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(formattedDate))).toBeInTheDocument()
  })

  it('renders multiple DAAs', () => {
    const fso2: FileStorageObject = {
      ...fso,
      fileStorageObjectId: 2,
      fileName: 'second-agreement.pdf',
    }
    const daa2: DAAObject = {
      ...daa,
      daaId: 2,
      file: fso2,
    }
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa, daa2]} />)
    expect(screen.getByRole('button', { name: /test-agreement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /second-agreement/i })).toBeInTheDocument()
  })

  it('renders no buttons when the daas array is empty', () => {
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls DAA.getDaaFileById with the daaId and filename without extension when the download button is clicked', async () => {
    const user = userEvent.setup()
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    await user.click(screen.getByRole('button', { name: /test-agreement/i }))
    expect(DAA.getDaaFileById).toHaveBeenCalledWith(1, 'test-agreement')
  })

  it('renders the Agreement, Issued by, and DACs using this DAA column headers', () => {
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    expect(screen.getByText('Agreement')).toBeInTheDocument()
    expect(screen.getByText('Issued by')).toBeInTheDocument()
    expect(screen.getByText('DACs using this DAA')).toBeInTheDocument()
  })

  it('renders DAC names in the DACs using this DAA column', () => {
    const dacs: DacObject[] = [
      { dacId: 1, name: 'Test DAC' },
      { dacId: 2, dacName: 'Another DAC' },
    ]
    const daaWithDacs: DAAObject = { ...daa, dacs }
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daaWithDacs]} />)
    expect(screen.getByText('Test DAC, Another DAC')).toBeInTheDocument()
  })

  it('renders an em dash in the DACs column when the DAA has no associated DACs', () => {
    render(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
