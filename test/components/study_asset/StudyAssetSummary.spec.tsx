import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

vi.mock('src/components/collaborator_list/ModalWrapper', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) =>
    isOpen ? <>{children}</> : null,
}))

interface TestAsset {
  id: string
  name: string
  description: string
  value: number
}

const sampleAsset: TestAsset = {
  id: 'asset1',
  name: 'Test Asset',
  description: 'Test Description',
  value: 100,
}

describe('StudyAssetSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders asset summary with all columns', () => {
    const editAction = vi.fn()
    const deleteAction = vi.fn()
    const viewAction = vi.fn()

    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={deleteAction}
        viewAction={viewAction}
      />,
    )

    expect(screen.getByText('Test Asset')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders only specified columns when columnsToShow is provided', () => {
    const editAction = vi.fn()
    const deleteAction = vi.fn()
    const viewAction = vi.fn()

    render(
      <StudyAssetSummary
        asset={sampleAsset}
        columnsToShow={['name', 'value']}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={deleteAction}
        viewAction={viewAction}
      />,
    )

    expect(screen.getByText('Test Asset')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('calls viewAction when view button is clicked', () => {
    const viewAction = vi.fn()

    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={viewAction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'View asset' }))
    expect(viewAction).toHaveBeenCalledOnce()
  })

  it('calls editAction when edit button is clicked', () => {
    const editAction = vi.fn()

    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={vi.fn()}
        viewAction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit asset' }))
    expect(editAction).toHaveBeenCalledOnce()
  })

  it('shows delete modal when delete button is clicked', () => {
    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete asset' }))
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls deleteAction when delete is confirmed', () => {
    const deleteAction = vi.fn()

    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={vi.fn()}
        deleteAction={deleteAction}
        viewAction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete asset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(deleteAction).toHaveBeenCalledOnce()
  })

  it('disables edit button when disabled prop is true', () => {
    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={vi.fn()}
        disabled={true}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit asset' })).toBeDisabled()
  })

  it('disables delete button when disableDelete prop is true', () => {
    render(
      <StudyAssetSummary
        asset={sampleAsset}
        name="Test Asset"
        objectName="asset"
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={vi.fn()}
        disableDelete={true}
      />,
    )

    expect(screen.getByRole('button', { name: 'Delete asset' })).toBeDisabled()
  })
})
