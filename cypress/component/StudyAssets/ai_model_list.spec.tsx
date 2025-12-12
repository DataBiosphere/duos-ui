import React from 'react'
import { mount } from 'cypress/react'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import AiModelList from 'src/components/ai_models_list/AiModelList'
import AiModelRow from 'src/components/ai_models_list/AiModelRow'
import AiModelSummary from 'src/components/ai_models_list/AiModelSummary'
import { AiModel } from 'src/types/model'

const sampleModel: AiModel = {
  modelId: 'm1',
  studyId: 's1',
  name: 'Baseline Model',
  description: 'Desc',
  url: 'https://example.com',
  format: 'PyTorch',
  license: 'MIT',
  trainedOnDatasets: ['ds1', 'ds2'],
  maintainer: { name: 'Alice', email: 'alice@example.com' },
  tags: ['vision', 'baseline'],
}

const AiModelListHarness: React.FC<{ initial: AiModel[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<AiModel[]>(initial)
  return (
    <AiModelList
      aiModels={items}
      columnsToShow={['name', 'format', 'license']}
      onAiModelsChange={setItems}
      disabled={false}
    />
  )
}

describe('AiModelList component', () => {
  it('renders existing models', () => {
    mount(<AiModelListHarness initial={[sampleModel]} />)
    cy.contains('Baseline Model').should('exist')
    cy.contains('PyTorch').should('exist')
  })

  it('opens add form and enforces validation disabling save then adds', () => {
    const onChangeSpy: AiModel[] = []
    mount(
      <AiModelAddEdit
        id={-1}
        aiModel={undefined}
        aiModels={[]}
        closeAction={cy.stub().as('close')}
        onAiModelsChange={(models) => { onChangeSpy.push(...models) }}
      />,
    )
    cy.get('#name').type('My Model')
    cy.get('#url').type('https://x.com')
    cy.get('#format').type('ONNX')
    cy.get('#license').type('Apache-2.0')
    cy.get('#maintainerName').type('Bob')
    cy.get('#maintainerEmail').type('bob@example.com')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(onChangeSpy.length).to.eq(1)
      expect(onChangeSpy[0].name).to.eq('My Model')
      expect(onChangeSpy[0].maintainer.email).to.eq('bob@example.com')
    })
  })

  it('opens model in view mode when view button is clicked', () => {
    mount(<AiModelListHarness initial={[sampleModel]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.contains('Baseline Model').should('exist')
    cy.get('#name').should('be.disabled')
    cy.get('#format').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
    cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
  })

  it('closes view mode when close button is clicked', () => {
    mount(<AiModelListHarness initial={[sampleModel]} />)
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#name').should('not.exist')
    cy.get('.glyphicon-eye-open').should('exist')
  })

  it('adds a new model', () => {
    const state: AiModel[] = []
    mount(
      <AiModelList
        aiModels={state}
        columnsToShow={['name', 'license']}
        onAiModelsChange={(m) => { state.splice(0, state.length, ...m) }}
        disabled={false}
      />,
    )
    cy.get('#add-ai-model-btn').click()
    cy.get('#name').type('Added Model')
    cy.get('#url').type('https://m.com')
    cy.get('#format').type('TensorFlow')
    cy.get('#license').type('BSD')
    cy.get('#maintainerName').type('Carol')
    cy.get('#maintainerEmail').type('carol@example.com')
    cy.get('.collaborator-form-add-save-button').click()
    cy.wrap(null).then(() => {
      expect(state.length).to.eq(1)
      expect(state[0].name).to.eq('Added Model')
    })
  })

  it('edits existing model and saves changes', () => {
    const models: AiModel[] = [sampleModel]
    mount(
      <AiModelAddEdit
        id={0}
        aiModel={sampleModel}
        aiModels={models}
        closeAction={cy.stub().as('close')}
        onAiModelsChange={(updated) => {
          expect(updated[0].name).to.eq('Baseline Model Edited')
        }}
      />,
    )
    cy.get('#name').clear()
    cy.get('#name').type('Baseline Model Edited')
    cy.get('.collaborator-form-add-save-button').click()
  })

  it('deletes a model via modal confirmation', () => {
    mount(<AiModelListHarness initial={[sampleModel]} />)
    cy.contains('Baseline Model').should('exist')
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
    cy.contains('Baseline Model').should('not.exist')
    cy.get('.collaborator-summary-card').should('have.length', 0)
  })

  it('shows all default columns when none are provided', () => {
    const state: AiModel[] = [sampleModel]
    mount(
      <AiModelList
        aiModels={state}
        onAiModelsChange={(m) => { state.splice(0, state.length, ...m) }}
        disabled={false}
      />,
    )
    cy.contains(sampleModel.name).should('exist')
    cy.contains(sampleModel.url).should('exist')
    cy.contains(sampleModel.format).should('exist')
    cy.contains(sampleModel.license).should('exist')
    cy.contains(sampleModel.maintainer.name).should('exist')
    cy.contains(sampleModel.maintainer.email).should('exist')
  })
})

describe('AiModelSummary', () => {
  it('renders arrays and maintainer formatting', () => {
    mount(
      <AiModelSummary
        aiModel={sampleModel}
        columnsToShow={['name', 'maintainer', 'trainedOnDatasets', 'tags', 'license']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Baseline Model').should('exist')
    cy.contains('Alice (alice@example.com)').should('exist')
    cy.contains('ds1, ds2').should('exist')
    cy.contains('vision, baseline').should('exist')
    cy.contains('MIT').should('exist')
  })

  it('renders view button and triggers viewAction', () => {
    mount(
      <AiModelSummary
        aiModel={sampleModel}
        columnsToShow={['name']}
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

describe('AiModelRow', () => {
  it('shows summary when not in edit mode', () => {
    mount(
      <AiModelRow
        id={0}
        editMode={false}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name', 'format']}
        editAction={cy.stub().as('edit')}
        deleteAction={cy.stub().as('delete')}
        closeAction={cy.stub()}
        onAiModelsChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.contains('Baseline Model').should('exist')
    cy.get('.glyphicon-pencil').click({ force: true })
    cy.get('@edit').should('have.been.calledOnce')
  })

  it('renders edit form when editMode true', () => {
    mount(
      <AiModelRow
        id={0}
        editMode={true}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub().as('close')}
        onAiModelsChange={cy.stub().as('change')}
        disabled={false}
      />,
    )
    cy.get('#name').should('have.value', 'Baseline Model')
  })

  it('renders view form when viewMode true and is read-only', () => {
    mount(
      <AiModelRow
        id={0}
        editMode={false}
        viewMode={true}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub()}
        onAiModelsChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('#name').should('have.value', 'Baseline Model')
    cy.get('#name').should('be.disabled')
    cy.get('.collaborator-form-add-save-button').should('not.exist')
  })

  it('triggers viewAction when view button is clicked', () => {
    mount(
      <AiModelRow
        id={0}
        editMode={false}
        viewMode={false}
        aiModel={sampleModel}
        aiModels={[sampleModel]}
        columnsToShow={['name', 'format']}
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        closeAction={cy.stub()}
        viewAction={cy.stub().as('view')}
        onAiModelsChange={cy.stub()}
        disabled={false}
      />,
    )
    cy.get('.glyphicon-eye-open').click({ force: true })
    cy.get('@view').should('have.been.calledOnce')
  })
})
