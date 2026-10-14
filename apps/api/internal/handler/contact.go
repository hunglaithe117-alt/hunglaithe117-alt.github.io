package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/example/blog-personal/apps/api/internal/service"
)

// contactResponse is the wire shape for POST /api/contact
// (packages/types ContactResponse); `emailed` reports the store-only fallback.
type contactResponse struct {
	ID      string `json:"id"`
	OK      bool   `json:"ok"`
	Emailed bool   `json:"emailed"`
}

// ContactHandler serves the contact form.
type ContactHandler struct {
	contact   *service.Contact
	ipHashSlt string
}

// NewContactHandler constructs the handler.
func NewContactHandler(contact *service.Contact, ipHashSalt string) *ContactHandler {
	return &ContactHandler{contact: contact, ipHashSlt: ipHashSalt}
}

// contactRequest mirrors the accepted JSON body.
type contactRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Body  string `json:"body"`
}

// Post handles POST /api/contact: validate → rate-limit → D1 audit row → email
// (T5.4). A failed email send still returns 200 with emailed=false.
func (h *ContactHandler) Post(c *fiber.Ctx) error {
	var req contactRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON body")
	}

	ipHash := service.HashIP(h.ipHashSlt, c.IP())
	result, err := h.contact.Submit(c.UserContext(), service.ContactRequest{
		Name:  req.Name,
		Email: req.Email,
		Body:  req.Body,
	}, ipHash)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(contactResponse{ID: result.ID, OK: true, Emailed: result.Emailed})
}
