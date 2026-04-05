"""Common template context shared across all page renders."""

import functools
import os
import tomllib
from datetime import date

from .models import Page

_app_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_app_dir)


@functools.lru_cache(maxsize=1)
def _get_version():
    """Read the project version from pyproject.toml (cached)."""
    pyproject_path = os.path.join(_project_root, "pyproject.toml")

    with open(pyproject_path, "rb") as file:
        data = tomllib.load(file)

    return data["project"]["version"]


def get_common_context(page_slug):
    """Build context shared across all pages.

    Args:
        page_slug: The slug of the current page (e.g. "index", "positions").

    Returns:
        A dict of template variables available in every render.
    """
    page_obj = Page.get(Page.slug == page_slug)

    return {
        "page": page_slug,
        "title": page_obj.title,
        "description": page_obj.description,
        "personal": {
            "name": "Karolis Strazdas",
            "location": "Kaunas, Lithuania",
        },
        "position": {
            "name": "Software engineer",
            "company": "Indeform Ltd",
        },
        "navigation": [
            {"id": page.slug, "title": page.title, "url": page.url}
            for page in Page.select().order_by(Page.sort_order)
        ],
        "build": {
            "version": _get_version(),
            "year": date.today().year,
            "date": date.today().strftime("%Y-%m-%d"),
        },
        "debug": os.environ.get("FLASK_DEBUG", "0") == "1",
    }
