// Package email sends contact notifications through Cloudflare Email Sending.
//
// The `send_email` binding declared in `apps/edge/cloudflare.config.ts` is only
// reachable from the edge Worker; the Go API runs in a Container and therefore
// uses the equivalent Cloudflare Email Sending REST endpoint with a scoped API
// token. When the token is absent the sender degrades gracefully (store-only),
// per T5.4 / D-003 risk notes.
package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
)

// ErrUnavailable signals that the email transport is not configured. The contact
// service treats this as the graceful store-only fallback, not a hard failure.
var ErrUnavailable = fmt.Errorf("email: transport unavailable")

// CloudflareSender posts a structured message to the Email Sending API:
// POST {base}/accounts/{account_id}/email/sending/send
type CloudflareSender struct {
	accountID  string
	apiToken   string
	baseURL    string
	httpClient *http.Client
}

// NewCloudflare builds a sender from configuration.
func NewCloudflare(cfg config.Config) *CloudflareSender {
	return &CloudflareSender{
		accountID:  cfg.CloudflareAccountID,
		apiToken:   cfg.EmailAPIToken,
		baseURL:    strings.TrimRight(cfg.D1APIBaseURL, "/"),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Send delivers a plain-text notification. `to` may be the owner mailbox and
// `replyTo` the submitter so the owner can reply directly.
func (s *CloudflareSender) Send(ctx context.Context, from, to, replyTo, subject, body string) error {
	if s.apiToken == "" || s.accountID == "" {
		return ErrUnavailable
	}

	payload := map[string]any{
		"from":       from,
		"recipients": []string{to},
		"subject":    subject,
		"text":       body,
	}
	if replyTo != "" {
		payload["reply_to"] = replyTo
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("email: marshal payload: %w", err)
	}

	endpoint := fmt.Sprintf("%s/accounts/%s/email/sending/send", s.baseURL, s.accountID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("email: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("email: send: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
		return fmt.Errorf("email: send failed (status %d): %s", resp.StatusCode, strings.TrimSpace(string(detail)))
	}
	return nil
}
