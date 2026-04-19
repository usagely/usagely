package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/usagely/usagely/internal/config"
	"github.com/usagely/usagely/internal/db"
	"github.com/usagely/usagely/internal/handler"
	"github.com/usagely/usagely/internal/middleware"
)

func main() {
	cfg := config.Load()

	var pool *pgxpool.Pool
	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		var err error
		pool, err = db.Connect(ctx, cfg.DatabaseURL)
		cancel()
		if err != nil {
			slog.Warn("database unavailable", slog.Any("error", err))
		} else {
			defer pool.Close()
		}
	}

	authMiddleware := middleware.NewAuthMiddleware(cfg.JWKSUrl)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recovery)
	r.Use(middleware.CORS(cfg.CORSOrigin))
	r.Get("/healthz", handler.Health)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(authMiddleware.Handler)
		r.Use(middleware.EditionGate(cfg.Edition))
		r.Get("/dashboard", handler.Dashboard(pool))
		r.Get("/teams", handler.Teams(pool))
		r.Get("/budgets", handler.Budgets(pool))
		r.Get("/anomalies", handler.Anomalies(pool))
		r.Get("/settings", handler.Settings)
		r.Get("/tools", handler.Tools(pool))
		r.Get("/models", handler.Models(pool))
		r.Get("/people", handler.People(pool))
		r.Get("/people/{email}", handler.Profile(pool))
		r.Get("/recommendations", handler.Recommendations(pool))
		r.Get("/shadow", handler.Shadow(pool))
		r.Get("/approvals", handler.Approvals(pool))
		r.Get("/forecast", handler.Forecast(pool))
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		slog.Info("shutdown signal received")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			slog.Error("shutdown error", slog.Any("error", err))
		}
	}()

	slog.Info("starting server", slog.String("port", cfg.Port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server error", slog.Any("error", err))
		os.Exit(1)
	}
}
