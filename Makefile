install-act-brew:
	@echo "Installing act..."
	brew install act

install-act:
	@echo "Installing act..."
	curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

eas-build:
	@echo "Building EAS..."
	act --var ACT=true -W .github/workflows/eas-build.yaml --secret-file apps/mobile/.env.production.local -P macos-latest=-self-hosted --input auto_submit=true

eas-update:
	@echo "Updating EAS..."
	act --var ACT=true -W .github/workflows/eas-update.yaml --secret-file apps/mobile/.env.production.local