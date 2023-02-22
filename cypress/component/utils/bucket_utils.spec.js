/* eslint-disable no-undef */

import {binCollectionToBuckets} from '../../../src/utils/BucketUtils';

describe('BucketUtils', () => {
  it('instantiates', () => {
    cy.fixture('sample_collection.json').then((collection) => {
      binCollectionToBuckets(collection);
    });
  });
});
