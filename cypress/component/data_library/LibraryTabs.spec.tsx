import React from 'react'
import { LibraryTabs } from 'src/components/data_library/LibraryTabs'
import { AssetType } from 'src/types/library'

describe('LibraryTabs', () => {
  const tabs = [
    { key: AssetType.STUDIES, label: 'Studies' },
    { key: AssetType.DATASETS, label: 'Datasets' },
  ]

  it('renders all tabs', () => {
    cy.mount(
      <LibraryTabs
        value={AssetType.STUDIES}
        onChange={() => {}}
        tabs={tabs}
      />,
    )
    cy.contains('Studies').should('be.visible')
    cy.contains('Datasets').should('be.visible')
  })

  it('highlights the active tab', () => {
    // Note: Mui Tab uses 'font-weight: 700' for bold and '400' for normal
    cy.mount(
      <LibraryTabs
        value={AssetType.DATASETS}
        onChange={() => {}}
        tabs={tabs}
      />,
    )
    cy.contains('Datasets').should('have.css', 'font-weight', '700')
    cy.contains('Studies').should('have.css', 'font-weight', '400')
  })

  it('calls onChange when a tab is clicked', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(
      <LibraryTabs
        value={AssetType.STUDIES}
        onChange={onChange}
        tabs={tabs}
      />,
    )

    cy.contains('Datasets').click()
    cy.get('@onChange').should('have.been.calledWith', AssetType.DATASETS)
  })

  it('shows scroll buttons when tabs overflow the container width', () => {
    cy.viewport(300, 600)

    const manyTabs = Object.values(AssetType).map(type => ({ key: type, label: type }))

    cy.mount(
      <LibraryTabs
        value={AssetType.STUDIES}
        onChange={() => {}}
        tabs={manyTabs}
      />,
    )

    cy.get('.MuiTabs-scrollButtons').should('be.visible')
  })
})
