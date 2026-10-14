// Package repository is the only layer permitted to touch storage. It talks to
// Cloudflare D1 through the D1 REST API because the Go binary runs inside a
// Cloudflare Container and therefore cannot receive Worker bindings
// (SOLUTION.md §D: "repository is the only layer touching D1").
package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
)

// ErrNotConfigured is returned when D1 credentials are missing. Callers should
// surface a 503 / graceful-degraded response rather than a 500 stack trace.
var ErrNotConfigured = fmt.Errorf("repository: D1 is not configured")

// D1Client is a minimal Cloudflare D1 REST client. It is safe for concurrent use.
type D1Client struct {
	accountID  string
	databaseID string
	apiToken   string
	baseURL    string
	httpClient *http.Client
}

// NewD1 builds a D1 client from configuration. It does not perform I/O.
func NewD1(cfg config.Config) *D1Client {
	return &D1Client{
		accountID:  cfg.CloudflareAccountID,
		databaseID: cfg.D1DatabaseID,
		apiToken:   cfg.D1APIToken,
		baseURL:    strings.TrimRight(cfg.D1APIBaseURL, "/"),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *D1Client) configured() bool {
	return c.accountID != "" && c.databaseID != "" && c.apiToken != ""
}

// query executes one SQL statement with positional parameters. The spec pins
// positional `?` parameters (T5.3 pseudocode) — values are never interpolated.
func (c *D1Client) query(ctx context.Context, sql string, params ...any) ([]map[string]any, error) {
	if !c.configured() {
		return nil, ErrNotConfigured
	}

	body, err := json.Marshal(map[string]any{"sql": sql, "params": params})
	if err != nil {
		return nil, fmt.Errorf("repository: marshal query: %w", err)
	}

	endpoint := fmt.Sprintf("%s/accounts/%s/d1/database/%s/query",
		c.baseURL, url.PathEscape(c.accountID), url.PathEscape(c.databaseID))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("repository: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("repository: d1 request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("repository: read response: %w", err)
	}

	var envelope d1Envelope
	if err := json.Unmarshal(raw, &envelope); err != nil {
		return nil, fmt.Errorf("repository: decode response (status %d): %w", resp.StatusCode, err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 || !envelope.Success {
		return nil, fmt.Errorf("repository: d1 query failed (status %d): %s", resp.StatusCode, envelope.errorMessage())
	}
	if len(envelope.Result) == 0 {
		return nil, nil
	}
	if !envelope.Result[0].Success {
		return nil, fmt.Errorf("repository: d1 statement failed: %s", envelope.Result[0].Error)
	}
	return envelope.Result[0].Results, nil
}

// d1Envelope mirrors the D1 REST response envelope.
type d1Envelope struct {
	Success bool `json:"success"`
	Errors  []struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"errors"`
	Result []d1Result `json:"result"`
}

type d1Result struct {
	Success bool             `json:"success"`
	Results []map[string]any `json:"results"`
	Error   string           `json:"error"`
}

func (e d1Envelope) errorMessage() string {
	if len(e.Errors) == 0 {
		return "unknown error"
	}
	if e.Errors[0].Code != 0 {
		return fmt.Sprintf("[%d] %s", e.Errors[0].Code, e.Errors[0].Message)
	}
	return e.Errors[0].Message
}
