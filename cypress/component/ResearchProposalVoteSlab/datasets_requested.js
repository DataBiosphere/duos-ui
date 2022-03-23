/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";

const dacDatasets = [
  dataset(1),
  dataset(2),
  dataset(3),
  dataset(4),
  dataset(5),
  dataset(6),
  dataset(7),
]

const dataset = (id) => {
  return {
    dataSetId: id,
    alias: `DUOS-${id}`,
    properties: [
      {propertyName: "Dataset Name", propertyValue: `Dataset ${id}`}
    ]
  }
}

describe('DatasetsRequestedPanel - Tests', function() {
  it('Renders no dataset information if provided bucket has no datasets', function() {

  });

  it('Renders no dataset information if provided DAC-specific dataset list is empty', function() {

  });

  it('Renders no dataset information if there is no matches between bucket and DAC datasets', function() {

  });

  it('Renders dataset information only for matches between bucket and DAC datasets', function() {

  });

  it('Renders less than five datasets without an expansion link', function() {

  });

  it('Renders five datasets without an expansion link', function() {

  });

  it('Renders more than five datasets with an expansion link', function() {

  });

  it('Shows more datasets when expansion link is clicked', function() {

  });

  it('Renders correct id and name of dataset', function() {

  });
});