/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import DataAccessRequestApplication from '../../../src/pages/dar_application/DataAccessRequestApplication.js';
import { MemoryRouter } from 'react-router-dom';
import { User, DataSet, DAR } from '../../../src/libs/ajax';
import { Storage } from '../../../src/libs/storage.js';
import { Navigation } from '../../../src/libs/utils.js';
import { NotificationService } from '../../../src/libs/notificationService';

const props = {
  match: {
    params: {},
  },
};

const user = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCards: [{}],
  researcherProperties: [
    {
      propertyId: 10350,
      userId: 5,
      propertyKey: 'eraAuthorized',
      propertyValue: 'true'
    },
    {
      propertyId: 10351,
      userId: 5,
      propertyKey: 'eraExpiration',
      propertyValue: '999980741397751'
    },
  ],
};

const userNoLibraryCard = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCards: [],
  researcherProperties: [
    {
      propertyId: 10350,
      userId: 5,
      propertyKey: 'eraAuthorized',
      propertyValue: 'true'
    },
    {
      propertyId: 10351,
      userId: 5,
      propertyKey: 'eraExpiration',
      propertyValue: '999980741397751'
    },
  ],
};


const datasets = [
  {
    dataSetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    name: 'Some Dataset',
    dataUse: {

    },
  }
];

const userSigningOfficials = [
  {
    userId: 6,
    displayName: 'SO 1',
    email: 'so1@gmail.com'
  },
  {
    userId: 7,
    displayName: 'SO 2',
    email: 'so2@gmail.com'
  }
];


