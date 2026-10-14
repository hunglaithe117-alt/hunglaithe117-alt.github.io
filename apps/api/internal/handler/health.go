package handler

import "github.com/gofiber/fiber/v2"

// healthResponse is the /healthz payload. It intentionally exposes no config.
type healthResponse struct {
	Status string `json:"status"`
}

// Health handles GET /healthz (T5.1: `/healthz` returns 200 locally).
func Health(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(healthResponse{Status: "ok"})
}
