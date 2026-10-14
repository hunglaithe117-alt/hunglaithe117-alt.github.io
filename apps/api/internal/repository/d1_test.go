package repository

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
)

func newTestClient(t *testing.T, handler http.HandlerFunc) (*D1Client, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	client := NewD1(config.Config{
		CloudflareAccountID: "acct-123",
		D1DatabaseID:        "db-abc",
		D1APIToken:          "token-xyz",
		D1APIBaseURL:        srv.URL,
	})
	return client, srv
}

func TestIncrementAndGetParsesCount(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/accounts/acct-123/d1/database/db-abc/query" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer token-xyz" {
			t.Errorf("unexpected auth header: %q", got)
		}
		var body struct {
			SQL    string `json:"sql"`
			Params []any  `json:"params"`
		}
		raw, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(raw, &body); err != nil {
			t.Fatalf("bad request body: %v", err)
		}
		if !strings.Contains(body.SQL, "ON CONFLICT") || !strings.Contains(body.SQL, "RETURNING count") {
			t.Errorf("expected atomic upsert SQL, got %q", body.SQL)
		}
		if len(body.Params) != 1 || body.Params[0] != "hello-world" {
			t.Errorf("expected slug param, got %v", body.Params)
		}
		_, _ = w.Write([]byte(`{"success":true,"errors":[],"result":[{"success":true,"results":[{"count":5}]}]}`))
	})

	count, err := client.IncrementAndGet(context.Background(), "hello-world")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if count != 5 {
		t.Fatalf("expected 5, got %d", count)
	}
}

func TestGetCountMissingRow(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"success":true,"errors":[],"result":[{"success":true,"results":[]}]}`))
	})
	count, found, err := client.GetCount(context.Background(), "nope")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found || count != 0 {
		t.Fatalf("expected (0,false), got (%d,%v)", count, found)
	}
}

func TestCountContactsSince(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"success":true,"errors":[],"result":[{"success":true,"results":[{"n":2}]}]}`))
	})
	n, err := client.CountContactsSince(context.Background(), "hash", time.Now().Add(-time.Minute))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if n != 2 {
		t.Fatalf("expected 2, got %d", n)
	}
}

func TestQuerySurfacesAPIError(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"success":false,"errors":[{"code":10000,"message":"auth error"}],"result":null}`))
	})
	_, err := client.IncrementAndGet(context.Background(), "x")
	if err == nil || !strings.Contains(err.Error(), "auth error") {
		t.Fatalf("expected auth error, got %v", err)
	}
}

func TestNotConfigured(t *testing.T) {
	client := NewD1(config.Config{})
	if _, err := client.IncrementAndGet(context.Background(), "x"); err != ErrNotConfigured {
		t.Fatalf("expected ErrNotConfigured, got %v", err)
	}
}
