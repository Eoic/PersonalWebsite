import os

from flask import Flask, Response
from mako.lookup import TemplateLookup

from .db import db_proxy, init_db

_app_dir = os.path.dirname(os.path.abspath(__file__))
_template_lookup = None


def _get_template_lookup():
    global _template_lookup
    if _template_lookup is None:
        _template_lookup = TemplateLookup(
            directories=[os.path.join(_app_dir, "templates")],
            input_encoding="utf-8",
            output_encoding="utf-8",
            encoding_errors="replace",
        )
    return _template_lookup


def render_mako(template_name, **context):
    """Render a Mako template and return a Flask Response.

    Args:
        template_name: Template path relative to ``app/templates/``,
                       e.g. ``"pages/index.html"``.
        **context: Variables passed into the template.

    Returns:
        A ``flask.Response`` with the rendered HTML.
    """
    lookup = _get_template_lookup()
    template = lookup.get_template(template_name)
    html = template.render(**context)
    return Response(html, content_type="text/html; charset=utf-8")


def create_app(config=None):
    """Flask application factory.

    Args:
        config: Optional dict of configuration overrides.
    """
    app = Flask(
        __name__,
        static_folder=os.path.join(_app_dir, os.pardir, "assets"),
        static_url_path="/assets",
    )

    if config:
        app.config.update(config)

    # Initialise the database (creates tables if needed).
    with app.app_context():
        init_db(db_path=app.config.get("DATABASE_PATH"))

    # Per-request database connection management.
    @app.before_request
    def _db_connect():
        db_proxy.connect(reuse_if_open=True)

    @app.teardown_request
    def _db_close(exc):
        if not db_proxy.is_closed():
            db_proxy.close()

    # Register the main blueprint (page routes).
    from .routes import bp as main_bp

    app.register_blueprint(main_bp)

    # Enable live reload in debug mode.
    from . import livereload

    livereload.init_app(app)

    return app
