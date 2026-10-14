package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
)

type fakeContactStore struct {
	recent   int
	inserted int
	err      error
}

func (f *fakeContactStore) InsertContact(_ context.Context, _, _, _, _, _ string, _ time.Time) error {
	if f.err != nil {
		return f.err
	}
	f.inserted++
	return nil
}

func (f *fakeContactStore) CountContactsSince(_ context.Context, _ string, _ time.Time) (int, error) {
	if f.err != nil {
		return 0, f.err
	}
	return f.recent, nil
}

type fakeSender struct {
	sent bool
	err  error
}

func (f *fakeSender) Send(_ context.Context, _, _, _, _, _ string) error {
	f.sent = true
	return f.err
}

func newContactTest(t *testing.T) (*Contact, *fakeContactStore, *fakeSender) {
	t.Helper()
	store := &fakeContactStore{}
	sender := &fakeSender{}
	cfg := config.Config{RateLimitPerMinute: 1, ContactFrom: "no-reply@example.com", ContactTo: "owner@example.com"}
	svc := NewContact(store, sender, cfg)
	svc.now = func() time.Time { return time.Date(2026, 10, 14, 12, 0, 0, 0, time.UTC) }
	return svc, store, sender
}

func TestContactSubmitHappyPath(t *testing.T) {
	svc, store, sender := newContactTest(t)
	res, err := svc.Submit(context.Background(), ContactRequest{Name: "Ada", Email: "ada@example.com", Body: "Hello"}, "hash")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.ID == "" || !res.Emailed || !sender.sent {
		t.Fatalf("expected sent result, got %+v (sent=%v)", res, sender.sent)
	}
	if store.inserted != 1 {
		t.Fatalf("expected 1 audit row, got %d", store.inserted)
	}
}

func TestContactSubmitValidation(t *testing.T) {
	cases := map[string]ContactRequest{
		"empty name":    {Name: "", Email: "a@example.com", Body: "hi"},
		"bad email":     {Name: "A", Email: "not-an-email", Body: "hi"},
		"email newline": {Name: "A", Email: "a@example.com\nBcc: x@y.z", Body: "hi"},
		"name newline":  {Name: "A\r\nX", Email: "a@example.com", Body: "hi"},
		"empty body":    {Name: "A", Email: "a@example.com", Body: "   "},
	}
	svc, store, _ := newContactTest(t)
	for name, req := range cases {
		if _, err := svc.Submit(context.Background(), req, "hash"); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("%s: expected ErrInvalidInput, got %v", name, err)
		}
	}
	if store.inserted != 0 {
		t.Fatalf("invalid submissions must not be stored, got %d", store.inserted)
	}
}

func TestContactSubmitRateLimit(t *testing.T) {
	svc, store, _ := newContactTest(t)
	store.recent = 1
	_, err := svc.Submit(context.Background(), ContactRequest{Name: "A", Email: "a@example.com", Body: "hi"}, "hash")
	if !errors.Is(err, ErrRateLimited) {
		t.Fatalf("expected ErrRateLimited, got %v", err)
	}
}

func TestContactSubmitStoreOnlyFallbackOnSendFailure(t *testing.T) {
	svc, store, sender := newContactTest(t)
	sender.err = errors.New("email unavailable")
	res, err := svc.Submit(context.Background(), ContactRequest{Name: "A", Email: "a@example.com", Body: "hi"}, "hash")
	if err != nil {
		t.Fatalf("send failure must not fail the request: %v", err)
	}
	if res.Emailed {
		t.Fatal("expected emailed=false on send failure")
	}
	if store.inserted != 1 {
		t.Fatalf("audit row must be kept, got %d", store.inserted)
	}
}

func TestHashIPIsStableAndNonReversible(t *testing.T) {
	a := HashIP("salt", "203.0.113.7")
	b := HashIP("salt", "203.0.113.7")
	c := HashIP("other", "203.0.113.7")
	if a != b {
		t.Fatal("hash must be deterministic for the same salt+ip")
	}
	if a == c {
		t.Fatal("hash must depend on the salt")
	}
	if len(a) != 64 {
		t.Fatalf("expected sha256 hex length 64, got %d", len(a))
	}
}
