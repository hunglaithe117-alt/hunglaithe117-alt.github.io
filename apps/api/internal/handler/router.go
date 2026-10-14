// Package handler exposes the HTTP surface. Handlers stay thin: parse input,
// delegate to a service, map errors to status codes (T5.1 code style).
package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"

	"github.com/example/blog-personal/apps/api/internal/config"
)

// Router bundles the HTTP handlers and shared middleware config.
type Router struct {
	views   *ViewsHandler
	contact *ContactHandler
	cfg     config.Config
}

// NewRouter constructs the router.
func NewRouter(views *ViewsHandler, contact *ContactHandler, cfg config.Config) *Router {
	return &Router{views: views, contact: contact, cfg: cfg}
}

// Build assembles the Fiber application.
func (r *Router) Build() *fiber.App {
	app := fiber.New(fiber.Config{
		// T5.4: hard cap on request size (body is also validated per-field).
		BodyLimit:             r.cfg.MaxBodyBytes,
		ErrorHandler:          errorHandler,
		DisableStartupMessage: true,
		ProxyHeader:           fiber.HeaderXForwardedFor,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(logger.Config{
		// No PII: method/path/status/latency plus the request id set by
		// requestid.New(). The body, headers, query string and client IP are
		// never logged (T6.3).
		Format: "${time} ${status} ${latency} ${method} ${path} rid=${locals:requestid}\n",
	}))
	app.Use(securityHeaders())
	app.Use(r.cors())

	app.Get("/healthz", Health)
	// Public alias: the edge Worker only forwards `/api` + `/api/*` to the
	// container, so an external uptime check must target `/api/healthz` (T6.3).
	app.Get("/api/healthz", Health)
	app.Get("/api/views/:slug", r.views.Get)
	app.Post("/api/contact", r.contact.Post)

	return app
}

// cors builds the env-driven allowlist CORS policy (T5.5). No wildcard, no
// credentials, and only the methods/headers the API actually serves.
func (r *Router) cors() fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(r.cfg.AllowedOrigins, ","),
		AllowMethods:     "GET,POST,OPTIONS",
		AllowHeaders:     "Content-Type",
		AllowCredentials: false,
		MaxAge:           600,
	})
}

// securityHeaders adds conservative browser hardening headers (T5.5/T6.2).
func securityHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("Referrer-Policy", "no-referrer")
		c.Set("Cross-Origin-Resource-Policy", "same-site")
		// /api is same-origin with the site, so an HSTS header here also pins the
		// whole host to HTTPS in browsers (T6.2).
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		return c.Next()
	}
}
