import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
        <input value={item.name} readOnly={viewMode} onChange={() => {}} />
        <button onClick={() => {}}>Close</button>
      </div>
    )}
  </div>
)

const sampleItems: TestAsset[] = [
  { id: 'item1', name: 'First Item' },
  { id: 'item2', name: 'Second Item' },
]

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDefaultRowProps(baseProps: any): TestRowProps {
  return baseProps as TestRowProps
}

interface StatefulWrapperProps {
  initialItems?: TestAsset[]
  onItemsChange?: (items: TestAsset[]) => void
  disabled?: boolean
  columnsToShow?: (keyof TestAsset)[]
  addButtonIcon?: React.ReactNode
}

const StatefulWrapper: React.FC<StatefulWrapperProps> = ({
  initialItems = [],
  onItemsChange,
  disabled,
  columnsToShow,
  addButtonIcon,
}) => {
  const [items, setItems] = useState<TestAsset[]>(initialItems)
  const handleChange = (updated: TestAsset[]) => {
    setItems(updated)
    if (onItemsChange) onItemsChange(updated)
  }
  return (
    <StudyAssetList<TestAsset, never, TestAddEditProps, TestRowProps>
      items={items}
      onItemsChange={handleChange}
      disabled={disabled}
      columnsToShow={columnsToShow}
      AddEditComponent={TestAddEditComponent}
      RowComponent={TestRowComponent}
      addButtonId="add-test-btn"
      addButtonLabel="Add Test Item"
      addButtonIcon={addButtonIcon}
      getValidationState={getValidationState}
      getAddEditProps={getDefaultAddEditProps}
      getRowProps={getDefaultRowProps}
      getItemKey={item => item.id}
    />
  )
}

describe('StudyAssetList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add button', () => {
    render(<StatefulWrapper />)
    expect(screen.getByRole('button', { name: /Add Test Item/i })).toBeInTheDocument()
  })

  it('shows add/edit form when add button is clicked', () => {
    render(<StatefulWrapper />)
    fireEvent.click(screen.getByRole('button', { name: /Add Test Item/i }))
    expect(screen.getByTestId('add-edit-form')).toBeInTheDocument()
  })

  it('adds new item when save is clicked', () => {
    const onItemsChange = vi.fn()
    render(<StatefulWrapper initialItems={[]} onItemsChange={onItemsChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Add Test Item/i }))
    fireEvent.click(screen.getByText('Save'))

    expect(onItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'New Item' })]),
    )
    const calledWith: TestAsset[] = onItemsChange.mock.calls[0][0]
    expect(calledWith.length).toBe(1)
    expect(calledWith[0].name).toBe('New Item')
  })

  it('hides add/edit form when cancel is clicked', () => {
    render(<StatefulWrapper />)
    fireEvent.click(screen.getByRole('button', { name: /Add Test Item/i }))
    expect(screen.getByTestId('add-edit-form')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByTestId('add-edit-form')).not.toBeInTheDocument()
  })

  it('renders existing items', () => {
    render(<StatefulWrapper initialItems={sampleItems} columnsToShow={['name']} />)
    expect(screen.getByText('First Item')).toBeInTheDocument()
    expect(screen.getByText('Second Item')).toBeInTheDocument()
  })

  it('deletes item when delete button is clicked', () => {
    const onItemsChange = vi.fn()
    render(<StatefulWrapper initialItems={[...sampleItems]} onItemsChange={onItemsChange} />)

    const row1 = screen.getByTestId('row-item1')
    fireEvent.click(row1.querySelector('.glyphicon-trash') as Element)

    expect(onItemsChange).toHaveBeenCalled()
    const calledWith: TestAsset[] = onItemsChange.mock.calls[0][0]
    expect(calledWith.length).toBe(1)
    expect(calledWith[0].id).toBe('item2')
  })

  it('disables add button when disabled prop is true', () => {
    render(<StatefulWrapper disabled={true} />)
    expect(screen.getByRole('button', { name: /Add Test Item/i })).toBeDisabled()
  })

  it('renders button with custom icon', () => {
    const customIcon = <span data-testid="custom-icon">★</span>
    render(<StatefulWrapper addButtonIcon={customIcon} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    expect(screen.getByTestId('custom-icon').textContent).toBe('★')
  })

  it('removes default icon when empty string is passed', () => {
    render(<StatefulWrapper addButtonIcon="" />)
    const addBtn = document.getElementById('add-test-btn') as HTMLElement
    expect(addBtn.querySelector('.glyphicon-plus')).not.toBeInTheDocument()
  })
})
