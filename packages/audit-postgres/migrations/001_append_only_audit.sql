CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS novaris_audit;
REVOKE ALL ON SCHEMA novaris_audit FROM PUBLIC;

CREATE TABLE IF NOT EXISTS novaris_audit.audit_artifacts (
  artifact_id text PRIMARY KEY CHECK (artifact_id ~ '^sha256:[0-9a-f]{64}$'),
  package_id text UNIQUE NOT NULL CHECK (package_id ~ '^sha256:[0-9a-f]{64}$'),
  artifact_type text NOT NULL CHECK (artifact_type = 'evidence_package'),
  media_type text NOT NULL CHECK (media_type = 'application/vnd.novaris.evidence-package+json'),
  canonical_bytes bytea NOT NULL,
  semantic_json jsonb NOT NULL,
  byte_length bigint NOT NULL CHECK (byte_length >= 0),
  bytes_fingerprint text NOT NULL CHECK (bytes_fingerprint ~ '^sha256:[0-9a-f]{64}$'),
  inserted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS novaris_audit.audit_events (
  stream_id text NOT NULL,
  sequence bigint NOT NULL CHECK (sequence > 0),
  event_hash text NOT NULL CHECK (event_hash ~ '^sha256:[0-9a-f]{64}$'),
  previous_event_hash text NOT NULL CHECK (previous_event_hash ~ '^sha256:[0-9a-f]{64}$'),
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^sha256:[0-9a-f]{64}$'),
  event_type text NOT NULL CHECK (event_type = 'evidence_package_persisted'),
  artifact_id text NOT NULL REFERENCES novaris_audit.audit_artifacts(artifact_id),
  package_id text NOT NULL,
  story_id text NOT NULL,
  policy_version text NOT NULL CHECK (policy_version = 'phase1-v1'),
  admission_input_fingerprint text NOT NULL,
  admission_decision_fingerprint text NOT NULL,
  occurred_at timestamptz NOT NULL,
  material_bytes bytea NOT NULL,
  material_json jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (stream_id, sequence),
  UNIQUE (stream_id, idempotency_key),
  UNIQUE (stream_id, event_type, artifact_id)
);

CREATE OR REPLACE FUNCTION novaris_audit.reject_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'append-only audit relation'; END; $$;

CREATE OR REPLACE FUNCTION novaris_audit.verify_artifact_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parsed jsonb;
BEGIN
  IF NEW.artifact_id <> 'sha256:' || encode(digest(NEW.canonical_bytes, 'sha256'), 'hex')
     OR NEW.bytes_fingerprint <> NEW.artifact_id
     OR NEW.byte_length <> octet_length(NEW.canonical_bytes) THEN
    RAISE EXCEPTION 'artifact byte identity mismatch';
  END IF;
  parsed := convert_from(NEW.canonical_bytes, 'UTF8')::jsonb;
  IF parsed <> NEW.semantic_json OR NEW.package_id <> parsed->>'packageId' THEN
    RAISE EXCEPTION 'artifact semantic mismatch';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION novaris_audit.verify_event_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parsed jsonb; last_sequence bigint; last_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.stream_id, 0));
  parsed := convert_from(NEW.material_bytes, 'UTF8')::jsonb;
  IF parsed <> NEW.material_json
     OR NEW.event_hash <> 'sha256:' || encode(digest(NEW.material_bytes, 'sha256'), 'hex')
     OR NEW.stream_id <> parsed->>'streamId'
     OR NEW.sequence::text <> parsed->>'sequence'
     OR NEW.previous_event_hash <> parsed->>'previousEventHash'
     OR NEW.idempotency_key <> parsed->>'idempotencyKey'
     OR NEW.request_fingerprint <> parsed->>'requestFingerprint'
     OR NEW.event_type <> parsed->>'eventType'
     OR NEW.artifact_id <> parsed->>'artifactId'
     OR NEW.package_id <> parsed->>'packageId'
     OR NEW.story_id <> parsed->>'storyId'
     OR NEW.policy_version <> parsed->>'policyVersion'
     OR NEW.admission_input_fingerprint <> parsed->>'admissionInputFingerprint'
     OR NEW.admission_decision_fingerprint <> parsed->>'admissionDecisionFingerprint'
     OR NEW.occurred_at <> (parsed->>'occurredAt')::timestamptz THEN
    RAISE EXCEPTION 'event material mismatch';
  END IF;
  SELECT sequence, event_hash INTO last_sequence, last_hash
  FROM novaris_audit.audit_events WHERE stream_id = NEW.stream_id
  ORDER BY sequence DESC LIMIT 1;
  IF last_sequence IS NULL THEN
    IF NEW.sequence <> 1 OR NEW.previous_event_hash <> 'sha256:' || repeat('0', 64) THEN
      RAISE EXCEPTION 'invalid genesis event';
    END IF;
  ELSIF NEW.sequence <> last_sequence + 1 OR NEW.previous_event_hash <> last_hash THEN
    RAISE EXCEPTION 'invalid event successor';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS audit_artifacts_verify_insert ON novaris_audit.audit_artifacts;
CREATE TRIGGER audit_artifacts_verify_insert BEFORE INSERT ON novaris_audit.audit_artifacts
FOR EACH ROW EXECUTE FUNCTION novaris_audit.verify_artifact_insert();
DROP TRIGGER IF EXISTS audit_events_verify_insert ON novaris_audit.audit_events;
CREATE TRIGGER audit_events_verify_insert BEFORE INSERT ON novaris_audit.audit_events
FOR EACH ROW EXECUTE FUNCTION novaris_audit.verify_event_insert();
DROP TRIGGER IF EXISTS audit_artifacts_reject_change ON novaris_audit.audit_artifacts;
CREATE TRIGGER audit_artifacts_reject_change BEFORE UPDATE OR DELETE ON novaris_audit.audit_artifacts
FOR EACH ROW EXECUTE FUNCTION novaris_audit.reject_mutation();
DROP TRIGGER IF EXISTS audit_events_reject_change ON novaris_audit.audit_events;
CREATE TRIGGER audit_events_reject_change BEFORE UPDATE OR DELETE ON novaris_audit.audit_events
FOR EACH ROW EXECUTE FUNCTION novaris_audit.reject_mutation();
DROP TRIGGER IF EXISTS audit_artifacts_reject_truncate ON novaris_audit.audit_artifacts;
CREATE TRIGGER audit_artifacts_reject_truncate BEFORE TRUNCATE ON novaris_audit.audit_artifacts
FOR EACH STATEMENT EXECUTE FUNCTION novaris_audit.reject_mutation();
DROP TRIGGER IF EXISTS audit_events_reject_truncate ON novaris_audit.audit_events;
CREATE TRIGGER audit_events_reject_truncate BEFORE TRUNCATE ON novaris_audit.audit_events
FOR EACH STATEMENT EXECUTE FUNCTION novaris_audit.reject_mutation();

REVOKE ALL ON ALL TABLES IN SCHEMA novaris_audit FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA novaris_audit FROM PUBLIC;
