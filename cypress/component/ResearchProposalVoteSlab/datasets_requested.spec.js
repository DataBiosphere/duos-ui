/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import DatasetsRequestedPanel from "../../../src/components/collection_voting_slab/DatasetsRequestedPanel";

const dataset = (id) => {
  return {
    dataSetId: id,
    alias: `DUOS-${id}`,
    properties: [
      {propertyName: "Dataset Name", propertyValue: `Dataset ${id}`}
    ]
  };
};

const dacDatasets = [
  dataset(1),
  dataset(2),
  dataset(3),
  dataset(4),
  dataset(5),
  dataset(6),
  dataset(7),
];


describe('DatasetsRequestedPanel - Tests', function () {
  it('Renders no dataset information if provided bucket has no datasets', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{elections: [[]]}}
        dacDatasets={dacDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if no bucket provided', function () {
    mount(
      <DatasetsRequestedPanel
        dacDatasets={dacDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if provided DAC-specific dataset list is empty', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{
          elections: [[
            {dataSetId: 1},
            {dataSetId: 2},
            {dataSetId: 3},
          ]]
        }}
        dacDatasets={[]}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if no DAC datasets are provided', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{
          elections: [[
            {dataSetId: 1},
            {dataSetId: 2},
            {dataSetId: 3},
          ]]
        }}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders no dataset information if there is no matches between bucket and DAC datasets', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{
          elections: [[
            {dataSetId: 8},
            {dataSetId: 9},
            {dataSetId: 10},
          ]]
        }}
        dacDatasets={dacDatasets}
      />
    );
    cy.get('[dataCy=dataset-list]').children().should('have.length', 0);
    cy.get('[dataCy=dataset-count]').should('contain.text', '(0)');
  });

  it('Renders less than five datasets without an expansion link', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{
          elections: [[
            {dataSetId: 8},
            {dataSetId: 9},
            {dataSetId: 1},
            {dataSetId: 3},
          ]]
        }}
        dacDatasets={dacDatasets}
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
        bucket={{
          elections: [[
            {dataSetId: 8},
            {dataSetId: 1},
            {dataSetId: 2},
            {dataSetId: 3},
            {dataSetId: 4},
            {dataSetId: 5},
            {dataSetId: 9},
          ]]
        }}
        dacDatasets={dacDatasets}
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
        bucket={{
          elections: [[
            {dataSetId: 1},
            {dataSetId: 2},
            {dataSetId: 3},
            {dataSetId: 4},
            {dataSetId: 5},
            {dataSetId: 6},
            {dataSetId: 7},
          ]]
        }}
        dacDatasets={dacDatasets}
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
        bucket={{
          elections: [[
            {dataSetId: 1},
            {dataSetId: 2},
            {dataSetId: 3},
            {dataSetId: 4},
            {dataSetId: 5},
            {dataSetId: 6},
            {dataSetId: 7},
          ]]
        }}
        dacDatasets={dacDatasets}
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

  it('Renders filler dataset id if attribute is null', function () {
    mount(
      <DatasetsRequestedPanel
        bucket={{
          elections: [[
            {dataSetId: 1}
          ]]
        }}
        dacDatasets={[
          {
            dataSetId: 1,
            properties: [
              {propertyName: "Dataset Name", propertyValue: `Dataset 1`}
            ]
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
        bucket={{
          elections: [[
            {dataSetId: 1}
          ]]
        }}
        dacDatasets={[
          {
            dataSetId: 1,
            alias: 'DUOS-1'
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
        bucket={{
          elections: [[
            {dataSetId: 1}
          ]]
        }}
        dacDatasets={dacDatasets}
        isLoading={true}
      />
    );

    cy.get('.text-placeholder').should('exist');
    cy.get('[dataCy=dataset-list]').should('not.exist');
  });
});