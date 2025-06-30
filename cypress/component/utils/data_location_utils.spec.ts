import {getDataLocationLink} from 'src/utils/DataLocationUtils';
import {mount} from 'cypress/react';

describe('DataLocationUtils', () => {
  describe('getDataLocationLink', () => {
    it('should render Terra Data Repo link when location is TDR Location', () => {
      const dataLocation = 'TDR Location';
      const dataUrl = 'https://data.terra.bio/dataset/12345';

      mount(getDataLocationLink(dataLocation, dataUrl));

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'Terra Data Repo');
    });

    it('should render Terra Workspace link when location is Terra Workspace', () => {
      const dataLocation = 'Terra Workspace';
      const dataUrl = 'https://app.terra.bio/workspace/12345';

      mount(getDataLocationLink(dataLocation, dataUrl));

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'Terra Workspace');
    });

    it('should render text without link when location is Not Determined', () => {
      const dataLocation = 'Not Determined';
      const dataUrl = 'https://example.com/somewhere';

      mount(getDataLocationLink(dataLocation, dataUrl));

      // Should render text without a link
      cy.get('a').should('not.exist');
      cy.contains('Not Determined');
    });

    it('should render External to DUOS link for any other location', () => {
      const dataLocation = 'Other Location';
      const dataUrl = 'https://example.com/other';

      mount(getDataLocationLink(dataLocation, dataUrl));

      cy.get('a')
        .should('have.attr', 'href', dataUrl)
        .should('contain', 'External to DUOS');
    });

    it('should handle undefined dataUrl', () => {
      const dataLocation = 'Terra Workspace';
      // No dataUrl provided

      mount(getDataLocationLink(dataLocation, undefined));

      cy.get('a')
        .should('contain', 'Terra Workspace');
    });
  });
});
