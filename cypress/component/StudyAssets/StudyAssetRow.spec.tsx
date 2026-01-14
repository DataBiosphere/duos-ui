import React from 'react'
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
    editAction: cy.stub(),
    deleteAction: cy.stub(),
    closeAction: cy.stub(),
    viewAction: cy.stub(),
    onAssetsChange: cy.stub(),
    disabled: false,
    AddEditComponent: TestAddEditComponent,
    SummaryComponent: TestSummaryComponent,
    addEditProps: {
      asset: sampleAsset,
      onSave: cy.stub(),
      onCancel: cy.stub(),
    },
    summaryProps: {
      asset: sampleAsset,
    },
  })

  it('renders summary component when not in edit or view mode', () => {
    const props = createDefaultProps()
    cy.mount(<StudyAssetRow {...props} />)
    cy.get('[data-testid="summary-component"]').should('exist')
    cy.contains('Test Asset').should('exist')
    cy.get('[data-testid="add-edit-component"]').should('not.exist')
  })

  it('renders add/edit component when in edit mode', () => {
    const props = createDefaultProps()
    cy.mount(<StudyAssetRow {...props} editMode={true} />)
    cy.get('[data-testid="add-edit-component"]').should('exist')
    cy.get('#assetName').should('have.value', 'Test Asset')
    cy.get('[data-testid="summary-component"]').should('not.exist')
  })

  it('renders add/edit component in read-only mode when in view mode', () => {
    const props = createDefaultProps()
    cy.mount(<StudyAssetRow {...props} viewMode={true} />)
    cy.get('[data-testid="add-edit-component"]').should('exist')
    cy.get('#assetName').should('be.disabled')
    cy.contains('Save').should('be.disabled')
    cy.get('[data-testid="summary-component"]').should('not.exist')
  })

  it('does not render add/edit component as read-only when in edit mode', () => {
    const props = createDefaultProps()
    cy.mount(<StudyAssetRow {...props} editMode={true} />)
    cy.get('#assetName').should('not.be.disabled')
    cy.contains('Save').should('not.be.disabled')
  })
})
