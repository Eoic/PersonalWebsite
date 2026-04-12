"""WSGI entry point for Gunicorn.

Usage:
    gunicorn wsgi:app --bind 0.0.0.0:8000 --workers 2
"""

from app import create_app

app = create_app()
