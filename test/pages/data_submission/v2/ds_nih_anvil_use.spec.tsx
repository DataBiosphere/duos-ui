import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NihAnvilUseRelated, NihAnvilUseRelatedProps } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { NihAnvilUse, NihAnvilUsePreSelectOptions, Study, StudyProperty } from 'src/pages/data_submission/v2/v2-models'

const NIH_ANVIL_PRE_SELECTOR_ID = 'nihAnvilUse_pre_selector'
const NIH_ANVIL_FIELD_ID = 'nihAnvilUse'
const DB_GAP_FIELD_IDS = ['dbGaPPhsID', 'dbGaPStudyRegistrationName', 'embargoReleaseDate', 'sequencingCenter']

const queryById = (id: string) => document.querySelector(`#${id}`)

const expectDbGaPFieldsVisible = (visible: boolean) => {
  DB_GAP_FIELD_IDS.forEach((id) => {
    expect(queryById(id) !== null).toBe(visible)
  })
}

const buildProps = (properties: StudyProperty[] = []): NihAnvilUseRelatedProps => ({
  setStudy: vi.fn(),
  study: { properties } as Study,
})

const renderComponent = (nihAnvilUseValue?: string) => {
  const properties = nihAnvilUseValue ? [new NihAnvilUse(nihAnvilUseValue)] : []
  render(<NihAnvilUseRelated {...buildProps(properties)} />)
}

const clickPreSelector = (selection: NihAnvilUsePreSelectOptions) => {
  fireEvent.click(screen.getByText(selection))
}

describe('NihAnvilUseRelated', () => {
  it('renders pre-selector only with NO default for a new study', () => {
    renderComponent()

    expect(queryById(NIH_ANVIL_PRE_SELECTOR_ID)).not.toBeNull()
    expect(queryById(NIH_ANVIL_FIELD_ID)).toBeNull()
    expectDbGaPFieldsVisible(false)

    clickPreSelector(NihAnvilUsePreSelectOptions.YES)
    expect(queryById(NIH_ANVIL_FIELD_ID)).not.toBeNull()
  })

  it('shows nihAnvilUse field after selecting YES in pre-selector', () => {
    renderComponent()

    clickPreSelector(NihAnvilUsePreSelectOptions.YES)
    expect(queryById(NIH_ANVIL_FIELD_ID)).not.toBeNull()
  })

  it('does not show nihAnvilUse field after selecting NO in pre-selector', () => {
    renderComponent()

    clickPreSelector(NihAnvilUsePreSelectOptions.NO)
    expect(queryById(NIH_ANVIL_FIELD_ID)).toBeNull()
  })

  it('shows dbGaP fields when NHGRI funded and dbGaP ID exists', () => {
    renderComponent(NihAnvilUse.YES_NHGRI_YES_PHS_ID)

    clickPreSelector(NihAnvilUsePreSelectOptions.YES)
    fireEvent.click(screen.getByText(NihAnvilUse.YES_NHGRI_YES_PHS_ID))

    expectDbGaPFieldsVisible(true)
  })

  it.each([
    NihAnvilUse.YES_NHGRI_NO_PHS_ID,
    NihAnvilUse.NO_NHGRI_YES_ANVIL,
    NihAnvilUse.NO_NHGRI_NO_ANVIL,
  ])('hides dbGaP fields for nihAnvilUse value "%s"', (value) => {
    renderComponent(value)

    clickPreSelector(value === NihAnvilUse.NO_NHGRI_NO_ANVIL ? NihAnvilUsePreSelectOptions.NO : NihAnvilUsePreSelectOptions.YES)
    if (value !== NihAnvilUse.NO_NHGRI_NO_ANVIL) {
      fireEvent.click(screen.getByText(value))
    }

    expect(queryById(NIH_ANVIL_FIELD_ID) !== null).toBe(value !== NihAnvilUse.NO_NHGRI_NO_ANVIL)
    expectDbGaPFieldsVisible(false)
  })

  it('resets fields when switching pre-selector from YES to NO', () => {
    renderComponent(NihAnvilUse.YES_NHGRI_YES_PHS_ID)

    clickPreSelector(NihAnvilUsePreSelectOptions.YES)
    expect(queryById(NIH_ANVIL_FIELD_ID)).not.toBeNull()

    clickPreSelector(NihAnvilUsePreSelectOptions.NO)
    expect(queryById(NIH_ANVIL_FIELD_ID)).toBeNull()
    expectDbGaPFieldsVisible(false)
  })

  it('shows nihAnvilUse field when switching pre-selector from NO to YES', () => {
    renderComponent(NihAnvilUse.NO_NHGRI_NO_ANVIL)

    clickPreSelector(NihAnvilUsePreSelectOptions.NO)
    expect(queryById(NIH_ANVIL_FIELD_ID)).toBeNull()

    clickPreSelector(NihAnvilUsePreSelectOptions.YES)
    expect(queryById(NIH_ANVIL_FIELD_ID)).not.toBeNull()
  })
})
