import { getDataLocationLink } from 'src/utils/DataLocationUtils'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'

describe('DataLocationUtils', () => {
  describe('getDataLocationLink', () => {
    it('should render Terra Data Repo link when location is TDR Location', () => {
      const dataLocation = DataLocationType.TDRLocation
      const dataUrl = 'https://data.terra.bio/dataset/12345'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'Terra Data Repo')
    })

    it('should render Terra Workspace link when location is Terra Workspace', () => {
      const dataLocation = DataLocationType.TerraWorkspace
      const dataUrl = 'https://app.terra.bio/workspace/12345'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'Terra Workspace')
    })

    it('should render AnVIL Workspace link when location is AnVIL Workspace', () => {
      const dataLocation = DataLocationType.AnVILWorkspace
      const dataUrl = 'https://anvil.terra.bio/workspaces/test'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'AnVIL Workspace')
    })

    it('should render text without link when location is Not Determined', () => {
      const dataLocation = DataLocationType.NotDetermined
      const dataUrl = 'https://example.com/somewhere'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      // Should render text without a link
      cy.get('a').should('not.exist')
      cy.contains('Not Determined')
    })

    it('should render External to DUOS link when location is Other', () => {
      const dataLocation = DataLocationType.Other
      const dataUrl = 'https://example.com/other'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'External to DUOS')
    })

    it('should handle undefined dataUrl', () => {
      const dataLocation = DataLocationType.TerraWorkspace
      // No dataUrl provided

      cy.mount(getDataLocationLink(dataLocation))

      cy.get('a').should('not.exist')
      cy.contains('Terra Workspace')
    })

    it('should render unsafe dataUrl as inert text', () => {
      const dataLocation = DataLocationType.TerraWorkspace
      const dataUrl = 'javascript:alert(1)'

      cy.mount(getDataLocationLink(dataLocation, dataUrl))

      cy.get('a').should('not.exist')
      cy.contains('Terra Workspace')
    })
  })
})
