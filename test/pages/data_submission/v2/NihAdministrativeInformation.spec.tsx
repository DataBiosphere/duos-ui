import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  NihAdministrativeInformation,
  NihAdministrativeInformationProps,
} from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { NihAnvilUse, Study } from 'src/pages/data_submission/v2/v2-models'

vi.mock('src/components/forms/InstitutionPicker', () => ({
  InstitutionPicker: ({ fieldId }: { fieldId: string }) => <div id={fieldId} />,
}))

const queryById = (id: string) => document.querySelector(`#${id}`)

const ADMIN_INFO_FIELD_IDS = [
  'piInstitution',
  'nihGrantContractNumber',
  'nihICsSupportingStudy',
  'nihProgramOfficerName',
  'nihInstitutionCenterSubmission',
  'nihGenomicProgramAdministratorName',
  'multiCenterStudy',
  'controlledAccessRequiredForGenomicSummaryResultsGSR',
]

const buildProps = (nihAnvilUseValue?: string): NihAdministrativeInformationProps => ({
  setStudy: vi.fn(),
  study: {
    properties: nihAnvilUseValue ? [new NihAnvilUse(nihAnvilUseValue)] : [],
  } as Study,
})

const expectFieldsVisible = (visible: boolean) => {
  ADMIN_INFO_FIELD_IDS.forEach((id) => {
    expect(queryById(id) !== null).toBe(visible)
  })
}

describe('NihAdministrativeInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders no fields when nihAnvilUse is not set', () => {
    render(<NihAdministrativeInformation {...buildProps()} />)
    expectFieldsVisible(false)
  })

  it('shows all 8 fields for YES_NHGRI_YES_PHS_ID', () => {
    render(<NihAdministrativeInformation {...buildProps(NihAnvilUse.YES_NHGRI_YES_PHS_ID)} />)
    expectFieldsVisible(true)
  })

  it('shows all 8 fields for YES_NHGRI_NO_PHS_ID', () => {
    render(<NihAdministrativeInformation {...buildProps(NihAnvilUse.YES_NHGRI_NO_PHS_ID)} />)
    expectFieldsVisible(true)
  })

  it('shows all 8 fields for NO_NHGRI_YES_ANVIL', () => {
    render(<NihAdministrativeInformation {...buildProps(NihAnvilUse.NO_NHGRI_YES_ANVIL)} />)
    expectFieldsVisible(true)
  })

  it('renders no fields for NO_NHGRI_NO_ANVIL', () => {
    render(<NihAdministrativeInformation {...buildProps(NihAnvilUse.NO_NHGRI_NO_ANVIL)} />)
    expectFieldsVisible(false)
  })
})
