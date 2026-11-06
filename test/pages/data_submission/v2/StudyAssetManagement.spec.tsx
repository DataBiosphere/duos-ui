import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { BioSpecimenPreservationMethod, BioSpecimenType, Biospecimen } from 'src/types/model'

vi.mock('src/components/consent_group_list/ConsentGroupList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/ai_models_list/AiModelList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/workspaces_list/WorkspaceList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/publications_list/PublicationList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/presentations_list/PresentationList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/clinical_trial_list/ClinicalTrialList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/intellectual_property_list/IntellectualPropertyList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

vi.mock('src/components/funding_resource_list/FundingResourceList', () => ({
  default: ({ studyAssetWrapper }: { studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode }) => (
    <>{studyAssetWrapper?.(null, null)}</>
  ),
}))

const biospecimenListProps = vi.hoisted(() => ({ current: undefined as undefined | { biospecimens: unknown[], onBiospecimenChange: (b: unknown[]) => void } }))

vi.mock('src/components/biospecimen_list/BiospecimenList', () => ({
  default: (props: {
    biospecimens: unknown[]
    onBiospecimenChange: (b: unknown[]) => void
    studyAssetWrapper?: (c: React.ReactNode, b: React.ReactNode) => React.ReactNode
  }) => {
    biospecimenListProps.current = props
    return <>{props.studyAssetWrapper?.(null, null)}</>
  },
}))

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 1,
  studyId: '1',
  donorId: 'donor-1',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Test Organization',
}

const baseStudy: Study = {
  piName: '',
  piEmail: '',
  data: {},
  assets: {
    biospecimens: [sampleBiospecimen],
  },
}

describe('StudyAssetManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 9 asset sections with titles and descriptions', () => {
    render(
      <StudyAssetManagement
        study={baseStudy}
        setStudy={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Study Assets' })).toBeInTheDocument()
    expect(screen.getByText(/Add datasets, models, workspaces, biospecimens, and other resources associated with this study/)).toBeInTheDocument()
    expect(screen.queryByText(/contact the DUOS Team/i)).toBeNull()

    expect(screen.getByRole('heading', { level: 3, name: 'Datasets' })).toBeInTheDocument()
    expect(screen.getByText('Add datasets associated with this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Models' })).toBeInTheDocument()
    expect(screen.getByText('Add computational models or algorithms derived from this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Featured Workspaces' })).toBeInTheDocument()
    expect(screen.getByText('Add computational workspaces for data analysis')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Publications' })).toBeInTheDocument()
    expect(screen.getByText('Add published research papers related to this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Presentations' })).toBeInTheDocument()
    expect(screen.getByText('Add conference presentations or talks about this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Clinical Trials' })).toBeInTheDocument()
    expect(screen.getByText('Add clinical trials associated with this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Intellectual Property' })).toBeInTheDocument()
    expect(screen.getByText('Add patents or other IP related to this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Funding Resources' })).toBeInTheDocument()
    expect(screen.getByText('Add grants and funding sources for this study')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Biospecimens' })).toBeInTheDocument()
    expect(screen.getByText('Add biospecimens collected for this study, one entry per vial or sample')).toBeInTheDocument()
  })

  it('renders the biospecimens section for a study without biospecimens', () => {
    const studyWithoutBiospecimens: Study = {
      ...baseStudy,
      assets: { ...baseStudy.assets, biospecimens: [] },
    }

    render(
      <StudyAssetManagement
        study={studyWithoutBiospecimens}
        setStudy={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Biospecimens' })).toBeInTheDocument()
    expect(biospecimenListProps.current?.biospecimens).toEqual([])
  })

  it('stores biospecimen changes in the study assets', () => {
    let study: Study = baseStudy
    const setStudy = vi.fn((update: React.SetStateAction<Study>) => {
      study = typeof update === 'function' ? update(study) : update
    })
    render(<StudyAssetManagement study={baseStudy} setStudy={setStudy} />)
    expect(biospecimenListProps.current?.biospecimens).toEqual([sampleBiospecimen])

    const added = { ...sampleBiospecimen, biospecimenId: undefined, donorId: 'donor-2' }
    biospecimenListProps.current?.onBiospecimenChange([sampleBiospecimen, added])

    expect(study.assets?.biospecimens).toEqual([sampleBiospecimen, added])
  })
})
