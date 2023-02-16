/* eslint-disable no-undef */

import {processCollection} from '../../../src/utils/BucketUtils';

describe('BucketUtils', () => {
  it('instantiates', () => {
    cy.fixture('sample_collection.json').then((collection) => {
      processCollection(collection);
    });
  });
});
