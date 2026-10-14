-- 0002_contact.sql — contact form audit log (T5.4).
-- Rows are written BEFORE the email is attempted so a failed send can be
-- recovered (store-only fallback, D-003). ip_hash is a peppered SHA-256 digest;
-- raw IPs are never stored.

CREATE TABLE IF NOT EXISTS contact_messages (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    body       TEXT NOT NULL,
    ip_hash    TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Backs the per-IP rate limit (CountContactsSince).
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_hash_created_at
    ON contact_messages (ip_hash, created_at);