describe('Data Access Request - Validation', () => {

  describe('With Library Cards', () => {
    beforeEach(() => {
      cy.stub(User, 'getSOsForCurrentUser').returns(userSigningOfficials);
      cy.stub(DataSet, 'searchDatasets').returns(Promise.resolve(datasets));
      cy.stub(DataSet, 'getDatasetsByIds').returns(Promise.resolve(datasets));
      cy.stub(Storage, 'getCurrentUser').returns(user);
      cy.stub(User, 'getMe').returns(user);
      cy.stub(Navigation, 'console').returns({});
      cy.stub(DAR, 'postDar').returns({});
      cy.stub(DAR, 'updateDarDraft').returns({ referenceId: 'asdf' });
      cy.stub(DAR, 'uploadDARDocument').returns({ referenceId: 'asdf' });
      cy.stub(DAR, 'postDarDraft').returns({ referenceId: 'asdf' });
      cy.stub(NotificationService, 'getBannerObjectById').returns(Promise.resolve({}));
      mount(
        <MemoryRouter initialEntries={['/']}>
          <DataAccessRequestApplication {...props} />
        </MemoryRouter>
      );
    });
  
    it('Submits given valid DAR', () => {
      cy.get('#piName').type('Some PI');
      cy.get('#signingOfficial').type('SO 2{enter}');
      cy.get('#itDirector').type('Some IT Director');
      cy.get('#anvilUse_yes').click();
  
      cy.get('#datasetIds').type('asdf{enter}');
  
      cy.get('#projectTitle').type('Title');
      cy.get('#rus').type('asdf');
      cy.get('#nonTechRus').type('asdf asdf');
  
      cy.get('#diseases_no').click();
      cy.get('#hmb_yes').click();
  
      cy.get('#controls_no').click();
      cy.get('#population_no').click();
      cy.get('#oneGender_no').click();
      cy.get('#forProfit_no').click();
      cy.get('#pediatric_no').click();
      cy.get('#vulnerablePopulation_no').click();
      cy.get('#illegalBehavior_no').click();
      cy.get('#sexualDiseases_no').click();
      cy.get('#psychiatricTraits_no').click();
      cy.get('#notHealth_no').click();
      cy.get('#stigmatizedDiseases_no').click();
  
      cy.get('#btn_attest').click();
      cy.get('#btn_openSubmitModal').click();
      cy.get('#btn_submit').click().then(() => {
        expect(DAR.postDar).to.have.been.calledOnce;
      });
  
    });
  
    it('Required fields should not be errored when you open page', () => {
      cy.get('#piName').should('not.have.class', 'errored');
      cy.get('#signingOfficial').should('not.have.class', 'errored');
      cy.get('#itDirector').should('not.have.class', 'errored');
      cy.get('#anvilUse').should('not.have.class', 'errored');
  
      cy.get('#datasetIds').should('not.have.class', 'errored');
  
      cy.get('#projectTitle').should('not.have.class', 'errored');
      cy.get('#rus').should('not.have.class', 'errored');
      cy.get('#nonTechRus').should('not.have.class', 'errored');
  
      cy.get('#diseases').should('not.have.class', 'errored');
  
      cy.get('#controls').should('not.have.class', 'errored');
      cy.get('#population').should('not.have.class', 'errored');
      cy.get('#oneGender').should('not.have.class', 'errored');
      cy.get('#forProfit').should('not.have.class', 'errored');
      cy.get('#pediatric').should('not.have.class', 'errored');
      cy.get('#vulnerablePopulation').should('not.have.class', 'errored');
      cy.get('#illegalBehavior').should('not.have.class', 'errored');
      cy.get('#sexualDiseases').should('not.have.class', 'errored');
      cy.get('#psychiatricTraits').should('not.have.class', 'errored');
      cy.get('#notHealth').should('not.have.class', 'errored');
      cy.get('#stigmatizedDiseases').should('not.have.class', 'errored');
    });
  
    it('Required fields get errors on submit', () => {
      cy.get('#btn_attest').click();
  
      cy.get('#piName').should('have.class', 'errored');
      cy.get('#signingOfficial').should('have.class', 'errored');
      cy.get('#itDirector').should('have.class', 'errored');
      cy.get('#anvilUse').should('have.class', 'errored');
  
      cy.get('#datasetIds').should('have.class', 'errored');
  
      cy.get('#projectTitle').should('have.class', 'errored');
      cy.get('#rus').should('have.class', 'errored');
      cy.get('#nonTechRus').should('have.class', 'errored');
  
      cy.get('#diseases').should('have.class', 'errored');
  
      cy.get('#controls').should('have.class', 'errored');
      cy.get('#population').should('have.class', 'errored');
      cy.get('#oneGender').should('have.class', 'errored');
      cy.get('#forProfit').should('have.class', 'errored');
      cy.get('#pediatric').should('have.class', 'errored');
      cy.get('#vulnerablePopulation').should('have.class', 'errored');
      cy.get('#illegalBehavior').should('have.class', 'errored');
      cy.get('#sexualDiseases').should('have.class', 'errored');
      cy.get('#psychiatricTraits').should('have.class', 'errored');
      cy.get('#notHealth').should('have.class', 'errored');
      cy.get('#stigmatizedDiseases').should('have.class', 'errored');
    });
  
    it('Internal / external / lab collaborators error properly', () => {
      cy.get('#add-labCollaborators-btn').click();
  
      // should not be errored when open
      cy.get('#0_collaboratorName').should('not.have.class', 'errored');
      cy.get('#0_collaboratorEraCommonsId').should('not.have.class', 'errored');
      cy.get('#0_collaboratorTitle').should('not.have.class', 'errored');
      cy.get('#0_collaboratorEmail').should('not.have.class', 'errored');
      cy.get('#0_collaboratorApproval').should('not.have.class', 'errored');
  
      cy.get('#collaborator-labCollaborators-add-save').click();
  
      // if clicked and nothing filled out, required field should error
      cy.get('#0_collaboratorName').should('have.class', 'errored');
      cy.get('#0_collaboratorEraCommonsId').should('have.class', 'errored');
      cy.get('#0_collaboratorTitle').should('have.class', 'errored');
      cy.get('#0_collaboratorEmail').should('have.class', 'errored');
      cy.get('#0_collaboratorApproval').should('have.class', 'errored');
  
      // fill out fields
      cy.get('#0_collaboratorName').type('asdf');
      cy.get('#0_collaboratorEraCommonsId').type('asdgasdg');
      cy.get('#0_collaboratorTitle').type('asdgasdgasdgas');
      cy.get('#0_collaboratorEmail').type('asdgasdgasdgasdga'); // not a valid email
      cy.get('#0_collaboratorApproval_no').click();
  
      // should remove errors, except for email
      cy.get('#0_collaboratorName').should('not.have.class', 'errored');
      cy.get('#0_collaboratorEraCommonsId').should('not.have.class', 'errored');
      cy.get('#0_collaboratorTitle').should('not.have.class', 'errored');
      cy.get('#0_collaboratorApproval').should('not.have.class', 'errored');
      cy.get('#0_collaboratorEmail').should('have.class', 'errored');
  
      // shouldn't submit since invalid email format
      cy.get('#collaborator-labCollaborators-add-save').click();
  
      // fix email
      cy.get('#0_collaboratorEmail').type('@gmail.com');
      cy.get('#0_collaboratorEmail').should('not.have.class', 'errored');
  
      // should save fine
      cy.get('#0_summary').should('not.exist');
      cy.get('#collaborator-labCollaborators-add-save').click();
      cy.get('#0_summary').should('exist');
  
    });
  });

  describe('Without Library Cards', () => {
    beforeEach(() => {
      cy.stub(User, 'getSOsForCurrentUser').returns(userSigningOfficials);
      cy.stub(DataSet, 'searchDatasets').returns(Promise.resolve(datasets));
      cy.stub(DataSet, 'getDatasetsByIds').returns(Promise.resolve(datasets));
      cy.stub(Storage, 'getCurrentUser').returns(userNoLibraryCard);
      cy.stub(User, 'getMe').returns(userNoLibraryCard);
      cy.stub(Navigation, 'console').returns({});
      cy.stub(DAR, 'postDar').returns({});
      cy.stub(DAR, 'updateDarDraft').returns({ referenceId: 'asdf' });
      cy.stub(DAR, 'uploadDARDocument').returns({ referenceId: 'asdf' });
      cy.stub(DAR, 'postDarDraft').returns({ referenceId: 'asdf' });
      cy.stub(NotificationService, 'getBannerObjectById').returns(Promise.resolve({}));
  
      mount(
        <MemoryRouter initialEntries={['/']}>
          <DataAccessRequestApplication {...props} />
        </MemoryRouter>
      );
    });

    it('Cannot submit without library card', () => {
      cy.get('#piName').type('Some PI');
      cy.get('#signingOfficial').type('SO 2{enter}');
      cy.get('#itDirector').type('Some IT Director');
      cy.get('#anvilUse_yes').click();
  
      cy.get('#datasetIds').type('asdf{enter}');
  
      cy.get('#projectTitle').type('Title');
      cy.get('#rus').type('asdf');
      cy.get('#nonTechRus').type('asdf asdf');
  
      cy.get('#diseases_no').click();
      cy.get('#hmb_yes').click();
  
      cy.get('#controls_no').click();
      cy.get('#population_no').click();
      cy.get('#oneGender_no').click();
      cy.get('#forProfit_no').click();
      cy.get('#pediatric_no').click();
      cy.get('#vulnerablePopulation_no').click();
      cy.get('#illegalBehavior_no').click();
      cy.get('#sexualDiseases_no').click();
      cy.get('#psychiatricTraits_no').click();
      cy.get('#notHealth_no').click();
      cy.get('#stigmatizedDiseases_no').click();
  
      cy.get('#btn_attest').click();


      cy.get('#btn_openSubmitModal').should('not.exist');

  
    });
  });
});

