/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import DatasetsRequestedPanel from '../../../src/components/collection_voting_slab/DatasetsRequestedPanel';

const dataset = (id) => {
  return {
    dataSetId: id,
    datasetIdentifier: `DUOS-${id}`,
    name: `Dataset ${id}`
  };
};

const bucketDatasets = [
  dataset(1),
  dataset(2),
  dataset(3),
  dataset(4),
  dataset(5),
  dataset(6),
  dataset(7),
];

describe('DatasetsRequestedPanel - Tests', function () {
  it('Renders no dataset information if bucketDatasets is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={[]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 0);
    cy.get('[datacy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if bucketDatasets is null', function () {
    mount(
      <DatasetsRequestedPanel
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 0);
    cy.get('[datacy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if dacDatasetIds is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 0);
    cy.get('[datacy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if dacDatasetIds is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 0);
    cy.get('[datacy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if there are no matches between bucket datasets and DAC dataset ids', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[8, 9, 10]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 0);
    cy.get('[datacy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders less than five datasets without an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 3, 9, 10]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 2);
    cy.get('[datacy=dataset-count]').should('contain.text', '(2)');

    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 3');

    cy.get('[datacy=collapse-expand-link]').should('not.exist');
  });

  it('Renders five datasets without an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 5);
    cy.get('[datacy=dataset-count]').should('contain.text', '(5)');

    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-2');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 2');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 3');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-4');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 4');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-5');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 5');

    cy.get('[datacy=collapse-expand-link]').should('not.exist');
  });

  it('Renders more than five datasets with an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 5);
    cy.get('[datacy=dataset-count]').should('contain.text', '(7)');

    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-2');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 2');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 3');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-4');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 4');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-5');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 5');

    cy.get('[datacy=dataset-list]').should('not.contain.text', 'DUOS-6');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'Dataset 6');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'DUOS-7');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'Dataset 7');

    cy.get('[datacy=collapse-expand-link]').should('contain.text', '+ View 2 more');
  });

  it('Shows more or less datasets when link is clicked', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
      />
    );
    cy.get('[datacy=dataset-list]').children().should('have.length', 5);
    cy.get('[datacy=dataset-count]').should('contain.text', '(7)');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'DUOS-6');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'Dataset 6');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'DUOS-7');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'Dataset 7');

    cy.get('[datacy=collapse-expand-link]').should('contain.text', '+ View 2 more');
    cy.get('[datacy=collapse-expand-link]').click();

    cy.get('[datacy=dataset-list]').children().should('have.length', 7);
    cy.get('[datacy=dataset-count]').should('contain.text', '(7)');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-6');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 6');
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-7');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 7');

    cy.get('[datacy=collapse-expand-link]').should('contain.text', '- View 2 less');
    cy.get('[datacy=collapse-expand-link]').click();

    cy.get('[datacy=dataset-list]').children().should('have.length', 5);
    cy.get('[datacy=collapse-expand-link]').should('contain.text', '+ View 2 more');
  });

  it('Renders filler dataset identifier if attribute is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={[
          {
            dataSetId: 1,
            name: 'Dataset 1'
          }
        ]}
        dacDatasetIds={[1]}
      />
    );
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'DUOS-1');
    cy.get('[datacy=dataset-list]').should('contain.text', '- -');
    cy.get('[datacy=dataset-list]').should('contain.text', 'Dataset 1');
  });

  it('Renders filler dataset name if attribute is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={[
          {
            dataSetId: 1,
            datasetIdentifier: 'DUOS-1'
          }
        ]}
        dacDatasetIds={[1]}
      />
    );
    cy.get('[datacy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[datacy=dataset-list]').should('not.contain.text', 'Dataset 1');
    cy.get('[datacy=dataset-list]').should('contain.text', '- -');
  });

  it('Renders skeleton text when loading', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        isLoading={true}
      />
    );

    cy.get('.text-placeholder').should('exist');
    cy.get('[datacy=dataset-list]').should('not.exist');
  });

  it('shows all datasets if the viewing on the admin page', () => {
    mount(
      <DatasetsRequestedPanel
        bucketDatasets={bucketDatasets}
        dacDatasetIds={[1]}
        isLoading={false}
        adminPage={true}
      />
    );
    cy.get('.dataset-list-item').should('have.length', 5);
    cy.get('[datacy=collapse-expand-link]').contains('View 2 more');
  });
});
