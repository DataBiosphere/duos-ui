import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResearchProposalSlab from 'src/components/collection_voting_slab/ResearchProposalSlab'
import { TranslationEntry } from 'src/libs/dataUseTranslation'

vi.mock('src/components/HighlightText', () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}))

vi.mock('src/components/collection_voting_slab/DataUseAlertBox', () => ({
  default: ({ translatedDataUse }: { translatedDataUse: Record<string, TranslationEntry[]> }) => {
    const hasManualReview = Object.values(translatedDataUse)
      .flat()
      .some((entry: TranslationEntry) => entry.manualReview)
    return hasManualReview ? <div data-cy="alert-box" /> : null
  },
}))

const darInfoPrimaryUse = { rus: 'test', diseases: true }
const darInfoSecondaryUse = { stigmatizedDiseases: true }
const darInfoPrimarySecondaryUse = { diseases: true, illegalBehavior: true }

describe('ResearchProposalSlab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the slab container', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    expect(document.querySelector('[data-cy="rp-slab"]')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading is true', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} isLoading={true} />)
    expect(document.querySelector('.text-placeholder')).toBeInTheDocument()
  })

  it('does not show loading skeleton when not loading', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} isLoading={false} />)
    expect(document.querySelector('.text-placeholder')).not.toBeInTheDocument()
  })

  it('does not render narrative toggle when loading', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} isLoading={true} />)
    expect(document.getElementById('rp-narrative-toggle')).not.toBeInTheDocument()
  })

  it('shows (Hide) link by default when expanded', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    expect(screen.getByText('(Hide)')).toBeInTheDocument()
  })

  it('collapses expanded view when (Hide) is clicked', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    fireEvent.click(screen.getByText('(Hide)'))
    expect(document.querySelector('[data-cy="rp-expanded"]')).not.toBeInTheDocument()
  })

  it('shows (Show) link after collapsing', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    fireEvent.click(screen.getByText('(Hide)'))
    expect(screen.getByText('(Show)')).toBeInTheDocument()
  })

  it('re-expands view when (Show) is clicked', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    fireEvent.click(screen.getByText('(Hide)'))
    fireEvent.click(screen.getByText('(Show)'))
    expect(document.querySelector('[data-cy="rp-expanded"]')).toBeInTheDocument()
  })

  it('renders the primary data use pill code', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    expect(screen.getByText('DS')).toBeInTheDocument()
  })

  it('renders the secondary data use pill code', () => {
    render(<ResearchProposalSlab darInfo={darInfoSecondaryUse} />)
    expect(screen.getAllByText('OTHER').length).toBeGreaterThan(0)
  })

  it('renders both primary and secondary data use pills', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimarySecondaryUse} />)
    expect(screen.getByText('DS')).toBeInTheDocument()
    expect(screen.getByText('OTHER')).toBeInTheDocument()
  })

  it('renders research purpose text when expanded', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    expect(document.querySelector('[data-cy="research-purpose"]')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
  })

  it('hides research purpose text when collapsed', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    fireEvent.click(screen.getByText('(Hide)'))
    expect(document.querySelector('[data-cy="research-purpose"]')).not.toBeInTheDocument()
  })

  it('renders alert box when there are manually reviewed data uses', () => {
    render(<ResearchProposalSlab darInfo={darInfoSecondaryUse} />)
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
  })

  it('does not render alert box when there are no manually reviewed data uses', () => {
    render(<ResearchProposalSlab darInfo={darInfoPrimaryUse} />)
    expect(document.querySelector('[data-cy="alert-box"]')).not.toBeInTheDocument()
  })

  it('does not render alert box when collapsed', () => {
    render(<ResearchProposalSlab darInfo={darInfoSecondaryUse} />)
    fireEvent.click(screen.getByText('(Hide)'))
    expect(document.querySelector('[data-cy="alert-box"]')).not.toBeInTheDocument()
  })
})
