import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  GeneralStudyInformation,
  GeneralStudyInformationProps,
} from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { Study } from 'src/pages/data_submission/v2/v2-models'

const buildProps = (overrides: Partial<GeneralStudyInformationProps> = {}): GeneralStudyInformationProps => ({
  setStudy: vi.fn(),
  study: { piName: '', piEmail: '', data: {} } as Study,
  ...overrides,
})

describe('GeneralStudyInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with all 14 formField-container elements', () => {
    render(<GeneralStudyInformation {...buildProps()} />)
    expect(document.querySelectorAll('.formField-container')).toHaveLength(14)
  })

  it('calls setStudy when the study name field changes', () => {
    const setStudySpy = vi.fn()
    render(<GeneralStudyInformation {...buildProps({ setStudy: setStudySpy })} />)

    fireEvent.change(document.getElementById('name') as HTMLInputElement, {
      target: { value: 'A Study Name' },
    })

    expect(setStudySpy).toHaveBeenCalled()
  })
})
