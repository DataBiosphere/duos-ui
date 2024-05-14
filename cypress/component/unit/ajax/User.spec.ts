import { Config } from '../../../../src/libs/config';
import { DuosUserResponse } from '../../../../src/types/responseTypes';
import { User } from '../../../../src/libs/ajax/User';
import { getApiUrl } from '../../../../src/libs/ajax';

const testUser: Partial<DuosUserResponse> = {
  displayName: 'testUser',
  userId: 22,
};

describe('User', () => {
  describe('getMe', () => {
    beforeEach(() => {
      cy.intercept('GET', 'api/user/me', testUser).as('getMe');
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
        expect(returnedUser.displayName).to.eq(testUser.displayName);
        expect(returnedUser.userId).to.eq(testUser.userId);
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
});
