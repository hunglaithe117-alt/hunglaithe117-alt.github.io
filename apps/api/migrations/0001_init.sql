-- 0001_init.sql — view counter (T5.3).
-- Apply with:
--   cf d1 migrations apply <DATABASE_ID> --dir migrations --table d1_migrations
-- D1 is SQLite: the upsert in internal/repository/views.go is atomic so no
-- read-modify-write race is possible.

CREATE TABLE IF NOT EXISTS views (
    slug       TEXT PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
);
