// Command server is the Cloudflare Container entrypoint for the blog API.
//
// Layering (SOLUTION.md §D): main wires config → repository → service → handler.
// The repository is the only layer that talks to D1. The binary serves plain
// HTTP on :PORT; the apps/edge Worker routes /api/* to this container and holds
// the Cloudflare bindings (D1, send_email) declared in cloudflare.config.ts.
package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/example/blog-personal/apps/api/internal/config"
	"github.com/example/blog-personal/apps/api/internal/handler"
	"github.com/example/blog-personal/apps/api/internal/repository"
	"github.com/example/blog-personal/apps/api/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	if !cfg.D1Configured() {
		logger.Warn("D1 credentials absent; storage-backed routes will return 503")
	}

	repo := repository.NewD1(cfg)

	views := service.NewViews(repo)
	contact := service.NewContact(repo, cfg)

	router := handler.NewRouter(
		handler.NewViewsHandler(views),
		handler.NewContactHandler(contact, cfg.IPHashSalt),
		cfg,
	)
	app := router.Build()

	// Graceful shutdown on SIGINT/SIGTERM (container stop).
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		logger.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			logger.Error("graceful shutdown failed", "error", err)
		}
	}()

	logger.Info("api listening", "port", cfg.Port, "environment", cfg.Environment)
	if err := app.Listen(":" + cfg.Port); err != nil && !errors.Is(err, context.Canceled) {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
