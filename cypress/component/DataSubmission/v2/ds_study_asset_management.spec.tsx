import React from 'react'
import { mount } from 'cypress/react'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'
import { Study } from 'src/pages/data_submission/v2/v2-models'

const baseStudy: Study = {
  assets: {
    models: [],
    workspaces: [],
    publications: [],
    presentations: [],
    clinicalTrials: [],
    intellectualProperty: [],
    funding: [],
  },
} as Study

describe('StudyAssetManagement component', () => {
  it('renders all asset sections with titles and descriptions', () => {
    const setStudySpy = cy.spy().as('setStudySpy')
    mount(<StudyAssetManagement study={baseStudy} setStudy={setStudySpy} />)

    const sections = [
      { title: 'Datasets', desc: 'Add datasets associated with this study' },
      { title: 'Models', desc: 'Add computational models or algorithms derived from this study' },
      { title: 'Featured Workspaces', desc: 'Add computational workspaces for data analysis' },
      { title: 'Publications', desc: 'Add published research papers related to this study' },
      { title: 'Presentations', desc: 'Add conference presentations or talks about this study' },
      { title: 'Clinical Trials', desc: 'Add clinical trials associated with this study' },
      { title: 'Intellectual Property', desc: 'Add patents or other IP related to this study' },
      { title: 'Funding Resources', desc: 'Add grants and funding sources for this study' },
    ]

    cy.contains('Study Assets').should('exist')
    cy.contains('Add datasets, models, workspaces, and other resources associated with this study').should('exist')

    for (const { title, desc } of sections) {
      cy.contains('h3', title).should('exist')
      cy.contains(desc).should('exist')
    }
  })
})
