.PHONY: dev build test lint migrate seed

dev:
	@echo "Starting development servers..."
	pnpm turbo dev & go run ./server/cmd/api

build:
	pnpm turbo build
	go build -o ./bin/api ./server/cmd/api

test:
	pnpm turbo test
	go test ./server/...

lint:
	pnpm turbo lint

migrate:
	go run ./server/cmd/migrate

seed:
	go run ./server/cmd/seed
