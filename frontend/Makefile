.PHONY: help setup dev build preview lint format typecheck test clean

help:          ## Show all targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS=":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup:         ## First-time: install deps + activate husky
	pnpm install
	pnpm exec husky

dev:           ## Start Vite dev server
	pnpm dev

build:         ## Production build
	pnpm build

preview:       ## Preview production build locally
	pnpm build && pnpm preview

lint:          ## Run ESLint
	pnpm lint

format:        ## Format with Prettier
	pnpm format

typecheck:     ## TypeScript check
	pnpm typecheck

test:          ## Run tests
	pnpm test

test-ci:       ## Run tests with coverage
	pnpm test:ci

build-image:   ## Build production Docker image
	docker build \
	  --build-arg VITE_API_URL=http://localhost:4000 \
	  --build-arg VITE_WS_URL=ws://localhost:4000 \
	  -t eventcraft-web:local .

clean:         ## Remove node_modules + dist + coverage
	rm -rf node_modules dist coverage
