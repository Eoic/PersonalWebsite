.PHONY: dev seed build-assets serve

dev:
	FLASK_DEBUG=1 flask --app app run --reload --port 5000

seed:
	python -m app.seed

build-assets:
	python -m app.build_assets

serve:
	gunicorn wsgi:app --bind 127.0.0.1:8000 --workers 2
