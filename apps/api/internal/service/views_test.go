package service

import (
	"context"
	"errors"
	"testing"
)

type fakeViewStore struct {
	count     int
	found     bool
	increment int
	err       error
	sawBot    bool
}

func (f *fakeViewStore) IncrementAndGet(_ context.Context, _ string) (int, error) {
	if f.err != nil {
		return 0, f.err
	}
	f.count++
	return f.count, nil
}

func (f *fakeViewStore) GetCount(_ context.Context, _ string) (int, bool, error) {
	if f.err != nil {
		return 0, false, f.err
	}
	return f.count, f.found, nil
}

func TestViewsRegisterIncrementsForHumans(t *testing.T) {
	store := &fakeViewStore{count: 41}
	got, err := NewViews(store).Register(context.Background(), "hello-world", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Count != 42 {
		t.Fatalf("expected 42, got %d", got.Count)
	}
}

func TestViewsRegisterIsReadOnlyForBots(t *testing.T) {
	store := &fakeViewStore{count: 7, found: true}
	got, err := NewViews(store).Register(context.Background(), "hello-world", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Count != 7 {
		t.Fatalf("bot should not increment: expected 7, got %d", got.Count)
	}
}

func TestViewsRegisterRejectsInvalidSlug(t *testing.T) {
	store := &fakeViewStore{}
	for _, slug := range []string{"", "Hello", "a b", "UPPER", "../etc/passwd", "a/b"} {
		if _, err := NewViews(store).Register(context.Background(), slug, false); !errors.Is(err, ErrInvalidInput) {
			t.Fatalf("slug %q: expected ErrInvalidInput, got %v", slug, err)
		}
	}
}

func TestViewsRegisterMapsUnconfiguredStorage(t *testing.T) {
	store := &fakeViewStore{err: errors.New("repository: D1 is not configured")}
	_, err := NewViews(store).Register(context.Background(), "hello", false)
	if !errors.Is(err, ErrStorageUnavailable) {
		t.Fatalf("expected ErrStorageUnavailable, got %v", err)
	}
}

func TestIsLikelyBot(t *testing.T) {
	bots := []string{"", "Googlebot/2.1", "Mozilla/5.0 (compatible; bingbot/2.0)", "curl/8.4.0", "HeadlessChrome"}
	for _, ua := range bots {
		if !IsLikelyBot(ua) {
			t.Errorf("expected %q to be flagged as bot", ua)
		}
	}
	humans := []string{
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
	}
	for _, ua := range humans {
		if IsLikelyBot(ua) {
			t.Errorf("expected %q to be treated as human", ua)
		}
	}
}
