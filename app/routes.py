"""Flask routes for all pages."""

import json
import os

from flask import Blueprint, send_from_directory

from . import render_mako
from .context import get_common_context
from .models import (
    About,
    Education,
    EducationTag,
    Post,
    Position,
    PositionTag,
    Project,
    ProjectMedia,
    ProjectTag,
    Tag,
)

bp = Blueprint("main", __name__)

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_assets_dir = os.path.join(_project_root, "assets")

_PAGE_INTROS = {
    "index": "Software engineer based in Kaunas, building useful tools for the web and other interactive systems.",
    "positions": "Professional work, responsibilities, and the tools I have spent the most time shipping with.",
    "education": "Formal education and the technical foundation behind the way I approach software work.",
    "projects": "Selected side projects, experiments, and longer-running ideas.",
    "posts": "Short notes, worklog entries, and small observations.",
}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _get_tags_for_positions(positions):
    """Return a dict mapping position id to list of tag name strings."""
    if not positions:
        return {}

    position_ids = [p.id for p in positions]
    tags_query = (
        PositionTag.select(PositionTag, Tag)
        .join(Tag)
        .where(PositionTag.position.in_(position_ids))
    )

    result = {}
    for pt in tags_query:
        result.setdefault(pt.position_id, []).append(pt.tag.name)
    return result


def _get_tags_for_education(education_items):
    """Return a dict mapping education id to list of tag name strings."""
    if not education_items:
        return {}

    education_ids = [e.id for e in education_items]
    tags_query = (
        EducationTag.select(EducationTag, Tag)
        .join(Tag)
        .where(EducationTag.education.in_(education_ids))
    )

    result = {}
    for et in tags_query:
        result.setdefault(et.education_id, []).append(et.tag.name)
    return result


def _get_tags_for_projects(projects):
    """Return a dict mapping project id to list of tag name strings."""
    if not projects:
        return {}

    project_ids = [p.id for p in projects]
    tags_query = (
        ProjectTag.select(ProjectTag, Tag)
        .join(Tag)
        .where(ProjectTag.project.in_(project_ids))
    )

    result = {}
    for pt in tags_query:
        result.setdefault(pt.project_id, []).append(pt.tag.name)
    return result


def _get_media_for_projects(projects):
    """Return a dict mapping project id to list of media dicts."""
    if not projects:
        return {}

    project_ids = [p.id for p in projects]
    media_query = ProjectMedia.select().where(
        ProjectMedia.project.in_(project_ids)
    )

    result = {}
    for m in media_query:
        result.setdefault(m.project_id, []).append(
            {"type": m.media_type, "src": m.src, "alt": m.alt}
        )
    return result


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------


@bp.route("/")
def index():
    """Render the About (index) page."""
    ctx = get_common_context("index")

    # Fetch About key-value pairs and parse JSON values.
    about_data = {}
    for row in About.select():
        about_data[row.key] = json.loads(row.value)

    ctx.update(
        page_intro=_PAGE_INTROS["index"],
        content_description=about_data.get("content_description", ""),
        reading=about_data.get("reading", []),
        learning_about=about_data.get("learning_about", []),
        working_on=about_data.get("working_on", []),
    )

    return render_mako("pages/index.html", **ctx)


@bp.route("/positions")
def positions():
    """Render the Positions page."""
    ctx = get_common_context("positions")

    position_models = list(
        Position.select().order_by(Position.sort_order)
    )
    tags_map = _get_tags_for_positions(position_models)

    items = []
    for p in position_models:
        items.append(
            {
                "from": p.date_from,
                "until": p.date_until,
                "title": f"{p.title} &bull; {p.company}",
                "description": p.description,
                "tags": tags_map.get(p.id, []),
            }
        )

    ctx.update(
        page_intro=_PAGE_INTROS["positions"],
        items=items,
        article_title_prefix="Position",
    )
    return render_mako("pages/positions.html", **ctx)


@bp.route("/education")
def education():
    """Render the Education page."""
    ctx = get_common_context("education")

    education_models = list(
        Education.select().order_by(Education.sort_order)
    )
    tags_map = _get_tags_for_education(education_models)

    items = []
    for e in education_models:
        items.append(
            {
                "from": e.date_from,
                "until": e.date_until,
                "title": f"{e.title} &bull; {e.institution}",
                "description": e.description or "",
                "tags": tags_map.get(e.id, []),
            }
        )

    ctx.update(
        page_intro=_PAGE_INTROS["education"],
        items=items,
        article_title_prefix="Education",
    )
    return render_mako("pages/education.html", **ctx)


@bp.route("/projects")
def projects():
    """Render the Projects page."""
    ctx = get_common_context("projects")

    project_models = list(
        Project.select().order_by(Project.sort_order)
    )
    tags_map = _get_tags_for_projects(project_models)
    media_map = _get_media_for_projects(project_models)

    items = []
    for p in project_models:
        item = {
            "title": p.title,
            "description": p.description,
            "tags": tags_map.get(p.id, []),
        }

        if p.title_link:
            item["title_link"] = p.title_link

        if p.subtitle:
            item["subtitle"] = p.subtitle

        media = media_map.get(p.id)
        if media:
            item["media"] = media

        items.append(item)

    ctx.update(
        page_intro=_PAGE_INTROS["projects"],
        items=items,
        article_title_prefix="Project",
    )
    return render_mako("pages/projects.html", **ctx)


@bp.route("/posts")
def posts():
    """Render the posts page."""
    ctx = get_common_context("posts")

    items = []
    for p in (
        Post.select()
        .order_by(Post.published_on.desc(), Post.sort_order)
    ):
        items.append(
            {
                "title": p.title,
                "published_on": p.published_on,
                "body": p.body,
            }
        )

    ctx.update(
        page_intro=_PAGE_INTROS["posts"],
        items=items,
    )
    return render_mako("pages/posts.html", **ctx)


# ---------------------------------------------------------------------------
# Static file routes
# ---------------------------------------------------------------------------


@bp.route("/robots.txt")
def robots():
    """Serve robots.txt from the assets directory."""
    return send_from_directory(_assets_dir, "robots.txt")


@bp.route("/sitemap.xml")
def sitemap():
    """Serve sitemap.xml from the assets directory."""
    return send_from_directory(_assets_dir, "sitemap.xml")
