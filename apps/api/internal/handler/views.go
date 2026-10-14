package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/example/blog-personal/apps/api/internal/service"
)

// viewResponse is the wire shape for GET /api/views/:slug
// (packages/types ViewResponse).
type viewResponse struct {
	Slug  string `json:"slug"`
	Count int    `json:"count"`
}

// ViewsHandler serves the view counter.
type ViewsHandler struct {
	views *service.Views
}

// NewViewsHandler constructs the handler.
func NewViewsHandler(views *service.Views) *ViewsHandler {
	return &ViewsHandler{views: views}
}

// Get handles GET /api/views/:slug. Counting happens on GET (D-025); obvious
// crawlers are read-only so they cannot inflate the count (T5.3).
func (h *ViewsHandler) Get(c *fiber.Ctx) error {
	slug := c.Params("slug")
	bot := service.IsLikelyBot(c.Get(fiber.HeaderUserAgent))

	view, err := h.views.Register(c.UserContext(), slug, bot)
	if err != nil {
		return err
	}
	return c.JSON(viewResponse{Slug: view.Slug, Count: view.Count})
}
