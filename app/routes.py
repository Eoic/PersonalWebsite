import json
import math
import os
import re
from datetime import UTC, datetime
from urllib.parse import urlparse

import bcrypt
from flask import Blueprint, redirect, request, send_from_directory, session, url_for
from flask_login import login_required, login_user, logout_user
from flask_login import current_user

from app.forms import LoginForm, PostForm
from app.garden_state import (
    GardenConflictError,
    apply_garden_action,
    get_garden_snapshot,
)

from . import limiter, render_mako
from .context import get_common_context
from .models import (
    About,
    Book,
    Education,
    EducationTag,
    Post,
    Position,
    PositionTag,
    Project,
    ProjectMedia,
    ProjectTag,
    Tag,
    User,
    WhiteboardStroke,
)

bp = Blueprint("main", __name__)

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_assets_dir = os.path.join(_project_root, "assets")
_WHITEBOARD_BOARD_SLUG = "main"
_WHITEBOARD_ALLOWED_TOOL = "draw"
_WHITEBOARD_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
_WHITEBOARD_SESSION_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{7,63}$")
_WHITEBOARD_MIN_BRUSH_SIZE = 1
_WHITEBOARD_MAX_BRUSH_SIZE = 48
_WHITEBOARD_MAX_POINTS = 4096
_WHITEBOARD_MAX_COORDINATE = 1_000_000
_GARDEN_ALLOWED_TOOLS = {"plant", "water", "prune"}
_GARDEN_ALLOWED_SPECIES = {"daisy", "tulip", "poppy", "fern"}
_GARDEN_MAX_COORDINATE = 1_000_000

