package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gofiber/fiber/v2"

	"github.com/example/blog-personal/apps/api/internal/service"
)

// requestIDKey is the locals key that requestid.New() populates by default.
// The request id is echoed to the client as the X-Request-ID response header
// and carried into every structured log line (T6.3).
const requestIDKey = "requestid"

// errorResponse is the uniform error payload for every /api/* route
// (packages/types ApiError).
type errorResponse struct {
	Error string `json:"error"`
}

// errorHandler renders all Fiber errors as JSON and never leaks stack traces
// (T5.4 code style: "no stack traces to clients").
func errorHandler(c *fiber.Ctx, err error) error {
	status := http.StatusInternalServerError
	message := "internal error"

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		status = fiberErr.Code
		switch status {
		case http.StatusRequestEntityTooLarge:
			message = "request body too large"
		case http.StatusNotFound:
			message = "not found"
		case http.StatusMethodNotAllowed:
			message = "method not allowed"
		default:
			message = fiberErr.Message
		}
	} else {
		status, message = statusForError(err)
	}

	logRequestError(c, status, err)

	return c.Status(status).JSON(errorResponse{Error: message})
}

// logRequestError writes one structured line per failed request: status, route,
// method and request id only. The body, headers, query string and client IP are
// deliberately omitted so logs stay PII-free (T6.3). 5xx are logged at error
// level (alertable); 4xx at debug (noise-free).
func logRequestError(c *fiber.Ctx, status int, err error) {
	attrs := []any{
		"status", status,
		"method", c.Method(),
		"path", c.Path(),
		"request_id", c.Locals(requestIDKey),
	}
	if status >= http.StatusInternalServerError {
		slog.Error("request failed", append(attrs, "error", err)...)
		return
	}
	slog.Debug("request rejected", append(attrs, "error", err)...)
}

// statusForError maps service sentinels to HTTP status codes.
func statusForError(err error) (int, string) {
	switch {
	case errors.Is(err, service.ErrInvalidInput):
		return http.StatusUnprocessableEntity, err.Error()
	case errors.Is(err, service.ErrRateLimited):
		return http.StatusTooManyRequests, err.Error()
	case errors.Is(err, service.ErrStorageUnavailable):
		return http.StatusServiceUnavailable, "storage unavailable"
	default:
		return http.StatusInternalServerError, "internal error"
	}
}
