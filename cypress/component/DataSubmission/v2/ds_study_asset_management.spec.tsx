import React from 'react'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'

const sampleBiospecimens: Biospecimen[] = [{
  biospecimenId: 'SPEC-001',
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}]

const baseStudy: Study = {
  assets: {
    models: [],
    workspaces: [],
    publications: [],
    presentations: [],
    clinicalTrials: [],
    intellectualProperty: [],
    funding: [],
    biospecimens: sampleBiospecimens,
  },
} as unknown as Study

describe('StudyAssetManagement component', () => {
  it('renders all asset sections with titles and descriptions', () => {
    const setStudySpy = cy.spy().as('setStudySpy')
    cy.mount(<StudyAssetManagement study={baseStudy} setStudy={setStudySpy} onOpenContactUs={cy.stub()} />)

    const sections = [
      { title: 'Datasets', desc: 'Add datasets associated with this study' },
      { title: 'Models', desc: 'Add computational models or algorithms derived from this study' },
      { title: 'Featured Workspaces', desc: 'Add computational workspaces for data analysis' },
      { title: 'Publications', desc: 'Add published research papers related to this study' },
      { title: 'Presentations', desc: 'Add conference presentations or talks about this study' },
      { title: 'Clinical Trials', desc: 'Add clinical trials associated with this study' },
      { title: 'Intellectual Property', desc: 'Add patents or other IP related to this study' },
      { title: 'Funding Resources', desc: 'Add grants and funding sources for this study' },
      { title: 'Biospecimens', desc: 'View total biospecimens for this study' },
    ]

    cy.contains('Study Assets').should('exist')
    cy.contains('Add datasets, models, workspaces, and other resources associated with this study. To add biospecimen data,').should('exist')
    cy.contains('contact the DUOS Team').should('exist')

    for (const { title, desc } of sections) {
      cy.contains('h3', title).should('exist')
      cy.contains(desc).should('exist')
    }
  })

  it('does not render biospecimens section when biospecimens array is empty', () => {
    const baseStudyNoBiospecimens = {
      ...baseStudy,
      assets: {
        ...baseStudy.assets,
        biospecimens: [],
      },
    }

    const setStudySpy = cy.spy().as('setStudySpy')
    cy.mount(<StudyAssetManagement study={baseStudyNoBiospecimens} setStudy={setStudySpy} onOpenContactUs={cy.stub()} />)

    cy.contains('h3', 'Biospecimens').should('not.exist')
    cy.contains('View total biospecimens for this study').should('not.exist')
  })
})
