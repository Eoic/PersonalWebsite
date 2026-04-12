LAN_IP := $(shell python3 scripts/get_lan_ip.py)
DEV_HOST := 0.0.0.0
DEV_APP_PORT := 5000
DEV_ASSET_PORT := 5173
SERVE_PORT := 8000
DEV_APP_URL := http://$(LAN_IP):$(DEV_APP_PORT)
DEV_ASSET_URL := http://$(LAN_IP):$(DEV_ASSET_PORT)
SERVE_URL := http://$(LAN_IP):$(SERVE_PORT)
DB_SYNC_REMOTE ?=
DB_SYNC_DEST_DIR ?= /opt/website/data
DB_SYNC_FILE ?= site.db
DB_SYNC_OWNER ?= website:website

.PHONY: dev dev-assets seed build-assets serve createuser typecheck sync-db

dev:
	@printf "Flask: %s\nVite:  %s\n" "$(DEV_APP_URL)" "$(DEV_ASSET_URL)"
	VITE_PUBLIC_URL=$(DEV_ASSET_URL) VITE_DEV_SERVER_URL=$(DEV_ASSET_URL) npx concurrently -k -n vite,flask -c cyan,green "npm run dev" "FLASK_DEBUG=1 VITE_DEV_SERVER_URL=$(DEV_ASSET_URL) uv run python -m flask --app app run --reload --host $(DEV_HOST) --port $(DEV_APP_PORT)"

dev-assets:
	npm run build:watch

seed:
	uv run python -m app.seed

build-assets:
	uv run python -m app.build_assets

serve:
	@printf "Site: %s\n" "$(SERVE_URL)"
	uv run gunicorn wsgi:app --bind $(DEV_HOST):$(SERVE_PORT) --workers 2

createuser:
	uv run python -m app.create_user

typecheck:
	npm run typecheck

sync-db:
	@test -n "$(DB_SYNC_REMOTE)" || (echo "Set DB_SYNC_REMOTE, e.g. make sync-db DB_SYNC_REMOTE=website@server"; exit 1)
	rsync -rtv --progress --chmod=F644 --no-owner --no-group "data/$(DB_SYNC_FILE)" "$(DB_SYNC_REMOTE):$(DB_SYNC_DEST_DIR)/$(DB_SYNC_FILE)"
	ssh "$(DB_SYNC_REMOTE)" "if [ \"\$$(id -un)\" = \"website\" ]; then chmod 644 '$(DB_SYNC_DEST_DIR)/$(DB_SYNC_FILE)'; else chown $(DB_SYNC_OWNER) '$(DB_SYNC_DEST_DIR)/$(DB_SYNC_FILE)' && chmod 644 '$(DB_SYNC_DEST_DIR)/$(DB_SYNC_FILE)'; fi"
