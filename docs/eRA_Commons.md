# eRA Commons Integration

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
    DUOS ->> ECM: User is passed through to
    ECM ->> NIH: ECM Pass-through 
    NIH ->> NIH: User Auths
    NIH ->> ECM: Return with user state
    ECM ->> ECM: Save user state
    ECM ->> DUOS: Return user with state
    DUOS ->> DUOS: Decode ECM response
    DUOS ->> Consent: Save state to Consent
    DUOS ->> User: Updates user display
```
