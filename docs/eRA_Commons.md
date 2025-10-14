# RAS/eRA Commons Integration

DUOS uses ECM as an intermediary to allow users to authenticate
with NIH. ECM provides a redirect url that we point the user to.
Once authenticated, the user is redirected back to ECM which saves
the authentication information and then redirects the user back to 
the originating URL. DUOS, historically, also saved this information
locally in Consent. This allows Data Access Committees the ability to
see if a researcher is an NIH user. 

```mermaid
%%{init: { 'theme': 'forest' } }%%
sequenceDiagram
    User ->> DUOS: clicks the eRA Commons button
    DUOS ->> ECM: Get authorization url
    Note over DUOS, ECM: POST /api/oauth/v1/{provider}/authorization-url
    Note over DUOS, ECM: include a redirectUri query parameter
    Note over DUOS, ECM: include a { "redirectTo": "url" } request body
    ECM ->> DUOS: return auth url
    DUOS ->> User: send user new url to follow
    User ->> NIH: User is forwarded to NIH
    NIH ->> NIH: User Auths
    NIH ->> DUOS: Return with user state
    Note over DUOS, NIH: Gets the oauth code from NIH
    DUOS ->> ECM: Post oauthcode to ECM
    Note over DUOS, ECM: POST /api/oauth/v1/{provider}/oauthcode
    Note over DUOS, ECM: include state, oauthcode
    ECM ->> DUOS: return LinkInfo
    Note over ECM, DUOS: response includes externalUserId redirectTo
    DUOS ->> Consent: Request sync Consent <-> ECM
    Consent ->> ECM: Sync eRA Commons state between Consent and ECM
    ECM ->> Consent: Return sync status
    Consent ->> Consent: Save status
    DUOS ->> User: Redirect user to original redirectTo
    User ->> DUOS: Original page is refreshed
    DUOS ->> User: Updates user display
```
