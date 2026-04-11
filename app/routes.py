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
    "index": "I'm a software engineer passionate about building useful and/or interesting things for the web. You can explore my projects and work experience here.",
    "positions": "Professional work, responsibilities, and the tools I have spent the most time working with.",
    "education": "Formal education and the technical foundation behind the way I approach software work.",
    "projects": "Selected side projects, experiments, and longer-running ideas.",
    "posts": "Short notes, worklog entries, and small observations.",
    "bookshelf": "An incomplete list of books I've read. Not in a chronological order.",
}


def _get_tags_for_positions(positions):
    """Return a dict mapping position id to list of tag name strings."""
    if not positions:
        return {}

    position_ids = [position.id for position in positions]

    tags_query = (
        PositionTag.select(PositionTag, Tag)
        .join(Tag)
        .where(PositionTag.position.in_(position_ids))
    )

    result = {}

    for position_tag in tags_query:
        result.setdefault(position_tag.position_id, []).append(position_tag.tag.name)

    return result


def _get_tags_for_education(education_items):
    """Return a dict mapping education id to list of tag name strings."""
    if not education_items:
        return {}

    education_ids = [education.id for education in education_items]

    tags_query = (
        EducationTag.select(EducationTag, Tag)
        .join(Tag)
        .where(EducationTag.education.in_(education_ids))
    )

    result = {}

    for education_tag in tags_query:
        result.setdefault(education_tag.education_id, []).append(education_tag.tag.name)

    return result


def _get_tags_for_projects(projects):
    """Return a dict mapping project id to list of tag name strings."""
    if not projects:
        return {}

    project_ids = [project.id for project in projects]

    tags_query = (
        ProjectTag.select(ProjectTag, Tag)
        .join(Tag)
        .where(ProjectTag.project.in_(project_ids))
    )

    result = {}

    for project_tag in tags_query:
        result.setdefault(project_tag.project_id, []).append(project_tag.tag.name)

    return result


def _get_media_for_projects(projects):
    """Return a dict mapping project id to list of media dicts."""
    if not projects:
        return {}

    result = {}
    project_ids = [project.id for project in projects]
    media_query = ProjectMedia.select().where(ProjectMedia.project.in_(project_ids))

    for media in media_query:
        result.setdefault(media.project_id, []).append(
            {
                "type": media.media_type,
                "src": media.src,
                "alt": media.alt,
            }
        )

    return result


@bp.route("/")
def index():
    """Render the About (index) page."""
    about_data = {}
    ctx = get_common_context("index")

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
    position_models = list(Position.select().order_by(Position.sort_order))
    tags_map = _get_tags_for_positions(position_models)
    items = []

    for position in position_models:
        items.append(
            {
                "from": position.date_from,
                "until": position.date_until,
                "title": f"{position.title} &bull; {position.company}",
                "description": position.description,
                "tags": tags_map.get(position.id, []),
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
    education_models = list(Education.select().order_by(Education.sort_order))
    tags_map = _get_tags_for_education(education_models)
    items = []

    for education in education_models:
        items.append(
            {
                "from": education.date_from,
                "until": education.date_until,
                "title": f"{education.title} &bull; {education.institution}",
                "description": education.description or "",
                "tags": tags_map.get(education.id, []),
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
    project_models = list(Project.select().order_by(Project.sort_order))
    tags_map = _get_tags_for_projects(project_models)
    media_map = _get_media_for_projects(project_models)
    items = []

    for project in project_models:
        item = {
            "title": project.title,
            "description": project.description,
            "tags": tags_map.get(project.id, []),
        }

        if project.title_link:
            item["title_link"] = project.title_link

        if project.subtitle:
            item["subtitle"] = project.subtitle

        media = media_map.get(project.id)

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

    for post in Post.select().order_by(Post.published_on.desc(), Post.sort_order):
        items.append(
            {
                "title": post.title,
                "published_on": post.published_on,
                "body": post.body,
            }
        )

    ctx.update(
        page_intro=_PAGE_INTROS["posts"],
        items=items,
    )

    return render_mako("pages/posts.html", **ctx)


@bp.route("/bookshelf")
def bookshelf():
    """Render the bookshelf page."""
    ctx = get_common_context("bookshelf")

    ctx.update(
        page_intro=_PAGE_INTROS["bookshelf"],
        items=[],
    )

    return render_mako("pages/bookshelf.html", **ctx)


@bp.route("/robots.txt")
def robots():
    """Serve robots.txt from the assets directory."""
    return send_from_directory(_assets_dir, "robots.txt")


@bp.route("/sitemap.xml")
def sitemap():
    """Serve sitemap.xml from the assets directory."""
    return send_from_directory(_assets_dir, "sitemap.xml")
