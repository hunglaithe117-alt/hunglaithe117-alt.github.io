package config

import (
	"strings"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Port != "8080" || cfg.MaxBodyBytes != defaultMaxBodyBytes {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
	if len(cfg.AllowedOrigins) == 0 {
		t.Fatal("expected default allowed origins")
	}
}

func TestLoadRejectsWildcardOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://example.com,*")
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "wildcard") {
		t.Fatalf("expected wildcard rejection, got %v", err)
	}
}

func TestLoadTrimsCSV(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", " https://a.example , https://b.example ,, ")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cfg.AllowedOrigins) != 2 || cfg.AllowedOrigins[0] != "https://a.example" {
		t.Fatalf("unexpected origins: %v", cfg.AllowedOrigins)
	}
}

func TestD1Configured(t *testing.T) {
	t.Setenv("CLOUDFLARE_ACCOUNT_ID", "acct")
	t.Setenv("D1_DATABASE_ID", "db")
	t.Setenv("D1_API_TOKEN", "tok")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !cfg.D1Configured() {
		t.Fatal("expected D1 to be configured")
	}
}

func TestLoadRejectsNonPositiveBodyLimit(t *testing.T) {
	t.Setenv("MAX_BODY_BYTES", "0")
	if _, err := Load(); err == nil {
		t.Fatal("expected error for non-positive body limit")
	}
}
