import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Route, Routes } from 'react-router'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { Draft } from 'src/libs/ajax/Draft'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetRegistrationSchemaV1 } from 'src/pages/data_submission/v2/v2-models'
import { DraftDetail } from 'src/types/draft'
import { renderWithRouter } from '../../../test-utils'

vi.mock('src/libs/ajax/Draft', () => ({ Draft: { getDraft: vi.fn(), deleteDraft: vi.fn() } }))
vi.mock('src/libs/ajax/DataSet', () => ({ DataSet: { getStudyById: vi.fn(), registerDataset: vi.fn(), updateStudy: vi.fn() } }))
vi.mock('src/libs/storage', () => ({ Storage: { getCurrentUser: () => ({}), userIsLogged: () => false } }))

// Swap MUI DatePicker for a plain input, as the section specs do.
vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id }: { id: string }) => <input data-testid={`date-picker-${id}`} />,
}))

const DRAFT_ID = '0393c587-343b-4c85-8969-e69e3f4f5aa8'
const DRAFT_ROUTE = `/data_submission_form/draft/study-dataset/${DRAFT_ID}`

/**
 * Hydration is not one await: the draft load resolves, the spinner gives way to the whole form, and
 * only the passive-effect pass after that commit copies each defaultValue into its control. On a
 * contended machine that chain runs well past the 1s these helpers allow by default, so every wait
 * that stands between a render and a hydrated control gets the longer budget. It costs nothing
 * unless the test is genuinely failing.
 */
const HYDRATION_TIMEOUT = { timeout: 10000 }

const baseDocument = (): DatasetRegistrationSchemaV1 => {
  const detail: DraftDetail<DatasetRegistrationSchemaV1> = JSON.parse(readFileSync(
    resolve(__dirname, '../../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
    'utf8',
  ))
  return detail.document
}

/** A draft with something of every kind the form has to place: scalar, property, group, file type. */
const richDocument = (): DatasetRegistrationSchemaV1 => ({
  ...baseDocument(),
  piEmail: 'investigator@example.org',
  phenotypeIndication: 'Synthetic indication',
  species: 'Homo sapiens',
  alternativeDataSharingPlan: true,
  alternativeDataSharingPlanExplanation: 'Synthetic explanation',
  data: { someClientKey: 'kept as-is' },
  // A draft carries only what the wire contract defines, which is a subset of the richer shape the
  // form uses once a study is persisted.
  consentGroups: [
    {
      consentGroupName: 'Synthetic Open Dataset',
      accessManagement: 'open',
      numberOfParticipants: 10,
      fileTypes: [{ fileType: 'Genome', functionalEquivalence: 'Synthetic reference build' }],
    },
    {
      consentGroupName: 'Synthetic Controlled Dataset',
      accessManagement: 'controlled',
      numberOfParticipants: 42,
    },
  ] as unknown as DatasetRegistrationSchemaV1['consentGroups'],
} as DatasetRegistrationSchemaV1)

const renderDraft = (document: DatasetRegistrationSchemaV1) => {
  const detail = { ...JSON.parse(readFileSync(
    resolve(__dirname, '../../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
    'utf8',
  )), document }
  vi.mocked(Draft.getDraft).mockResolvedValue(detail)
  return renderWithRouter(
    <Routes>
      <Route path="/data_submission_form/draft/study-dataset/:draftUuid" element={<DataSubmissionFormV2 />} />
    </Routes>,
    { route: DRAFT_ROUTE },
  )
}

const inputValue = (id: string): string =>
  (globalThis.document.getElementById(id) as HTMLInputElement)?.value

const submittedPayload = (): DatasetRegistrationSchemaV1 => {
  const formData = vi.mocked(DataSet.registerDataset).mock.calls[0][0] as FormData
  return JSON.parse(formData.get('dataset') as string)
}

const createStudy = async () => {
  fireEvent.click(screen.getByText('Create Study'))
  await waitFor(() => expect(DataSet.registerDataset).toHaveBeenCalled(), HYDRATION_TIMEOUT)
}

describe('DataSubmissionFormV2 hydrating a draft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)
    vi.mocked(Draft.deleteDraft).mockResolvedValue(undefined)
  })

  it('places the scalar fields in their controls', async () => {
    renderDraft(richDocument())

    await waitFor(() => expect(inputValue('name')).toBe('Synthetic Minimal Study'), HYDRATION_TIMEOUT)
    expect(inputValue('description')).toBe('A synthetic study used only for contract tests.')
    expect(inputValue('piName')).toBe('Synthetic Investigator')
    expect(inputValue('piEmail')).toBe('investigator@example.org')
  })

  it('places the fields that travel as study properties', async () => {
    renderDraft(richDocument())

    await waitFor(() => expect(inputValue('phenotypeIndication')).toBe('Synthetic indication'), HYDRATION_TIMEOUT)
    expect(inputValue('species')).toBe('Homo sapiens')
  })

  it('lists the consent groups in the order the document gave them', async () => {
    renderDraft(richDocument())

    expect(await screen.findByText('Synthetic Open Dataset', {}, HYDRATION_TIMEOUT)).toBeInTheDocument()
    expect(screen.getByText('Synthetic Controlled Dataset')).toBeInTheDocument()
  })

  it('keeps consent groups, their file types, and the client metadata through submission', async () => {
    renderDraft(richDocument())
    expect(await screen.findByText('Create Study', {}, HYDRATION_TIMEOUT)).toBeInTheDocument()

    await createStudy()

    const submitted = submittedPayload()
    expect(submitted.consentGroups.map(group => group.consentGroupName))
      .toEqual(['Synthetic Open Dataset', 'Synthetic Controlled Dataset'])
    expect(submitted.consentGroups[0].fileTypes)
      .toEqual([{ fileType: 'Genome', functionalEquivalence: 'Synthetic reference build' }])
    expect(submitted.data).toEqual({ someClientKey: 'kept as-is' })
  })

  it('leaves the file control empty and still able to take a file', async () => {
    // The sharing-plan section, and its file control, only appear for an NIH-funded study.
    renderDraft({
      ...richDocument(),
      nihAnvilUse: 'I am NHGRI funded and I have a dbGaP PHS ID already',
    } as DatasetRegistrationSchemaV1)
    // FileInput keeps its input hidden and unlabelled, so it is found the way its own spec finds it.
    await waitFor(() => expect(globalThis.document.querySelector('input[type="file"]')).toBeInTheDocument(), HYDRATION_TIMEOUT)

    const fileInput = globalThis.document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput.files?.length ?? 0).toBe(0)

    const plan = new File(['plan'], 'sharing-plan.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [plan] } })
    await createStudy()

    // The form clones the study before submitting, so the file arrives as a copy rather than the
    // same instance.
    const formData = vi.mocked(DataSet.registerDataset).mock.calls[0][0] as FormData
    expect((formData.get('alternativeDataSharingPlan') as File).name).toBe('sharing-plan.txt')
  })
})
