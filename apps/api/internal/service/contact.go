package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
)

// Contact field limits (T5.4: "validate {name,email,body} (lengths, email
// format, no header injection)").
const (
	maxNameLength  = 100
	maxEmailLength = 254 // RFC 5321 practical maximum
	maxBodyLength  = 5000
)

// ContactStore is the slice of the repository the contact service needs.
type ContactStore interface {
	InsertContact(ctx context.Context, id, name, email, body, ipHash string, createdAt time.Time) error
	CountContactsSince(ctx context.Context, ipHash string, since time.Time) (int, error)
}

// EmailSender is any outbound notification transport. The Cloudflare Email
// Sending REST adapter and test fakes both satisfy it.
type EmailSender interface {
	Send(ctx context.Context, from, to, replyTo, subject, body string) error
}

// ContactRequest is the validated-shape input for POST /api/contact.
type ContactRequest struct {
	Name  string
	Email string
	Body  string
}

// ContactResult reports what happened so the handler can return an honest status
// (a stored row with a failed send still succeeds, per T5.4 store-only fallback).
type ContactResult struct {
	ID      string
	Emailed bool
}

// Contact implements the contact form workflow.
type Contact struct {
	store  ContactStore
	sender EmailSender
	cfg    config.Config
	now    func() time.Time
}

// NewContact wires the contact service.
func NewContact(store ContactStore, sender EmailSender, cfg config.Config) *Contact {
	return &Contact{store: store, sender: sender, cfg: cfg, now: time.Now}
}

// Submit validates, rate-limits, stores an audit row, then attempts to send the
// notification. Send failures are non-fatal (row already persisted) and logged
// without PII by the caller.
func (s *Contact) Submit(ctx context.Context, req ContactRequest, ipHash string) (ContactResult, error) {
	clean, err := validateContact(req)
	if err != nil {
		return ContactResult{}, err
	}

	now := s.now().UTC()
	since := now.Add(-time.Minute)
	recent, err := s.store.CountContactsSince(ctx, ipHash, since)
	if err != nil {
		return ContactResult{}, mapStoreError(err)
	}
	if recent >= s.cfg.RateLimitPerMinute {
		// T5.4: reject >1 request/min/IP.
		return ContactResult{}, fmt.Errorf("%w: too many submissions", ErrRateLimited)
	}

	id, err := newID()
	if err != nil {
		return ContactResult{}, fmt.Errorf("service: generate id: %w", err)
	}
	if err := s.store.InsertContact(ctx, id, clean.Name, clean.Email, clean.Body, ipHash, now); err != nil {
		return ContactResult{}, mapStoreError(err)
	}

	result := ContactResult{ID: id, Emailed: false}
	subject := fmt.Sprintf("New contact message from %s", clean.Name)
	if err := s.sender.Send(ctx, s.cfg.ContactFrom, s.cfg.ContactTo, clean.Email, subject, clean.Body); err != nil {
		// T5.4 / D-003: keep the DB row and return a graceful status.
		return result, nil
	}
	result.Emailed = true
	return result, nil
}

// validateContact trims and bounds input, rejecting header-injection attempts.
func validateContact(req ContactRequest) (ContactRequest, error) {
	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(req.Email)
	body := strings.TrimSpace(req.Body)

	if name == "" || len(name) > maxNameLength {
		return ContactRequest{}, fmt.Errorf("%w: name must be 1-%d characters", ErrInvalidInput, maxNameLength)
	}
	if email == "" || len(email) > maxEmailLength {
		return ContactRequest{}, fmt.Errorf("%w: email must be 1-%d characters", ErrInvalidInput, maxEmailLength)
	}
	if body == "" || len(body) > maxBodyLength {
		return ContactRequest{}, fmt.Errorf("%w: body must be 1-%d characters", ErrInvalidInput, maxBodyLength)
	}
	// Header-injection guard: reject CR/LF anywhere in single-line fields.
	if strings.ContainsAny(name, "\r\n") || strings.ContainsAny(email, "\r\n") {
		return ContactRequest{}, fmt.Errorf("%w: illegal control characters", ErrInvalidInput)
	}
	parsed, err := mail.ParseAddress(email)
	if err != nil || !strings.EqualFold(parsed.Address, email) {
		return ContactRequest{}, fmt.Errorf("%w: malformed email address", ErrInvalidInput)
	}
	return ContactRequest{Name: name, Email: email, Body: body}, nil
}

// HashIP returns a peppered SHA-256 hex digest. Raw IPs are never persisted or
// logged (T5.4: "hash IPs before storing").
func HashIP(salt, ip string) string {
	sum := sha256.Sum256([]byte(salt + "|" + ip))
	return hex.EncodeToString(sum[:])
}

// newID returns a random UUID v4-formatted identifier (no external dependency).
func newID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}
