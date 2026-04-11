.PHONY: dev seed build-assets serve

dev:
	FLASK_DEBUG=1 FLASK_SECRET_KEY="74870674f89981909b2f10f7ed0387b333b7a5c5e45ef8ccabeed1c9b4993764" uv run python -m flask --app app run --reload --port 5000

seed:
	uv run python -m app.seed

build-assets:
	uv run python -m app.build_assets

serve:
	uv run gunicorn wsgi:app --bind 127.0.0.1:8000 --workers 2

createuser:
	uv run python -m app.create_user