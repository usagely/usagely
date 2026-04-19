package main

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestSeed(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	if err := seed(ctx, pool); err != nil {
		t.Fatalf("Seed failed: %v", err)
	}

	var orgCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM organizations WHERE id = $1", orgID).Scan(&orgCount); err != nil {
		t.Fatalf("Query organizations: %v", err)
	}
	if orgCount != 1 {
		t.Errorf("Expected 1 organization, got %d", orgCount)
	}

	var teamCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM teams WHERE org_id = $1", orgID).Scan(&teamCount); err != nil {
		t.Fatalf("Query teams: %v", err)
	}
	if teamCount != 8 {
		t.Errorf("Expected 8 teams, got %d", teamCount)
	}

	var userCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE org_id = $1", orgID).Scan(&userCount); err != nil {
		t.Fatalf("Query users: %v", err)
	}
	if userCount != 14 {
		t.Errorf("Expected 14 users, got %d", userCount)
	}

	var toolCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM tools WHERE org_id = $1", orgID).Scan(&toolCount); err != nil {
		t.Fatalf("Query tools: %v", err)
	}
	if toolCount != 15 {
		t.Errorf("Expected 15 tools, got %d", toolCount)
	}

	var modelCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM models").Scan(&modelCount); err != nil {
		t.Fatalf("Query models: %v", err)
	}
	if modelCount != 7 {
		t.Errorf("Expected 7 models, got %d", modelCount)
	}

	var dailyCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM usage_daily WHERE org_id = $1", orgID).Scan(&dailyCount); err != nil {
		t.Fatalf("Query usage_daily: %v", err)
	}
	if dailyCount != 60 {
		t.Errorf("Expected 60 daily entries, got %d", dailyCount)
	}

	var budgetCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM budgets WHERE org_id = $1", orgID).Scan(&budgetCount); err != nil {
		t.Fatalf("Query budgets: %v", err)
	}
	if budgetCount != 6 {
		t.Errorf("Expected 6 budgets, got %d", budgetCount)
	}

	var anomalyCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM anomalies WHERE org_id = $1", orgID).Scan(&anomalyCount); err != nil {
		t.Fatalf("Query anomalies: %v", err)
	}
	if anomalyCount != 4 {
		t.Errorf("Expected 4 anomalies, got %d", anomalyCount)
	}

	var recCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM recommendations WHERE org_id = $1", orgID).Scan(&recCount); err != nil {
		t.Fatalf("Query recommendations: %v", err)
	}
	if recCount != 6 {
		t.Errorf("Expected 6 recommendations, got %d", recCount)
	}

	var appCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM approvals WHERE org_id = $1", orgID).Scan(&appCount); err != nil {
		t.Fatalf("Query approvals: %v", err)
	}
	if appCount != 5 {
		t.Errorf("Expected 5 approvals, got %d", appCount)
	}

	var shadowCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM shadow_tools WHERE org_id = $1", orgID).Scan(&shadowCount); err != nil {
		t.Fatalf("Query shadow_tools: %v", err)
	}
	if shadowCount != 5 {
		t.Errorf("Expected 5 shadow_tools, got %d", shadowCount)
	}
}
