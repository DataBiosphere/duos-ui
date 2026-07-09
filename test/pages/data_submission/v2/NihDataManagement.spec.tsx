import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  NihDataManagement,
  NihDataManagementProps,
} from 'src/pages/data_submission/v2/NihDataManagement'
import {
  AlternativeDataSharingPlan,
  AlternativeDataSharingPlanReasons,
  NihAnvilUse,
  Study,
  StudyProperty,
} from 'src/pages/data_submission/v2/v2-models'

vi.mock('src/components/forms/FileInput', () => ({
  FileInput: ({ id }: { id: string }) => <label id={`lbl_${id}`}>Upload file</label>,
}))

const queryById = (id: string) => document.querySelector(`#${id}`)

const buildProps = (properties: StudyProperty[] = []): NihDataManagementProps => ({
  setStudy: vi.fn(),
  study: { properties } as Study,
})

const verifySharingPlanSubfieldsAbsent = () => {
  expect(queryById('legalRestrictions')).toBeNull()
  expect(queryById('isInformedConsentProcessesInadequate')).toBeNull()
  expect(queryById('alternativeDataSharingPlanExplanation')).toBeNull()
  expect(document.querySelector('#lbl_alternativeDataSharingPlanFile')).toBeNull()
  expect(queryById('alternativeDataSharingPlanDataSubmitted')).toBeNull()
  expect(queryById('alternativeDataSharingPlanDataReleased')).toBeNull()
}

describe('NihDataManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when nihAnvilUse is not set', () => {
    render(<NihDataManagement {...buildProps()} />)
    expect(queryById('alternativeDataSharingPlan')).toBeNull()
  })

  it('shows alternativeDataSharingPlan field for YES_NHGRI_YES_PHS_ID but hides sub-fields', () => {
    render(<NihDataManagement {...buildProps([new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID)])} />)
    expect(queryById('alternativeDataSharingPlan')).not.toBeNull()
    verifySharingPlanSubfieldsAbsent()
  })

  it('shows all sub-fields when alternativeDataSharingPlan is true', () => {
    const props = buildProps([
      new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID),
      new AlternativeDataSharingPlan(true),
    ])
    render(<NihDataManagement {...props} />)
    expect(queryById('legalRestrictions')).not.toBeNull()
    expect(queryById('isInformedConsentProcessesInadequate')).not.toBeNull()
    expect(queryById('alternativeDataSharingPlanExplanation')).not.toBeNull()
    expect(document.querySelector('#lbl_alternativeDataSharingPlanFile')).not.toBeNull()
    expect(queryById('alternativeDataSharingPlanDataSubmitted')).not.toBeNull()
    expect(queryById('alternativeDataSharingPlanDataReleased')).not.toBeNull()
  })

  it('shows consent sub-reason fields when isInformedConsentProcessesInadequate is selected', () => {
    const props = buildProps([
      new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID),
      new AlternativeDataSharingPlan(true),
      new AlternativeDataSharingPlanReasons([
        AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate,
      ]),
    ])
    render(<NihDataManagement {...props} />)
    expect(queryById('consentFormsUnavailable')).not.toBeNull()
    expect(queryById('consentProcessDidNotAddressFutureUseOrBroadSharing')).not.toBeNull()
    expect(queryById('consentProcessPrecludesFutureUseOrBroadSharing')).not.toBeNull()
    expect(queryById('otherInformedConsentLimitationsOrConcerns')).not.toBeNull()
    expect(queryById('otherReasonForRequest')).not.toBeNull()
  })

  it('hides sub-fields when alternativeDataSharingPlan is false', () => {
    const props = buildProps([
      new NihAnvilUse(NihAnvilUse.YES_NHGRI_YES_PHS_ID),
      new AlternativeDataSharingPlan(false),
    ])
    render(<NihDataManagement {...props} />)
    verifySharingPlanSubfieldsAbsent()
  })

  it('shows alternativeDataSharingPlan field for YES_NHGRI_NO_PHS_ID', () => {
    render(<NihDataManagement {...buildProps([new NihAnvilUse(NihAnvilUse.YES_NHGRI_NO_PHS_ID)])} />)
    expect(queryById('alternativeDataSharingPlan')).not.toBeNull()
  })

  it('shows alternativeDataSharingPlan field for NO_NHGRI_YES_ANVIL', () => {
    render(<NihDataManagement {...buildProps([new NihAnvilUse(NihAnvilUse.NO_NHGRI_YES_ANVIL)])} />)
    expect(queryById('alternativeDataSharingPlan')).not.toBeNull()
  })

  it('does not show alternativeDataSharingPlan field for NO_NHGRI_NO_ANVIL', () => {
    render(<NihDataManagement {...buildProps([new NihAnvilUse(NihAnvilUse.NO_NHGRI_NO_ANVIL)])} />)
    expect(queryById('alternativeDataSharingPlan')).toBeNull()
  })
})
