-- Session schema for the end-to-end (E2E) harness only.
--
-- Consent owns this table in production. The authoritative definition is the
-- Liquibase changeset `changelog-consent-2026-06-16-bff-01-user-sessions.xml`
-- in the `consent` repository, and this file is a copy of the parts the
-- Fastify session store reads and writes (server/src/session/pgStore.ts):
-- `sid`, `sess` and `expire`, plus the `idp` column the audit trigger fills.
--
-- The copy exists because this repository has no migration path of its own and
-- the E2E job needs a database before the server starts. Keep it in step with
-- the changeset above. The audit triggers, the audit table and the pg_cron
-- purge job are deliberately absent: no server code depends on them, and the
-- store filters expired rows itself (`expire > NOW()`).
--
-- The script is applied to an empty CI database, so it is not idempotent by
-- design beyond `IF NOT EXISTS`.

CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR   NOT NULL COLLATE "default",
  sess   JSON      NOT NULL,
  expire TIMESTAMP NOT NULL,
  idp    VARCHAR(16),
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);
