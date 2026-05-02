import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'
import React from 'react'

interface HookTestComponentProps {
  consoleType: string
}

const HookTestComponent = ({ consoleType }: HookTestComponentProps) => {
  const columns = useResponsiveDarCollectionColumns(consoleType)

  return (
    <div>
      <div data-testid="column-count">{columns.length}</div>
      <div data-testid="columns">{columns.join(',')}</div>
    </div>
  )
}

describe('useResponsiveDarCollectionColumns', () => {
  it('returns admin columns including DAC on wide viewports', () => {
    cy.viewport(1600, 900)
    cy.mount(<HookTestComponent consoleType={consoleTypes.ADMIN} />)

    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.DAC)
    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.DATASET_COUNT)
    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.EXPIRES_AT)
  })

  it('returns researcher columns without DAC and respects narrow viewport defaults', () => {
    cy.viewport(900, 900)
    cy.mount(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

    cy.get('[data-testid="columns"]').should('not.contain', DarCollectionTableColumnOptions.DAC)
    cy.get('[data-testid="columns"]').should('not.contain', DarCollectionTableColumnOptions.DATASET_COUNT)
    cy.get('[data-testid="columns"]').should('not.contain', DarCollectionTableColumnOptions.EXPIRES_AT)
  })

  it('updates returned columns when crossing researcher breakpoints on resize', () => {
    cy.viewport(1600, 900)
    cy.mount(<HookTestComponent consoleType={consoleTypes.RESEARCHER} />)

    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.DATASET_COUNT)
    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.EXPIRES_AT)

    cy.viewport(1100, 900)
    cy.get('[data-testid="columns"]').should('not.contain', DarCollectionTableColumnOptions.DATASET_COUNT)
    cy.get('[data-testid="columns"]').should('contain', DarCollectionTableColumnOptions.EXPIRES_AT)

    cy.viewport(900, 900)
    cy.get('[data-testid="columns"]').should('not.contain', DarCollectionTableColumnOptions.EXPIRES_AT)
  })
})