_PAGE_INTROS = {
    "index": "I'm a software engineer passionate about building useful and/or interesting things for the web. You can explore my projects and work experience here.",
    "positions": "Professional work, responsibilities, and the tools I have spent the most time working with.",
    "education": "Formal education and the technical foundation behind the way I approach software work.",
    "projects": "Selected side projects, experiments, and longer-running ideas.",
    "whiteboard": "Shared freehand drawing space.",
    "posts": "Short notes and other ramblings. Nothing intelligent or insightful here.",
    "bookshelf": "Some of the books I've read. Not in any particular order, chronological or otherwise.",
    "garden": "A shared, persistent garden. Plant flowers, water them, prune what has wilted. Blooms pollinate neighbors over time, and the whole patch responds to weather and season.",
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


def _whiteboard_error(message, status):
    """Return a JSON error response for whiteboard endpoints."""
    return {"error": message}, status


def _can_manage_whiteboard():
    """Return True when the current user can moderate destructive whiteboard actions."""
    return current_user.is_authenticated


def _format_whiteboard_timestamp(timestamp):
    """Serialize a naive UTC timestamp to an ISO string."""
    return (
        timestamp.astimezone(UTC)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _serialize_whiteboard_stroke(stroke):
    """Convert a WhiteboardStroke model into the public API shape."""
    return {
        "id": stroke.id,
        "tool": stroke.tool,
        "color": stroke.color,
        "brushSize": stroke.brush_size,
        "points": json.loads(stroke.points_json),
        "createdAt": _format_whiteboard_timestamp(stroke.created_at),
    }


def _parse_whiteboard_payload():
    """Return the request JSON payload dict or a 400 response."""
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return None, _whiteboard_error("Request body must be valid JSON.", 400)

    return payload, None


def _garden_error(message, status):
    """Return a JSON error response for garden endpoints."""
    return {"error": message}, status


def _parse_garden_payload():
    """Return the request JSON payload dict or a 400 response."""
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return None, _garden_error("Request body must be valid JSON.", 400)

    return payload, None


def _validate_garden_tool(raw_value):
    """Validate a garden action tool."""
    if raw_value not in _GARDEN_ALLOWED_TOOLS:
        raise ValueError("tool must be one of plant, water, or prune.")

    return raw_value


def _validate_garden_species(raw_value):
    """Validate a garden species string."""
    if raw_value not in _GARDEN_ALLOWED_SPECIES:
        raise ValueError("species must be one of daisy, tulip, poppy, or fern.")

    return raw_value


def _validate_garden_coordinate(raw_value, label):
    """Validate integer garden coordinates."""
    if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
        raise ValueError(f"{label} must be a number.")

    if not math.isfinite(raw_value):
        raise ValueError(f"{label} must be finite.")

    if int(raw_value) != raw_value:
        raise ValueError(f"{label} must be an integer.")

    coordinate = int(raw_value)

    if abs(coordinate) > _GARDEN_MAX_COORDINATE:
        raise ValueError(f"{label} is out of bounds.")

    return coordinate


def _validate_client_session_id(raw_value):
    """Validate the client session identifier used for same-session erase."""
    if not isinstance(raw_value, str) or not _WHITEBOARD_SESSION_ID_RE.fullmatch(
        raw_value
    ):
        raise ValueError("clientSessionId must be a valid session identifier.")

    return raw_value


def _validate_brush_size(raw_value):
    """Validate and clamp the brush size to an allowed range."""
    if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
        raise ValueError("brushSize must be a number.")

    if not math.isfinite(raw_value):
        raise ValueError("brushSize must be finite.")

    brush_size = int(round(raw_value))

    return max(_WHITEBOARD_MIN_BRUSH_SIZE, min(_WHITEBOARD_MAX_BRUSH_SIZE, brush_size))


def _validate_color(raw_value):
    """Validate a safe hex color string."""
    if not isinstance(raw_value, str) or not _WHITEBOARD_COLOR_RE.fullmatch(raw_value):
        raise ValueError("color must be a six-digit hex value.")

    return raw_value.lower()


def _validate_whiteboard_points(raw_value):
    """Validate and normalize a stroke point list."""
    if not isinstance(raw_value, list):
        raise ValueError("points must be an array of coordinates.")

    if not raw_value:
        raise ValueError("points must not be empty.")

    if len(raw_value) > _WHITEBOARD_MAX_POINTS:
        raise ValueError("points contains too many coordinates.")

    points = []

    for point in raw_value:
        if not isinstance(point, dict):
            raise ValueError("Each point must be an object with x and y.")

        x = point.get("x")
        y = point.get("y")

        if isinstance(x, bool) or isinstance(y, bool):
            raise ValueError("Point coordinates must be numeric.")

        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            raise ValueError("Point coordinates must be numeric.")

        if not math.isfinite(x) or not math.isfinite(y):
            raise ValueError("Point coordinates must be finite.")

        if abs(x) > _WHITEBOARD_MAX_COORDINATE or abs(y) > _WHITEBOARD_MAX_COORDINATE:
            raise ValueError("Point coordinates are out of bounds.")

        points.append({"x": float(x), "y": float(y)})

    return points


def _compute_duration(from_date: datetime, until_date: datetime | None) -> str:
    until_date = until_date or datetime.now(UTC)

    months = max(
        0,
        (
            until_date.year * 12
            + until_date.month
            - (from_date.year * 12 + from_date.month)
        ),
    )

    if months < 1:
        return "Less than a month"

    parts = []
    years = math.floor(months / 12)
    remaining_months = months % 12

    if years > 0:
        parts.append(f"{years} year{'s' if years > 1 else ''}")

    if remaining_months > 0:
        parts.append(f"{remaining_months} month{'s' if remaining_months > 1 else ''}")

    if len(parts) > 0:
        return ", ".join(parts)

    return ""


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
    items = []
    ctx = get_common_context("positions")
    position_models = list(Position.select().order_by(Position.sort_order))
    tags_map = _get_tags_for_positions(position_models)

    for position in position_models:
        items.append(
            {
                "from": position.date_from,
                "until": position.date_until,
                "duration": _compute_duration(position.date_from, position.date_until),
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
    items = []
    ctx = get_common_context("education")
    education_models = list(Education.select().order_by(Education.sort_order))
    tags_map = _get_tags_for_education(education_models)

    for education in education_models:
        items.append(
            {
                "from": education.date_from,
                "until": education.date_until,
                "duration": _compute_duration(
                    education.date_from,
                    education.date_until,
                ),
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
    items = []
    ctx = get_common_context("posts")

    if current_user.is_authenticated:
        posts = Post.select()
    else:
        posts = Post.select().where(Post.hidden == 0)

    posts = posts.order_by(Post.published_on.desc(), Post.sort_order)

    for post in posts:
        items.append(
            {
                "id": post.id,
                "title": post.title,
                "body": post.body,
                "slug": post.id,
                "published_on": post.published_on,
            }
        )

        items[-1]["hidden"] = post.hidden if current_user.is_authenticated else 0

    ctx.update(
        page_intro=_PAGE_INTROS["posts"],
        items=items,
        page_actions=[url_for("main.new_post")],
    )

    return render_mako("pages/posts.html", **ctx)


@bp.route("/posts/new", methods=["GET", "POST"])
@login_required
def new_post():
    """Render the editor page for creating a new post."""
    action_path = url_for("main.new_post")
    cancel_path = url_for("main.posts")
    ctx = get_common_context("posts")

    ctx.update(
        action_path=action_path,
        cancel_path=cancel_path,
    )

    if request.method == "GET":
        form = PostForm(meta={"csrf_context": session})
        ctx.update(form=form)
        return render_mako("pages/post_form.html", **ctx)
    elif request.method == "POST":
        form = PostForm(request.form, meta={"csrf_context": session})

        if form.validate():
            Post.create(
                title=form.title.data,
                body=form.body.data,
                hidden=form.hidden.data,
                published_on=datetime.now(UTC),
                sort_order=0,
            )

            return redirect(url_for("main.posts"))
        else:
            ctx = get_common_context("posts")
            ctx.update(form=form)
            return render_mako("pages/post_form.html", **ctx), 400


@bp.route("/posts/edit/<int:post_id>", methods=["GET", "POST"])
@login_required
def edit_post(post_id):
    """Render the editor page for a specific post."""
    action_path = url_for("main.edit_post", post_id=post_id)
    cancel_path = url_for("main.posts")
    ctx = get_common_context("posts")

    ctx.update(
        post_id=post_id,
        action_path=action_path,
        cancel_path=cancel_path,
    )

    if request.method == "GET":
        post = Post.get(Post.id == post_id)
        form = PostForm(meta={"csrf_context": session}, obj=post)
        ctx.update(form=form)
        return render_mako("pages/post_form.html", **ctx)
    elif request.method == "POST":
        form = PostForm(request.form, meta={"csrf_context": session})

        if form.validate():
            post = Post.get(Post.id == post_id)
            post.title = form.title.data
            post.body = form.body.data
            post.hidden = form.hidden.data
            post.save()
            return redirect(url_for("main.posts"))
        else:
            ctx = get_common_context("posts")
            ctx.update(form=form)
            return render_mako("pages/post_form.html", **ctx), 400


@bp.route("/posts/delete/<int:post_id>", methods=["GET", "POST"])
@login_required
def delete_post(post_id):
    """Render the confirmation page for deleting a specific post."""
    ctx = get_common_context("posts")

    if request.method == "GET":
        ctx.update(
            message="Are you sure you want to delete this post? This action cannot be undone.",
            action_path=url_for("main.delete_post", post_id=post_id),
            cancel_path=url_for("main.posts"),
        )

        return render_mako("pages/delete_confirm.html", **ctx)
    elif request.method == "POST":
        try:
            post = Post.get(Post.id == post_id)
            post.delete_instance()
        except Post.DoesNotExist:
            print(f"Post with id {post_id} does not exist.")

        return redirect(url_for("main.posts"))


@bp.route("/bookshelf")
def bookshelf():
    """Render the bookshelf page."""
    ctx = get_common_context("bookshelf")
    books = list(Book.select().order_by(Book.title))
    ctx["page_head_styles"].append(
        ".bookshelf-item{display:block;position:relative;aspect-ratio:2/3;"
        "overflow:hidden;opacity:.85;background:var(--color-surface-muted)}"
        "a.bookshelf-item::after{display:none;content:none}"
        ".bookshelf-item img{position:absolute;inset:0;display:block;width:100%;"
        "height:100%;object-fit:cover;opacity:0}"
        ".bookshelf-item.is-loaded img{opacity:1}"
    )

    ctx.update(
        page_intro=_PAGE_INTROS["bookshelf"],
        books=books,
    )

    return render_mako("pages/bookshelf.html", **ctx)


def _safe_next_url(target):
    """Return target if it is a same-host relative URL, else None."""
    if not target:
        return None

    parsed = urlparse(target)

    if parsed.netloc or parsed.scheme:
        return None

    if not parsed.path.startswith("/"):
        return None

    return target


@bp.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per minute;50 per hour", methods=["POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    ctx = get_common_context("login")
    form_data = request.form if request.method == "POST" else None
    form = LoginForm(form_data, meta={"csrf_context": session})
    ctx.update(form=form, errors=[])

    if request.method == "POST":
        if form.validate():
            try:
                user = User.get(User.username == form.username.data)
            except User.DoesNotExist:
                user = None

            if not user or not bcrypt.checkpw(
                form.password.data.encode("utf-8"),
                user.password.encode("utf-8"),
            ):
                ctx.update(errors=["Invalid username or password"])
                return render_mako("pages/login.html", **ctx)

            login_user(user, remember=True)
            next_url = _safe_next_url(request.args.get("next"))
            return redirect(next_url or url_for("main.index"))
        else:
            ctx.update(errors=["Invalid username or password"])

    return render_mako("pages/login.html", **ctx)


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))


@bp.route("/whiteboard/strokes")
def whiteboard_strokes():
    """Return all persisted strokes for the shared whiteboard."""
    strokes = (
        WhiteboardStroke.select()
        .where(WhiteboardStroke.board_slug == _WHITEBOARD_BOARD_SLUG)
        .order_by(WhiteboardStroke.id)
    )

    return {"strokes": [_serialize_whiteboard_stroke(stroke) for stroke in strokes]}


@bp.route("/whiteboard/strokes", methods=["DELETE"])
@limiter.limit("10 per minute")
def clear_whiteboard_strokes():
    """Clear the shared whiteboard for authenticated moderators."""
    if not _can_manage_whiteboard():
        return _whiteboard_error("Login required to clear the whiteboard.", 403)

    (
        WhiteboardStroke.delete()
        .where(WhiteboardStroke.board_slug == _WHITEBOARD_BOARD_SLUG)
        .execute()
    )

    return "", 204


@bp.route("/whiteboard/strokes", methods=["POST"])
@limiter.limit("60 per minute")
def create_whiteboard_stroke():
    """Persist a completed freehand stroke for the shared whiteboard."""
    payload, error = _parse_whiteboard_payload()

    if error is not None:
        return error

    if payload.get("tool") != _WHITEBOARD_ALLOWED_TOOL:
        return _whiteboard_error("Only draw strokes can be persisted.", 400)

    try:
        client_session_id = _validate_client_session_id(payload.get("clientSessionId"))
        color = _validate_color(payload.get("color"))
        brush_size = _validate_brush_size(payload.get("brushSize"))
        points = _validate_whiteboard_points(payload.get("points"))
    except ValueError as exc:
        return _whiteboard_error(str(exc), 400)

    stroke = WhiteboardStroke.create(
        board_slug=_WHITEBOARD_BOARD_SLUG,
        client_session_id=client_session_id,
        tool=_WHITEBOARD_ALLOWED_TOOL,
        color=color,
        brush_size=brush_size,
        points_json=json.dumps(points),
    )

    return {
        "id": stroke.id,
        "createdAt": _format_whiteboard_timestamp(stroke.created_at),
    }, 201


@bp.route("/whiteboard/strokes/<int:stroke_id>", methods=["DELETE"])
@limiter.limit("60 per minute")
def delete_whiteboard_stroke(stroke_id):
    """Delete a stroke if it belongs to the current page session."""
    payload, error = _parse_whiteboard_payload()

    if error is not None:
        return error

    try:
        client_session_id = _validate_client_session_id(payload.get("clientSessionId"))
    except ValueError as exc:
        return _whiteboard_error(str(exc), 400)

    try:
        stroke = WhiteboardStroke.get(
            (WhiteboardStroke.id == stroke_id)
            & (WhiteboardStroke.board_slug == _WHITEBOARD_BOARD_SLUG)
        )
    except WhiteboardStroke.DoesNotExist:
        return _whiteboard_error("Stroke not found.", 404)

    if not _can_manage_whiteboard() and stroke.client_session_id != client_session_id:
        return _whiteboard_error(
            "This stroke can no longer be erased from this session.",
            403,
        )

    stroke.delete_instance()
    return "", 204


@bp.route("/whiteboard")
def whiteboard():
    """Render the whiteboard page."""
    ctx = get_common_context("whiteboard")

    ctx.update(
        page_head_scripts=[
            {
                "src": "https://kit.fontawesome.com/ad3b985a78.js",
                "crossorigin": "anonymous",
            }
        ],
        page_styles=["whiteboard"],
        whiteboard_can_manage=_can_manage_whiteboard(),
        page_scripts=["whiteboard"],
        page_intro=_PAGE_INTROS["whiteboard"],
    )

    return render_mako("pages/whiteboard.html", **ctx)


@bp.route("/garden")
def garden():
    """Render the garden page."""
    ctx = get_common_context("garden")

    ctx.update(
        page_intro=_PAGE_INTROS["garden"],
        page_styles=["garden"],
        page_scripts=["garden"],
    )

    return render_mako("pages/garden.html", **ctx)


@bp.route("/garden/state")
def garden_state():
    """Return the authoritative shared garden snapshot."""
    try:
        snapshot = get_garden_snapshot()
    except GardenConflictError as exc:
        return _garden_error(str(exc), 503)

    return snapshot


@bp.route("/garden/actions", methods=["POST"])
def garden_actions():
    """Apply an anonymous shared garden action and return the new snapshot."""
    payload, error = _parse_garden_payload()

    if error is not None:
        return error

    try:
        tool = _validate_garden_tool(payload.get("tool"))
        x = _validate_garden_coordinate(payload.get("x"), "x")
        y = _validate_garden_coordinate(payload.get("y"), "y")
        species = (
            _validate_garden_species(payload.get("species"))
            if tool == "plant"
            else None
        )
    except ValueError as exc:
        return _garden_error(str(exc), 400)

    try:
        snapshot = apply_garden_action(tool=tool, x=x, y=y, species=species)
    except GardenConflictError as exc:
        return _garden_error(str(exc), 503)

    return snapshot


@bp.route("/robots.txt")
def robots():
    """Serve robots.txt from the assets directory."""
    return send_from_directory(_assets_dir, "robots.txt")


@bp.route("/sitemap.xml")
def sitemap():
    """Serve sitemap.xml from the assets directory."""
    return send_from_directory(_assets_dir, "sitemap.xml")
