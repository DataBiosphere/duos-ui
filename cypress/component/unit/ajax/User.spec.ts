import {
  CreateDuosUserResponse,
  DuosUserResponse,
  UpdateDuosUserResponse,
} from '../../../../src/types/responseTypes';
import {
  CreateDuosUserRequest,
  UpdateDuosUserRequestV1,
  UpdateDuosUserRequestV2,
} from '../../../../src/types/requestTypes';
import { User } from '../../../../src/libs/ajax/User';
import { getApiUrl } from '../../../../src/libs/ajax';
import {
  AcknowledgementMap,
  ApprovedDataset,
  Dataset,
} from '../../../../src/types/model';

const testUser1: Partial<DuosUserResponse> = {
  displayName: 'testUser1',
  userId: 22,
  roles: [
    {
      roleId: 0,
      name: 'Admin',
      userId: 22,
      userRoleId: 0,
    },
  ],
  createDate: new Date(),
  libraryCards: [],
};

const testUser2: Partial<DuosUserResponse> = {
  displayName: 'testUser2',
  userId: 33,
};

const acknowledgements = {
  testAck1: 'testAck1',
  testAck2: 'testAck2',
};

const acknowldgementMap: AcknowledgementMap = {
  key1: {
    userId: testUser1.userId,
    ackKey: acknowledgements.testAck1,
    firstAcknowledged: 1,
    lastAcknowledged: 1000,
  },
};

const dataset1: Partial<Dataset> = {
  datasetName: 'testDataset1',
  dataSetId: 1,
};

const dataset2: Partial<Dataset> = {
  datasetName: 'testDataset2',
  dataSetId: 2,
};

const approvedDataSet1: Partial<ApprovedDataset> = {
  datasetId: 5,
  datasetName: 'testDataset1',
};

const approvedDataSet2: Partial<ApprovedDataset> = {
  datasetId: 10,
  datasetName: 'testDataset2',
};

