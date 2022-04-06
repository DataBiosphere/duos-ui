/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import DatasetsRequestedPanel from "../../../src/components/collection_voting_slab/DatasetsRequestedPanel";

const dataset = (id) => {
  return {
    dataSetId: id,
    datasetIdentifier: `DUOS-${id}`,
    name: `Dataset ${id}`
  };
};

const collectionDatasets = [
  dataset(1),
  dataset(2),
  dataset(3),
  dataset(4),
  dataset(5),
  dataset(6),
  dataset(7),
];


describe('DatasetsRequestedPanel - Tests', function () {
  it('Renders no dataset information if bucketDatasetIds is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if bucketDatasetIds is null', function () {
    mount(
      <DatasetsRequestedPanel
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if dacDatasetIds is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3]}
        dacDatasetIds={[]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if dacDatasetIds is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if collectionDatasets is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3]}
        dacDatasetIds={[1, 2, 3]}
        collectionDatasets={[]}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if collectionDatasets is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3]}
        dacDatasetIds={[1, 2, 3]}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if there is no matches between bucket and DAC dataset ids', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[8, 9, 10]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders less than five datasets without an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[8, 9, 1, 3]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 2);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(2)');

    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 3');

    cy.get('[dataCy=collapse-expand-link]').should('not.exist');
  });

  it('Renders five datasets without an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[8, 1, 2, 3, 4, 5, 9]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 5);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(5)');

    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-2');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 2');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 3');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-4');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 4');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-5');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 5');

    cy.get('[dataCy=collapse-expand-link]').should('not.exist');
  });

  it('Renders more than five datasets with an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 5);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(7)');

    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 1');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-2');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 2');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-3');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 3');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-4');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 4');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-5');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 5');

    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'DUOS-6');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'Dataset 6');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'DUOS-7');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'Dataset 7');

    cy.get('[dataCy=collapse-expand-link]').should('contain.text', '+ View 2 more');
  });

  it('Shows more or less datasets when link is clicked', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 5);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(7)');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'DUOS-6');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'Dataset 6');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'DUOS-7');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'Dataset 7');

    cy.get('[dataCy=collapse-expand-link]').should('contain.text', '+ View 2 more');
    cy.get('[dataCy=collapse-expand-link]').click();

    cy.get('[dataCy=dataset-list]').children().should('have.length', 7);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(7)');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-6');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 6');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-7');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 7');

    cy.get('[dataCy=collapse-expand-link]').should('contain.text', '- View 2 less');
    cy.get('[dataCy=collapse-expand-link]').click();

    cy.get('[dataCy=dataset-list]').children().should('have.length', 5);
    cy.get('[dataCy=collapse-expand-link]').should('contain.text', '+ View 2 more');
  });

  it('Renders filler dataset identifier if attribute is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1]}
        dacDatasetIds={[1]}
        collectionDatasets={[
          {
            dataSetId: 1,
            name: 'Dataset 1'
          }
        ]}
      />
    );
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'DUOS-1');
    cy.get('[dataCy=dataset-list]').should('contain.text', '- -');
    cy.get('[dataCy=dataset-list]').should('contain.text', 'Dataset 1');
  });

  it('Renders filler dataset name if attribute is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1]}
        dacDatasetIds={[1]}
        collectionDatasets={[
          {
            dataSetId: 1,
            datasetIdentifier: 'DUOS-1'
          }
        ]}
      />
    );
    cy.get('[dataCy=dataset-list]').should('contain.text', 'DUOS-1');
    cy.get('[dataCy=dataset-list]').should('not.contain.text', 'Dataset 1');
    cy.get('[dataCy=dataset-list]').should('contain.text', '- -');
  });

  it('Renders skeleton text when loading', function () {
    mount(
      <DatasetsRequestedPanel
        bucketDatasetIds={[1]}
        dacDatasetIds={[1, 2, 3, 4, 5, 6, 7]}
        collectionDatasets={collectionDatasets}
        isLoading={true}
      />
    );

    cy.get('.text-placeholder').should('exist');
    cy.get('[dataCy=dataset-list]').should('not.exist');
  });
});
