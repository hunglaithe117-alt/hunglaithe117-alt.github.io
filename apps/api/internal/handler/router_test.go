package handler_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/example/blog-personal/apps/api/internal/config"
	"github.com/example/blog-personal/apps/api/internal/handler"
	"github.com/example/blog-personal/apps/api/internal/service"
)

type stubViews struct {
	count int
	err   error
}

func (s *stubViews) IncrementAndGet(context.Context, string) (int, error) { return s.count, s.err }
func (s *stubViews) GetCount(context.Context, string) (int, bool, error)  { return s.count, true, s.err }

type stubContacts struct {
	recent int
	err    error
}

func (s *stubContacts) InsertContact(context.Context, string, string, string, string, string, time.Time) error {
	return s.err
}
func (s *stubContacts) CountContactsSince(context.Context, string, time.Time) (int, error) {
	return s.recent, s.err
}

func newApp(views *stubViews, contacts *stubContacts, cfg config.Config) *fiber.App {
	viewsSvc := service.NewViews(views)
	contactSvc := service.NewContact(contacts, cfg)
	return handler.NewRouter(
		handler.NewViewsHandler(viewsSvc),
		handler.NewContactHandler(contactSvc, "salt"),
		cfg,
	).Build()
}

func baseConfig() config.Config {
	return config.Config{
		AllowedOrigins:     []string{"https://example.com", "https://blog-edge-preview.example.workers.dev"},
		MaxBodyBytes:       1024,
		RateLimitPerMinute: 1,
	}
}

func do(t *testing.T, app *fiber.App, method, path, body string, headers map[string]string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	return resp
}

func TestHealthz(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/healthz", "", nil)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestHealthzPublicAlias(t *testing.T) {
	// Reachable through the edge Worker, which only forwards /api + /api/*
	// (T6.3 uptime checks target this path).
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/api/healthz", "", nil)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestViewsInvalidSlug(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/api/views/Bad_Slug", "", nil)
	if resp.StatusCode != 422 {
		t.Fatalf("expected 422, got %d", resp.StatusCode)
	}
}

func TestViewsStorageUnavailable(t *testing.T) {
	app := newApp(&stubViews{err: errors.New("repository: D1 is not configured")}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/api/views/hello", "", nil)
	if resp.StatusCode != 503 {
		t.Fatalf("expected 503, got %d", resp.StatusCode)
	}
}

func TestCORSPreflightAllowedOrigin(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "OPTIONS", "/api/contact", "", map[string]string{
		"Origin":                        "https://example.com",
		"Access-Control-Request-Method": "POST",
	})
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "https://example.com" {
		t.Fatalf("expected ACAO for allowed origin, got %q", got)
	}
}

func TestCORSDisallowedOriginGetsNoACAO(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/api/views/hello", "", map[string]string{
		"Origin": "https://evil.example.net",
	})
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("disallowed origin must not receive ACAO, got %q", got)
	}
}

func TestSecurityHeaders(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	resp := do(t, app, "GET", "/healthz", "", nil)
	if resp.Header.Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("missing nosniff header")
	}
	if resp.Header.Get("X-Frame-Options") != "DENY" {
		t.Fatal("missing X-Frame-Options header")
	}
	if resp.Header.Get("Strict-Transport-Security") == "" {
		t.Fatal("missing Strict-Transport-Security header")
	}
}

func TestContactInvalidBody(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	body := `{"name":"A","email":"nope","body":"hi"}`
	resp := do(t, app, "POST", "/api/contact", body, map[string]string{"Content-Type": "application/json"})
	if resp.StatusCode != 422 {
		t.Fatalf("expected 422, got %d", resp.StatusCode)
	}
}

func TestContactRateLimited(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{recent: 1}, baseConfig())
	body := `{"name":"A","email":"a@example.com","body":"hi"}`
	resp := do(t, app, "POST", "/api/contact", body, map[string]string{"Content-Type": "application/json"})
	if resp.StatusCode != 429 {
		t.Fatalf("expected 429, got %d", resp.StatusCode)
	}
}

func TestContactOversizeBodyRejected(t *testing.T) {
	app := newApp(&stubViews{}, &stubContacts{}, baseConfig())
	huge := `{"name":"A","email":"a@example.com","body":"` + strings.Repeat("x", 5000) + `"}`
	req := httptest.NewRequest("POST", "/api/contact", strings.NewReader(huge))
	req.Header.Set("Content-Type", "application/json")
	// Fiber enforces BodyLimit at the transport layer; the test harness surfaces
	// that as an error rather than a response.
	if _, err := app.Test(req, -1); err == nil {
		t.Fatal("expected oversize request to be rejected by the body limit")
	}
}
