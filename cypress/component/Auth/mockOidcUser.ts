import {OidcUser} from "../../../src/libs/auth/oidcBroker";

export const mockOidcUser: OidcUser = {
  access_token: '',
  get expires_in(): number | undefined {
    return undefined;
  },
  session_state: undefined,
  state: undefined,
  token_type: '',
  get expired(): boolean | undefined {
    return undefined;
  },
  get scopes(): string[] {
    return [];
  },
  toStorageString(): string {
    return '';
  },
  profile: {
    jti: undefined,
    nbf: undefined,
    sub: undefined,
    iss: '',
    aud: '',
    exp: 0,
    iat: 0
  }
};
