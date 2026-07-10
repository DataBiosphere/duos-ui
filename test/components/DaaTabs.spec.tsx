import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { DaaTabs } from 'src/components/DaaTabs'
import { DAA } from 'src/libs/ajax/DAA'
import type { DAAObject } from 'src/types/model'

vi.mock('src/libs/ajax/DAA')

const makeDaa = (daaId: number, fileName: string): DAAObject => ({
  daaId,
  createUserId: 1,
  createDate: '2024-01-01',
  initialDacId: 1,
  file: {
    fileStorageObjectId: daaId,
    entityId: String(daaId),
    fileName,
    category: 'dataAccessAgreement' as const,
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1,
  },
  dacs: [],
} as unknown as DAAObject)

const baseProps = {
  selectedDaa: null,
  onSelectDaa: vi.fn(),
  onTabChange: vi.fn(),
}

describe('DaaTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DAA.getDaaFileById).mockResolvedValue(undefined as never)
  })

  it('clicking a download link in the owned tab calls DAA.getDaaFileById with the daaId and filename', () => {
    const ownedDaa = makeDaa(2, 'custom-daa.pdf')
    render(
      <DaaTabs
        {...baseProps}
        ownedDaas={[ownedDaa]}
        sharedDaas={[]}
        activeTab="owned"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'custom-daa.pdf' }))

    expect(vi.mocked(DAA.getDaaFileById)).toHaveBeenCalledWith(2, 'custom-daa.pdf')
  })

  it('clicking a download link in the shared tab calls DAA.getDaaFileById with the daaId and filename', () => {
    const sharedDaa = makeDaa(5, 'shared-daa.pdf')
    render(
      <DaaTabs
        {...baseProps}
        ownedDaas={[]}
        sharedDaas={[sharedDaa]}
        activeTab="shared"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'shared-daa.pdf' }))

    expect(vi.mocked(DAA.getDaaFileById)).toHaveBeenCalledWith(5, 'shared-daa.pdf')
  })
})
