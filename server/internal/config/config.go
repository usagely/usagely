package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	Port        string
	JWTSecret   string
	CORSOrigin  string
	Edition     string
	JWKSUrl     string
}

func Load() Config {
	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        getEnvOrDefault("PORT", "8080"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		CORSOrigin:  getEnvOrDefault("CORS_ORIGIN", "http://localhost:3000"),
		Edition:     getEnvOrDefault("EDITION", "oss"),
		JWKSUrl:     getEnvOrDefault("JWKS_URL", "http://localhost:3000/api/auth/jwks"),
	}
	return cfg
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