describe('User', () => {
  describe('getMe', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/me', testUser1).as('getMe');
    });
    it('uses an auth token in the request header', () => {
      User.getMe();
      cy.wait('@getMe').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getMe();
      cy.wait('@getMe').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/me`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.getMe();
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/me', { statusCode: 404 }).as('getMe');
        try {
          await User.getMe();
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/*', testUser1).as('getById');
    });
    it('uses an auth token in the request header', () => {
      User.getById(testUser1.userId);
      cy.wait('@getById').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getById(testUser1.userId);
      cy.wait('@getById').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/${testUser1.userId}`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.getById(
          testUser1.userId
        );
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/*', { statusCode: 404 }).as('getById');
        try {
          await User.getById(testUser1.userId);
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('list', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/role/*', [testUser1, testUser2]).as('list');
    });
    it('uses an auth token in the request header', () => {
      User.list('Admin');
      cy.wait('@list').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.list('Admin');
      cy.wait('@list').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/role/Admin`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUsers: DuosUserResponse[] = await User.list('Admin');
        expect(returnedUsers.length).to.eq(2);
        expect(returnedUsers[0].displayName).to.eq(testUser1.displayName);
        expect(returnedUsers[0].userId).to.eq(testUser1.userId);
        expect(returnedUsers[1].displayName).to.eq(testUser2.displayName);
        expect(returnedUsers[1].userId).to.eq(testUser2.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/role/*', { statusCode: 404 }).as('list');
        try {
          await User.list('Admin');
        } catch (err) {
          assert(true);
        }
      });
    });
  });

  //TODO
  describe('create', () => {
    beforeEach(() => {
      cy.intercept('POST', 'api/dacuser', testUser1).as('create');
    });

    const createRequest: CreateDuosUserRequest = {
      displayName: testUser1.displayName,
      email: 'test@email.com',
      emailPreference: true,
      roles: [],
    };

    it('uses an auth token in the request header', () => {
      User.create(createRequest);
      cy.wait('@create').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.create(createRequest);
      cy.wait('@create').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/dacuser`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.create(createRequest);
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('should return false', async () => {
        cy.intercept('POST', 'api/dacuser', { statusCode: 404 }).as('create');
        const result: CreateDuosUserResponse = await User.create(createRequest);
        expect(result).to.eq(false);
      });
    });
  });

  describe('updateSelf', () => {
    beforeEach(() => {
      cy.intercept('PUT', 'api/user', testUser1).as('updateSelf');
    });

    const updateRequest: UpdateDuosUserRequestV1 = { ...testUser1 };

    it('uses an auth token in the request header', () => {
      User.updateSelf(updateRequest);
      cy.wait('@updateSelf').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.updateSelf(updateRequest);
      cy.wait('@updateSelf').then(async (interception) => {
        expect(interception.request.url).to.eq(`${await getApiUrl()}/api/user`);
      });
    });

    it('sends the updated user in the request body', () => {
      User.updateSelf(updateRequest);
      cy.wait('@updateSelf').then((interception) => {
        expect(interception.request.body.userId).to.eq(testUser1.userId);
        expect(interception.request.body.displayName).to.eq(
          testUser1.displayName
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.updateSelf(
          updateRequest
        );
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('should return false', async () => {
        cy.intercept('PUT', 'api/user', { statusCode: 404 }).as('updateSelf');
        const result: UpdateDuosUserResponse = await User.updateSelf(
          updateRequest
        );
        expect(result).to.eq(false);
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      cy.intercept('PUT', 'api/user/*', testUser1).as('update');
    });

    const updateRequest: UpdateDuosUserRequestV2 = { ...testUser1 };

    it('uses an auth token in the request header', () => {
      User.update(updateRequest, testUser1.userId);
      cy.wait('@update').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.update(updateRequest, testUser1.userId);
      cy.wait('@update').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/${testUser1.userId}`
        );
      });
    });

    it('sends the updated user in the request body', () => {
      User.update(updateRequest, testUser1.userId);
      cy.wait('@update').then((interception) => {
        expect(interception.request.body.userId).to.eq(testUser1.userId);
        expect(interception.request.body.displayName).to.eq(
          testUser1.displayName
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.update(
          updateRequest,
          testUser1.userId
        );
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('should return false', async () => {
        cy.intercept('PUT', 'api/user/*', { statusCode: 404 }).as('update');
        const result: UpdateDuosUserResponse = await User.update(
          updateRequest,
          testUser1.userId
        );
        expect(result).to.eq(false);
      });
    });
  });

  describe('registerUser', () => {
    beforeEach(() => {
      cy.intercept('POST', 'api/user', testUser1).as('registerUser');
    });
    it('uses an auth token in the request header', () => {
      User.registerUser();
      cy.wait('@registerUser').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.registerUser();
      cy.wait('@registerUser').then(async (interception) => {
        expect(interception.request.url).to.eq(`${await getApiUrl()}/api/user`);
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.registerUser();
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
        expect(returnedUser.userId).to.eq(testUser1.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('POST', 'api/user', { statusCode: 404 }).as(
          'registerUser'
        );
        try {
          await User.registerUser();
        } catch (err) {
          assert(true);
        }
      });
    });
  });

  describe('getSOsForCurrentUser', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/signing-officials', [
        testUser1,
        testUser2,
      ]).as('getSOsForCurrentUser');
    });
    it('uses an auth token in the request header', () => {
      User.getSOsForCurrentUser();
      cy.wait('@getSOsForCurrentUser').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getSOsForCurrentUser();
      cy.wait('@getSOsForCurrentUser').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/signing-officials`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUsers: DuosUserResponse[] =
          await User.getSOsForCurrentUser();
        expect(returnedUsers.length).to.eq(2);
        expect(returnedUsers[0].displayName).to.eq(testUser1.displayName);
        expect(returnedUsers[0].userId).to.eq(testUser1.userId);
        expect(returnedUsers[1].displayName).to.eq(testUser2.displayName);
        expect(returnedUsers[1].userId).to.eq(testUser2.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/signing-officials', {
          statusCode: 404,
        }).as('getSOsForCurrentUser');
        try {
          await User.getSOsForCurrentUser();
        } catch (err) {
          assert(true);
        }
      });
    });
  });

  describe('getUnassignedUsers', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/institution/unassigned', [
        testUser1,
        testUser2,
      ]).as('getUnassignedUsers');
    });
    it('uses an auth token in the request header', () => {
      User.getUnassignedUsers();
      cy.wait('@getUnassignedUsers').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getUnassignedUsers();
      cy.wait('@getUnassignedUsers').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/institution/unassigned`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUsers: DuosUserResponse[] =
          await User.getUnassignedUsers();
        expect(returnedUsers.length).to.eq(2);
        expect(returnedUsers[0].displayName).to.eq(testUser1.displayName);
        expect(returnedUsers[0].userId).to.eq(testUser1.userId);
        expect(returnedUsers[1].displayName).to.eq(testUser2.displayName);
        expect(returnedUsers[1].userId).to.eq(testUser2.userId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/institution/unassigned', {
          statusCode: 404,
        }).as('getUnassignedUsers');
        try {
          await User.getUnassignedUsers();
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('addRoleToUser', () => {
    const newRoleId = 5;
    beforeEach(() => {
      cy.intercept('PUT', 'api/user/**', testUser1).as('addRoleToUser');
    });
    it('uses an auth token in the request header', () => {
      User.addRoleToUser(testUser1.userId, newRoleId);
      cy.wait('@addRoleToUser').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.addRoleToUser(testUser1.userId, newRoleId);
      cy.wait('@addRoleToUser').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/${testUser1.userId}/${newRoleId}`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.addRoleToUser(
          testUser1.userId,
          newRoleId
        );
        expect(returnedUser.userId).to.eq(testUser1.userId);
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('PUT', 'api/user/**', { statusCode: 404 }).as(
          'addRoleToUser'
        );
        try {
          await User.addRoleToUser(testUser1.userId, newRoleId);
        } catch (err) {
          assert(true);
        }
      });
    });
  });

  describe('deleteRoleFromUser', () => {
    beforeEach(() => {
      cy.intercept('DELETE', 'api/user/**', testUser1).as('deleteRoleFromUser');
    });

    const roleIdToDelete = testUser1.roles[0].roleId;
    it('uses an auth token in the request header', () => {
      User.deleteRoleFromUser(testUser1.userId, roleIdToDelete);
      cy.wait('@deleteRoleFromUser').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.deleteRoleFromUser(testUser1.userId, roleIdToDelete);
      cy.wait('@deleteRoleFromUser').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/${testUser1.userId}/${roleIdToDelete}`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedUser: DuosUserResponse = await User.deleteRoleFromUser(
          testUser1.userId,
          roleIdToDelete
        );
        expect(returnedUser.userId).to.eq(testUser1.userId);
        expect(returnedUser.displayName).to.eq(testUser1.displayName);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('DELETE', 'api/user/role/**', { statusCode: 404 }).as(
          'deleteRoleFromUser'
        );
        try {
          await User.deleteRoleFromUser(testUser1.userId, roleIdToDelete);
        } catch (err) {
          assert(true);
        }
      });
    });
  });

  describe('getUserRelevantDatasets', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/me/dac/datasets', [dataset1, dataset2]).as(
        'getUserRelevantDatasets'
      );
    });
    it('uses an auth token in the request header', () => {
      User.getUserRelevantDatasets();
      cy.wait('@getUserRelevantDatasets').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getUserRelevantDatasets();
      cy.wait('@getUserRelevantDatasets').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/me/dac/datasets`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedDatasets: Dataset[] =
          await User.getUserRelevantDatasets();
        expect(returnedDatasets.length).to.eq(2);
        expect(returnedDatasets[0].datasetName).to.eq(dataset1.datasetName);
        expect(returnedDatasets[0].dataSetId).to.eq(dataset1.dataSetId);
        expect(returnedDatasets[1].datasetName).to.eq(dataset2.datasetName);
        expect(returnedDatasets[1].dataSetId).to.eq(dataset2.dataSetId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/me/dac/datasets', { statusCode: 404 }).as(
          'getUserRelevantDatasets'
        );
        try {
          await User.getUserRelevantDatasets();
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('getAcknowledgements', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/acknowledgements', acknowldgementMap).as(
        'getAcknowledgements'
      );
    });
    it('uses an auth token in the request header', () => {
      User.getAcknowledgements();
      cy.wait('@getAcknowledgements').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getAcknowledgements();
      cy.wait('@getAcknowledgements').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/acknowledgements`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const response: AcknowledgementMap = await User.getAcknowledgements();
        assert(response.hasOwnProperty('key1'));
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/acknowledgements', {
          statusCode: 404,
        }).as('getAcknowledgements');
        try {
          await User.getAcknowledgements();
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('acceptAcknowledgments', () => {
    beforeEach(() => {
      cy.intercept('POST', 'api/user/acknowledgements', acknowldgementMap).as(
        'acceptAcknowledgments'
      );
    });

    describe('is called with no keys', () => {
      it('should not make a request and send back an empty object', async () => {
        cy.intercept('POST', 'api/user/acknowledgements', {
          statusCode: 500,
        }).as('acceptAcknowledgments');
        try {
          const res: AcknowledgementMap = await User.acceptAcknowledgments();
          assert(true, 'No outgoing request was made');
          expect(Object.keys(res).length).to.eq(0);
        } catch (err) {
          assert(false, 'Outgoing request was made');
        }
      });
    });

    it('uses an auth token in the request header', () => {
      User.acceptAcknowledgments(
        acknowledgements.testAck1,
        acknowledgements.testAck2
      );
      cy.wait('@acceptAcknowledgments').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.acceptAcknowledgments(
        acknowledgements.testAck1,
        acknowledgements.testAck2
      );
      cy.wait('@acceptAcknowledgments').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/acknowledgements`
        );
      });
    });

    it('sends the keys in the request body', () => {
      User.acceptAcknowledgments(
        acknowledgements.testAck1,
        acknowledgements.testAck2
      );
      cy.wait('@acceptAcknowledgments').then((interception) => {
        expect(interception.request.body).to.contain(acknowledgements.testAck1);
        expect(interception.request.body).to.contain(acknowledgements.testAck2);
      });
    });

    describe('on success', () => {
      it('returns the body of the response', async () => {
        const response: AcknowledgementMap = await User.acceptAcknowledgments(
          acknowledgements.testAck1,
          acknowledgements.testAck2
        );
        assert(response.hasOwnProperty('key1'));
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('POST', 'api/user/acknowledgements', {
          statusCode: 404,
        }).as('acceptAcknowledgments');
        try {
          await User.acceptAcknowledgments(
            acknowledgements.testAck1,
            acknowledgements.testAck2
          );
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });

  describe('getApprovedDatasets', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/me/researcher/datasets', [
        approvedDataSet1,
        approvedDataSet2,
      ]).as('getApprovedDatasets');
    });
    it('uses an auth token in the request header', () => {
      User.getApprovedDatasets();
      cy.wait('@getApprovedDatasets').then((interception) => {
        expect(interception.request.headers.authorization).to.eq(
          'Bearer token'
        );
      });
    });
    it('sends a request to the correct endpoint', () => {
      User.getApprovedDatasets();
      cy.wait('@getApprovedDatasets').then(async (interception) => {
        expect(interception.request.url).to.eq(
          `${await getApiUrl()}/api/user/me/researcher/datasets`
        );
      });
    });
    describe('on success', () => {
      it('returns the body of the response', async () => {
        const returnedDatasets: ApprovedDataset[] =
          await User.getApprovedDatasets();
        expect(returnedDatasets.length).to.eq(2);
        expect(returnedDatasets[0].datasetName).to.eq(
          approvedDataSet1.datasetName
        );
        expect(returnedDatasets[0].datasetId).to.eq(approvedDataSet1.datasetId);
        expect(returnedDatasets[1].datasetName).to.eq(
          approvedDataSet2.datasetName
        );
        expect(returnedDatasets[1].datasetId).to.eq(approvedDataSet2.datasetId);
      });
    });
    describe('on rejection', () => {
      it('does not handle the rejection', async () => {
        cy.intercept('GET', 'api/user/me/researcher/datasets', {
          statusCode: 404,
        }).as('getApprovedDatasets');
        try {
          await User.getApprovedDatasets();
        } catch (err) {
          expect(err.response.status).to.eq(404);
        }
      });
    });
  });
});
