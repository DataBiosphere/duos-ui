import React from 'react'
import { mount } from 'cypress/react'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialList from 'src/components/clinical_trial_list/ClinicalTrialList'
import ClinicalTrialRow from 'src/components/clinical_trial_list/ClinicalTrialRow'
import ClinicalTrialSummary from 'src/components/clinical_trial_list/ClinicalTrialSummary'
import { ClinicalTrial } from 'src/types/model'

const sampleTrial: ClinicalTrial = {
  clinicalTrialId: 'ct1',
  studyId: 's1',
  title: 'Baseline Trial',
  registry: 'ClinicalTrials.gov',
  identifier: 'NCT00000001',
  status: 'Recruiting',
  sponsor: 'NIH',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  interventionType: 'Drug',
  description: 'Desc',
  phase: 'Phase II',
  url: 'https://example.com/trial',
  tags: ['oncology', 'phase2'],
}

const ClinicalTrialListHarness: React.FC<{ initial: ClinicalTrial[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<ClinicalTrial[]>(initial)
  return (
    <ClinicalTrialList
      clinicalTrials={items}
      columnsToShow={['title']}
      onClinicalTrialChange={setItems}
      disabled={false}
    />
  )
}

describe('ClinicalTrialAddEdit', () => {
  it('disables Add until required fields filled then adds', () => {
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
    cy.get('.collaborator-form-add-save-button').should('be.disabled')
    cy.get('#title').type('My Trial')
    cy.get('#registry').type('Registry X')
    cy.get('#identifier').type('ID123')
    cy.get('#status').type('Active')
    cy.get('#sponsor').type('Sponsor Y')
    cy.get('#startDate').type('2024-06-01')
    cy.get('#interventionType').type('Device')
    cy.get('#phase').type('Phase I')
    cy.get('#url').type('https://trial.example.com')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled').click()
    cy.wrap(null).then(() => {
      expect(added.length).to.eq(1)
      expect(added[0].title).to.eq('My Trial')
      expect(added[0].identifier).to.eq('ID123')
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
        }}
      />,
    )
    cy.get('#title').clear()
    cy.get('#title').type('Baseline Trial Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })
})

describe('ClinicalTrialSummary', () => {
  it('renders tags and date range', () => {
    mount(
      <ClinicalTrialSummary
        clinicalTrial={sampleTrial}
        columnsToShow={['title', 'registry', 'identifier', 'status', 'sponsor', 'dateRange', 'interventionType', 'phase', 'url', 'tags']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Baseline Trial').should('exist')
    cy.contains('ClinicalTrials.gov').should('exist')
    cy.contains('NCT00000001').should('exist')
    cy.contains('Recruiting').should('exist')
    cy.contains('NIH').should('exist')
    cy.contains('2024-01-01 → 2025-12-31').should('exist')
    cy.contains('Drug').should('exist')
    cy.contains('Phase II').should('exist')
    cy.contains('https://example.com/trial').should('exist')
    cy.contains('oncology, phase2').should('exist')
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
    cy.contains('Baseline Trial').should('exist')
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
    cy.get('#title').should('have.value', 'Baseline Trial')
  })
})

describe('ClinicalTrialList', () => {
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
    cy.get('#status').type('Completed')
    cy.get('#sponsor').type('Org Z')
    cy.get('#startDate').type('2024-02-02')
    cy.get('#interventionType').type('Biologic')
    cy.get('#phase').type('Phase III')
    cy.get('#url').type('https://added.example.com')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].title).to.eq('Added Trial')
    })
  })

  it('deletes a clinical trial via modal confirmation', () => {
    mount(<ClinicalTrialListHarness initial={[sampleTrial]} />)
    cy.contains('Baseline Trial').should('exist')
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
    cy.contains('Baseline Trial').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })
})
