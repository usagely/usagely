package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	req := httptest.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()

	Health(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp HealthResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got '%s'", resp.Status)
	}

	if resp.Version != "0.1.0" {
		t.Errorf("expected version '0.1.0', got '%s'", resp.Version)
	}
}

type mockPingable struct {
	err error
}

func (m *mockPingable) Ping(_ context.Context) error {
	return m.err
}

func TestReadyOK(t *testing.T) {
	mock := &mockPingable{}

	req := httptest.NewRequest("GET", "/healthz/ready", nil)
	w := httptest.NewRecorder()

	Ready(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp ReadyResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "ready" {
		t.Errorf("expected status 'ready', got '%s'", resp.Status)
	}
}

func TestReadyError(t *testing.T) {
	mock := &mockPingable{err: errors.New("connection refused")}

	req := httptest.NewRequest("GET", "/healthz/ready", nil)
	w := httptest.NewRecorder()

	Ready(mock)(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status 503, got %d", w.Code)
	}

	var resp ReadyResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "not ready" {
		t.Errorf("expected status 'not ready', got '%s'", resp.Status)
	}
	if !strings.Contains(resp.Error, "connection refused") {
		t.Errorf("expected error to contain 'connection refused', got '%s'", resp.Error)
	}
}

func TestReadyNilPingable(t *testing.T) {
	req := httptest.NewRequest("GET", "/healthz/ready", nil)
	w := httptest.NewRecorder()

	Ready(nil)(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status 503, got %d", w.Code)
	}

	var resp ReadyResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "not ready" {
		t.Errorf("expected status 'not ready', got '%s'", resp.Status)
	}
}

func TestNewPgxPingableNil(t *testing.T) {
	p := NewPgxPingable(nil)
	if p != nil {
		t.Error("expected nil pingable when pool is nil")
	}
}
