package handler

import (
	"errors"
	"net/http"

	"github.com/gofiber/fiber/v2"

	"github.com/example/blog-personal/apps/api/internal/service"
)

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

	return c.Status(status).JSON(errorResponse{Error: message})
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
