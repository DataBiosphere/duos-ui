-- E2E copy of Consent's BFF session changelogs:
--   changelog-consent-2026-06-16-bff-01-user-sessions.xml
--   changelog-consent-2026-06-16-bff-02-user-session-audit.xml
-- Keep the schema in sync. Scheduled cleanup (pg_cron) is omitted; the session
-- store excludes expired rows when reading. The audit table and its triggers
-- are included because sign-in, rotation and logout write to them.

CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR   NOT NULL COLLATE "default",
  sess   JSON      NOT NULL,
  expire TIMESTAMP NOT NULL,
  idp    VARCHAR(16),
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS user_session_audit (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sid_hash   VARCHAR(64)  NOT NULL,
  user_email VARCHAR(255),
  idp        VARCHAR(16),
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMP,
  end_reason VARCHAR(16)
);

CREATE INDEX IF NOT EXISTS idx_session_audit_email ON user_session_audit (user_email);
CREATE INDEX IF NOT EXISTS idx_session_audit_sid ON user_session_audit (sid_hash);

CREATE OR REPLACE FUNCTION sync_session_idp() RETURNS trigger AS $$
BEGIN
  NEW.idp := NEW.sess->>'idp';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_sessions_sync_idp
  BEFORE INSERT OR UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION sync_session_idp();

CREATE OR REPLACE FUNCTION audit_session_start() RETURNS trigger AS $$
BEGIN
  INSERT INTO user_session_audit (sid_hash, user_email, idp)
  VALUES (
    encode(sha256(NEW.sid::bytea), 'hex'),
    NEW.sess->>'userId',
    NEW.sess->>'idp'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_sessions_audit_start
  AFTER INSERT ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_session_start();

CREATE OR REPLACE FUNCTION audit_session_update() RETURNS trigger AS $$
BEGIN
  UPDATE user_session_audit
     SET user_email = COALESCE(user_email, NEW.sess->>'userId'),
         idp        = COALESCE(idp, NEW.sess->>'idp')
   WHERE sid_hash = encode(sha256(NEW.sid::bytea), 'hex')
     AND ended_at IS NULL
     AND (user_email IS NULL OR idp IS NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_sessions_audit_update
  AFTER UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_session_update();

CREATE OR REPLACE FUNCTION audit_session_end() RETURNS trigger AS $$
BEGIN
  UPDATE user_session_audit
     SET ended_at   = NOW(),
         end_reason = COALESCE(end_reason, 'expired')
   WHERE sid_hash = encode(sha256(OLD.sid::bytea), 'hex')
     AND ended_at IS NULL;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_sessions_audit_end
  AFTER DELETE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_session_end();
