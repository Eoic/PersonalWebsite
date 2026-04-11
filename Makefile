.PHONY: dev seed build-assets serve

dev:
	FLASK_DEBUG=1 uv run python -m flask --app app run --reload --port 5000

seed:
	uv run python -m app.seed

build-assets:
	uv run python -m app.build_assets

serve:
	uv run gunicorn wsgi:app --bind 127.0.0.1:8000 --workers 2

createuser:
	uv run python -m app.create_user