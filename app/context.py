"""Common template context shared across all page renders."""

import functools
import os
import tomllib
from datetime import date

from .models import Page
from flask_login import current_user

_app_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_app_dir)
_site_name = "Karolis Strazdas"
_site_origin = "https://karolis-strazdas.lt"


@functools.lru_cache(maxsize=1)
def _get_version():
    """Read the project version from pyproject.toml (cached)."""
    pyproject_path = os.path.join(_project_root, "pyproject.toml")

    with open(pyproject_path, "rb") as file:
        data = tomllib.load(file)

    return data["project"]["version"]


def _get_canonical_url(page_url):
    """Return the production canonical URL for a page path."""
    if page_url == "/":
        return f"{_site_origin}/"

    return f"{_site_origin}{page_url}"


def _get_breadcrumb_items(page_obj):
    """Return JSON-LD breadcrumb items for a page."""
    items = [
        {
            "position": 1,
            "name": "Home",
            "url": f"{_site_origin}/",
        }
    ]

    if page_obj.url != "/":
        items.append(
            {
                "position": 2,
                "name": page_obj.title,
                "url": _get_canonical_url(page_obj.url),
            }
        )

    return items


def get_common_context(page_slug):
    """Build context shared across all pages.

    Args:
        page_slug: The slug of the current page (e.g. "index", "positions").

    Returns:
        A dict of template variables available in every render.
    """
    page_obj = Page.get(Page.slug == page_slug)

    debug = os.environ.get("FLASK_DEBUG", "0") == "1"

    return {
        "page": page_slug,
        "title": page_obj.title,
        "description": page_obj.description,
        "canonical_url": _get_canonical_url(page_obj.url),
        "breadcrumb_items": _get_breadcrumb_items(page_obj),
        "site": {
            "name": _site_name,
            "url": f"{_site_origin}/",
        },
        "page_intro": "",
        "personal": {
            "name": _site_name,
            "location": "Kaunas, Lithuania",
        },
        "position": {
            "name": "Software engineer",
            "company": "Indeform Ltd",
        },
        "navigation": [
            {
                "id": page.slug,
                "title": page.title,
                "url": page.url,
            }
            for page in Page.select().where(Page.hidden == 0).order_by(Page.sort_order)
        ],
        "build": {
            "version": _get_version(),
            "year": date.today().year,
            "date": date.today().strftime("%Y-%m-%d"),
        },
        "current_user": current_user,
        "debug": debug,
        "vite_dev_server_url": os.environ.get("VITE_DEV_SERVER_URL") if debug else None,
        "page_head_styles": [],
        "page_head_scripts": [],
        "page_styles": [],
        "page_scripts": [],
    }
