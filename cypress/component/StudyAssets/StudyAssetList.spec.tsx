import React from 'react'
import { mount } from 'cypress/react'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

interface TestAsset {
  id: string
  name: string
}

interface TestAddEditProps {
  items: TestAsset[]
  onSave: (item: TestAsset) => void
  onCancel: () => void
}

interface TestRowProps {
  item: TestAsset
  editMode: boolean
  viewMode: boolean
  editAction: () => void
  deleteAction: () => void
  viewAction: () => void
  disabled: boolean
}

const TestAddEditComponent: React.FC<TestAddEditProps> = ({ items, onSave, onCancel }) => (
  <div data-testid="add-edit-form">
    <input id="itemName" placeholder="Enter name" />
    <button onClick={() => onSave({ id: `item${items.length + 1}`, name: 'New Item' })}>Save</button>
    <button onClick={onCancel}>Cancel</button>
  </div>
)

const TestRowComponent: React.FC<TestRowProps> = ({ item, editMode, viewMode, editAction, deleteAction, viewAction, disabled }) => (
  <div data-testid={`row-${item.id}`} className="test-row">
    {!editMode && !viewMode && (
      <>
        <span>{item.name}</span>
        <button className="glyphicon-eye-open" onClick={viewAction} disabled={disabled}>View</button>
        <button className="glyphicon-pencil" onClick={editAction} disabled={disabled}>Edit</button>
        <button className="glyphicon-trash" onClick={deleteAction} disabled={disabled}>Delete</button>
      </>
    )}
    {(editMode || viewMode) && (
      <div>
        <input value={item.name} readOnly={viewMode} />
        <button onClick={() => {}}>Close</button>
      </div>
    )}
  </div>
)

const sampleItems: TestAsset[] = [
  { id: 'item1', name: 'First Item' },
  { id: 'item2', name: 'Second Item' },
]

// Helper functions
const getValidationState = (validation?: ValidationError) => validation

function getDefaultAddEditProps(items: TestAsset[], closeAction: () => void, onChange: (items: TestAsset[]) => void): TestAddEditProps {
  return {
    items,
    onSave: (item: TestAsset) => {
      onChange([...items, item])
      closeAction()
    },
    onCancel: closeAction,
  }
}

function getDefaultRowProps(baseProps: Omit<TestRowProps, 'item' | 'items' | 'index'>): TestRowProps {
  return baseProps as TestRowProps
}

function mountStudyAssetList(
  items: TestAsset[] = [],
  onItemsChange: (items: TestAsset[]) => void = cy.stub(),
  options: {
    disabled?: boolean
    columnsToShow?: (keyof TestAsset)[]
  } = {},
) {
  return mount(
    <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
      items={items}
      onItemsChange={onItemsChange}
      disabled={options.disabled}
      columnsToShow={options.columnsToShow}
      AddEditComponent={TestAddEditComponent}
      RowComponent={TestRowComponent}
      addButtonId="add-test-btn"
      addButtonLabel="Add Test Item"
      getValidationState={getValidationState}
      getAddEditProps={getDefaultAddEditProps}
      getRowProps={getDefaultRowProps}
    />,
  )
}

function createCollectedItems(initial: TestAsset[] = []) {
  const collected: TestAsset[] = [...initial]
  const onChange = (items: TestAsset[]) => collected.splice(0, collected.length, ...items)
  return { collected, onChange }
}

function clickAddButton() {
  cy.get('#add-test-btn').click()
}

function saveNewItem() {
  cy.get('[data-testid="add-edit-form"]').within(() => {
    cy.contains('Save').click()
  })
}

function cancelAddEdit() {
  cy.get('[data-testid="add-edit-form"]').within(() => {
    cy.contains('Cancel').click()
  })
}

describe('StudyAssetList', () => {
  it('renders add button', () => {
    mountStudyAssetList()
    cy.get('#add-test-btn').should('exist')
    cy.contains('Add Test Item').should('exist')
  })

  it('shows add/edit form when add button is clicked', () => {
    mountStudyAssetList()
    clickAddButton()
    cy.get('[data-testid="add-edit-form"]').should('exist')
  })

  it('adds new item when save is clicked', () => {
    const { collected, onChange } = createCollectedItems()
    mountStudyAssetList([], onChange)

    clickAddButton()
    saveNewItem()

    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].name).to.eq('New Item')
    })
  })

  it('hides add/edit form when cancel is clicked', () => {
    mountStudyAssetList()
    clickAddButton()
    cancelAddEdit()
    cy.get('[data-testid="add-edit-form"]').should('not.exist')
  })

  it('renders existing items', () => {
    mountStudyAssetList(sampleItems, cy.stub(), { columnsToShow: ['name'] })
    cy.contains('First Item').should('exist')
    cy.contains('Second Item').should('exist')
  })

  it('deletes item when delete button is clicked', () => {
    const { collected, onChange } = createCollectedItems(sampleItems)
    mountStudyAssetList(collected, onChange)

    cy.get('[data-testid="row-item1"]').within(() => {
      cy.get('.glyphicon-trash').click()
    })

    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].id).to.eq('item2')
    })
  })

  it('disables add button when disabled prop is true', () => {
    mountStudyAssetList([], cy.stub(), { disabled: true })
    cy.get('#add-test-btn').should('be.disabled')
  })
})
