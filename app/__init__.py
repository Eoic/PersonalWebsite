import os
import tomllib

from flask import Flask, Response
from flask_login import LoginManager
from mako.lookup import TemplateLookup
from app.models import User

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


def create_app():
    """Flask application factory.

    Args:
        config: Optional dict of configuration overrides.
    """
    app = Flask(
        __name__,
        static_folder=os.path.join(_app_dir, os.pardir, "assets"),
        static_url_path="/assets",
    )

    app.config.from_file(
        os.path.join(_app_dir, os.pardir, "config.toml"),
        load=tomllib.load,
        text=False,
        silent=False,
    )

    app.secret_key = app.config.get("SECRET_KEY")
    login_manager = LoginManager()
    login_manager.init_app(app)

    with app.app_context():
        init_db(db_path=app.config.get("DATABASE_PATH"))

    @app.before_request
    def _db_connect():
        db_proxy.connect(reuse_if_open=True)

    @app.teardown_request
    def _db_close(exc):
        if not db_proxy.is_closed():
            db_proxy.close()

    @login_manager.user_loader
    def load_user(user_id):
        return User.get_by_id(user_id)

    from .routes import bp as main_bp

    app.register_blueprint(main_bp)
    return app
