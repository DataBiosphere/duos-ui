import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { LibraryCardAgreementTermsDownload } from 'src/components/LibraryCardAgreementTermsDownload'

vi.mock('src/components/external_docs/NIHDataUseCertificationAgreement', () => ({
  NIHDataUseCertificationAgreement: () => <a href="#">NIH Data Use Certification Agreement</a>,
}))

vi.mock('src/assets/NIHLibraryCardAgreement06252025.pdf', () => ({ default: '/nih-agreement.pdf' }))
vi.mock('src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf', () => ({ default: '/broad-agreement.pdf' }))

describe('LibraryCardAgreementTermsDownload', () => {
  it('renders the Broad Library Card Agreement link', () => {
    render(<LibraryCardAgreementTermsDownload />)
    const link = screen.getByRole('link', { name: /broad library card agreement/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/broad-agreement.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders the NIH Library Card Agreement link', () => {
    render(<LibraryCardAgreementTermsDownload />)
    const link = screen.getByRole('link', { name: /nih library card agreement/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/nih-agreement.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders the NIH Data Use Certification Agreement', () => {
    render(<LibraryCardAgreementTermsDownload />)
    expect(screen.getByRole('link', { name: /nih data use certification agreement/i })).toBeInTheDocument()
  })

  it('applies the correct button classes to the agreement links', () => {
    render(<LibraryCardAgreementTermsDownload />)
    const broad = screen.getByRole('link', { name: /broad library card agreement/i })
    const nih = screen.getByRole('link', { name: /nih library card agreement/i })
    expect(broad).toHaveClass('button', 'button-white')
    expect(nih).toHaveClass('button', 'button-white')
  })
})
