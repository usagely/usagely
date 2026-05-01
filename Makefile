.PHONY: dev build test lint migrate seed verify

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

# verify: chain of fast-fail checks suitable for agents and CI.
# Deferred until their tooling/cleanup lands in their own PRs:
#   - pnpm --filter web lint       (3 pre-existing react-hooks errors)
#   - golangci-lint run ./...      (no config yet, see issue #1 PR 5)
#   - sqlc diff                    (binary not installed in dev images)
#   - pnpm --filter web tsc --noEmit (no script yet; `next build` already type-checks)
verify:
	pnpm --filter web test -- --run
	pnpm --filter web build
	cd server && go vet ./...
	cd server && go test ./...

migrate:
	go run ./server/cmd/migrate

seed:
	go run ./server/cmd/seed
