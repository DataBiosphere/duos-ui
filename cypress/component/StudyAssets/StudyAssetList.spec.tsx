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
  items: TestAsset[]
  index: number
  editMode: boolean
  viewMode: boolean
  editAction: () => void
  deleteAction: () => void
  viewAction: () => void
  closeAction: () => void
  onItemsChange: (items: TestAsset[]) => void
  columnsToShow: (keyof TestAsset)[]
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

describe('StudyAssetList', () => {
  const getValidationState = (validation?: ValidationError) => validation

  it('renders add button', () => {
    const onItemsChange = cy.stub()
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={[]}
        onItemsChange={onItemsChange}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('#add-test-btn').should('exist')
    cy.contains('Add Test Item').should('exist')
  })

  it('shows add/edit form when add button is clicked', () => {
    const onItemsChange = cy.stub()
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={[]}
        onItemsChange={onItemsChange}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('#add-test-btn').click()
    cy.get('[data-testid="add-edit-form"]').should('exist')
  })

  it('adds new item when save is clicked', () => {
    const collected: TestAsset[] = []
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={[]}
        onItemsChange={items => collected.splice(0, collected.length, ...items)}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('#add-test-btn').click()
    cy.get('[data-testid="add-edit-form"]').within(() => {
      cy.contains('Save').click()
    })

    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].name).to.eq('New Item')
    })
  })

  it('hides add/edit form when cancel is clicked', () => {
    const onItemsChange = cy.stub()
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={[]}
        onItemsChange={onItemsChange}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('#add-test-btn').click()
    cy.get('[data-testid="add-edit-form"]').within(() => {
      cy.contains('Cancel').click()
    })
    cy.get('[data-testid="add-edit-form"]').should('not.exist')
  })

  it('renders existing items', () => {
    const onItemsChange = cy.stub()
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={sampleItems}
        columnsToShow={['name']}
        onItemsChange={onItemsChange}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.contains('First Item').should('exist')
    cy.contains('Second Item').should('exist')
  })

  it('deletes item when delete button is clicked', () => {
    const collected: TestAsset[] = [...sampleItems]
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={collected}
        onItemsChange={items => collected.splice(0, collected.length, ...items)}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('[data-testid="row-item1"]').within(() => {
      cy.get('.glyphicon-trash').click()
    })

    cy.wrap(null).then(() => {
      expect(collected.length).to.eq(1)
      expect(collected[0].id).to.eq('item2')
    })
  })

  it('disables add button when disabled prop is true', () => {
    const onItemsChange = cy.stub()
    mount(
      <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
        items={[]}
        onItemsChange={onItemsChange}
        disabled={true}
        AddEditComponent={TestAddEditComponent}
        RowComponent={TestRowComponent}
        addButtonId="add-test-btn"
        addButtonLabel="Add Test Item"
        getValidationState={getValidationState}
        getAddEditProps={(items, closeAction, onChange) => ({
          items,
          onSave: (item: TestAsset) => {
            onChange([...items, item])
            closeAction()
          },
          onCancel: closeAction,
        })}
        getRowProps={baseProps => baseProps}
      />,
    )
    cy.get('#add-test-btn').should('be.disabled')
  })
})
