import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StudyAssetRow, { StudyAssetRowProps } from 'src/components/study_asset/StudyAssetRow'

interface TestAsset {
  id: string
  name: string
  value: number
}

interface TestAddEditProps {
  asset: TestAsset
  onSave: (asset: TestAsset) => void
  onCancel: () => void
  readOnly?: boolean
}

interface TestSummaryProps {
  asset: TestAsset
}

const TestAddEditComponent: React.FC<TestAddEditProps> = ({ asset, onSave, onCancel, readOnly }) => (
  <div data-testid="add-edit-component">
    <input id="assetName" defaultValue={asset.name} disabled={readOnly} />
    <button onClick={() => onSave(asset)} disabled={readOnly}>Save</button>
    <button onClick={onCancel}>Cancel</button>
  </div>
)

const TestSummaryComponent: React.FC<TestSummaryProps> = ({ asset }) => (
  <div data-testid="summary-component">
    <span>{asset.name}</span>
  </div>
)

const sampleAsset: TestAsset = {
  id: 'asset1',
  name: 'Test Asset',
  value: 100,
}

describe('StudyAssetRow', () => {
  const createDefaultProps = (): StudyAssetRowProps<TestAsset, TestAddEditProps, TestSummaryProps> => ({
    id: 1,
    editMode: false,
    viewMode: false,
    asset: sampleAsset,
    assets: [sampleAsset],
    columnsToShow: ['name', 'value'],
    editAction: vi.fn(),
    deleteAction: vi.fn(),
    closeAction: vi.fn(),
    viewAction: vi.fn(),
    onAssetsChange: vi.fn(),
    disabled: false,
    AddEditComponent: TestAddEditComponent,
    SummaryComponent: TestSummaryComponent,
    addEditProps: {
      asset: sampleAsset,
      onSave: vi.fn(),
      onCancel: vi.fn(),
    },
    summaryProps: {
      asset: sampleAsset,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders summary component when not in edit or view mode', () => {
    const props = createDefaultProps()
    render(<StudyAssetRow {...props} />)
    expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    expect(screen.getByText('Test Asset')).toBeInTheDocument()
    expect(screen.queryByTestId('add-edit-component')).not.toBeInTheDocument()
  })

  it('renders add/edit component when in edit mode', () => {
    const props = createDefaultProps()
    render(<StudyAssetRow {...props} editMode={true} />)
    expect(screen.getByTestId('add-edit-component')).toBeInTheDocument()
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Test Asset')
    expect(screen.queryByTestId('summary-component')).not.toBeInTheDocument()
  })

  it('renders add/edit component in read-only mode when in view mode', () => {
    const props = createDefaultProps()
    render(<StudyAssetRow {...props} viewMode={true} />)
    expect(screen.getByTestId('add-edit-component')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.queryByTestId('summary-component')).not.toBeInTheDocument()
  })

  it('does not render add/edit component as read-only when in edit mode', () => {
    const props = createDefaultProps()
    render(<StudyAssetRow {...props} editMode={true} />)
    expect(screen.getByRole('textbox')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })
})
