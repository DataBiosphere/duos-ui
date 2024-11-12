/* eslint-disable no-undef */

import {mount} from 'cypress/react';
import React from 'react';
import {Storage} from '../../../src/libs/storage';
import UserProfile from '../../../src/pages/user_profile/UserProfile';

const duosUser = {
    isSigningOfficial: false,
};

describe('User Profile', () => {
  it('Renders the user profile page', () => {
    cy.stub(Storage, 'getCurrentUser').returns(duosUser);
    mount(<UserProfile/>);
    cy.get('h2').should('contain', 'Your Profile');
  });
});
