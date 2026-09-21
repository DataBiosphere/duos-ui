-- E2E copy of Consent's changelog-consent-2026-06-16-bff-01-user-sessions.xml.
-- Keep the schema in sync. Audit triggers and scheduled cleanup are omitted;
-- the session store excludes expired rows when reading.

CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR   NOT NULL COLLATE "default",
  sess   JSON      NOT NULL,
  expire TIMESTAMP NOT NULL,
  idp    VARCHAR(16),
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);
