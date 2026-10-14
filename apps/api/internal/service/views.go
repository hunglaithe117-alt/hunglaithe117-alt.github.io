package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"
)

// viewSlugPattern constrains slugs to a URL-safe, lower-case shape so a hostile
// client cannot blow up the key space (T5.3 risk notes).
var viewSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// maxSlugLength bounds slug size (T5.3: "validate slug").
const maxSlugLength = 128

// ViewStore is the slice of the repository the view service needs.
type ViewStore interface {
	IncrementAndGet(ctx context.Context, slug string) (int, error)
	GetCount(ctx context.Context, slug string) (int, bool, error)
}

// View is the public view-count payload.
type View struct {
	Slug  string
	Count int
}

// Views implements the view counter.
type Views struct {
	store ViewStore
}

// NewViews wires the view service.
func NewViews(store ViewStore) *Views {
	return &Views{store: store}
}

// ValidateSlug rejects malformed slugs before they reach storage.
func ValidateSlug(slug string) error {
	if slug == "" || len(slug) > maxSlugLength || !viewSlugPattern.MatchString(slug) {
		return fmt.Errorf("%w: invalid slug", ErrInvalidInput)
	}
	return nil
}

// Register records a view for slug. When bot is true the counter is read-only so
// crawlers do not inflate counts (T5.3/D-025: "count on GET with basic bot
// filtering").
func (s *Views) Register(ctx context.Context, slug string, bot bool) (View, error) {
	if err := ValidateSlug(slug); err != nil {
		return View{}, err
	}

	if bot {
		count, _, err := s.store.GetCount(ctx, slug)
		if err != nil {
			return View{}, mapStoreError(err)
		}
		return View{Slug: slug, Count: count}, nil
	}

	count, err := s.store.IncrementAndGet(ctx, slug)
	if err != nil {
		return View{}, mapStoreError(err)
	}
	return View{Slug: slug, Count: count}, nil
}

// botSignals are substrings that reliably identify non-human clients.
var botSignals = []string{
	"bot", "crawler", "spider", "crawl", "slurp", "facebookexternalhit",
	"embedly", "quora link preview", "pinterest", "slackbot", "twitterbot",
	"whatsapp", "discordbot", "preview", "headless", "lighthouse", "pingdom",
	"uptimerobot", "curl", "wget", "python-requests", "go-http-client",
}

// IsLikelyBot is a best-effort bot filter. An empty User-Agent is treated as a
// bot because real browsers always send one (T5.3 known limitation).
func IsLikelyBot(userAgent string) bool {
	ua := strings.ToLower(strings.TrimSpace(userAgent))
	if ua == "" {
		return true
	}
	for _, signal := range botSignals {
		if strings.Contains(ua, signal) {
			return true
		}
	}
	return false
}

func mapStoreError(err error) error {
	if err == nil {
		return nil
	}
	if strings.Contains(err.Error(), "not configured") {
		return fmt.Errorf("%w: %v", ErrStorageUnavailable, err)
	}
	return err
}
