package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"thunder.dev/server/internal/app"
	"thunder.dev/server/internal/config"
)

func main() {
	cfg := config.Load()
	var pool *pgxpool.Pool
	if cfg.DatabaseURL == "" {
		log.Println("DATABASE_URL is empty. API routes that use Postgres will fail until it is set.")
	} else {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		created, err := pgxpool.New(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("database pool: %v", err)
		}
		pool = created
		if err := pool.Ping(ctx); err != nil {
			log.Printf("database ping failed: %v", err)
		} else {
			log.Println("connected to Postgres")
		}
		defer pool.Close()
	}

	server := &http.Server{
		Addr:              "0.0.0.0:" + cfg.Port,
		Handler:           app.New(cfg, pool),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("THUNDER Go API listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
}
