import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialDaaAgreementWrapper from 'src/components/SigningOfficialDaaAgreementWrapper'
import Acknowledgments, { acceptAcknowledgments } from 'src/libs/acknowledgements'
import { Notifications } from 'src/libs/utils'

const navigate = vi.fn()

vi.mock('src/libs/acknowledgements', () => ({
  default: {
    broadLcaAcknowledgement: 'broad-lca',
    nihLcaAcknowledgement: 'nih-lca',
  },
  acceptAcknowledgments: vi.fn(),
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('src/components/external_docs/NIHDataUseCertificationAgreement', () => ({
  NIHDataUseCertificationAgreement: () => (
    <a href="/nih-data-use-certification.pdf">NIH Data Use Certification Agreement</a>
  ),
}))

describe('SigningOfficialDaaAgreementWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders library card agreement terms', () => {
    render(<SigningOfficialDaaAgreementWrapper isDataSubmitterTab={false} />)

    expect(screen.getByRole('heading', { name: 'Agree to Library Card Terms' })).toBeInTheDocument()
    expect(screen.getByText(/To begin issuing Library Cards to researchers from your institution/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Broad Library Card Agreement/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /NIH Library Card Agreement/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /NIH Data Use Certification Agreement/ })).toBeInTheDocument()
  })

  it('renders data submitter agreement terms without library card agreements', () => {
    render(<SigningOfficialDaaAgreementWrapper isDataSubmitterTab={true} />)

    expect(screen.getByRole('heading', { name: 'Agree to Data Submitter Terms' })).toBeInTheDocument()
    expect(screen.getByText(/To begin issuing Data Submitter privileges to researchers from your institution/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /DUOS Data Submitter Agreement/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Broad Library Card Agreement/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /NIH Library Card Agreement/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /NIH Data Use Certification Agreement/ })).not.toBeInTheDocument()
  })

  it('accepts signing official DAA acknowledgements', async () => {
    vi.mocked(acceptAcknowledgments).mockResolvedValue(undefined)

    render(<SigningOfficialDaaAgreementWrapper isDataSubmitterTab={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'I AGREE' }))

    await waitFor(() => {
      expect(acceptAcknowledgments).toHaveBeenCalledWith(
        Acknowledgments.broadLcaAcknowledgement,
        Acknowledgments.nihLcaAcknowledgement,
      )
      expect(navigate).toHaveBeenCalledWith('/signing_official_console/library_cards')
    })
  })

  it('shows an error notification when acknowledgement acceptance fails', async () => {
    const showErrorSpy = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.mocked(acceptAcknowledgments).mockRejectedValue(new Error('server failed'))

    render(<SigningOfficialDaaAgreementWrapper isDataSubmitterTab={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'I AGREE' }))

    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith({
        text: 'Error: Unable to accept data access agreements: server failed',
      })
    })
  })
})
