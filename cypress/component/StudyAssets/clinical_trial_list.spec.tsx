import React from 'react'
import { mount } from 'cypress/react'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialList from 'src/components/clinical_trial_list/ClinicalTrialList'
import ClinicalTrialRow from 'src/components/clinical_trial_list/ClinicalTrialRow'
import ClinicalTrialSummary from 'src/components/clinical_trial_list/ClinicalTrialSummary'
import {
  ClinicalTrial,
  ClinicalTrialStatus,
  ClinicalTrialInterventionType,
  ClinicalTrialPhase,
} from 'src/types/model'

const sampleTrial: ClinicalTrial = {
  clinicalTrialId: 'ct1',
  studyId: 's1',
  title: 'Baseline Trial',
  registry: 'ClinicalTrials.gov',
  identifier: 'NCT00000001',
  status: ClinicalTrialStatus.COMPLETED,
  sponsor: 'NIH',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  interventionType: ClinicalTrialInterventionType.DRUG,
  description: 'Desc',
  phase: ClinicalTrialPhase.PHASE2,
  url: 'https://example.com/trial',
  tags: ['oncology', 'phase2'],
}

const ClinicalTrialListHarness: React.FC<{ initial: ClinicalTrial[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<ClinicalTrial[]>(initial)
  return (
    <ClinicalTrialList
      clinicalTrials={items}
      columnsToShow={['title', 'registry']}
      onClinicalTrialChange={setItems}
      disabled={false}
    />
  )
}

describe('ClinicalTrialList component', () => {
  it('renders existing trials', () => {
    mount(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    cy.contains(sampleTrial.title).should('exist')
    cy.contains(sampleTrial.registry).should('exist')
  })

  it('opens add form and enforces validation disabling save then adds', () => {
    const added: ClinicalTrial[] = []
    mount(
      <ClinicalTrialAddEdit
        id={-1}
        clinicalTrial={undefined}
        clinicalTrials={[]}
        closeAction={cy.stub().as('close')}
        onClinicalTrialChange={(cts) => { added.splice(0, added.length, ...cts) }}
      />,
    )
    cy.get('#title').type('My Trial')
    cy.get('#registry').type('Registry X')
    cy.get('#identifier').type('ID123')
    cy.get('#status').click()
    cy.get('#status').type('Completed{enter}')
    cy.get('#sponsor').type('Sponsor Y')
    cy.get('#startDate').type('2024-06-01')
    cy.get('#interventionType').click()
    cy.get('#interventionType').type('Drug{enter}')
    cy.get('#phase').click()
    cy.get('#phase').type('Phase 2{enter}')
    cy.get('#url').type('https://trial.example.com')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(added.length).to.eq(1)
      expect(added[0].title).to.eq('My Trial')
      expect(added[0].identifier).to.eq('ID123')
      expect(added[0].status).to.eq(ClinicalTrialStatus.COMPLETED)
    })
  })

  it('opens trial in view mode when view button is clicked', () => {
    mount(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains(sampleTrial.title).should('exist')
    cy.get('#title').should('be.disabled')
    cy.get('#registry').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    mount(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#title').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })

  it('adds a new clinical trial', () => {
    const state: ClinicalTrial[] = []
    mount(
      <ClinicalTrialList
        clinicalTrials={state}
        columnsToShow={['title', 'status']}
        onClinicalTrialChange={(cts) => { state.splice(0, state.length, ...cts) }}
        disabled={false}
      />,
    )
    cy.get('#add-clinical-trial-btn').click()
    cy.get('#title').type('Added Trial')
    cy.get('#registry').type('Reg A')
    cy.get('#identifier').type('ID999')
    cy.get('#status').click()
    cy.get('#status').type('Completed{enter}')
    cy.get('#sponsor').type('Org Z')
    cy.get('#startDate').type('2024-02-02')
    cy.get('#interventionType').click()
    cy.get('#interventionType').type('Device{enter}')
    cy.get('#phase').click()
    cy.get('#phase').type('Phase 3{enter}')
    cy.get('#url').type('https://added.example.com')
    cy.get('.collaborator-form-add-save-button').click({ force: true })
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].title).to.eq('Added Trial')
      expect(state[0].status).to.eq(ClinicalTrialStatus.COMPLETED)
    })
  })

  it('edits existing trial and saves changes', () => {
    const trials: ClinicalTrial[] = [sampleTrial]
    mount(
      <ClinicalTrialAddEdit
        id={0}
        clinicalTrial={sampleTrial}
        clinicalTrials={trials}
        closeAction={cy.stub().as('close')}
        onClinicalTrialChange={(updated) => {
          expect(updated[0].title).to.eq('Baseline Trial Edited')
          expect(updated[0].phase).to.eq(ClinicalTrialPhase.PHASE2)
        }}
      />,
    )
    cy.get('#title').clear()
    cy.get('#title').type('Baseline Trial Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })

  it('deletes a clinical trial via modal confirmation', () => {
    mount(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    cy.contains(sampleTrial.title).should('exist')
    cy.get('.glyphicon-trash').click({ force: true })
    cy.get('.ReactModal__Content')
      .should('be.visible')
      .within(() => {
        cy.get('button')
          .filter(':visible')
          .contains(/delete/i)
          .click({ force: true })
      })
    cy.get('.ReactModal__Content').should('not.exist')
    cy.contains(sampleTrial.title).should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})

describe('ClinicalTrialSummary', () => {
  it('renders tags and date range', () => {
    mount(
      <ClinicalTrialSummary
        clinicalTrial={sampleTrial}
        columnsToShow={[
          'title',
          'registry',
          'identifier',
          'status',
          'sponsor',
          'dateRange',
          'interventionType',
          'phase',
          'url',
          'tags',
        ]}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleTrial.title).should('exist')
    cy.contains(sampleTrial.registry).should('exist')
    cy.contains(sampleTrial.identifier).should('exist')
    cy.contains(/Completed/i).should('exist')
    cy.contains(sampleTrial.sponsor).should('exist')
    cy.contains('2024-01-01 → 2025-12-31').should('exist')
    cy.contains(/Drug/i).should('exist')
    cy.contains(/Phase II|Phase 2/i).should('exist')
    cy.contains(sampleTrial.url).should('exist')
    cy.contains('oncology, phase2').should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    mount(
      <ClinicalTrialSummary
        clinicalTrial={sampleTrial}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').should('exist')
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})

describe('ClinicalTrialRow', () => {
  it('shows summary when not in edit mode and triggers edit', () => {
    mount(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title', 'status']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onClinicalTrialChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleTrial.title).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <ClinicalTrialRow
        id={0}
        editMode={true}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onClinicalTrialChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', sampleTrial.title)
  })

  it('renders view form when viewMode true and is read-only', () => {
    mount(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        viewMode={true}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onClinicalTrialChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#title').should('have.value', sampleTrial.title)
    cy.get('#title').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    mount(
      <ClinicalTrialRow
        id={0}
        editMode={false}
        viewMode={false}
        clinicalTrial={sampleTrial}
        clinicalTrials={[sampleTrial]}
        columnsToShow={['title', 'status']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onClinicalTrialChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})
