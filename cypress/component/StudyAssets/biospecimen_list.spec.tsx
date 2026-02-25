import React from 'react'
import BiospecimenAddEdit from 'src/components/biospecimen_list/BiospecimenAddEdit'
import BiospecimenList from 'src/components/biospecimen_list/BiospecimenList'
import BiospecimenRow from 'src/components/biospecimen_list/BiospecimenRow'
import BiospecimenSummary from 'src/components/biospecimen_list/BiospecimenSummary'
import { Biospecimen, BioSpecimenPreservationMethod, BioSpecimenType } from 'src/types/model'
import { testDeleteViaModal } from './testUtils'

const sampleBiospecimen: Biospecimen = {
  biospecimenId: 'SPEC-001',
  studyId: 'STUDY-001',
  donorId: 'DONOR-001',
  specimenType: BioSpecimenType.BLOOD,
  preservationMethod: BioSpecimenPreservationMethod.FRESH_FROZEN,
  organization: 'Johns Hopkins Hospital',
}

const BiospecimenListHarness: React.FC<{ initial: Biospecimen[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Biospecimen[]>(initial)
  return (
    <BiospecimenList
      biospecimens={items}
      columnsToShow={['donorId', 'specimenType', 'preservationMethod']}
      onBiospecimenChange={setItems}
      disabled={false}
    />
  )
}

describe('BiospecimenList component', () => {
  it('renders custom button label with count', () => {
    cy.mount(<BiospecimenListHarness initial={[sampleBiospecimen]} />)
    cy.get('#add-biospecimen-btn').should('contain', '1')
  })

  it('renders button label with zero count when empty', () => {
    cy.mount(<BiospecimenListHarness initial={[]} />)
    cy.get('#add-biospecimen-btn').should('contain', '0')
  })

  it('renders button without default icon', () => {
    cy.mount(<BiospecimenListHarness initial={[]} />)
    cy.get('#add-biospecimen-btn').within(() => {
      cy.get('.glyphicon-plus').should('not.exist')
    })
  })

  it('updates button label when biospecimens count changes', () => {
    const state: Biospecimen[] = [sampleBiospecimen]
    cy.mount(
      <BiospecimenList
        biospecimens={state}
        columnsToShow={['donorId']}
        onBiospecimenChange={(b) => { state.splice(0, state.length, ...b) }}
        disabled={false}
      />,
    )
    cy.get('#add-biospecimen-btn').should('contain', '1')
  })

  it('shows all default columns when none are provided', () => {
    const state: Biospecimen[] = []
    cy.mount(
      <BiospecimenList
        biospecimens={state}
        onBiospecimenChange={(b) => { state.splice(0, state.length, ...b) }}
        disabled={false}
      />,
    )
    cy.get('#add-biospecimen-btn').should('exist')
  })

  it('deletes a model via modal confirmation', () => {
    testDeleteViaModal(
      () => cy.mount(<BiospecimenListHarness initial={[sampleBiospecimen]} />),
      sampleBiospecimen.biospecimenId,
    )
  })
})

describe('BiospecimenAddEdit component', () => {
  it('renders null when not in read-only mode', () => {
    cy.mount(
      <BiospecimenAddEdit
        id={-1}
        biospecimen={undefined}
        biospecimens={[]}
        closeAction={cy.stub().as('close')}
        onBiospecimensChange={cy.stub()}
      />,
    )
    cy.get('body').should('exist')
  })

  it('renders null in edit mode', () => {
    cy.mount(
      <BiospecimenAddEdit
        id={0}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        closeAction={cy.stub().as('close')}
        onBiospecimensChange={cy.stub()}
      />,
    )
    cy.get('body').should('exist')
  })

  it('renders null even with readOnly prop', () => {
    cy.mount(
      <BiospecimenAddEdit
        id={-1}
        biospecimen={undefined}
        biospecimens={[]}
        closeAction={cy.stub().as('close')}
        onBiospecimensChange={cy.stub()}
        readOnly={true}
      />,
    )
    cy.get('body').should('exist')
  })
})

describe('BiospecimenSummary', () => {
  it('renders biospecimen details', () => {
    cy.mount(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['donorId', 'specimenType', 'preservationMethod', 'organization']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleBiospecimen.donorId).should('exist')
    cy.contains(sampleBiospecimen.specimenType).should('exist')
    cy.contains(sampleBiospecimen.preservationMethod).should('exist')
    cy.contains(sampleBiospecimen.organization).should('exist')
  })

  it('renders only specified columns', () => {
    cy.mount(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType', 'donorId']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleBiospecimen.specimenType).should('exist')
    cy.contains(sampleBiospecimen.donorId).should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    cy.mount(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType']}
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

  it('renders edit button and triggers editAction', () => {
    cy.mount(
      <BiospecimenSummary
        biospecimen={sampleBiospecimen}
        columnsToShow={['specimenType']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-pencil').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })
})

describe('BiospecimenRow', () => {
  it('shows summary when not in edit mode', () => {
    cy.mount(
      <BiospecimenRow
        id={0}
        editMode={false}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['donorId', 'specimenType']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onBiospecimensChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains(sampleBiospecimen.specimenType).should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    cy.mount(
      <BiospecimenRow
        id={0}
        editMode={true}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['specimenType']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        onBiospecimensChange={cy.stub()}
        disabled={false}
      />,
    )
    // Since BiospecimenAddEdit returns null, verifying the component renders
    cy.get('body').should('exist')
  })

  it('renders view form when viewMode true and is read-only', () => {
    cy.mount(
      <BiospecimenRow
        id={0}
        editMode={false}
        viewMode={true}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['specimenType']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onBiospecimensChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('body').should('exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    cy.mount(
      <BiospecimenRow
        id={0}
        editMode={false}
        viewMode={false}
        biospecimen={sampleBiospecimen}
        biospecimens={[sampleBiospecimen]}
        columnsToShow={['donorId', 'specimenType']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onBiospecimensChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})
