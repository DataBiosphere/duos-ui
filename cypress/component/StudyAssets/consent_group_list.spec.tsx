import React from 'react'
import ConsentGroupAddEdit from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { mount } from 'cypress/react'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupList from 'src/components/consent_group_list/ConsentGroupList'
import ConsentGroupSummary from 'src/components/consent_group_list/ConsentGroupSummary'
import ConsentGroupRow from 'src/components/consent_group_list/ConsentGroupRow'
import {
  testDeleteViaModal,
  testViewModeFlow,
  testCloseViewMode,
  testEditModeRender,
  testViewModeRender,
  testViewActionTrigger,
  testSummaryViewActionTrigger,
} from './testUtils'

const sampleConsentGroup: ConsentGroup2 = {
  consentGroupId: 'cg1',
  consentGroupName: 'Test Consent Group',
  name: 'Test Consent Group',
  numberOfParticipants: 10,
  generalResearchUse: true,
  irb: false,
  accessManagement: 'open',
  dataLocation: 'Not Determined',
}

const ConsentGroupListHarness: React.FC<{ initial: ConsentGroup2[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<ConsentGroup2[]>(initial)
  return (
    <ConsentGroupList
      consentGroups={items}
      columnsToShow={['consentGroupName']}
      onConsentGroupChange={setItems}
      disabled={false}
    />
  )
}

// Helper functions
function mountListWithItem() {
  return mount(<ConsentGroupListHarness initial={[sampleConsentGroup]} />)
}

function mountRow(overrides: Partial<React.ComponentProps<typeof ConsentGroupRow>> = {}) {
  return mount(
    <ConsentGroupRow
      id={0}
      editMode={false}
      consentGroup={sampleConsentGroup}
      consentGroups={[sampleConsentGroup]}
      columnsToShow={['consentGroupName']}
      editAction={cy.stub()}
      deleteAction={cy.stub()}
      closeAction={cy.stub()}
      onConsentGroupChange={cy.stub()}
      disabled={false}
      {...overrides}
    />,
  )
}

function fillConsentGroupForm(overrides: Partial<ConsentGroup2> = {}) {
  cy.get('#consentGroupName').type(overrides.consentGroupName ?? 'New Consent Group')
  cy.get('#accessManagement_open').check()
  cy.get('#numberOfParticipants').clear()
  cy.get('#numberOfParticipants').type((overrides.numberOfParticipants ?? 25).toString())
  cy.get('#dataLocation').click()
  cy.get('#dataLocation').type((overrides.dataLocation ?? 'Not Determined') + '{enter}')
}

describe('ConsentGroupList component', () => {
  it('Edits without saving', function () {
    mount(
      <ConsentGroupAddEdit
        id={0}
        consentGroups={[]}
        closeAction={function (): void {
          throw new Error('Function not implemented.')
        }}
        onConsentGroupChange={function (_items: ConsentGroup2[]): void {
          throw new Error('Function not implemented.')
        }}
      />,
    )
    cy.get('#consentGroupName').type('Hello!')
    cy.get('#url').type('https://www.asdf.gov')
  })

  it('Shows conditional fields only when checked', function () {
    mount(
      <ConsentGroupAddEdit
        id={0}
        consentGroups={[]}
        closeAction={function (): void {
          throw new Error('Function not implemented.')
        }}
        onConsentGroupChange={function (_items: ConsentGroup2[]): void {
          throw new Error('Function not implemented.')
        }}
      />,
    )

    cy.get('#primaryConsent_generalResearchUse').click()

    cy.get('#gsText').should('not.exist')
    cy.get('#gs').check()
    cy.get('#gsText').should('exist')

    cy.get('#otherSecondaryText').should('not.exist')
    cy.get('#otherSecondary').check()
    cy.get('#otherSecondaryText').should('exist')

    cy.get('#otherPrimaryText').should('not.exist')
    cy.get('#primaryConsent_otherPrimary').check()
    cy.get('#otherPrimaryText').should('exist')

    cy.get('#diseaseSpecificUseText').should('not.exist')
    cy.get('#primaryConsent_diseaseSpecificUse').check()
    cy.get('#diseaseSpecificUseText').should('exist')
  })

  it('renders existing consent groups', () => {
    mountListWithItem()
    cy.contains(sampleConsentGroup.consentGroupName).should('exist')
  })

  it('opens consent group in view mode when view button is clicked', () => {
    testViewModeFlow(mountListWithItem, sampleConsentGroup.consentGroupName, {
      fieldId: '#consentGroupName',
    })
  })

  it('closes view mode when close button is clicked', () => {
    testCloseViewMode(mountListWithItem, { fieldId: '#consentGroupName' })
  })

  it('adds a new consent group', () => {
    const collected: ConsentGroup2[] = []
    mount(
      <ConsentGroupList
        consentGroups={[]}
        columnsToShow={['consentGroupName']}
        onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
        disabled={false}
      />,
    )
    cy.get('#add-consent-group-btn').click()
    fillConsentGroupForm()
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled')
    cy.get('.collaborator-form-add-save-button').click()

    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].consentGroupName).to.eq('New Consent Group')
    })
  })

  it('edits existing consent group and saves changes', () => {
    mountListWithItem()
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('#consentGroupName').should('exist')
    cy.get('#consentGroupName').clear()
    cy.get('#consentGroupName').type('Test Consent Group Edited')
    cy.get('#numberOfParticipants').clear()
    cy.get('#numberOfParticipants').type('15')
    cy.get('.collaborator-form-add-save-button').should('not.be.disabled')
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('#consentGroupName').should('not.exist')
    cy.contains('Test Consent Group Edited').should('exist')
  })

  it('deletes a consent group via modal confirmation', () => {
    testDeleteViaModal(mountListWithItem, sampleConsentGroup.consentGroupName)
  })
})

describe('ConsentGroupSummary', () => {
  it('renders columns and consent group data', () => {
    mount(
      <ConsentGroupSummary
        consentGroup={sampleConsentGroup}
        columnsToShow={['consentGroupName', 'numberOfParticipants']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleConsentGroup.consentGroupName).should('exist')
    cy.contains(sampleConsentGroup.numberOfParticipants.toString()).should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    testSummaryViewActionTrigger(() =>
      mount(
        <ConsentGroupSummary
          consentGroup={sampleConsentGroup}
          columnsToShow={['consentGroupName']}
          editAction={cy.stub()}
          deleteAction={cy.stub()}
          viewAction={cy.stub().as('view')}
          disabled={false}
        />,
      ),
    )
  })
})

describe('ConsentGroupRow', () => {
  it('shows summary when not in edit mode and triggers editAction', () => {
    mountRow({ editAction: cy.stub().as('edit') })
    cy.contains(sampleConsentGroup.consentGroupName).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    testEditModeRender<React.ComponentProps<typeof ConsentGroupRow>>(
      mountRow,
      '#consentGroupName',
      sampleConsentGroup.consentGroupName,
    )
  })

  it('renders view form when viewMode true and is read-only', () => {
    testViewModeRender<React.ComponentProps<typeof ConsentGroupRow>>(
      mountRow,
      '#consentGroupName',
      sampleConsentGroup.consentGroupName,
    )
  })

  it('triggers viewAction when view button is clicked', () => {
    testViewActionTrigger<React.ComponentProps<typeof ConsentGroupRow>>(mountRow)
  })
})
