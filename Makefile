.PHONY: help install lint typecheck test test-app build clean fetch-model serve-model

# Local dev: cache the default model on your machine and serve it over the LAN
# so on-device/simulator downloads are fast and repeatable. Point
# src/app/devConfig.ts DEV_MODEL_BASE_URL at this host (see that file).
MODEL_CACHE ?= .model-cache
MODEL_PORT  ?= 8000
MODEL_REPO  ?= Qwen/Qwen2.5-1.5B-Instruct-GGUF
MODEL_FILE  ?= qwen2.5-1.5b-instruct-q4_k_m.gguf

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

lint: ## Run ESLint on core and tests
	npm run lint

typecheck: ## Run the TypeScript type checker
	npm run typecheck

test: ## Run core unit tests (fast, no React Native)
	npm test

test-app: ## Run React Native component tests (testing-library)
	npm run test:app

build: ## Type-check the core and the RN app layer (no native build here)
	npm run typecheck
	npm run typecheck:app

fetch-model: ## Download the default GGUF into the local cache (once)
	@mkdir -p $(MODEL_CACHE)
	@# Hugging Face serves large files via Xet (chunked); plain curl/wget cannot
	@# reconstruct them, so use the official client. `hf auth login` first for
	@# un-throttled speed (anonymous downloads are rate-limited).
	@if command -v hf >/dev/null 2>&1; then \
		hf download "$(MODEL_REPO)" "$(MODEL_FILE)" --local-dir "$(MODEL_CACHE)"; \
	elif command -v huggingface-cli >/dev/null 2>&1; then \
		huggingface-cli download "$(MODEL_REPO)" "$(MODEL_FILE)" --local-dir "$(MODEL_CACHE)"; \
	else \
		echo "Install the Hugging Face client first (Xet-backed repos need it):"; \
		echo "  pipx install 'huggingface_hub[hf_xet]'   # provides the 'hf' command"; \
		echo "  hf auth login                            # optional, for fast downloads"; \
		exit 1; \
	fi
	@echo "Cached: $(MODEL_CACHE)/$(MODEL_FILE)"

serve-model: ## Serve cached GGUFs over the LAN for fast dev downloads
	@mkdir -p $(MODEL_CACHE)
	@echo "Serving $(MODEL_CACHE)/ on port $(MODEL_PORT)."
	@echo "Set DEV_MODEL_BASE_URL in src/app/devConfig.ts to:"
	@echo "  Android emulator: http://10.0.2.2:$(MODEL_PORT)"
	@echo "  iOS simulator:    http://localhost:$(MODEL_PORT)"
	@echo "  physical device:  http://<your-mac-LAN-ip>:$(MODEL_PORT)"
	cd $(MODEL_CACHE) && python3 -m http.server $(MODEL_PORT)

clean: ## Remove build artifacts
	rm -rf dist coverage
