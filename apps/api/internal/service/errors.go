// Package service holds the application logic. Services depend on small
// consumer-side interfaces so they stay storage-agnostic and unit-testable
// without D1 or the network (T5.3/T5.4 code style).
package service

import "errors"

// Sentinel errors mapped to HTTP status codes by the handler layer.
var (
	// ErrInvalidInput maps to 400/422.
	ErrInvalidInput = errors.New("service: invalid input")
	// ErrRateLimited maps to 429.
	ErrRateLimited = errors.New("service: rate limited")
	// ErrStorageUnavailable maps to 503 (D1 not configured / unreachable).
	ErrStorageUnavailable = errors.New("service: storage unavailable")
)
