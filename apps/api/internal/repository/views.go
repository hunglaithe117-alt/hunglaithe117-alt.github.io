package repository

import (
	"context"
	"fmt"
	"strconv"
	"time"
)

// IncrementAndGet atomically increments the view count for slug and returns the
// new value. It relies on a single upsert (`INSERT … ON CONFLICT … RETURNING`)
// because D1 is single-writer and read-modify-write would race (T5.3 risk notes).
func (c *D1Client) IncrementAndGet(ctx context.Context, slug string) (int, error) {
	const sql = `
INSERT INTO views (slug, count, updated_at)
VALUES (?, 1, datetime('now'))
ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = datetime('now')
RETURNING count;`

	rows, err := c.query(ctx, sql, slug)
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, fmt.Errorf("repository: increment returned no row for slug %q", slug)
	}
	return intFromRow(rows[0], "count")
}

// GetCount returns the current count for slug and whether a row exists. Bots are
// counted read-only (T5.3: "count on GET with basic bot filtering").
func (c *D1Client) GetCount(ctx context.Context, slug string) (int, bool, error) {
	const sql = `SELECT count FROM views WHERE slug = ?;`

	rows, err := c.query(ctx, sql, slug)
	if err != nil {
		return 0, false, err
	}
	if len(rows) == 0 {
		return 0, false, nil
	}
	count, err := intFromRow(rows[0], "count")
	if err != nil {
		return 0, false, err
	}
	return count, true, nil
}

// InsertContact stores an audit row before any outbound email is attempted so a
// failed send can still be recovered (T5.4 store-only fallback).
func (c *D1Client) InsertContact(
	ctx context.Context,
	id, name, email, body, ipHash string,
	createdAt time.Time,
) error {
	const sql = `
INSERT INTO contact_messages (id, name, email, body, ip_hash, created_at)
VALUES (?, ?, ?, ?, ?, ?);`

	_, err := c.query(ctx, sql, id, name, email, body, ipHash, createdAt.UTC().Format(time.RFC3339))
	return err
}

// CountContactsSince counts contact rows for a hashed IP since the given time,
// backing the per-IP rate limit (T5.4). Raw IPs are never stored.
func (c *D1Client) CountContactsSince(ctx context.Context, ipHash string, since time.Time) (int, error) {
	const sql = `SELECT COUNT(*) AS n FROM contact_messages WHERE ip_hash = ? AND created_at >= ?;`

	rows, err := c.query(ctx, sql, ipHash, since.UTC().Format(time.RFC3339))
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	return intFromRow(rows[0], "n")
}

// intFromRow coerces a D1 result value (JSON numbers decode as float64) to int.
func intFromRow(row map[string]any, key string) (int, error) {
	v, ok := row[key]
	if !ok {
		return 0, fmt.Errorf("repository: column %q missing from row", key)
	}
	switch n := v.(type) {
	case float64:
		return int(n), nil
	case int64:
		return int(n), nil
	case int:
		return n, nil
	case string:
		parsed, err := strconv.Atoi(n)
		if err != nil {
			return 0, fmt.Errorf("repository: column %q is not an integer: %w", key, err)
		}
		return parsed, nil
	default:
		return 0, fmt.Errorf("repository: column %q has unexpected type %T", key, v)
	}
}
