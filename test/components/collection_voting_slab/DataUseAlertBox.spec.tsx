import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataUseAlertBox from 'src/components/collection_voting_slab/DataUseAlertBox'
import { TranslationEntry } from 'src/libs/dataUseTranslation'

const dataUseManualReviewTrue: TranslationEntry = {
  code: 'ABC',
  description: 'data use 1',
  manualReview: true,
  type: 'Permissions',
}

const dataUseManualReviewTrue2: TranslationEntry = {
  code: 'DEF',
  description: 'data use 2',
  manualReview: true,
  type: 'Permissions',
}

const dataUseManualReviewFalse: TranslationEntry = {
  code: 'MNOP',
  description: 'data use 3',
  manualReview: false,
  type: 'Permissions',
}

const dataUseNoManualReview: TranslationEntry = {
  code: 'XYZ',
  description: 'data use 4',
  type: 'Permissions',
}

describe('DataUseAlertBox - Tests', () => {
  it('Renders the alert box and exclamation point when translated data use a manually reviewed data use', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseManualReviewTrue] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('Does not render the alert box and exclamation point when translated data use a manually reviewed data use', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseManualReviewFalse] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeNull()
  })

  it('Does not render the description of a data use without a manuallyReviewed attribute', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseNoManualReview] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeNull()
  })

  it('Renders the description of a primary use manually reviewed data use', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseManualReviewTrue], secondary: [dataUseManualReviewFalse] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
    expect(screen.getByText('data use 1')).toBeInTheDocument()
    expect(screen.queryByText('data use 3')).toBeNull()
  })

  it('Renders the description of a secondary use manually reviewed data use', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseManualReviewFalse], secondary: [dataUseManualReviewTrue] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
    expect(screen.getByText('data use 1')).toBeInTheDocument()
    expect(screen.queryByText('data use 3')).toBeNull()
  })

  it('Renders the description multiple manually reviewed data uses in the same category', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ Primary: [dataUseManualReviewTrue, dataUseManualReviewTrue2] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
    expect(screen.getByText('data use 1')).toBeInTheDocument()
    expect(screen.getByText('data use 2')).toBeInTheDocument()
  })

  it('Renders the description multiple manually reviewed data uses in different categories', () => {
    render(
      <DataUseAlertBox
        translatedDataUse={{ primary: [dataUseManualReviewTrue2], secondary: [dataUseManualReviewTrue] }}
      />,
    )
    expect(document.querySelector('[data-cy="alert-box"]')).toBeInTheDocument()
    expect(screen.getByText('data use 1')).toBeInTheDocument()
    expect(screen.getByText('data use 2')).toBeInTheDocument()
  })
})
