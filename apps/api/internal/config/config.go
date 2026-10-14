// Package config loads and validates the API's runtime configuration from the
// environment. No values are hard-coded as secrets here: the Cloudflare account
// id and D1 ids are placeholders sourced from env at deploy time
// (SOLUTION.md §E, DECISIONS.md D-008/D-014).
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Default values. These are *not* credentials — they keep local `go run`/tests
// working without a full environment.
const (
	defaultPort           = "8080"
	defaultMaxBodyBytes   = 16 * 1024 // 16 KiB request cap (T5.4 abuse guard)
	defaultD1APIBase      = "https://api.cloudflare.com/client/v4"
	defaultRatePerMinute  = 1
	defaultAllowedOrigins = "http://localhost:4321,http://localhost:8787"
)

// Config is the fully-resolved runtime configuration for the API container.
type Config struct {
	// Environment is one of "development", "production" or "test".
	Environment string
	// Port is the TCP port the Fiber server listens on.
	Port string
	// MaxBodyBytes caps the request body size (T5.4: reject oversized payloads).
	MaxBodyBytes int
	// AllowedOrigins is the CORS allowlist. Never "*" (T5.5, README §7).
	AllowedOrigins []string

	// CloudflareAccountID identifies the account hosting D1.
	CloudflareAccountID string
	// D1DatabaseID is the D1 database UUID (D1 commands take the id, not name).
	D1DatabaseID string
	// D1APIToken is a scoped API token used by the repository to reach D1 over
	// the Cloudflare REST API (the container cannot use Worker bindings).
	D1APIToken string
	// D1APIBaseURL overrides the Cloudflare API base (useful for tests).
	D1APIBaseURL string

	// IPHashSalt peppers stored IP hashes (never store raw IPs — T5.4).
	IPHashSalt string
	// RateLimitPerMinute caps contact submissions per hashed IP (T5.4).
	RateLimitPerMinute int
}

// Load reads configuration from the process environment. It never fails on
// missing optional values so that `/healthz` works in minimal environments; the
// repository surfaces a typed error when D1 settings are actually required.
//
// Contact email is intentionally absent: the container only validates and stores
// the D1 row, while the apps/edge Worker sends the notification via its
// `send_email` binding (D-040).
func Load() (Config, error) {
	cfg := Config{
		Environment:         envOr("ENVIRONMENT", "development"),
		Port:                envOr("PORT", defaultPort),
		MaxBodyBytes:        envIntOr("MAX_BODY_BYTES", defaultMaxBodyBytes),
		AllowedOrigins:      splitCSV(envOr("ALLOWED_ORIGINS", defaultAllowedOrigins)),
		CloudflareAccountID: strings.TrimSpace(os.Getenv("CLOUDFLARE_ACCOUNT_ID")),
		D1DatabaseID:        strings.TrimSpace(os.Getenv("D1_DATABASE_ID")),
		D1APIToken:          strings.TrimSpace(os.Getenv("D1_API_TOKEN")),
		D1APIBaseURL:        envOr("D1_API_BASE_URL", defaultD1APIBase),
		IPHashSalt:          envOr("IP_HASH_SALT", envOr("SESSION_SECRET", "dev-only-salt")),
		RateLimitPerMinute:  envIntOr("RATE_LIMIT_PER_MINUTE", defaultRatePerMinute),
	}

	if cfg.MaxBodyBytes <= 0 {
		return Config{}, fmt.Errorf("config: MAX_BODY_BYTES must be positive, got %d", cfg.MaxBodyBytes)
	}
	if len(cfg.AllowedOrigins) == 0 {
		return Config{}, fmt.Errorf("config: ALLOWED_ORIGINS must not be empty")
	}
	for _, origin := range cfg.AllowedOrigins {
		if origin == "*" {
			return Config{}, fmt.Errorf("config: wildcard origin is forbidden (T5.5)")
		}
	}
	return cfg, nil
}

// D1Configured reports whether the D1 REST credentials are present.
func (c Config) D1Configured() bool {
	return c.CloudflareAccountID != "" && c.D1DatabaseID != "" && c.D1APIToken != ""
}

func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func envIntOr(key string, fallback int) int {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
